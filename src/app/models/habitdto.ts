

import { QuestDto } from './quest.model';

export interface HabitMilestoneDto {
  id: string;
  habitId: string;
  name: string;
  description?: string | null;
  target: number;
  achieved: boolean;
  achievedDate?: string | null;
  xpReward: number;
  icon?: string | null;
  createdDt: string;
}

export interface HabitCompletionOutputDto {
  id: string;
  habitId: string;
  completionDate: string;
  completed: boolean;
  xpEarned: number;
  notes?: string | null;
  createdDt: string;
}

export interface HabitDto {
  id: string;
  userId: string;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  customCategory?: string | null;
  status?: string | null;
  frequency: string;
  startDt: string;
  endDt?: string | null;
  targetOccurrencesPerPeriod?: number | null;
  reminderTimeUtc?: string | null;
  icon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  xpReward: number;
  notes?: string | null;
  isActive: boolean;
  createdDt: string;
  updatedDt?: string | null;

  tagsList?: string[] | null;

  // Real, persisted progress rollup — replaces the old fabricated streak/level math.
  currentXP: number;
  currentLevel: number;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletionDate?: string | null;

  // Lightweight count for list views (GetAllHabits) — full quests[] only on GetById.
  questCount: number;

  // Only populated on GetById / Update responses.
  quests?: QuestDto[] | null;
  milestones?: HabitMilestoneDto[] | null;
  recentCompletions?: HabitCompletionOutputDto[] | null;
}
