import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HabitService } from '../../services/habit.service';
import { ToastService } from '../../toast.service';
import { getCategoryIcon, getCategoryLabel } from '../../models/category-constants';
import { QuestCardComponent } from '../../arclord/components/quest-card/quest-card.component';
import { HabitDto } from '../../models/habitdto';

interface CalendarDay {
  date: Date;
  completed: boolean;
}

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, QuestCardComponent],
  templateUrl: './habit-detail.component.html',
  styleUrls: ['./habit-detail.component.scss']
})
export class HabitDetailComponent implements OnInit {
  habit?: HabitDto;
  loading = true;
  errorMessage = '';
  calendarDays: CalendarDay[] = [];

  readonly calendarWindowDays = 30;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Habit ID is missing.';
      return;
    }
    this.loadHabit(id);
  }

  loadHabit(id: string): void {
    this.loading = true;
    this.habitService.getHabitById(id).subscribe({
      next: (habit) => {
        this.habit = habit;
        this.calendarDays = this.buildCalendarFromRealCompletions(habit);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load habit details.';
      }
    });
  }

  get categoryIcon(): string { return getCategoryIcon(this.habit?.category); }
  get categoryLabel(): string { return getCategoryLabel(this.habit?.category); }
  get quests() { return this.habit?.quests ?? []; }

  onQuestClick(questId: string): void {
    if (!this.habit) return;
    this.router.navigate(['/habit', this.habit.id, 'quest', questId]);
  }

  onNewQuest(): void {
    if (!this.habit) return;
    this.router.navigate(['/habit', this.habit.id, 'quest', 'new']);
  }

  // ── Added: navigates to the edit form for this habit ──────────────
  editHabit(): void {
    if (!this.habit) return;
    this.router.navigate(['/habit', this.habit.id, 'edit']);
  }

  deleteHabit(): void {
    if (!this.habit) return;
    const confirmed = window.confirm(
      `Delete "${this.habit.name}"? This will also remove all its Quests and Tasks and cannot be undone.`
    );
    if (!confirmed) return;

    this.habitService.deleteHabit(this.habit.id).subscribe({
      next: () => {
        this.toast.show('Habit deleted.', 'success');
        this.router.navigate(['/habits']);
      },
      error: () => this.toast.show('Could not delete habit.', 'failure')
    });
  }

  private buildCalendarFromRealCompletions(habit: HabitDto): CalendarDay[] {
    const completions = habit.recentCompletions ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    for (let i = this.calendarWindowDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const completed = completions.some(c => {
        const cDate = new Date(c.completionDate);
        cDate.setHours(0, 0, 0, 0);
        return cDate.getTime() === date.getTime() && c.completed;
      });

      days.push({ date, completed });
    }
    return days;
  }
}