import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { HabitService, HabitStatsDto } from '../../services/habit.service';
import { calculateRankProgress, RankingInfo, WeeklyCompletionData } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../services/user.service';

interface HabitTrend {
  habit: string;
  score: number;
}

/**
 * Full rewrite. The original was 100% static mock data — fabricated habit
 * names ("Night Vigil", "Rune Practice") that don't exist anywhere in the
 * real database, hardcoded "95%" weekly adherence, "14 days" streak,
 * "Elder Warden" -> "Shadow Sovereign" rank, "820" XP — none of it backed
 * by a single service call. It also used gold (#ecd46d, #fdf1b7, rgba
 * (236, 212, 109, ...)) as the dominant palette throughout its inline
 * styles, directly contradicting the "gold = accent only" theme rule.
 *
 * Now: every number comes from a real service call. Habit trends are
 * built from each habit's actual totalCompletions vs. its
 * targetOccurrencesPerPeriod (the same real fields HabitDetailComponent
 * uses), not invented. Rank/XP comes from UserService.getCurrentUserProgress(),
 * the same single source of truth the Dashboard uses — so this page can
 * never disagree with the Dashboard's numbers.
 */
@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule, MatProgressBarModule],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {
  loading = true;
  error = false;

  stats: HabitStatsDto | null = null;
  rankInfo: RankingInfo | null = null;
  weeklyData: WeeklyCompletionData[] = [];
  habitTrends: HabitTrend[] = [];

  constructor(
    private habitService: HabitService,
    private analyticsService: AnalyticsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = false;

    forkJoin({
      stats: this.habitService.getStats(),
      progress: this.userService.getCurrentUserProgress(),
      weeklyData: this.analyticsService.getWeeklyCompletionData(),
      habits: this.habitService.getAllHabits()
    }).subscribe({
      next: ({ stats, progress, weeklyData, habits }) => {
        this.stats = stats;
        this.rankInfo = calculateRankProgress(progress.totalXP);
        this.weeklyData = weeklyData;

        // Real per-habit completion trend: actual completions vs. actual
        // target, not a fabricated score. Habits with no target set are
        // skipped rather than shown with a meaningless percentage.
        this.habitTrends = habits
          .filter(h => !!h.targetOccurrencesPerPeriod && h.targetOccurrencesPerPeriod > 0)
          .map(h => ({
            habit: h.name,
            score: Math.min(
              Math.round((h.totalCompletions / (h.targetOccurrencesPerPeriod as number)) * 100),
              100
            )
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  get weeklyAdherence(): number {
    if (this.weeklyData.length === 0) return 0;
    const total = this.weeklyData.reduce((sum, w) => sum + w.completionPercentage, 0);
    return Math.round(total / this.weeklyData.length);
  }
}
