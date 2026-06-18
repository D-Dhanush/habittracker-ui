import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HabitService } from '../../services/habit.service';
import { Observable } from 'rxjs';
import { HabitCompletionDto, HabitDto } from '../../models/habitdto';

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
  habit$!: Observable<HabitDto>;
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

private calculateStats(habit: HabitDto): void {
  const completions = habit.recentCompletions ?? [];
  const tasks = habit.tasks ?? [];

  const completed = completions.filter(c => c.completed).length;

  this.completionPercentage =
    completions.length > 0
      ? Math.round((completed / completions.length) * 100)
      : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const completion = completions.find(c => {
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

  this.totalTasks = tasks.length;
  this.completedTasks = tasks.filter(t => t.completed).length;
}

  onBack(): void {
    this.router.navigate(['/quests']);
  }

  onEdit(habit: HabitDto): void {
    // Navigate to edit page
    this.router.navigate(['/add-habit', habit.id]);
  }

onComplete(habit: HabitDto): void {
  this.habitService.completeHabit(
    habit.id,
    {
      xpEarned: habit.xpReward ?? 0
    }
  ).subscribe();
}

getCategoryLabel(habit: HabitDto): string {
  return habit.customCategory || habit.category || 'General';
}

  getFrequencyLabel(frequency: string): string {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }

getRecentCompletions(habit: HabitDto): HabitCompletionDto[] {
  return (habit.recentCompletions ?? [])
    .filter(c => c.completed)
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )
    .slice(0, 10);
}

formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}}
