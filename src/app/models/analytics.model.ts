export interface DailyCompletionData {
  date: Date;
  completed: number;
  pending: number;
  completionPercentage: number;
}

export interface WeeklyCompletionData {
  week: string;
  completed: number;
  pending: number;
  completionPercentage: number;
}

export interface CategoryCompletionData {
  category: string;
  completed: number;
  total: number;
  completionPercentage: number;
}

export interface HabitMetrics {
  habitId: string;
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalXp: number;
  completionsThisMonth: number;
}

export interface RankingInfo {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  xpProgress: number;
  rank: string;
}

export interface RecentActivity {
  id: string;
  habitId: string;
  habitName: string;
  type: 'complete' | 'milestone' | 'streak' | 'rank';
  title: string;
  description: string;
  xpEarned: number;
  timestamp: Date;
  icon: string;
}

export interface CalendarDay {
  date: Date;
  completed: boolean;
  inStreak: boolean;
  empty: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarData {
  weeks: CalendarWeek[];
  month: string;
  year: number;
}

// ─── Rank / Level math ─────────────────────────────────────────
// MUST stay in sync with the backend's Progress.UFN_LevelFromXp and
// Progress.UFN_RankFromXp (see 002_stored_procedures_full.sql). The
// original dashboard had two independent, disagreeing rank systems
// (one hardcoded in the component, one implied by mock data) — this
// is the single source of truth for the frontend side of that logic.

const XP_PER_LEVEL = 500;

const RANK_THRESHOLDS: { max: number; rank: string }[] = [
  { max: 1000, rank: 'Novice' },
  { max: 5000, rank: 'Apprentice' },
  { max: 10000, rank: 'Adept' },
  { max: 25000, rank: 'Expert' },
  { max: 50000, rank: 'Master' },
  { max: Infinity, rank: 'Legend' }
];

export function rankFromTotalXp(totalXp: number): string {
  const found = RANK_THRESHOLDS.find(t => totalXp < t.max);
  return found ? found.rank : 'Legend';
}

export function levelFromTotalXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

/**
 * Builds a full RankingInfo display object from the raw totals the
 * backend's UserProgressDto provides (currentXp here = TotalXP from
 * the API — see note in user.service.ts on the CurrentXP/TotalXP split).
 */
export function calculateRankProgress(totalXp: number): RankingInfo {
  const currentLevel = levelFromTotalXp(totalXp);
  const rank = rankFromTotalXp(totalXp);
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;
  const xpProgress = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  return {
    currentLevel,
    currentXp: totalXp,
    xpToNextLevel,
    xpProgress,
    rank
  };
}
