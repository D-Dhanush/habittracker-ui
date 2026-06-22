import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { HabitService, HabitStatsDto } from '../../services/habit.service';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../services/user.service';
import { CalendarHeatmapComponent } from '../components/calendar-heatmap/calendar-heatmap.component';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import {
  CalendarData,
  WeeklyCompletionData,
  RecentActivity,
  RankingInfo,
  calculateRankProgress
} from '../../models/analytics.model';
import { UserProgressDto } from '../../models/quest.model';

/**
 * Rewritten from scratch. Removed entirely (confirmed dead code — never
 * referenced by the template): summaryCards, completedHabits,
 * pendingHabits, progressSeries, milestones, and a hardcoded
 * recentActivity array with fake flavor text ("Defeated the Ivory
 * Wraith"). Also removed getRankFromXp/getRankColor/getProgressToNextLevel,
 * which hardcoded XP thresholds that disagreed with the mock data's
 * "Elder Warden" rank AND with the backend's own rank function — there
 * were three different rank systems across this one file. Now there is
 * exactly one: Progress.UFN_RankFromXp server-side, mirrored by
 * calculateRankProgress() in analytics.model.ts.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CalendarHeatmapComponent, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats$!: Observable<HabitStatsDto>;
  calendarData$!: Observable<CalendarData>;
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

    const now = new Date();
    this.calendarData$ = this.analyticsService.getCalendarData(now.getMonth(), now.getFullYear());
    this.weeklyData$ = this.analyticsService.getWeeklyCompletionData();
    this.recentActivity$ = this.analyticsService.getRecentActivity();

    this.loadUserProgress();
  }

  private loadUserProgress(): void {
    this.loadingProgress = true;
    this.userService.getCurrentUserProgress().subscribe({
      next: (progress) => {
        this.userProgress = progress;
        // The backend already computes currentLevel/rank from TotalXP via
        // UFN_LevelFromXp/UFN_RankFromXp — but xpToNextLevel/xpProgress
        // (needed for the progress ring) aren't part of UserProgressDto,
        // so we derive the full display object client-side from the same
        // total. Keeping ONE set of thresholds (see analytics.model.ts)
        // means this can never disagree with what the backend already sent.
        this.rankInfo = calculateRankProgress(progress.totalXP);
        this.loadingProgress = false;
      },
      error: () => {
        this.loadingProgress = false;
      }
    });
  }
}
