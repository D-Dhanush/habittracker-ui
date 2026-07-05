// ── Flat task model for the Task Management page ─────────────────────────────
// Extends QuestTaskDto with parent-relationship fields (habitId, habitName,
// questId, questName) and optional UI-only fields (priority, dueDate).
// The backend GET /api/task endpoint returns this shape.

export interface TaskFlatDto {
  id: string;
  questId: string;
  questName: string;
  habitId: string;
  habitName: string;

  name: string;
  description?: string | null;
  xpReward: number;
  completed: boolean;
  completedDate?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  dueDate?: string | null;

  createdDt: string;
  updatedDt: string;
}

export interface TaskFilterParams {
  search?: string;
  habitId?: string;
  questId?: string;
  status?: 'all' | 'pending' | 'completed';
  priority?: 'all' | 'low' | 'medium' | 'high';
  page?: number;
  pageSize?: number;
}

export interface TaskUpdateDto {
  name?: string;
  description?: string;
  xpReward?: number;
  priority?: string;
  dueDate?: string;
}

export interface TaskPagedResult {
  items: TaskFlatDto[];
  total: number;
  page: number;
  pageSize: number;
}
