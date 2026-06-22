import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getCategoryIcon, getCategoryLabel } from '../../models/category-constants';
import { HabitDto } from '../../models/habitdto';
@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-card.component.html',
  styleUrls: ['./habit-card.component.scss']
})
export class HabitCardComponent {
  @Input() habit!: HabitDto;
  @Output() habitClick = new EventEmitter<string>();
  @Output() deleteConfirmed = new EventEmitter<string>();

  confirmDelete = false;

  get streak(): number {
    return this.habit?.streak ?? 0;
  }

  get level(): number {
    return this.habit?.currentLevel ?? 1;
  }

  get currentXP(): number {
    return this.habit?.currentXP ?? 0;
  }

  get questCount(): number {
    return this.habit?.questCount ?? 0;
  }

  get completionPercentage(): number {
    // A habit's overall completion is the average completion of its quests.
    // Until a habit carries that rollup directly, totalCompletions vs.
    // target gives a reasonable proxy; falls back to 0 rather than NaN.
    const target = this.habit?.targetOccurrencesPerPeriod;
    if (!target || target <= 0) return 0;
    const pct = Math.round(((this.habit?.totalCompletions ?? 0) / target) * 100);
    return Math.min(pct, 100);
  }

  get categoryIcon(): string {
    return getCategoryIcon(this.habit?.category);
  }

  get categoryLabel(): string {
    return getCategoryLabel(this.habit?.category);
  }

  get statusLabel(): string {
    const status = this.habit?.status ?? 'active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  onCardClick(): void {
    if (this.confirmDelete) return;
    this.habitClick.emit(this.habit.id);
  }

  promptDelete(event: Event): void {
    event.stopPropagation();
    this.confirmDelete = true;
  }

  confirmDeleteHabit(event: Event): void {
    event.stopPropagation();
    this.confirmDelete = false;
    this.deleteConfirmed.emit(this.habit.id);
  }

  cancelDelete(event: Event): void {
    event.stopPropagation();
    this.confirmDelete = false;
  }
}
