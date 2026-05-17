import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HabitService } from '../../habit.service';
import { HabitDto } from '../../models/Habit.dto';

interface CalendarDay {
  day: number;
  completed: boolean;
}

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-detail.component.html',
  styleUrls: ['./habit-detail.component.scss']
})
export class HabitDetailComponent implements OnInit {
  habit?: HabitDto;
  loading = true;
  errorMessage = '';
  currentStreak = 0;
  level = 1;
  levelProgress = 0;
  goalDays = 30;
  calendarDays: CalendarDay[] = [];

  constructor(
    private route: ActivatedRoute,
    private habitService: HabitService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Habit ID is missing.';
      return;
    }

    this.habitService.getHabitById(id).subscribe({
      next: (habit) => {
        this.habit = habit;
        this.currentStreak = this.calculateCurrentStreak(habit);
        this.level = this.calculateLevel(habit);
        this.levelProgress = this.calculateProgress(habit);
        this.calendarDays = this.buildCalendar(this.currentStreak);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load habit details.';
      }
    });
  }

  private calculateCurrentStreak(habit: HabitDto): number {
    const base = habit.targetOccurrencesPerPeriod ?? 7;
    return Math.min(30, Math.max(1, Math.round(base * 0.7)));
  }

  private calculateLevel(habit: HabitDto): number {
    const base = habit.targetOccurrencesPerPeriod ?? 7;
    return Math.min(10, Math.max(1, Math.ceil(base / 2)));
  }

  private calculateProgress(habit: HabitDto): number {
    const target = habit.targetOccurrencesPerPeriod ?? 7;
    const progress = this.currentStreak / Math.max(target, 1);
    return Math.min(1, progress);
  }

  private calculateCompletedDays(habit: HabitDto): number {
    const started = habit.startDt ? new Date(habit.startDt) : new Date();
    const today = new Date();
    const daysSinceStart = Math.max(0, Math.floor((today.getTime() - started.getTime()) / 86400000));
    return Math.min(this.currentStreak, daysSinceStart + 1, this.goalDays);
  }

  private buildCalendar(streak: number): CalendarDay[] {
    const completedDays = Math.min(streak, this.calculateCompletedDays(this.habit!));
    return Array.from({ length: this.goalDays }, (_, index) => ({
      day: index + 1,
      completed: index < completedDays
    }));
  }
}
