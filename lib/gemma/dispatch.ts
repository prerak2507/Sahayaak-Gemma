/**
 * Dispatch by function calling.
 *
 * Triage answers "what is this". Dispatch answers "what do we do about it now",
 * and that is a choice between mutually exclusive actions with different
 * arguments and different consequences. Gemma 4 calls tools natively, so the
 * decision arrives as a typed invocation rather than as a sentence somebody has
 * to parse.
 *
 * The tools here are the real actions the platform can take. Gemma picks one
 * and fills its arguments; this module executes it. The model never touches the
 * database and never picks a named individual.
 */

import { z } from 'zod';
import { gemmaToolChoice } from './structured';
import { assignCrew, type CrewAssignment } from '@/lib/data/rmc-workers';
import { RMC_DEPARTMENTS, type RmcDepartment, type TriageResult } from './civic';
import type { GemmaMeta, GemmaTool } from './client';

const DEPARTMENT_IDS = Object.keys(RMC_DEPARTMENTS) as RmcDepartment[];

const dispatchTools: GemmaTool[] = [
  {
    type: 'function',
    function: {
      name: 'dispatch_municipal_crew',
      description:
        'Send an RMC field crew to repair public infrastructure. Use for the ordinary municipal backlog: potholes, blocked sewers, leaking mains, dead street lights, uncollected garbage, encroachment.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            enum: DEPARTMENT_IDS,
            description: 'The RMC department that owns this asset',
          },
          crew_size: {
            type: 'integer',
            minimum: 1,
            maximum: 8,
            description: 'People needed to complete the repair safely',
          },
          skills_required: {
            type: 'array',
            items: { type: 'string' },
            description: 'Concrete trade skills, lowercase, for example asphalt or jetting',
          },
          target_hours: {
            type: 'integer',
            minimum: 1,
            maximum: 168,
            description: 'Hours within which this should be closed, from the SLA for its severity',
          },
        },
        required: ['department', 'crew_size', 'skills_required', 'target_hours'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_emergency',
      description:
        'Raise an immediate emergency alongside the crew dispatch. Use only when a delay of hours would risk life: live wires down, fire, gas, structural collapse, contaminated drinking water, or a road hazard causing active accidents.',
      parameters: {
        type: 'object',
        properties: {
          department: { type: 'string', enum: DEPARTMENT_IDS },
          hazard: {
            type: 'string',
            description: 'The specific danger to the public, in one short phrase',
          },
          notify_control_room: {
            type: 'boolean',
            description: 'Whether the RMC control room must be paged, not just the department',
          },
        },
        required: ['department', 'hazard', 'notify_control_room'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'refer_to_ngo',
      description:
        'Route to a partner NGO instead of RMC. Use for humanitarian and social need that no municipal department repairs: food, medicine, elderly care, shelter, blood donation, tutoring.',
      parameters: {
        type: 'object',
        properties: {
          focus_area: {
            type: 'string',
            enum: ['food', 'medical', 'elderly_care', 'shelter', 'education', 'child_welfare', 'livelihood', 'mental_health'],
          },
          volunteers_needed: { type: 'integer', minimum: 1, maximum: 20 },
          time_sensitive: {
            type: 'boolean',
            description: 'True when the need lapses if not met within a day',
          },
        },
        required: ['focus_area', 'volunteers_needed', 'time_sensitive'],
      },
    },
  },
];

const crewArgsSchema = z.object({
  department: z.enum(DEPARTMENT_IDS as [RmcDepartment, ...RmcDepartment[]]),
  crew_size: z.coerce.number().int().min(1).max(8),
  skills_required: z.array(z.string()).min(1),
  target_hours: z.coerce.number().int().min(1).max(168),
});

const emergencyArgsSchema = z.object({
  department: z.enum(DEPARTMENT_IDS as [RmcDepartment, ...RmcDepartment[]]),
  hazard: z.string(),
  notify_control_room: z.coerce.boolean(),
});

const ngoArgsSchema = z.object({
  focus_area: z.string(),
  volunteers_needed: z.coerce.number().int().min(1).max(20),
  time_sensitive: z.coerce.boolean(),
});

export type DispatchAction =
  | {
      kind: 'municipal_crew';
      department: RmcDepartment;
      crewSize: number;
      skillsRequired: string[];
      targetHours: number;
      assignment: CrewAssignment | null;
      emergency: null;
    }
  | {
      kind: 'emergency';
      department: RmcDepartment;
      hazard: string;
      notifyControlRoom: boolean;
      assignment: CrewAssignment | null;
    }
  | {
      kind: 'ngo_referral';
      focusArea: string;
      volunteersNeeded: number;
      timeSensitive: boolean;
    };

export interface DispatchDecision {
  action: DispatchAction;
  /** The tool Gemma chose, recorded verbatim for the audit trail. */
  toolCalled: string;
  rationale: string;
  _meta: GemmaMeta;
}

export class DispatchUndecidedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DispatchUndecidedError';
  }
}

