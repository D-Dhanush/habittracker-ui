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


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private habitService: HabitService) {}

  /**
   * Fetches full detail (including recentCompletions/milestones) for
   * every habit. List-view calls (getHabits) don't carry that data,
   * so every aggregation method below routes through this first.
   */
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

          let completed = 0;
          let total = 0;

          habits.forEach(habit => {
            (habit.recentCompletions ?? []).forEach((completion: HabitCompletionOutputDto) => {
              const compDate = new Date(completion.completionDate);
              if (compDate >= weekStart && compDate <= weekEnd) {
                total++;
                if (completion.completed) {
                  completed++;
                }
              }
            });
          });

          weeklyData.push({
            week: `Week ${week + 1}`,
            completed,
            pending: total - completed,
            completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
          });
        }

        return weeklyData.reverse();
      })
    );
  }

  getDailyCompletionData(days: number = 30): Observable<DailyCompletionData[]> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const dailyData: DailyCompletionData[] = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          let completed = 0;
          let pending = 0;

          habits.forEach(habit => {
            const completion = (habit.recentCompletions ?? []).find(c => {
              const cDate = new Date(c.completionDate);
              cDate.setHours(0, 0, 0, 0);
              return cDate.getTime() === date.getTime();
            });

            if (completion) {
              if (completion.completed) {
                completed++;
              } else {
                pending++;
              }
            }
          });

          dailyData.push({
            date,
            completed,
            pending,
            completionPercentage: (completed + pending) > 0 ? Math.round((completed / (completed + pending)) * 100) : 0
          });
        }

        return dailyData;
      })
    );
  }

  getCategoryCompletionData(): Observable<CategoryCompletionData[]> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const categoryMap = new Map<string, { completed: number; total: number }>();

        habits.forEach(habit => {
          const category = habit.customCategory ?? habit.category ?? 'General';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { completed: 0, total: 0 });
          }

          const stats = categoryMap.get(category)!;
          (habit.recentCompletions ?? []).forEach(completion => {
            stats.total++;
            if (completion.completed) {
              stats.completed++;
            }
          });
        });

        return Array.from(categoryMap.entries()).map(([category, stats]) => ({
          category,
          completed: stats.completed,
          total: stats.total,
          completionPercentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        }));
      })
    );
  }

  getHabitCompletionSummary(): Observable<{ completed: number; pending: number }> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        let completed = 0;
        let pending = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        habits.forEach(habit => {
          const todayCompletion = (habit.recentCompletions ?? []).find(c => {
            const cDate = new Date(c.completionDate);
            cDate.setHours(0, 0, 0, 0);
            return cDate.getTime() === today.getTime();
          });

          if (todayCompletion) {
            if (todayCompletion.completed) {
              completed++;
            } else {
              pending++;
            }
          } else {
            pending++;
          }
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
          const recentCompletions = (habit.recentCompletions ?? [])
            .filter(c => c.completed)
            .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime())
            .slice(0, 3);

          recentCompletions.forEach((completion, index) => {
            activities.push({
              id: `${habit.id}-complete-${index}`,
              habitId: habit.id,
              habitName: habit.name,
              type: 'complete',
              title: 'Habit Completed',
              description: `${habit.name} completed`,
              xpEarned: completion.xpEarned,
              timestamp: new Date(completion.completionDate),
              icon: 'check_circle'
            });
          });

          (habit.milestones ?? []).forEach(milestone => {
            if (milestone.achieved && milestone.achievedDate) {
              activities.push({
                id: milestone.id,
                habitId: habit.id,
                habitName: habit.name,
                type: 'milestone',
                title: 'Milestone Achieved',
                description: `${milestone.name}${milestone.description ? ' - ' + milestone.description : ''}`,
                xpEarned: milestone.xpReward,
                timestamp: new Date(milestone.achievedDate),
                icon: 'emoji_events'
              });
            }
          });
        });

        return activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
      })
    );
  }

  getCalendarData(month: number, year: number): Observable<CalendarData> {
    return this.getHabitsWithDetail().pipe(
      map(habits => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const weeks: CalendarWeek[] = [];
        let currentDate = new Date(startDate);

        while (currentDate <= lastDay) {
          const days: CalendarDay[] = [];

          for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentDate);
            const dayDateNormalized = new Date(dayDate);
            dayDateNormalized.setHours(0, 0, 0, 0);

            const isInMonth = dayDate.getMonth() === month;
            let completed = false;
            let inStreak = false;

            if (isInMonth) {
              let dayCompletions = 0;
              let dayTotal = 0;

              habits.forEach(habit => {
                const completion = (habit.recentCompletions ?? []).find(c => {
                  const cDate = new Date(c.completionDate);
                  cDate.setHours(0, 0, 0, 0);
                  return cDate.getTime() === dayDateNormalized.getTime();
                });

                if (completion) {
                  dayTotal++;
                  if (completion.completed) {
                    dayCompletions++;
                  }
                }
              });

              completed = dayTotal > 0 && dayCompletions === dayTotal;
              inStreak = completed; // Simplified streak logic
            }

            days.push({
              date: dayDate,
              completed,
              inStreak,
              empty: !isInMonth
            });

            currentDate.setDate(currentDate.getDate() + 1);
          }

          weeks.push({ days });
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];

        return {
          weeks,
          month: monthNames[month],
          year
        };
      })
    );
  }

  getMilestoneProgress(habitId: string): Observable<{ achieved: number; total: number }> {
    return this.habitService.getHabitById(habitId).pipe(
      map(habit => {
        if (!habit) return { achieved: 0, total: 0 };

        const achieved = (habit.milestones ?? []).filter(m => m.achieved).length;
        return {
          achieved,
          total: (habit.milestones ?? []).length
        };
      })
    );
  }
}
