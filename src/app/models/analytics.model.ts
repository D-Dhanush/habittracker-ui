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