const SYSTEM_PROMPT = `You are the dispatch desk for Rajkot Municipal Corporation.

A report has been triaged. Decide what happens to it now by calling exactly one tool.

- dispatch_municipal_crew for infrastructure RMC repairs. This is the right answer for almost everything.
- escalate_emergency only for an active, immediate threat to life happening right now.
- refer_to_ngo for humanitarian need that no municipal department repairs.

WHEN TO ESCALATE, AND WHEN NOT TO
Escalate only for: fire or smoke, a live electrical conductor someone can touch, a gas leak, a building or road actively collapsing, or drinking water that is contaminated now.

Do not escalate anything else, however badly it reads. In particular, do not escalate a pothole, a road defect, a skid or a fall that has already happened, waterlogging, a blocked or overflowing sewer, a dead street light, or uncollected rubbish. Those are urgent crew dispatches with short target_hours, not emergencies.

A report describing something that already happened is not an emergency. "My bike skidded last night" is a crew dispatch. "There is a live wire lying on the footpath right now" is an emergency.

The emergency channel pages the control room and pulls people off other work. Escalating a pothole costs someone else their response.

Set target_hours from the danger, not from the resident's tone. RMC service standards: water contamination or live electrical hazard within 24 hours, waterlogging and sewer overflow within 72 hours, street lights within 5 days, road surfacing within 7 days.

Call one tool. Do not answer in prose.`;

/**
 * Asks Gemma to choose and parameterise the next action for a triaged report.
 * Throws DispatchUndecidedError when no valid tool call comes back, so the
 * caller can queue the ticket for a human rather than inventing a dispatch.
 */
export async function decideDispatch(triage: TriageResult): Promise<DispatchDecision> {
  const brief = [
    `TITLE: ${triage.auto_title}`,
    `SUMMARY: ${triage.summary}`,
    `CATEGORY: ${triage.category}`,
    `URGENCY: ${triage.urgency_score}/10`,
    `LOCATION: ${triage.location ? triage.location.name : 'not identified'}`,
    `TRIAGE NOTE: ${triage.routing_reason}`,
  ].join('\n');

  const { call, content, meta } = await gemmaToolChoice({
    system: SYSTEM_PROMPT,
    user: brief,
    tools: dispatchTools,
    // The escalation rules above are explicit enough that reasoning mostly
    // talks the model into escalating. Set GEMMA_DISPATCH_THINK=true to compare.
    think: process.env.GEMMA_DISPATCH_THINK === 'true',
  });

  if (!call) {
    throw new DispatchUndecidedError(
      `Gemma returned no tool call for "${triage.auto_title}". Response was: ${content.slice(0, 200)}`
    );
  }

  const rationale = content.trim() || triage.routing_reason;

  if (call.name === 'dispatch_municipal_crew') {
    const args = crewArgsSchema.parse(call.arguments);
    return {
      action: {
        kind: 'municipal_crew',
        department: args.department,
        crewSize: args.crew_size,
        skillsRequired: args.skills_required,
        targetHours: args.target_hours,
        assignment: assignCrew(args.department, args.skills_required),
        emergency: null,
      },
      toolCalled: call.name,
      rationale,
      _meta: meta,
    };
  }

  if (call.name === 'escalate_emergency') {
    const args = emergencyArgsSchema.parse(call.arguments);
    return {
      action: {
        kind: 'emergency',
        department: args.department,
        hazard: args.hazard,
        notifyControlRoom: args.notify_control_room,
        assignment: assignCrew(args.department, triage.skills_required),
      },
      toolCalled: call.name,
      rationale,
      _meta: meta,
    };
  }

  if (call.name === 'refer_to_ngo') {
    const args = ngoArgsSchema.parse(call.arguments);
    return {
      action: {
        kind: 'ngo_referral',
        focusArea: args.focus_area,
        volunteersNeeded: args.volunteers_needed,
        timeSensitive: args.time_sensitive,
      },
      toolCalled: call.name,
      rationale,
      _meta: meta,
    };
  }

  throw new DispatchUndecidedError(`Gemma called an unknown tool: ${call.name}`);
}
