import { MIXING_CHALLENGES } from '../data/challenges';

/**
 * Challenge progress is measured in checks passed, shown as percentages.
 * Each challenge has a few checks (its "requirements"); a student's score for a challenge is
 * the most checks they have passed at once. Overall = all checks passed ÷ all checks.
 */

export const checksIn = (challengeId: string) =>
  MIXING_CHALLENGES.find((c) => c.id === challengeId)?.requirements.length ?? 0;

export const TOTAL_CHECKS = MIXING_CHALLENGES.reduce((sum, c) => sum + c.requirements.length, 0);

export const challengePercent = (challengeId: string, passed: number) => {
  const total = checksIn(challengeId);
  return total ? Math.round((Math.min(passed, total) / total) * 100) : 0;
};

export const checksPassed = (scores: Record<string, number>) =>
  MIXING_CHALLENGES.reduce((sum, c) => sum + Math.min(scores[c.id] || 0, c.requirements.length), 0);

export const overallPercent = (scores: Record<string, number>) =>
  TOTAL_CHECKS ? Math.round((checksPassed(scores) / TOTAL_CHECKS) * 100) : 0;

export const letterFor = (pct: number) => (pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F');
