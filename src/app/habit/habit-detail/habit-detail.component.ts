import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HabitService } from '../../services/habit.service';
import { ToastService } from '../../toast.service';
import { getCategoryIcon, getCategoryLabel } from '../../models/category-constants';
import { QuestCardComponent } from '../../arclord/components/quest-card/quest-card.component';
import { HabitDto } from '../../models/habitdto';
import { QuestService } from '../../services/quest.service';

interface CalendarDay { date: Date; completed: boolean; }

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

  /** Shown as a floating +XP banner after completing the habit */
  xpPopup: number | null = null;
  completing = false;

  readonly calendarWindowDays = 30;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private toast: ToastService,
    private questService: QuestService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading = false; this.errorMessage = 'Habit ID is missing.'; return; }
    this.loadHabit(id);
  }

  loadHabit(id: string): void {
    this.loading = true;
    this.habitService.getHabitById(id).subscribe({
      next: habit => { this.habit = habit; this.calendarDays = this.buildCalendar(habit); this.loading = false; },
      error: () => { this.loading = false; this.errorMessage = 'Unable to load habit details.'; }
    });
  }

  get categoryIcon(): string { return getCategoryIcon(this.habit?.category); }
  get categoryLabel(): string { return getCategoryLabel(this.habit?.category); }
  get quests() { return this.habit?.quests ?? []; }

  /** True if the habit already has a completed=true entry for today */
  get isCompletedToday(): boolean {
    if (!this.habit) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (this.habit.recentCompletions ?? []).some(c => {
      const d = new Date(c.completionDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && c.completed;
    });
  }

  completeHabit(): void {
    if (!this.habit || this.completing || this.isCompletedToday) return;
    this.completing = true;

    const today = new Date().toISOString();
    const xpReward = this.habit.xpReward ?? 50;

    this.habitService.completeHabit(this.habit.id, {
      completionDate: today,
      xpEarned: xpReward
    }).subscribe({
      next: result => {
        this.completing = false;

        // Update local recentCompletions so isCompletedToday flips immediately
        if (this.habit) {
          this.habit.recentCompletions = [
            ...(this.habit.recentCompletions ?? []),
            result
          ];
          // Refresh streak/XP counts from the response
          this.habit.currentXP = (this.habit.currentXP ?? 0) + result.xpEarned;
          this.habit.streak    = (this.habit.streak ?? 0) + 1;
          this.calendarDays    = this.buildCalendar(this.habit);
        }

        // Show floating XP banner
        this.xpPopup = result.xpEarned;
        setTimeout(() => (this.xpPopup = null), 2200);

        this.toast.show(`+${result.xpEarned} XP — habit completed! 🔥`, 'success');
      },
      error: () => {
        this.completing = false;
        this.toast.show('Could not record completion. Try again.', 'failure');
      }
    });
  }

  onDeleteQuest(questId: string): void {
  if (!confirm('Delete this quest and all its tasks?')) return;
  this.questService.deleteQuest(questId).subscribe({
    next: () => {
      if (this.habit?.quests) {
        this.habit.quests = this.habit.quests.filter(q => q.id !== questId);
      }
      this.toast.show('Quest deleted.', 'success');
    },
    error: () => this.toast.show('Could not delete quest.', 'failure')
  });
}

  onQuestClick(questId: string): void {
    if (!this.habit) return;
    this.router.navigate(['/habit', this.habit.id, 'quest', questId]);
  }

  onNewQuest(): void {
    if (!this.habit) return;
    this.router.navigate(['/habit', this.habit.id, 'quest', 'new']);
  }

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
      next: () => { this.toast.show('Habit deleted.', 'success'); this.router.navigate(['/habits']); },
      error: () => this.toast.show('Could not delete habit.', 'failure')
    });
  }

  private buildCalendar(habit: HabitDto): CalendarDay[] {
    const completions = habit.recentCompletions ?? [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Array.from({ length: this.calendarWindowDays }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (this.calendarWindowDays - 1 - i));
      const completed = completions.some(c => {
        const d = new Date(c.completionDate); d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime() && c.completed;
      });
      return { date, completed };
    });
  }
}
