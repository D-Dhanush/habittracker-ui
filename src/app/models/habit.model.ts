export type HabitCategory = 
  | 'health' 
  | 'fitness' 
  | 'spiritual' 
  | 'finance' 
  | 'study' 
  | 'productivity' 
  | 'mindset' 
  | 'lifestyle'
  | 'custom';

export type HabitFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

export type HabitStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface HabitTask {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  completedDate?: Date;
  xpReward?: number;
}

export interface HabitCompletion {
  date: Date;
  completed: boolean;
  xpEarned: number;
  notes?: string;
}

export interface HabitMilestone {
  id: string;
  name: string;
  description: string;
  target: number; // days or streak count
  achieved: boolean;
  achievedDate?: Date;
  xpReward: number;
  icon: string;
}

export interface Habit {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  category: HabitCategory;
  customCategory?: string;
  frequency: HabitFrequency;
  status: HabitStatus;
  icon?: string;
  primaryColor?: string; // hex color
  secondaryColor?: string; // hex color
  xpReward: number;
  startDate: Date;
  endDate?: Date;
  tasks: HabitTask[];
  completions: HabitCompletion[];
  milestones: HabitMilestone[];
  notes?: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface HabitStats {
  totalHabits: number;
  activeHabits: number;
  currentXp: number;
  totalXpEarned: number;
  currentStreak: number;
  longestStreak: number;
  completionPercentage: number;
  thisWeekCompletion: number;
  thisMonthCompletion: number;
}

export interface CategoryIcon {
  [key: string]: string;
}

export const CATEGORY_ICONS: CategoryIcon = {
  fitness: 'fitness_center',
  health: 'favorite',
  spiritual: 'spa',
  study: 'school',
  finance: 'attach_money',
  productivity: 'schedule',
  mindset: 'psychology',
  lifestyle: 'nights_stay'
};

export const CATEGORY_LABELS: { [key: string]: string } = {
  fitness: 'Fitness',
  health: 'Health',
  spiritual: 'Spiritual',
  study: 'Study',
  finance: 'Finance',
  productivity: 'Productivity',
  mindset: 'Mindset',
  lifestyle: 'Lifestyle'
};
