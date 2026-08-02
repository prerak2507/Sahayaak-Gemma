/**
 * RMC field crew registry and crew assignment.
 *
 * Assignment is deliberately not a model call. Matching a skill list against a
 * roster and an efficiency rating is arithmetic, it is auditable, and a crew
 * member can contest it. Gemma decides *which department owns the problem*,
 * which is a judgement call; picking the technician inside that department is
 * not.
 */

export interface RmcWorker {
  id: string;
  name: string;
  role: 'technician' | 'senior';
  department: string;
  title: string;
  skills: string[];
  /** Historic completion rating, 0 to 1, from closed tickets. */
  efficiency: number;
}

export const RMC_WORKER_REGISTRY: RmcWorker[] = [
  // PWD, roads and surfacing
  { id: 'emp-pwd-1', name: 'Jayesh Rathod', role: 'technician', department: 'pwd', title: 'PWD Field Engineer', skills: ['asphalt', 'pothole', 'road', 'filling', 'paving', 'tar'], efficiency: 0.92 },
  { id: 'emp-pwd-2', name: 'Amrit Parmar', role: 'technician', department: 'pwd', title: 'Road Maintenance Assistant', skills: ['road', 'sweeping', 'shoveling', 'gravel', 'cleaning'], efficiency: 0.88 },
  { id: 'emp-pwd-3', name: 'Karsan Bhai', role: 'senior', department: 'pwd', title: 'Senior Pothole Technician', skills: ['pothole', 'structural', 'concrete', 'asphalt', 'bridge'], efficiency: 0.95 },

  // Drainage
  { id: 'emp-drain-1', name: 'Sohan Prasad', role: 'technician', department: 'drainage', title: 'Sewer Jetting Operator', skills: ['sewer', 'jetting', 'drainage', 'blockage', 'manhole', 'suction'], efficiency: 0.87 },
  { id: 'emp-drain-2', name: 'Manu Rabari', role: 'technician', department: 'drainage', title: 'Drainage Network Inspector', skills: ['drainage', 'inspection', 'manhole', 'overflow', 'flooding', 'gutter'], efficiency: 0.91 },

  // Water works
  { id: 'emp-water-1', name: 'Tushar Trivedi', role: 'technician', department: 'water_works', title: 'Pipeline Field Assistant', skills: ['pipeline', 'leak', 'plumbing', 'welding', 'burst', 'joint'], efficiency: 0.89 },
  { id: 'emp-water-2', name: 'Mansukh Koli', role: 'technician', department: 'water_works', title: 'Pump Station Valve Operator', skills: ['valve', 'pressure', 'pump', 'station', 'flow'], efficiency: 0.93 },

  // Electricity
  { id: 'emp-elec-1', name: 'Vijay Parmar', role: 'senior', department: 'electricity', title: 'High Voltage Lineman', skills: ['lineman', 'cabling', 'transformer', 'high-voltage', 'wire'], efficiency: 0.96 },
  { id: 'emp-elec-2', name: 'Haresh Solanki', role: 'technician', department: 'electricity', title: 'Substation Technician', skills: ['streetlight', 'circuit', 'electricity', 'bulb', 'fuse'], efficiency: 0.88 },

  // Health and sanitation
  { id: 'emp-san-1', name: 'Ramesh Koli', role: 'technician', department: 'health_sanitation', title: 'Ward 7 Sanitation Inspector', skills: ['garbage', 'waste', 'street', 'cleaning', 'dumping', 'litter'], efficiency: 0.85 },
  { id: 'emp-san-2', name: 'Hasmukh Vora', role: 'technician', department: 'health_sanitation', title: 'Solid Waste Supervisor', skills: ['supervision', 'solid', 'refuse', 'dumpster', 'landfill'], efficiency: 0.90 },
  { id: 'emp-san-3', name: 'Naran Vaghasia', role: 'senior', department: 'health_sanitation', title: 'Bio-Medical Waste Specialist', skills: ['bio-medical', 'hazardous', 'medical', 'chemical', 'sanitation'], efficiency: 0.94 },

  // Encroachment
  { id: 'emp-enc-1', name: 'Ketan Chawda', role: 'technician', department: 'encroachment', title: 'Field Demolition Officer', skills: ['demolition', 'enforcement', 'eviction', 'machinery', 'excavator'], efficiency: 0.90 },
  { id: 'emp-enc-2', name: 'Kanti Bhai', role: 'technician', department: 'encroachment', title: 'Estate Encroachment Surveyor', skills: ['survey', 'land', 'legal', 'boundary', 'mapping'], efficiency: 0.85 },

  // Fire safety
  { id: 'emp-fire-1', name: 'Arjan Kher', role: 'senior', department: 'fire_safety', title: 'Senior Fire Rescue Lead', skills: ['fire', 'rescue', 'emergency', 'smoke', 'blaze', 'hazard'], efficiency: 0.98 },
  { id: 'emp-fire-2', name: 'Pravin Solanki', role: 'technician', department: 'fire_safety', title: 'Emergency Rescue Driver', skills: ['driver', 'truck', 'hose', 'hydrant', 'pump'], efficiency: 0.97 },
];

export interface CrewAssignment {
  worker: RmcWorker;
  score: number;
  matchedSkills: string[];
  explanation: string;
}

/**
 * Picks the best-matched available worker in a department.
 *
 * Deterministic: the same ticket always produces the same assignment, so a
 * dispatch can be explained to the person who received it. Score is matched
 * skills weighted above historic efficiency, ties broken by worker id.
 *
 * Note: this does not yet account for current workload. Balancing across open
 * tickets needs live crew state that this project does not hold, and rotating
 * assignments at random to imitate balance would make dispatch unauditable.
 */
export function assignCrew(
  department: string,
  skillsRequired: string[]
): CrewAssignment | null {
  const candidates = RMC_WORKER_REGISTRY.filter((w) => w.department === department);
  if (candidates.length === 0) return null;

  const wanted = skillsRequired.map((s) => s.toLowerCase().trim()).filter(Boolean);

  const rated = candidates.map((worker) => {
    const matchedSkills = worker.skills.filter((skill) =>
      wanted.some((req) => req.includes(skill) || skill.includes(req))
    );
    return {
      worker,
      matchedSkills,
      score: matchedSkills.length * 15 + worker.efficiency * 100,
    };
  });

  rated.sort((a, b) => b.score - a.score || a.worker.id.localeCompare(b.worker.id));
  const best = rated[0];

  const skillNote = best.matchedSkills.length
    ? `matches on ${best.matchedSkills.join(', ')}`
    : 'is the highest-rated technician available in this department';

  return {
    worker: best.worker,
    score: Math.round(best.score),
    matchedSkills: best.matchedSkills,
    explanation: `${best.worker.name}, ${best.worker.title}, ${skillNote} and closes ${Math.round(
      best.worker.efficiency * 100
    )}% of assigned tickets.`,
  };
}
