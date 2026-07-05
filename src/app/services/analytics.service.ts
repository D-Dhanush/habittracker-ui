import { Injectable } from '@angular/core';
import { Observable, map, switchMap, forkJoin, of } from 'rxjs';
import {
  DailyCompletionData,
  WeeklyCompletionData,
  CategoryCompletionData,
  RecentActivity,
  CalendarData,
  CalendarWeek,
  CalendarDay
} from '../models/analytics.model';
import { HabitService } from './habit.service';
import { HabitCompletionOutputDto, HabitDto } from '../models/habitdto';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private habitService: HabitService) {}

  private getHabitsWithDetail(): Observable<HabitDto[]> {
    return this.habitService.getHabits().pipe(
      switchMap(habits => {
        if (habits.length === 0) return of([]);
        return forkJoin(habits.map(h => this.habitService.getHabitById(h.id)));
      })
    );
  }

  getWeeklyCompletionData(): Observable<WeeklyCompletionData[]> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const weeklyData: WeeklyCompletionData[] = [];
        const today = new Date();
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - week * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          let completed = 0; let total = 0;
          habits.forEach(habit => {
            (habit.recentCompletions ?? []).forEach((c: HabitCompletionOutputDto) => {
              const d = new Date(c.completionDate);
              if (d >= weekStart && d <= weekEnd) {
                total++;
                if (c.completed) completed++;
              }
            });
          });
          weeklyData.push({ week: `Week ${week + 1}`, completed, pending: total - completed, completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0 });
        }
        return weeklyData.reverse();
      })
    );
  }

  getDailyCompletionData(days: number = 30): Observable<DailyCompletionData[]> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const today = new Date();
        return Array.from({ length: days }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (days - 1 - i));
          date.setHours(0, 0, 0, 0);
          let completed = 0; let pending = 0;
          habits.forEach(habit => {
            const c = (habit.recentCompletions ?? []).find(x => {
              const d = new Date(x.completionDate); d.setHours(0, 0, 0, 0);
              return d.getTime() === date.getTime();
            });
            if (c) { c.completed ? completed++ : pending++; }
          });
          return { date, completed, pending, completionPercentage: (completed + pending) > 0 ? Math.round((completed / (completed + pending)) * 100) : 0 };
        });
      })
    );
  }

  getCategoryCompletionData(): Observable<CategoryCompletionData[]> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const map2 = new Map<string, { completed: number; total: number }>();
        habits.forEach(habit => {
          const cat = habit.customCategory ?? habit.category ?? 'General';
          if (!map2.has(cat)) map2.set(cat, { completed: 0, total: 0 });
          const stats = map2.get(cat)!;
          (habit.recentCompletions ?? []).forEach(c => { stats.total++; if (c.completed) stats.completed++; });
        });
        return Array.from(map2.entries()).map(([category, s]) => ({
          category, completed: s.completed, total: s.total,
          completionPercentage: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
        }));
      })
    );
  }

  getHabitCompletionSummary(): Observable<{ completed: number; pending: number }> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let completed = 0; let pending = 0;
        habits.forEach(habit => {
          const c = (habit.recentCompletions ?? []).find(x => {
            const d = new Date(x.completionDate); d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
          });
          c ? (c.completed ? completed++ : pending++) : pending++;
        });
        return { completed, pending };
      })
    );
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const activities: RecentActivity[] = [];
        habits.forEach(habit => {
          (habit.recentCompletions ?? [])
            .filter(c => c.completed)
            .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime())
            .slice(0, 3)
            .forEach((c, i) => activities.push({
              id: `${habit.id}-complete-${i}`, habitId: habit.id, habitName: habit.name,
              type: 'complete', title: 'Habit Completed', description: `${habit.name} completed`,
              xpEarned: c.xpEarned, timestamp: new Date(c.completionDate), icon: 'check_circle'
            }));
          (habit.milestones ?? []).forEach(m => {
            if (m.achieved && m.achievedDate) activities.push({
              id: m.id, habitId: habit.id, habitName: habit.name, type: 'milestone',
              title: 'Milestone Achieved', description: `${m.name}${m.description ? ' - ' + m.description : ''}`,
              xpEarned: m.xpReward, timestamp: new Date(m.achievedDate), icon: 'emoji_events'
            });
          });
        });
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
      })
    );
  }

  /**
   * Full calendar with partial/perfectDay/xpEarned/completedHabits/missedHabits
   * per day, plus month-level XP total and best-streak count.
   */
  getCalendarData(month: number, year: number): Observable<CalendarData> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const firstDay = new Date(year, month, 1);
        const lastDay  = new Date(year, month + 1, 0);

        // Start grid on Sunday before the 1st
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const weeks: CalendarWeek[] = [];
        let currentDate = new Date(startDate);
        let totalXpThisMonth = 0;
        let bestStreak = 0; let runningStreak = 0;

        // Collect day-level data
        const dayMap = new Map<number, { completedHabits: string[]; missedHabits: string[]; xpEarned: number }>();

        habits.forEach(habit => {
          (habit.recentCompletions ?? []).forEach(c => {
            const d = new Date(c.completionDate); d.setHours(0, 0, 0, 0);
            const key = d.getTime();
            if (!dayMap.has(key)) dayMap.set(key, { completedHabits: [], missedHabits: [], xpEarned: 0 });
            const entry = dayMap.get(key)!;
            if (c.completed) {
              entry.completedHabits.push(habit.name);
              entry.xpEarned += c.xpEarned;
            } else {
              entry.missedHabits.push(habit.name);
            }
          });
        });

        while (currentDate <= lastDay) {
          const days: CalendarDay[] = [];
          for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentDate); dayDate.setHours(0, 0, 0, 0);
            const isInMonth = dayDate.getMonth() === month;
            const entry = dayMap.get(dayDate.getTime()) ?? { completedHabits: [], missedHabits: [], xpEarned: 0 };
            const isFuture = dayDate > today;

            let completed = false; let partial = false; let inStreak = false; let perfectDay = false;

            if (isInMonth && !isFuture) {
              const total = entry.completedHabits.length + entry.missedHabits.length;
              if (total > 0) {
                completed = entry.missedHabits.length === 0;
                partial   = entry.completedHabits.length > 0 && entry.missedHabits.length > 0;
                inStreak  = completed;
                perfectDay = completed;
              }

              if (isInMonth) {
                totalXpThisMonth += entry.xpEarned;
              }

              if (completed) { runningStreak++; bestStreak = Math.max(bestStreak, runningStreak); }
              else if (!isFuture) { runningStreak = 0; }
            }

            days.push({
              date: dayDate,
              completed, partial, perfectDay, inStreak,
              empty: !isInMonth,
              xpEarned: entry.xpEarned,
              completedHabits: entry.completedHabits,
              missedHabits: entry.missedHabits
            });

            currentDate.setDate(currentDate.getDate() + 1);
          }
          weeks.push({ days });
        }

        const MONTH_NAMES = ['January','February','March','April','May','June',
          'July','August','September','October','November','December'];

        return { weeks, month: MONTH_NAMES[month], year, totalXpThisMonth, bestStreakThisMonth: bestStreak };
      })
    );
  }

  getMilestoneProgress(habitId: string): Observable<{ achieved: number; total: number }> {
    return this.habitService.getHabitById(habitId).pipe(
      map(habit => {
        if (!habit) return { achieved: 0, total: 0 };
        const achieved = (habit.milestones ?? []).filter(m => m.achieved).length;
        return { achieved, total: (habit.milestones ?? []).length };
      })
    );
  }
}
