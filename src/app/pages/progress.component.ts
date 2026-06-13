import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface AnalyticTile {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

interface HabitTrend {
  habit: string;
  score: number;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule, MatProgressBarModule],
  template: `
    <section class="progress-shell">
      <div class="progress-header">
        <div>
          <h1>Arcane Progress</h1>
          <p>Inspect your completion trends, XP mastery, and streak excellence in a dark fantasy command center.</p>
        </div>
      </div>

      <div class="metric-grid">
        <mat-card class="metric-card" *ngFor="let item of analytics">
          <div class="metric-icon"><mat-icon>{{ item.icon }}</mat-icon></div>
          <div>
            <div class="metric-label">{{ item.title }}</div>
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-subtitle">{{ item.subtitle }}</div>
          </div>
        </mat-card>
      </div>

      <div class="analytics-grid">
        <mat-card class="analytics-card">
          <div class="card-title">
            <h2>Habit Completion Trends</h2>
          </div>
          <div class="trend-list">
            <div class="trend-row" *ngFor="let trend of habitTrends">
              <span>{{ trend.habit }}</span>
              <strong>{{ trend.score }}%</strong>
            </div>
          </div>
        </mat-card>

        <mat-card class="analytics-card">
          <div class="card-title">
            <h2>Consistency Metrics</h2>
          </div>
          <div class="consistency-stat">
            <div>
              <strong>95%</strong>
              <span>Weekly adherence</span>
            </div>
            <div>
              <strong>14 days</strong>
              <span>Current burning streak</span>
            </div>
            <div>
              <strong>4</strong>
              <span>Best habit streak</span>
            </div>
          </div>
        </mat-card>
      </div>

      <div class="analytics-grid">
        <mat-card class="analytics-card wide-card">
          <div class="card-title">
            <h2>XP Progression</h2>
          </div>
          <div class="progress-stack">
            <div class="progress-entry">
              <span>Quest XP this week</span>
              <strong>820</strong>
            </div>
            <mat-progress-bar mode="determinate" value="82"></mat-progress-bar>
            <div class="progress-entry last">
              <span>Monthly XP target</span>
              <strong>4.2k / 5.0k</strong>
            </div>
            <mat-progress-bar mode="determinate" value="84"></mat-progress-bar>
          </div>
        </mat-card>

        <mat-card class="analytics-card wide-card">
          <div class="card-title">
            <h2>Rank Advancement</h2>
          </div>
          <div class="rank-grid">
            <div class="rank-cell">
              <strong>Current</strong>
              <span>Elder Warden</span>
            </div>
            <div class="rank-cell">
              <strong>Next</strong>
              <span>Shadow Sovereign</span>
            </div>
            <div class="rank-cell">
              <strong>Progress</strong>
              <span>78%</span>
            </div>
          </div>
          <mat-progress-bar mode="determinate" value="78"></mat-progress-bar>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.progress-shell { display: grid; gap: 1.5rem; }`,
    `.progress-header h1 { margin: 0; font-size: clamp(2rem, 2.6vw, 3rem); }`,
    `.progress-header p { color: rgba(245, 235, 199, 0.78); margin-top: 0.6rem; max-width: 720px; }`,
    `.metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }`,
    `.metric-card { padding: 1.4rem; border-radius: 24px; background: rgba(10, 10, 16, 0.94); border: 1px solid rgba(236, 212, 109, 0.1); display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: center; }`,
    `.metric-icon { width: 58px; height: 58px; display: grid; place-items: center; border-radius: 18px; background: rgba(236, 212, 109, 0.12); color: #ecd46d; }`,
    `.metric-value { font-size: 1.75rem; font-weight: 700; color: #fdf1b7; }`,
    `.metric-label { color: rgba(245, 235, 199, 0.72); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.8rem; }`,
    `.metric-subtitle { color: rgba(245, 235, 199, 0.76); margin-top: 0.35rem; }`,
    `.analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }`,
    `.analytics-card { padding: 1.5rem; border-radius: 26px; background: linear-gradient(180deg, rgba(11, 11, 18, 0.96), rgba(24, 19, 39, 0.98)); border: 1px solid rgba(236, 212, 109, 0.1); }`,
    `.wide-card { grid-column: span 2; }`,
    `.card-title h2 { margin: 0 0 0.6rem; }`,
    `.trend-list { display: grid; gap: 0.85rem; }`,
    `.trend-row { display: flex; justify-content: space-between; align-items: center; padding: 0.95rem 1rem; border-radius: 18px; background: rgba(255, 255, 255, 0.04); color: #f3e9c3; }`,
    `.consistency-stat { display: grid; gap: 0.9rem; }`,
    `.consistency-stat div { display: grid; gap: 0.25rem; color: rgba(245, 235, 199, 0.82); }`,
    `.consistency-stat span { color: rgba(245, 235, 199, 0.72); font-size: 0.92rem; }`,
    `.progress-stack { display: grid; gap: 1rem; }`,
    `.progress-entry { display: flex; justify-content: space-between; align-items: center; color: rgba(245, 235, 199, 0.88); }`,
    `.progress-entry.last { color: #f8eab3; }`,
    `.rank-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.9rem; margin-bottom: 1rem; }`,
    `.rank-cell { padding: 1rem; border-radius: 18px; background: rgba(255, 255, 255, 0.04); color: #f7e8bf; }`,
    `mat-progress-bar { height: 12px; border-radius: 999px; }`,
    `@media (max-width: 980px) { .metric-grid, .analytics-grid { grid-template-columns: 1fr; } .wide-card { grid-column: auto; } }`
  ]
})
export class ProgressComponent {
  analytics: AnalyticTile[] = [
    { title: 'XP Progress', value: '4.2k', subtitle: 'This month', icon: 'bolt' },
    { title: 'Rank Growth', value: '78%', subtitle: 'Towards Shadow Sovereign', icon: 'military_tech' },
    { title: 'Streak Strength', value: '14d', subtitle: 'Current cadence', icon: 'whatshot' }
  ];

  habitTrends: HabitTrend[] = [
    { habit: 'Night Vigil', score: 92 },
    { habit: 'Rune Practice', score: 84 },
    { habit: 'Blade Mastery', score: 78 },
    { habit: 'Arcane Meditation', score: 95 }
  ];
}

