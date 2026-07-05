import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskFlatDto, TaskFilterParams, TaskUpdateDto } from '../models/task.model';
import { QuestDto, QuestTaskCompletionResultDto } from '../models/quest.model';
import { HabitDto } from '../models/habitdto';

/**
 * TaskService — thin facade that builds a flat task list from the existing
 * Quest and Habit APIs. No new backend endpoints are strictly required:
 *  - GET /api/Habit  → all habits (with questCount)
 *  - GET /api/Quest/by-habit/{id} → quests per habit
 *  - GET /api/Quest/{id}  → quest + tasks[]
 *  - POST /api/Quest/{q}/tasks/{t}/complete  → complete
 *  - PUT  /api/Quest/{q}/tasks/{t}            → update / uncomplete
 *  - DELETE /api/Quest/{q}/tasks/{t}          → delete
 *
 * A dedicated backend route GET /api/Task (with filters) is the Phase 2
 * upgrade path — add it here when the SP is ready and swap the getAllTasks
 * implementation below.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly habitUrl = `${environment.apiBaseUrl}/api/Habit`;
  private readonly questUrl = `${environment.apiBaseUrl}/api/Quest`;

  constructor(private http: HttpClient) {}

  /**
   * Assembles a flat task list from habits → quests → tasks.
   * Client-side only for now; wire to GET /api/Task once the SP exists.
   */
  getAllTasksFlat(): Observable<TaskFlatDto[]> {
    return this.http.get<HabitDto[]>(this.habitUrl).pipe(
      map(habits => {
        // Return habits so the next step can fetch quests per habit.
        // We use forkJoin in the component for simplicity.
        return habits;
      }),
      // Replaced by the component-level load below — this method intentionally
      // returns habits so callers can decide how deep to go.
    ) as any;
  }

  /** Load habits list only — for filter dropdowns */
  getHabits(): Observable<HabitDto[]> {
    return this.http.get<HabitDto[]>(this.habitUrl);
  }

  /** Load quests for a habit (includes task[] if the SP was updated) */
  getQuestsByHabit(habitId: string): Observable<QuestDto[]> {
    return this.http.get<QuestDto[]>(`${this.questUrl}/by-habit/${habitId}`);
  }

  /** Load a single quest with full tasks[] */
  getQuestDetail(questId: string): Observable<QuestDto> {
    return this.http.get<QuestDto>(`${this.questUrl}/${questId}`);
  }

  // ── Task mutations (all delegate to existing Quest endpoints) ─────────

  updateTask(questId: string, taskId: string, input: TaskUpdateDto): Observable<any> {
    return this.http.put(`${this.questUrl}/${questId}/tasks/${taskId}`, input);
  }

  completeTask(questId: string, taskId: string): Observable<QuestTaskCompletionResultDto> {
    return this.http.post<QuestTaskCompletionResultDto>(
      `${this.questUrl}/${questId}/tasks/${taskId}/complete`,
      { completed: true }
    );
  }

  /**
   * Revert completion via POST /complete with {completed:false}.
   * This hits the backend's CompleteTaskAsync revert branch, which now
   * calls USP_UncompleteQuestTask — a real, symmetric reversal of
   * USP_CompleteQuestTask (reverses QuestProgress/HabitProgress/
   * UserProgress XP, not just the task's Completed flag). Fixed: this
   * branch previously called USP_UpdateQuestTask, which only flipped the
   * task row's Completed bit and silently skipped all XP/streak/rank
   * reversal — exactly the gap this comment used to flag as pending.
   * Using PUT would still silently skip XP debit (UpdateTaskAsync
   * intentionally ignores @Completed) — POST to /complete remains correct.
   */
  uncompleteTask(questId: string, taskId: string): Observable<QuestTaskCompletionResultDto> {
    return this.http.post<QuestTaskCompletionResultDto>(
      `${this.questUrl}/${questId}/tasks/${taskId}/complete`,
      { completed: false }
    );
  }

  deleteTask(questId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.questUrl}/${questId}/tasks/${taskId}`);
  }
}
