import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HabitService, HabitStatsDto } from '../../services/habit.service';
import { AnalyticsService } from '../../services/analytics.service';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { CalendarHeatmapComponent } from '../components/calendar-heatmap/calendar-heatmap.component';
import { HabitCompletion } from '../../models/habit.model';
import { CalendarData, RecentActivity } from '../../models/analytics.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule,
    StatCardComponent,
    CalendarHeatmapComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats$!: Observable<HabitStatsDto>;
  recentActivity$!: Observable<RecentActivity[]>;
  calendarData$!: Observable<CalendarData>;
  weeklyData$!: Observable<any[]>;

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();

  constructor(
    private habitService: HabitService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.stats$ = this.habitService.getStats();
    this.recentActivity$ = this.analyticsService.getRecentActivity();
    this.calendarData$ = this.analyticsService.getCalendarData(this.currentMonth, this.currentYear);
    this.weeklyData$ = this.analyticsService.getWeeklyCompletionData();
  }

  getRankFromXp(xp: number): string {
    if (xp < 1000) return 'Novice';
    if (xp < 5000) return 'Apprentice';
    if (xp < 10000) return 'Adept';
    if (xp < 25000) return 'Expert';
    if (xp < 50000) return 'Master';
    return 'Legend';
  }

  getRankColor(xp: number): string {
    if (xp < 1000) return 'text-tertiary';
    if (xp < 5000) return 'text-blue';
    if (xp < 10000) return 'text-gold';
    if (xp < 25000) return 'text-gold';
    if (xp < 50000) return 'text-gold';
    return 'text-gold';
  }

  getProgressToNextLevel(xp: number): number {
    const levels = [1000, 5000, 10000, 25000, 50000];
    let currentLevel = 0;
    let nextLevel = levels[0];

    for (let level of levels) {
      if (xp >= level) {
        currentLevel = level;
        const nextIndex = levels.indexOf(level) + 1;
        nextLevel = nextIndex < levels.length ? levels[nextIndex] : level + 50000;
      }
    }

    return currentLevel === 0 ? (xp / nextLevel) * 100 : ((xp - currentLevel) / (nextLevel - currentLevel)) * 100;
  }

  summaryCards = [
    { label: 'Current Rank', value: 'Elder Warden', icon: 'military_tech', accent: '#7bc37f' },
    { label: 'Current Streak', value: '14 days', icon: 'whatshot', accent: '#f2a33c' }
  ];

  completedHabits = 18;
  pendingHabits = 10;
  progressSeries: { label: string; value: number }[] = [
    { label: 'Week 1', value: 72 },
    { label: 'Week 2', value: 86 },
    { label: 'Week 3', value: 94 },
    { label: 'Week 4', value: 78 }
  ];

  milestones = [
    { title: 'Moonlit Vanguard', description: 'Complete 15 quests this month', reward: '150 XP', complete: true },
    { title: 'Eternal Ember', description: 'Keep streak above 10 days', reward: 'Golden Sigil', complete: true },
    { title: 'Shadow Tactician', description: 'Finish 3 elite quests', reward: 'Rank Surge', complete: false }
  ];

  recentActivity = [
    { time: 'Just now', title: 'Defeated the Ivory Wraith', details: 'Quest completed +120 XP' },
    { time: '2h ago', title: 'Forged a new ritual', details: 'Streak extended to 14 days' },
    { time: 'Yesterday', title: 'Unlocked arcane milestone', details: 'Moonlit Vanguard achieved' }
  ];

  get completionRatio(): number {
    return Math.round((this.completedHabits / (this.completedHabits + this.pendingHabits)) * 100);
  }
}