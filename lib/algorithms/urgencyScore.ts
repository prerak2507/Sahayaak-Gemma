import { NeedCategory, UrgencyBreakdown, UrgencyResult } from '@/types';

const CATEGORY_MULTIPLIERS: Record<NeedCategory, number> = {
  disaster_relief: 1.3,
  medical: 1.2,
  food: 1.1,
  shelter: 1.1,
  water_sanitation: 1.1,
  child_welfare: 1.05,
  elderly_care: 1.05,
  mental_health: 1.0,
  education: 0.9,
  livelihood: 0.9,
  roads_potholes: 1.05,
  drainage_sewerage: 1.15,
  water_supply: 1.15,
  electricity_streetlights: 1.05,
  garbage_sanitation: 1.0,
  encroachment: 0.9,
  fire_safety: 1.25,
};

export interface UrgencyInput {
  severityRating: number;
  populationCount: number;
  isTimeSensitive: boolean;
  deadlineAt: string | null;
  volunteersNeeded: number;
  volunteersAssigned: number;
  category: NeedCategory;
  createdAt: string;
}

export function calculateUrgencyScore(input: UrgencyInput): UrgencyResult {
  const {
    severityRating,
    populationCount,
    isTimeSensitive,
    deadlineAt,
    volunteersNeeded,
    volunteersAssigned,
    category,
    createdAt,
  } = input;

  // Severity score (0-10)
  const severityScore = (severityRating / 10) * 10;

  // Reach score (0-10)
  const reachScore = Math.min(populationCount / 50, 1) * 10;

  // Time score (0-10)
  let timeScore = 2;
  if (isTimeSensitive) {
    timeScore = 10;
  } else if (deadlineAt) {
    const hoursToDeadline = (new Date(deadlineAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursToDeadline < 6) timeScore = 10;
    else if (hoursToDeadline < 24) timeScore = 7;
    else if (hoursToDeadline < 72) timeScore = 4;
    else timeScore = 2;
  }

  // Gap score (0-10)
  const gapScore = volunteersNeeded > 0
    ? ((volunteersNeeded - volunteersAssigned) / volunteersNeeded) * 10
    : 0;

  // Raw weighted score
  const rawScore = severityScore * 0.40 + reachScore * 0.25 + timeScore * 0.20 + gapScore * 0.10;

  // Category multiplier
  const categoryMultiplier = CATEGORY_MULTIPLIERS[category] || 1.0;

  // Age boost
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const ageBoost = (ageHours > 24 && volunteersAssigned === 0) ? 0.5 : 0;

  // Final score
  const finalScore = Math.min(rawScore * categoryMultiplier + ageBoost, 10);
  const rounded = Math.round(finalScore * 10) / 10;

  const breakdown: UrgencyBreakdown = {
    severity: Math.round(severityScore * 10) / 10,
    reach: Math.round(reachScore * 10) / 10,
    time: Math.round(timeScore * 10) / 10,
    gap: Math.round(gapScore * 10) / 10,
  };

  let label: UrgencyResult['label'];
  if (rounded >= 8) label = 'Critical';
  else if (rounded >= 6) label = 'High';
  else if (rounded >= 4) label = 'Medium';
  else label = 'Low';

  return { score: rounded, label, breakdown };
}
