#!/usr/bin/env node
/**
 * Builds docs/Sahaayak-Project-Overview.docx from the same material as
 * docs/PROJECT.md, for handing to judges who would rather read a document than
 * a repository.
 *
 *   node scripts/build-project-docx.mjs
 */

import { writeFileSync } from 'node:fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageBreak,
} from 'docx';

const ACCENT = 'C2410C';
const INK = '1F2937';
const MUTED = '6B7280';

const TABLE_WIDTH = 9360; // DXA, fits US Letter with 1" margins

const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120, line: 276 },
    alignment: opts.align,
    children: [
      new TextRun({
        text,
        size: opts.size ?? 21,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color ?? INK,
        font: opts.mono ? 'Consolas' : undefined,
      }),
    ],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, size: 30, bold: true, color: ACCENT })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, size: 24, bold: true, color: INK })],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 21, color: INK })],
  });

const code = (text) =>
  new Paragraph({
    spacing: { after: 60 },
    shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
    children: [new TextRun({ text, size: 18, font: 'Consolas', color: '111827' })],
  });

const rule = () =>
  new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' } },
    children: [new TextRun({ text: '' })],
  });

function table(headers, rows) {
  const widths = headers.map(() => Math.floor(TABLE_WIDTH / headers.length));
  const cell = (text, { bold = false, fill } = {}) =>
    new TableCell({
      width: { size: widths[0], type: WidthType.DXA },
      shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [new TextRun({ text, size: 19, bold, color: bold ? 'FFFFFF' : INK })],
        }),
      ],
    });

  return new Table({
    columnWidths: widths,
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hd) => cell(hd, { bold: true, fill: ACCENT })),
      }),
      ...rows.map((r, i) =>
        new TableRow({
          children: r.map((c) => cell(c, { fill: i % 2 ? 'F9FAFB' : undefined })),
        })
      ),
    ],
  });
}

const children = [];

