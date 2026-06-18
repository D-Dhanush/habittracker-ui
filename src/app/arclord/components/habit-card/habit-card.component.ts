import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HabitDto } from '../../../models/habitdto';
import { ToastService } from '../../../toast.service';
import { HabitService } from '../../../services/habit.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule,MatIconModule],
  templateUrl: './habit-card.component.html',
  styleUrls: ['./habit-card.component.scss']
})
export class HabitCardComponent implements OnInit, OnChanges {
  @Input() habitId!: string;
  @Input() habit: HabitDto | null = null;

  @Output() deleted = new EventEmitter<string>();
  @Output() habitClick = new EventEmitter<string>();

  confirmDelete = false;

  streak = 0;
  level = 1;
  completedDays = 0;
  completionPercentage = 0;

  constructor(
    private habitService: HabitService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.habitId && !this.habit) {
      this.habitService.getHabitById(this.habitId).subscribe({
        next: habit => {
          this.habit = habit;
          this.updateStats();
        },
        error: err => console.error(err)
      });
    } else {
      this.updateStats();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['habit']) {
      this.updateStats();
    }
  }

  updateStats(): void {
    if (!this.habit) return;

    const completions = this.habit.recentCompletions ?? [];

    const completed = completions.filter(c => c.completed).length;

    this.completionPercentage =
      completions.length > 0
        ? Math.round((completed / completions.length) * 100)
        : 0;

    this.streak = Math.max(
      1,
      Math.min(
        30,
        Math.round(
          (this.habit.targetOccurrencesPerPeriod ?? 7) * 0.65
        )
      )
    );

    this.level = Math.max(
      1,
      Math.min(
        10,
        Math.ceil(
          (this.habit.targetOccurrencesPerPeriod ?? 7) / 2
        )
      )
    );

    this.completedDays = Math.min(
      this.streak,
      new Date().getDate()
    );
  }

onCardClick(): void {
  if (!this.habit || this.confirmDelete) return;

  this.habitClick.emit(this.habit.id);
  this.router.navigate(['/habit', this.habit.id]);
}
  promptDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDelete = true;
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDelete = false;
  }

  confirmDeleteHabit(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.habit) return;

    this.habitService.deleteHabit(this.habit.id).subscribe({
      next: () => {
        this.toastService.show('Habit deleted', 'success');
        this.deleted.emit(this.habit!.id);
      },
      error: () => {
        this.toastService.show(
          'Delete failed. Try again.',
          'failure'
        );
      }
    });
  }

  getStatusLabel(): string {
    if (!this.habit?.status) {
      return 'Active';
    }

    return (
      this.habit.status.charAt(0).toUpperCase() +
      this.habit.status.slice(1)
    );
  }

  getCategoryLabel(): string {
    return (
      this.habit?.customCategory ??
      this.habit?.category ??
      'General'
    );
  }

  getIconSymbol(icon?: string | null): string {
    switch (icon) {
      case 'diamond':
        return '💎';

      case 'medal':
        return '🏅';

      case 'medal-silver':
        return '🥈';

      case 'emerald':
        return '💚';

      default:
        return '⭐';
    }
  }

  getStatusBadgeClass(): string {
  switch (this.habit?.status?.toLowerCase()) {
    case 'completed':
      return 'badge-success';

    case 'paused':
      return 'badge-warning';

    case 'archived':
      return 'badge-secondary';

    default:
      return 'badge-active';
  }
}
}