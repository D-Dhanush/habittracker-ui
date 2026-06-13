import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Habit, HabitCompletion } from '../../../models/habit.model';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './habit-card.component.html',
  styleUrls: ['./habit-card.component.scss']
})
export class HabitCardComponent implements OnInit {
  @Input() habit!: Habit;
  @Output() habitClick = new EventEmitter<string>();

  completionPercentage = 0;
  currentStreak = 0;

  ngOnInit(): void {
    this.calculateStats();
  }

  ngOnChanges(): void {
    this.calculateStats();
  }

  private calculateStats(): void {
    if (!this.habit) return;

    // Calculate completion percentage
    const completed = this.habit.completions.filter((c: HabitCompletion) => c.completed).length;
    this.completionPercentage = this.habit.completions.length > 0 
      ? Math.round((completed / this.habit.completions.length) * 100)
      : 0;

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const completion = this.habit.completions.find((c: HabitCompletion) => {
        const cDate = new Date(c.date);
        cDate.setHours(0, 0, 0, 0);
        return cDate.getTime() === currentDate.getTime();
      });

      if (completion?.completed) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    this.currentStreak = streak;
  }

  onCardClick(): void {
    this.habitClick.emit(this.habit.id);
  }

  getStatusBadgeClass(): string {
    switch (this.habit.status) {
      case 'active':
        return 'badge-success';
      case 'paused':
        return 'badge-warning';
      case 'completed':
        return 'badge-blue';
      case 'archived':
        return 'badge-tertiary';
      default:
        return '';
    }
  }

  getStatusLabel(): string {
    return this.habit.status.charAt(0).toUpperCase() + this.habit.status.slice(1);
  }

  getCategoryLabel(): string {
    return this.habit.customCategory || this.habit.category;
  }
}
