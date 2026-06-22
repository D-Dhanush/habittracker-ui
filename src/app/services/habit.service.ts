import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HabitDto, HabitMilestoneDto, HabitCompletionOutputDto } from '../models/habitdto';
import { CreateHabitDto } from '../models/createhabitdto';
import { environment } from '../../environments/environment';
// Mirrors backend HabitTrackerApi.InputModels.HabitUpdateDto exactly.
export interface HabitUpdateInput {
  name?: string;
  subtitle?: string;
  description?: string;
  category?: string;
  customCategory?: string;
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

export interface HabitCompletionInput {
  completionDate?: string;
  xpEarned?: number;
  notes?: string;
}

export interface HabitMilestoneInput {
  name: string;
  description?: string;
  target: number;
  xpReward: number;
  icon?: string;
}

// Mirrors backend HabitTrackerApi.ResultDtos.HabitStatsDto exactly.
// The previous version of this interface had currentXp/currentStreak/
// completionPercentage fields that did NOT exist on the real API
// response (the backend's old HabitStatsDto only had TotalXpEarned and
// LongestStreak) — every dashboard stat card reading from it silently
// rendered `undefined`. Both sides now agree on field names AND shape.
export interface HabitStatsDto {
  totalHabits: number;
  activeHabits: number;
  totalQuests: number;
  totalXpEarned: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: number;
  completionPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Habit`;

  constructor(private http: HttpClient) {}

  // ─── HABITS ───────────────────────────────────────────────

  createHabit(input: CreateHabitDto): Observable<HabitDto> {
    return this.http.post<HabitDto>(this.apiUrl, input);
  }

  getAllHabits(): Observable<HabitDto[]> {
    return this.http.get<HabitDto[]>(this.apiUrl);
  }

  // alias kept for existing component call sites that use getHabits()
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

  // ─── COMPLETION (direct habit-level, non-quest path) ───────

  completeHabit(habitId: string, input: HabitCompletionInput): Observable<HabitCompletionOutputDto> {
    return this.http.post<HabitCompletionOutputDto>(
      `${this.apiUrl}/${habitId}/complete`, input
    );
  }

  // ─── STATS ────────────────────────────────────────────────

  getStats(): Observable<HabitStatsDto> {
    return this.http.get<HabitStatsDto>(`${this.apiUrl}/stats/overview`);
  }

  // ─── MILESTONES ───────────────────────────────────────────

  addMilestone(habitId: string, input: HabitMilestoneInput): Observable<HabitMilestoneDto> {
    return this.http.post<HabitMilestoneDto>(
      `${this.apiUrl}/${habitId}/milestones`, input
    );
  }

  achieveMilestone(habitId: string, milestoneId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${habitId}/milestones/${milestoneId}/achieve`, {}
    );
  }
}
