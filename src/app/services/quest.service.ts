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
    return this.http.post<QuestTaskCompletionResultDto>(
      `${this.apiUrl}/${questId}/tasks/${taskId}/complete`, {}
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
