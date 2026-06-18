import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuestDto {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  xp: number;
  status: string;
  progress: number;
  completionRate: number;
  icon?: string;
  description?: string;
  notes?: string;
  checklistTasks: QuestChecklistTaskDto[];
  calendarLog: QuestCalendarLogDto[];
  createdDt: string;
  updatedDt: string;
}

export interface QuestChecklistTaskDto {
  id: string;
  questId: string;
  title: string;
  done: boolean;
  createdDt: string;
}

export interface QuestCalendarLogDto {
  id: string;
  questId: string;
  logDate: string;
  completed: boolean;
  notes?: string;
  createdDt: string;
}

export interface QuestInputDto {
  name: string;
  description?: string;
  category?: string;
  difficulty?: string;
  icon?: string;
  xp?: number;
  notes?: string;
}

export interface QuestUpdateDto {
  name?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  icon?: string;
  xp?: number;
  status?: string;
  progress?: number;
  notes?: string;
}

export interface ChecklistTaskDto {
  title: string;
}

export interface ChecklistTaskUpdateDto {
  title?: string;
  done?: boolean;
}

export interface QuestLogDto {
  logDate?: string;
  completed: boolean;
  notes?: string;
}

export interface UpdateProgressDto {
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuestService {
  private readonly apiUrl = 'http://localhost:7071/api/Quest';

  constructor(private http: HttpClient) {}

  // ─── QUESTS ───────────────────────────────────────────────

  createQuest(input: QuestInputDto): Observable<QuestDto> {
    return this.http.post<QuestDto>(this.apiUrl, input);
  }

  getAllQuests(): Observable<QuestDto[]> {
    return this.http.get<QuestDto[]>(this.apiUrl);
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

  // ─── CHECKLIST ────────────────────────────────────────────

  addChecklistTask(questId: string, input: ChecklistTaskDto): Observable<QuestChecklistTaskDto> {
    return this.http.post<QuestChecklistTaskDto>(
      `${this.apiUrl}/${questId}/checklist`, input
    );
  }

  updateChecklistTask(questId: string, taskId: string, input: ChecklistTaskUpdateDto): Observable<QuestChecklistTaskDto> {
    return this.http.put<QuestChecklistTaskDto>(
      `${this.apiUrl}/${questId}/checklist/${taskId}`, input
    );
  }

  // ─── PROGRESS & LOG ───────────────────────────────────────

  logProgress(questId: string, input: QuestLogDto): Observable<QuestCalendarLogDto> {
    return this.http.post<QuestCalendarLogDto>(
      `${this.apiUrl}/${questId}/log`, input
    );
  }

  updateProgress(questId: string, input: UpdateProgressDto): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${questId}/progress`, input
    );
  }
}