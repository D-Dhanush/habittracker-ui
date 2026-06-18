import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HabitDto } from '../models/habitdto';
import { CreateHabitDto } from '../models/createhabitdto';

export interface HabitCompletionInput {
  completionDate?: string;
  xpEarned?: number;
  notes?: string;
}

export interface HabitTaskInput {
  name: string;
  description?: string;
  xpReward?: number;
}

export interface HabitTaskUpdateInput {
  name?: string;
  description?: string;
  xpReward?: number;
  completed?: boolean;
}

export interface HabitUpdateInput {
  name?: string;
  subtitle?: string;
  description?: string;
  status?: string;
  frequency?: string;
  endDateUtc?: string;
  targetOccurrencesPerPeriod?: number;
  reminderTimeUtc?: string;
  icon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  xpReward?: number;
  tags?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface HabitStatsDto {
  totalHabits: number;
  activeHabits: number;

  currentXp: number;
  totalXpEarned: number;

  currentStreak: number;
  longestStreak: number;

  completionPercentage: number;

  completedToday: number;
}

export interface HabitTaskOutputDto {
  id: string;
  habitId: string;
  name: string;
  description?: string;
  xpReward: number;
  completed: boolean;
  completedDate?: string;
  createdDt: string;
  updatedDt: string;
}

export interface HabitCompletionOutputDto {
  id: string;
  habitId: string;
  completionDate: string;
  completed: boolean;
  xpEarned: number;
  notes?: string;
  createdDt: string;
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private readonly apiUrl = 'http://localhost:7071/api/Habit';

  constructor(private http: HttpClient) {}

  // ─── HABITS ───────────────────────────────────────────────

  createHabit(input: CreateHabitDto): Observable<HabitDto> {
    return this.http.post<HabitDto>(this.apiUrl, input);
  }

  getAllHabits(): Observable<HabitDto[]> {
    return this.http.get<HabitDto[]>(this.apiUrl);
  }

  // alias used by components that call getHabits()
  getHabits(): Observable<HabitDto[]> {
    return this.getAllHabits();
  }

  getHabitById(id: string): Observable<HabitDto> {
    return this.http.get<HabitDto>(`${this.apiUrl}/${id}`);
  }

  updateHabit(id: string, input: HabitUpdateInput): Observable<HabitDto> {
    return this.http.put<HabitDto>(`${this.apiUrl}/${id}`, input);
  }

  deleteHabit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ─── COMPLETION ───────────────────────────────────────────

  completeHabit(habitId: string, input: HabitCompletionInput): Observable<HabitCompletionOutputDto> {
    return this.http.post<HabitCompletionOutputDto>(
      `${this.apiUrl}/${habitId}/complete`, input
    );
  }

  // ─── STATS ────────────────────────────────────────────────

  getStats(): Observable<HabitStatsDto> {
    return this.http.get<HabitStatsDto>(`${this.apiUrl}/stats/overview`);
  }

  // ─── TASKS ────────────────────────────────────────────────

  addTask(habitId: string, input: HabitTaskInput): Observable<HabitTaskOutputDto> {
    return this.http.post<HabitTaskOutputDto>(
      `${this.apiUrl}/${habitId}/tasks`, input
    );
  }

  updateTask(habitId: string, taskId: string, input: HabitTaskUpdateInput): Observable<HabitTaskOutputDto> {
    return this.http.put<HabitTaskOutputDto>(
      `${this.apiUrl}/${habitId}/tasks/${taskId}`, input
    );
  }

  deleteTask(habitId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${habitId}/tasks/${taskId}`
    );
  }
}