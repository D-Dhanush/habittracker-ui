import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  QuestDto,
  QuestInputDto,
  QuestUpdateDto,
  QuestTaskDto,
  QuestTaskInputDto,
  QuestTaskUpdateDto,
  QuestMilestoneDto,
  QuestMilestoneInputDto,
  QuestLogDto,
  QuestCalendarLogDto,
  QuestTaskCompletionResultDto
} from '../models/quest.model';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class QuestService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Quest`;

  constructor(private http: HttpClient) {}

  // ─── QUESTS ───────────────────────────────────────────────

  createQuest(input: QuestInputDto): Observable<QuestDto> {
    return this.http.post<QuestDto>(this.apiUrl, input);
  }

  getQuestsByHabitId(habitId: string): Observable<QuestDto[]> {
    return this.http.get<QuestDto[]>(`${this.apiUrl}/by-habit/${habitId}`);
  }

  getQuestById(id: string): Observable<QuestDto> {
    return this.http.get<QuestDto>(`${this.apiUrl}/${id}`);
  }

  updateQuest(id: string, input: QuestUpdateDto): Observable<QuestDto> {
    return this.http.put<QuestDto>(`${this.apiUrl}/${id}`, input);
  }

  deleteQuest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateProgress(questId: string, progress: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${questId}/progress`, { progress });
  }

  // ─── TASKS ────────────────────────────────────────────────

  addTask(questId: string, input: QuestTaskInputDto): Observable<QuestTaskDto> {
    return this.http.post<QuestTaskDto>(`${this.apiUrl}/${questId}/tasks`, input);
  }

  updateTask(questId: string, taskId: string, input: QuestTaskUpdateDto): Observable<QuestTaskDto> {
    return this.http.put<QuestTaskDto>(`${this.apiUrl}/${questId}/tasks/${taskId}`, input);
  }

  deleteTask(questId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${questId}/tasks/${taskId}`);
  }

  /**
   * The only path that grants XP for completing a task. Cascades
   * Task -> Quest -> Habit -> UserProgress server-side in one
   * transaction and returns every updated layer in one response,
   * so the UI never needs a follow-up GET to refresh stats.
   */
  completeTask(questId: string, taskId: string): Observable<QuestTaskCompletionResultDto> {
    // FIXED: was posting an empty {} body. CompleteTaskRequestDto.Completed
    // is a non-nullable bool on the backend, defaulting to false when the
    // field is absent — so every "complete" click was silently deserialized
    // as completed=false and ran the UNCOMPLETE branch instead. This is why
    // the popup/UI looked right optimistically but the API state (and XP)
    // never matched, and why a fresh never-completed task would crash with
    // an ObjectDisposedException (hit the "Already incomplete" no-op path
    // unexpectedly). Must explicitly send completed: true.
    return this.http.post<QuestTaskCompletionResultDto>(
      `${this.apiUrl}/${questId}/tasks/${taskId}/complete`,
      { completed: true }
    );
  }


  /**
   * Reverses a task completion and debits the XP cascade.
   * Uses POST /complete with { completed: false } so the server-side
   * CompleteTaskAsync revert path runs USP_UncompleteQuestTask — a real,
   * symmetric reversal of USP_CompleteQuestTask (reverses QuestProgress/
   * HabitProgress/UserProgress XP, not just the task row's Completed flag).
   */
  uncompleteTask(questId: string, taskId: string): Observable<QuestTaskCompletionResultDto> {
    return this.http.post<QuestTaskCompletionResultDto>(
      `${this.apiUrl}/${questId}/tasks/${taskId}/complete`,
      { completed: false }
    );
  }

  // ─── MILESTONES ───────────────────────────────────────────

  addMilestone(questId: string, input: QuestMilestoneInputDto): Observable<QuestMilestoneDto> {
    return this.http.post<QuestMilestoneDto>(`${this.apiUrl}/${questId}/milestones`, input);
  }

  achieveMilestone(questId: string, milestoneId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${questId}/milestones/${milestoneId}/achieve`, {});
  }

  // ─── CALENDAR LOG ─────────────────────────────────────────

  logProgress(questId: string, input: QuestLogDto): Observable<QuestCalendarLogDto> {
    return this.http.post<QuestCalendarLogDto>(`${this.apiUrl}/${questId}/log`, input);
  }
}
