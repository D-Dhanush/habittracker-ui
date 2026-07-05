import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getCategoryIcon, getCategoryLabel } from '../../models/category-constants';
import { HabitDto } from '../../models/habitdto';

export interface WeekDay {
  label: string;
  date: number;
  isToday: boolean;
  completed: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-card.component.html',
  styleUrls: ['./habit-card.component.scss']
})
export class HabitCardComponent implements OnInit {
  @Input() habit!: HabitDto;
  @Output() habitClick    = new EventEmitter<string>();
  @Output() editClicked   = new EventEmitter<string>();
  @Output() deleteConfirmed = new EventEmitter<string>();

  confirmDelete = false;
  weekDays: WeekDay[] = [];

  ngOnInit(): void {
    this.weekDays = this.buildCurrentWeek();
  }

  // ── Icon: prefer user-picked icon, fall back to category default ─────────
  get categoryIcon(): string {
    if (this.habit?.icon?.trim()) return this.habit.icon.trim();
    return getCategoryIcon(this.habit?.category);
  }

  // ── Colors: use the user's chosen habit colors, fall back to gold ─────────
  get primaryColor(): string {
    return this.habit?.primaryColor?.trim() || '#d4af37';
  }

  get secondaryColor(): string {
    return this.habit?.secondaryColor?.trim() || '#a07820';
  }

  get categoryLabel(): string  { return getCategoryLabel(this.habit?.category); }
  get streak(): number         { return this.habit?.streak ?? 0; }
  get level(): number          { return this.habit?.currentLevel ?? 1; }
  get currentXP(): number      { return this.habit?.currentXP ?? 0; }
  get questCount(): number     { return this.habit?.questCount ?? 0; }

  get completionPercentage(): number {
    const target = this.habit?.targetOccurrencesPerPeriod;
    if (!target || target <= 0) return 0;
    return Math.min(Math.round(((this.habit?.totalCompletions ?? 0) / target) * 100), 100);
  }

  get statusLabel(): string {
    const s = this.habit?.status ?? 'active';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  onCardClick(): void {
    if (this.confirmDelete) return;
    this.habitClick.emit(this.habit.id);
  }

  onEditClick(event: Event): void {
    event.stopPropagation();
    this.editClicked.emit(this.habit.id);
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

  private buildCurrentWeek(): WeekDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedDates = new Set<string>();
    if (this.habit?.recentCompletions?.length) {
      for (const c of this.habit.recentCompletions) {
        if (c.completed) completedDates.add(c.completionDate.substring(0, 10));
      }
    } else if (this.habit?.lastCompletionDate) {
      completedDates.add(this.habit.lastCompletionDate.substring(0, 10));
    }

    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return ['M','T','W','T','F','S','S'].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso     = d.toISOString().substring(0, 10);
      const isToday = d.getTime() === today.getTime();
      const isFuture = d > today;
      return { label, date: d.getDate(), isToday, completed: completedDates.has(iso), isFuture };
    });
  }
}
