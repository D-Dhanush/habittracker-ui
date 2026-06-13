import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-quest-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './quest-detail.component.html',
  styleUrls: ['./quest-detail.component.scss']
})
export class QuestDetailComponent implements OnInit {
  habit$!: Observable<Habit | undefined>;
  currentStreak = 0;
  completionPercentage = 0;
  completedTasks = 0;
  totalTasks = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const habitId = params.get('id');
      if (habitId) {
        this.habit$ = this.habitService.getHabitById(habitId);
        this.habit$.subscribe(habit => {
          if (habit) {
            this.calculateStats(habit);
          }
        });
      }
    });
  }

  private calculateStats(habit: Habit): void {
    // Calculate completion percentage
    const completed = habit.completions.filter(c => c.completed).length;
    this.completionPercentage = habit.completions.length > 0 
      ? Math.round((completed / habit.completions.length) * 100)
      : 0;

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const completion = habit.completions.find(c => {
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

    // Calculate task stats
    this.totalTasks = habit.tasks.length;
    this.completedTasks = habit.tasks.filter(t => t.completed).length;
  }

  onBack(): void {
    this.router.navigate(['/quests']);
  }

  onEdit(habit: Habit): void {
    // Navigate to edit page
    this.router.navigate(['/add-habit', habit.id]);
  }

  onComplete(habit: Habit): void {
    this.habitService.completeHabit(habit.id, habit.xpReward);
  }

  getCategoryLabel(habit: Habit): string {
    return habit.customCategory || habit.category;
  }

  getFrequencyLabel(frequency: string): string {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }

  getRecentCompletions(habit: Habit): any[] {
    return habit.completions
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
