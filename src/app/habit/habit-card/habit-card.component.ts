import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../habit.service';
import { HabitDto } from '../../models/Habit.dto';
import { Router } from '@angular/router';
import { ToastService } from '../../toast.service';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-card.component.html',
  styleUrls: ['./habit-card.component.scss']
})
export class HabitCardComponent implements OnInit, OnChanges {
  @Input() habitId!: string;
  @Input() habit: HabitDto | null = null;
  @Output() deleted = new EventEmitter<string>();

  confirmDelete = false;
  streak = 0;
  level = 1;
  completedDays = 0;

  constructor(
    private habitService: HabitService,
    private router: Router,
    private toastService: ToastService
  ) {}

  getIconSymbol(icon?: string | null): string {
    switch (icon) {
      case 'diamond': return '💎';
      case 'medal': return '🏅';
      case 'medal-silver': return '🥈';
      case 'emerald': return '💚';
      case 'star':
      default:
        return '⭐';
    }
  }

  ngOnInit(): void {
    if (this.habitId && !this.habit) {
      this.habitService.getHabitById(this.habitId).subscribe({
        next: (habit: HabitDto) => {
          this.habit = habit;
          this.updateStats();
        },
        error: (error: any) => {
          console.error('Error fetching habit', error);
        }
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
    if (!this.habit) {
      return;
    }
    this.streak = Math.max(1, Math.min(30, Math.round((this.habit.targetOccurrencesPerPeriod ?? 7) * 0.65)));
    this.level = Math.max(1, Math.min(10, Math.ceil((this.habit.targetOccurrencesPerPeriod ?? 7) / 2)));
    this.completedDays = Math.min(this.streak, new Date().getDate());
  }

  onCardClick(): void {
    if (this.habit && !this.confirmDelete) {
      this.router.navigate(['/habit', this.habit.id]);
    }
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
    if (!this.habit) {
      return;
    }

    this.habitService.deleteHabit(this.habit.id).subscribe({
      next: () => {
        this.toastService.show('Habit deleted', 'success');
        this.deleted.emit(this.habit!.id);
      },
      error: () => {
        this.toastService.show('Delete failed. Try again.', 'failure');
      }
    });
  }
}