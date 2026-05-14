import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateHabitDto } from './models/CreateHabit.dto';
import { HabitDto } from './models/Habit.dto';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private apiUrl = 'http://localhost:7071/api/Habit';

  constructor(private http: HttpClient) {}

  createHabit(input: CreateHabitDto): Observable<HabitDto> {
    return this.http.post<HabitDto>(this.apiUrl, input);
  }

  getHabitById(id: string): Observable<HabitDto> {
    return this.http.get<HabitDto>(`${this.apiUrl}/${id}`);
  }

  getAllHabits(): Observable<HabitDto[]> {
    return this.http.get<HabitDto[]>(this.apiUrl);
  }
}