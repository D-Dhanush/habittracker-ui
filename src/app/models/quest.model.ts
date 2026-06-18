// Mirrors backend HabitTrackerApi.ResultDtos.QuestDto and friends exactly.
// This REPLACES the old src/app/arclord/models/quest.model.ts, which had
// fields (streak, calendar, logs) with no backend equivalent and was never
// actually wired to QuestService. Delete the old file after migrating.

export interface QuestTaskDto {
  id: string;
  questId: string;
  name: string;
  description?: string | null;
  xpReward: number;
  completed: boolean;
  completedDate?: string | null;
  createdDt: string;
  updatedDt: string;
}

export interface QuestMilestoneDto {
  id: string;
  questId: string;
  name: string;
  description?: string | null;
  target: number;
  achieved: boolean;
  achievedDate?: string | null;
  xpReward: number;
  icon?: string | null;
  createdDt: string;
}

export interface QuestCalendarLogDto {
  id: string;
  questId: string;
  logDate: string;
  completed: boolean;
  notes?: string | null;
  createdDt: string;
}

export interface QuestDto {
  id: string;
  habitId: string;
  name: string;
  category: string;
  difficulty: string; // 'Easy' | 'Medium' | 'Hard' | 'Bronze' | 'Silver' | 'Gold'
  xp: number;
  status: string; // 'Active' | 'Paused' | 'Completed'
  progress: number;
  completionRate: number;
  icon?: string | null;
  description?: string | null;
  notes?: string | null;
  createdDt: string;
  updatedDt: string;

  // Real, persisted progress rollup from Quest.QuestProgress
  currentXP: number;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;

  // Only populated on GetById / Update responses.
  tasks?: QuestTaskDto[] | null;
  milestones?: QuestMilestoneDto[] | null;
  calendarLog?: QuestCalendarLogDto[] | null;
}

export interface QuestInputDto {
  habitId: string;
  name: string;
  category: string;
  difficulty: string;
  xp: number;
  icon?: string;
  description?: string;
  notes?: string;
}

export interface QuestUpdateDto {
  name?: string;
  category?: string;
  difficulty?: string;
  icon?: string;
  xp?: number;
  status?: string;
  progress?: number;
  completionRate?: number;
  description?: string;
  notes?: string;
}

export interface QuestTaskInputDto {
  name: string;
  description?: string;
  xpReward?: number;
}

export interface QuestTaskUpdateDto {
  name?: string;
  description?: string;
  xpReward?: number;
}

export interface QuestMilestoneInputDto {
  name: string;
  description?: string;
  target: number;
  xpReward: number;
  icon?: string;
}

export interface QuestLogDto {
  logDate?: string;
  completed: boolean;
  notes?: string;
}

// ─── The cascade response ──────────────────────────────────────
// Mirrors backend QuestTaskCompletionResultDto. One call returns every
// layer that changed, so the UI can update task/quest/habit/user state
// from a single response without a follow-up GET.

export interface QuestProgressRollupDto {
  questId: string;
  currentXP: number;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
}

export interface HabitProgressRollupDto {
  habitId: string;
  currentLevel: number;
  currentXP: number;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletionDate?: string | null;
}

export interface UserProgressDto {
  userId: string;
  currentXP: number;
  totalXP: number;
  currentLevel: number;
  rank: string;
  updatedDt: string;
}

export interface QuestTaskCompletionResultDto {
  success: boolean;
  message: string;
  task?: QuestTaskDto | null;
  questProgress?: QuestProgressRollupDto | null;
  habitProgress?: HabitProgressRollupDto | null;
  userProgress?: UserProgressDto | null;
}
