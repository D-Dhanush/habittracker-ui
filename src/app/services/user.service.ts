import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProgressDto } from '../models/quest.model';
import { environment } from '../../environments/environment';

// Mirrors backend HabitTrackerApi.ResultDtos.UserDto exactly.
export interface UserDto {
  id: string;
  email: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  createdDt: string;
  lastLoginDt?: string | null;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/User`;

  constructor(private http: HttpClient) {}

  /**
   * Phase 1 has no real auth — this always resolves to the single
   * seeded default user. Phase 2 swaps the backend implementation
   * to read from an auth token; this call site doesn't change.
   */
  getCurrentUser(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/me`);
  }

  /**
   * Global, account-wide XP / Level / Rank — the single source of
   * truth for the dashboard header. Replaces the old per-component
   * hardcoded XP thresholds that disagreed with each other.
   */
  getCurrentUserProgress(): Observable<UserProgressDto> {
    return this.http.get<UserProgressDto>(`${this.apiUrl}/me/progress`);
  }
}