// ── Title ─────────────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    spacing: { before: 1200, after: 80 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Sahaayak', size: 64, bold: true, color: ACCENT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [
      new TextRun({
        text: 'Civic reporting for Rajkot, in the language people actually speak,\nrunning on one machine.',
        size: 26,
        color: INK,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: 'Build With Gemma Hackathon  ·  GDG Cloud Rajkot',
        size: 21,
        color: MUTED,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [
      new TextRun({ text: 'Track: GenAI for Good', size: 21, bold: true, color: ACCENT }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Runs entirely on Gemma 4 (gemma4:e4b-it-qat, Apache 2.0), locally, offline.',
        size: 20,
        italics: true,
        color: MUTED,
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ── 1. Why ────────────────────────────────────────────────────────────────
children.push(
  h1('1.  Why we built this'),
  p('Rajkot Municipal Corporation serves about 1.6 million people across six ward zones. Reporting a broken street light today requires a resident to know three things: that street lights belong to the electricity department and not to PWD, that a portal exists, and enough English or Hindi to fill it in.'),
  p('Most people in Rajkot write Gujarati. A very large share write Gujarati in Latin letters, because that is what the phone keyboard gives them.'),
  new Paragraph({
    spacing: { before: 160, after: 160 },
    indent: { left: 400 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 12 } },
    children: [
      new TextRun({ text: 'kalavad road par moto khado chhe, bike lapsi gai', size: 22, bold: true, font: 'Consolas' }),
      new TextRun({ text: ' ', size: 22 }),
      new TextRun({ text: '"There’s a big pothole on Kalavad Road, my bike skidded."', size: 21, italics: true, color: MUTED }),
    ],
  }),
  p('That sentence is not Gujarati script. It is not English. It is not Hindi. It is how a real complaint actually arrives, and no municipal portal in India accepts it.'),
  h2('Two quiet failures follow'),
  bullet('Most problems are never reported. A working adult will not learn a municipal org chart to report a pothole, so the corporation’s data under-represents exactly the wards with the least English.'),
  bullet('Reports that are filed land in the wrong queue. A resident guesses the department, guesses wrong, and the ticket ages where nobody is watching.'),
  p('The obvious fix is software that reads what people actually write. The obvious objection, and the reason this does not already exist, is money and data: a municipal corporation cannot put a residents’ complaint database and a per-token bill on a foreign API, and a ward office on a patchy connection cannot depend on one being reachable.'),
  p('Gemma 4 removes the objection. A 6 GB open-weights model, on the desktop already sitting in the ward office, reads all four ways people write here, decides what the report is, and routes it. No API key, no per-token cost, no data leaving the building, and an Apache 2.0 licence so the corporation can run it forever without asking anyone.', { bold: true }),
  rule()
);

// ── 2. What it does ───────────────────────────────────────────────────────
children.push(
  h1('2.  What it does'),
  p('A resident reports however they can: typed Gujarati, romanized Gujarati, Hindi, English, a photo, a voice note, or WhatsApp.'),
  table(
    ['Step', 'What happens', 'Who does it'],
    [
      ['1. Triage', 'Reads the report in its original language. Returns validity, language, title, an English summary for the crew, a native-script summary for the resident, category, department, urgency 1-10, and a named place.', 'Gemma'],
      ['2. Dispatch', 'Chooses and parameterises one of three real actions by calling it as a tool.', 'Gemma'],
      ['3. Photo check', 'Confirms the photo is real and shows what was described.', 'Gemma'],
      ['4. Location', 'Resolves the named place to coordinates.', 'Gazetteer, not the model'],
      ['5. Crew assignment', 'Picks the technician by skill match and historic completion rate.', 'Arithmetic, not the model'],
      ['6. Closure', 'Confirms the completion photo shows the problem actually fixed.', 'Gemma'],
    ]
  ),
  h2('A worked example, measured on the demo machine'),
  code('input:  kalavad road par sharu ma moto khado chhe, kal raat e mari bike lapsi gai'),
  code(''),
  code('language              gu          (romanized Gujarati, correctly not "en")'),
  code('summary               There is a large pothole on Kalavad Road which'),
  code('                      caused the resident’s bike to skid last night.'),
  code('summary_native        કલાવડ રોડ પર રસ્તામાં મોટો ખાડો છે'),
  code('assigned_department   pwd'),
  code('urgency_score         6'),
  code('location              Kalavad Road → 22.2904, 70.7749   (from the gazetteer)'),
  code('tool called           dispatch_municipal_crew(department=pwd, target_hours=7)'),
  code('crew                  Karsan Bhai, Senior Pothole Technician,'),
  code('                      matches on asphalt, closes 95% of assigned tickets'),
  p('Total: about 12 seconds, entirely on a laptop GPU, with the network off.', { bold: true, after: 200 }),
  rule()
);

// ── 3. How Gemma is used ──────────────────────────────────────────────────
children.push(
  h1('3.  How Gemma 4 is used'),
  p('Every decision in this system is made by Gemma. There are 22 AI endpoints and all of them go through one client.'),
  h2('3.1  One client, two hosts'),
  p('lib/gemma/client.ts is the only code in the project that talks to a model. It speaks Ollama’s /api/chat protocol, which local Ollama and Ollama’s hosted models implement identically. Local is always attempted first; the hosted path exists only so a public demo works for someone who has installed nothing. Switching is one environment variable, not a second code path.'),
  h2('3.2  Structured output, which replaced a JSON scraper'),
  p('This is the single most important technical change, and the clearest argument for Gemma 4 specifically. The predecessor asked a hosted model for JSON inside prose, then went hunting for it: strip markdown fences, attempt a parse, fall back to indexOf("{") and lastIndexOf("}"), then give up and serve a canned object. That scraper was the largest single source of wrong answers in the old system.'),
  p('Gemma 4 accepts a JSON Schema and is constrained during decoding to emit conforming output. We derive the schema from the same Zod object that validates the result, so the prompt contract and the parse target are literally the same definition and cannot drift.'),
  p('There is no regex JSON extraction anywhere in this codebase.', { bold: true }),
  h2('3.3  Native function calling for dispatch'),
  p('Routing is a choice between mutually exclusive actions with different arguments and consequences, which is exactly what tool calling is for. Gemma is given three real actions and calls one:'),
  bullet('dispatch_municipal_crew(department, crew_size, skills_required, target_hours)'),
  bullet('escalate_emergency(department, hazard, notify_control_room)'),
  bullet('refer_to_ngo(focus_area, volunteers_needed, time_sensitive)'),
  p('Escalation is a separate tool rather than a boolean field, deliberately: it makes escalating a pothole a visibly wrong choice rather than a flag somebody set. Measured behaviour: a pothole gets a crew with a 7 hour target; a live wire on a footpath pages the control room.'),
  h2('3.4  Multimodal'),
  p('Gemma 4 reads images on every variant, so the same local model that reads the text also screens the photo, checks it against the resident’s words, and verifies the crew’s completion evidence. The middle check is the anti-fraud control: it is what stops one photograph being filed against six different streets.'),
  h2('3.5  Multilingual reasoning, not translate-then-reason'),
  p('Nothing is translated before it is understood. Gemma reads Gujarati as Gujarati. Translation exists only to show a resident their own report back and to give a crew an English work order. The prompt carries a small Gujarati civic glossary, because the model initially read khado (pothole) as "a large rock".'),
  rule()
);

// ── 4. Why Gemma ──────────────────────────────────────────────────────────
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('4.  Why Gemma, and not anything else'),
  h2('Against a hosted frontier API'),
  table(
    ['', 'Hosted API', 'Gemma 4, local'],
    [
      ['Cost per report', 'per-token, forever', 'zero after download'],
      ['Residents’ complaint data', 'leaves the building', 'never leaves'],
      ['Works on a bad connection', 'no', 'yes'],
      ['Municipal procurement', 'a recurring foreign bill', 'a one-time download'],
      ['Licence', 'terms can change', 'Apache 2.0'],
    ]
  ),
  p('A municipal corporation is not a startup. It needs something it can budget once, run on hardware it owns, and keep running when a vendor changes their pricing or their terms. That is a governance requirement before it is a technical one.', { after: 200 }),
  h2('Against a smaller open model'),
  p('The work here needs four capabilities at the same time, and that combination is what narrows the field:'),
  bullet('Genuine multilingual competence, including romanized Indic script. Most small models handle Gujarati poorly and romanized Gujarati worse.'),
  bullet('Schema-constrained structured output. Without it we are back to scraping JSON out of prose, which is what we replaced.'),
  bullet('Native function calling, so dispatch is a typed invocation rather than a sentence to parse.'),
  bullet('Vision, so the same model reads the photo.'),
  p('A model with three of these forces a second model into the stack, which doubles the memory footprint and defeats the purpose of fitting on one office machine.'),
  h2('Against a larger open model'),
  p('gemma4:e4b-it-qat is 6.1 GB and fits a 6 GB laptop GPU. That constraint is the product. A 27B model needs hardware a ward office does not have and will not buy. The interesting claim is not "an AI can read Gujarati", it is "this runs on the machine already on the desk".'),
  rule()
);

// ── 5. Limits ─────────────────────────────────────────────────────────────
children.push(
  h1('5.  What we deliberately do not let the model do'),
  p('A judge should trust the system more, not less, for these limits.'),
  table(
    ['Boundary', 'Why'],
    [
      ['Gemma never produces coordinates', 'A model confidently wrong about a decimal place sends a crew to the wrong ward, and a hallucinated coordinate is indistinguishable from a real one. Gemma extracts a place name; a fixed gazetteer resolves it. An unresolved name asks the resident for a pin.'],
      ['Gemma never picks the technician', 'Choosing who works tonight is arithmetic against a roster, and deterministic, so the assignment can be explained to the person who received it.'],
      ['Gemma never issues a compliance verdict', 'An earlier version scored NGOs from a list of filenames. That is a regulatory judgement about a real organisation. It now prepares a human reviewer’s worklist.'],
      ['Gemma never estimates what it cannot see', 'The satellite page used to show a green-cover percentage invented by a text model from bare coordinates. It now interprets supplied measurements or reports low confidence.'],
      ['Status labels are derived, not asked for', 'The model kept labelling a scheme at 0% coverage as "adequate". Comparing a number to a threshold is arithmetic, so the code does it.'],
    ]
  ),
  rule(),
  h1('6.  Honest limitations'),
  p('Speech-to-text does not run on Gemma yet. Gemma 4’s smaller variants carry a ~300M audio encoder, so a Gujarati voice note could in principle be understood by the same model that routes it. In practice, through Ollama v0.30.x, E4B returns empty or hallucinated transcripts (ollama#16584, open), thinking mode yields empty responses on audio (ollama#16583), and llama.cpp has not implemented Gemma 4 audio at all (llama.cpp#21334).'),
  p('The path is built and gated behind GEMMA_AUDIO_ENABLED. By default a dedicated ASR handles the microphone and Gemma does everything after the transcript. When the upstream bug closes, one flag moves and a file becomes dead code.'),
  bullet('Text-to-speech is not a Gemma task; reading Gujarati aloud needs a vocoder.'),
  bullet('Scheme gap analysis takes 35 to 60 seconds locally. Fine weekly, wrong for a live demo.'),
  bullet('Crew assignment ignores current workload, because live crew state is not held and faking balance with randomness would make dispatch unauditable.'),
  rule()
);

// ── 7. Failing honestly ───────────────────────────────────────────────────
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('7.  Failing honestly'),
  p('Every AI route fails closed. If Gemma cannot answer, the route returns 5xx with a machine-readable code and a message written for a resident. No route invents a result.'),
  p('This reverses the predecessor’s behaviour, and it is the change we would defend hardest. Photo verification used to return valid:true on every failure path, including a missing API key. An outage silently approved every submission while the interface told residents their report had been AI verified. A verification that cannot fail is not a verification.'),
  h2('The same pattern, removed in seven places'),
  table(
    ['Where', 'What it did'],
    [
      ['photo verification', 'approved everything on any failure'],
      ['jury-demo route', 'shipped pre-written "AI routing reasons" in a fallback table'],
      ['policy brief', 'produced a ₹15 Crore funding proposal when the model failed'],
      ['scheme analysis', 'a full 12-scheme report with invented percentages'],
      ['impact narrative', 'four paragraphs of invented statistics presented as generated output'],
      ['officer dashboard', 'injected 8 fake incidents, commented "never looks dead for the jury"'],
      ['analytics', 'always merged 18 fabricated incidents into real data'],
    ]
  ),
  p('Every AI response now carries _meta naming the model and host that produced it, and _meta.source is "gemma" for real inference or "fallback" otherwise.'),
  rule()
);

// ── 8. Proof ──────────────────────────────────────────────────────────────
children.push(
  h1('8.  Proving it is real'),
  p('Nothing here needs to be taken on trust.'),
  code('npm run gemma:health              # host, model, and a live constrained completion'),
  code('node scripts/verify-schemas.mjs   # every schema serialises to valid JSON Schema'),
  code('node scripts/test-ai-routes.mjs   # all 21 AI behaviours against the real model'),
  code('curl localhost:3000/api/gemma/health?probe=1'),
  p('test-ai-routes.mjs mocks nothing. Current state: 21 passed, 0 failed. It asserts behaviour, not just HTTP 200 — that romanized Gujarati is detected as gu, that a pothole routes to PWD, that a live wire escalates and a pothole does not, that spam is refused, and that the assistant declines a question its data cannot answer.', { bold: true }),
  h2('Measured on an RTX 4050, 6 GB'),
  table(
    ['Operation', 'Time'],
    [
      ['First call after startup', '~70 s (weights loading into VRAM)'],
      ['Triage, warm', '9 to 12 s'],
      ['Dispatch, warm', '2 to 3 s'],
      ['Translate, search, chat', '2 to 3 s'],
      ['Full intake (triage + dispatch)', '~12 s'],
      ['Seeding 20 reports through the model', '~210 s'],
    ]
  ),
  rule()
);

// ── 9. How it solves the problem ──────────────────────────────────────────
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('9.  How this solves the problem'),
  table(
    ['The problem', 'What changes'],
    [
      ['A resident must know the org chart', 'They describe the problem. Gemma picks the department.'],
      ['Portals accept only English or Hindi', 'Gujarati, romanized Gujarati and Hindi are first-class. Nothing is translated before it is understood.'],
      ['Reports age in the wrong queue', 'Routing and urgency happen at intake, in about 12 seconds.'],
      ['Emergencies queue behind cosmetic complaints', 'Escalation is a separate decision with its own channel.'],
      ['Cloud AI is unaffordable and cannot hold citizen data', '6 GB model, corporation’s own hardware, no egress, Apache 2.0.'],
      ['A ward office has patchy internet', 'It runs offline. Verify by turning off the wifi.'],
      ['Nobody can tell if the "AI" did anything', 'Every response names the model and host that produced it.'],
      ['One photo filed against six streets', 'Gemma cross-checks the photo against the words.'],
      ['Tickets closed on bad evidence', 'Gemma checks completion photos before closing.'],
    ]
  ),
  rule(),
  h1('10.  Explaining it to a judge in five minutes'),
  p('Warm the model first: the first call after Ollama starts takes about 70 seconds, every call after is 2 to 3.', { italics: true, color: MUTED }),
  bullet('Open with the sentence, not the architecture. Show "kalavad road par moto khado chhe" and ask what language it is. That is the problem statement in one line.'),
  bullet('Turn off the wifi, then file it. Twelve seconds later there is a routed ticket with a named technician. Nothing left the laptop.'),
  bullet('Show it refuse things. Spam is refused as spam. A broken light inside someone’s bedroom is refused as private property, because RMC maintains public assets. A system that accepts everything is not triaging.'),
  bullet('Show the escalation boundary. A pothole gets a crew and a 7 hour target; a live wire pages the control room. Same model, same prompt, different judgement, delivered as a tool call.'),
  bullet('Show what it will not do. A report naming an unknown housing society is stored asking for a pin rather than dropped on the city centre. This is what separates a demo from a system.'),
  bullet('Close on the economics. Apache 2.0, 6 GB, runs on the machine already in the ward office, no per-token bill, no data leaving the building. Only true because the model is small enough, open enough and good enough at once — and it was not true a year ago.'),
  h2('Likely questions'),
  p('"Is it really local?"  Turn off the network and file another report, or hit /api/gemma/health?probe=1, which names the host and model that served it.'),
  p('"What if Gemma is wrong?"  Every route fails closed, nothing is auto-approved, dispatch below the confidence floor goes to a human, and the model never picks a technician or a coordinate.'),
  p('"Is this just a wrapper?"  Structured decoding, native tool calling and vision are all load-bearing. Removing any one breaks a specific feature, and the repository shows what the code looked like before each.'),
  p('"Does it do speech?"  Honestly, not on Gemma yet. Section 6 says exactly why, with links to the open upstream bugs. A dedicated ASR handles the microphone; Gemma does everything after the transcript.')
);

const doc = new Document({
  creator: 'Sahaayak',
  title: 'Sahaayak — Project Overview',
  description: 'Civic reporting for Rajkot on Gemma 4. Build With Gemma Hackathon, GDG Cloud Rajkot.',
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 220 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('docs/Sahaayak-Project-Overview.docx', buffer);
console.log('wrote docs/Sahaayak-Project-Overview.docx');
