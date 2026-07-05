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
  /** All tracked habits for this day were completed */
  completed: boolean;
  /** Some habits completed, some missed — yellow */
  partial: boolean;
  /** completed === true AND the day is part of a streak — gold */
  perfectDay: boolean;
  inStreak: boolean;
  /** Day is outside the displayed month */
  empty: boolean;
  /** Total XP earned across all habits on this day */
  xpEarned: number;
  /** Names of habits completed this day — shown in day-detail panel */
  completedHabits: string[];
  /** Names of habits that had a completion record but completed===false */
  missedHabits: string[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarData {
  weeks: CalendarWeek[];
  month: string;
  year: number;
  /** Total XP earned during this calendar month */
  totalXpThisMonth: number;
  /** Longest consecutive completed-day run in this month */
  bestStreakThisMonth: number;
}

// ─── Rank / Level math ─────────────────────────────────────────
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

export function nextRankFromTotalXp(totalXp: number): string | null {
  const idx = RANK_THRESHOLDS.findIndex(t => totalXp < t.max);
  if (idx === -1 || idx === RANK_THRESHOLDS.length - 1) return null;
  return RANK_THRESHOLDS[idx + 1].rank;
}

export function levelFromTotalXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function calculateRankProgress(totalXp: number): RankingInfo {
  const currentLevel = levelFromTotalXp(totalXp);
  const rank = rankFromTotalXp(totalXp);
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;
  const xpProgress = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  return { currentLevel, currentXp: totalXp, xpToNextLevel, xpProgress, rank };
}
