import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { HabitService, HabitStatsDto } from '../../services/habit.service';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../services/user.service';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import {
  WeeklyCompletionData,
  RecentActivity,
  RankingInfo,
  calculateRankProgress
} from '../../models/analytics.model';
import { UserProgressDto } from '../../models/quest.model';
import { CalendarComponent } from '../components/calendar/calendar.component';

/**
 * Fixed: previously built a calendarData$ Observable and tried to pass it
 * into <app-calendar [calendarData]="..."> — but CalendarComponent (the
 * new full month-navigation calendar, see Priority 4) is fully
 * self-contained: it calls AnalyticsService.getCalendarData() itself in
 * its own ngOnInit and has no @Input() for calendarData at all. Passing
 * a binding for an Input that doesn't exist is a strictTemplates compile
 * error. Removed the now-redundant calendarData$/CalendarData import;
 * the dashboard now just drops <app-calendar> in with no bindings.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CalendarComponent, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats$!: Observable<HabitStatsDto>;
  weeklyData$!: Observable<WeeklyCompletionData[]>;
  recentActivity$!: Observable<RecentActivity[]>;

  userProgress: UserProgressDto | null = null;
  rankInfo: RankingInfo | null = null;
  loadingProgress = true;

  constructor(
    private habitService: HabitService,
    private analyticsService: AnalyticsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.stats$ = this.habitService.getStats();
    this.weeklyData$ = this.analyticsService.getWeeklyCompletionData();
    this.recentActivity$ = this.analyticsService.getRecentActivity();

    this.loadUserProgress();
  }

  private loadUserProgress(): void {
    this.loadingProgress = true;
    this.userService.getCurrentUserProgress().subscribe({
      next: (progress) => {
        this.userProgress = progress;
        this.rankInfo = calculateRankProgress(progress.totalXP);
        this.loadingProgress = false;
      },
      error: () => {
        this.loadingProgress = false;
      }
    });
  }
}
