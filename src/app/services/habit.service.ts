import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Habit, HabitStats, CATEGORY_ICONS } from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habitsSubject = new BehaviorSubject<Habit[]>([]);
  public habits$ = this.habitsSubject.asObservable();

  private statsSubject = new BehaviorSubject<HabitStats>({
    totalHabits: 0,
    activeHabits: 0,
    currentXp: 0,
    totalXpEarned: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionPercentage: 0,
    thisWeekCompletion: 0,
    thisMonthCompletion: 0
  });
  public stats$ = this.statsSubject.asObservable();

  constructor() {
    this.loadMockData();
  }

  private loadMockData(): void {
    const mockHabits: Habit[] = [
      {
        id: '1',
        name: 'Morning Run',
        subtitle: 'Stay active and healthy',
        description: 'Daily 30-minute morning run to boost energy and fitness',
        category: 'fitness',
        frequency: 'daily',
        status: 'active',
        icon: 'fitness_center',
        primaryColor: '#d4af37',
        secondaryColor: '#4dd9ff',
        xpReward: 50,
        startDate: new Date('2024-01-01'),
        tasks: [
          { id: '1', name: 'Warm up', completed: true, xpReward: 10 },
          { id: '2', name: 'Run 30 minutes', completed: true, xpReward: 30 },
          { id: '3', name: 'Cool down', completed: true, xpReward: 10 }
        ],
        completions: this.generateCompletions(45),
        milestones: [
          {
            id: '1',
            name: 'Week Warrior',
            description: 'Complete 7 days in a row',
            target: 7,
            achieved: true,
            achievedDate: new Date('2024-01-07'),
            xpReward: 150,
            icon: 'emoji_events'
          }
        ],
        createdDate: new Date('2024-01-01'),
        updatedDate: new Date('2024-05-18')
      },
      {
        id: '2',
        name: 'Meditation',
        subtitle: 'Mental clarity and peace',
        description: 'Daily meditation practice for mindfulness and stress relief',
        category: 'spiritual',
        frequency: 'daily',
        status: 'active',
        icon: 'spa',
        primaryColor: '#d4af37',
        secondaryColor: '#4dd9ff',
        xpReward: 30,
        startDate: new Date('2024-02-01'),
        tasks: [
          { id: '1', name: 'Find quiet space', completed: false, xpReward: 5 },
          { id: '2', name: 'Meditate 20 minutes', completed: false, xpReward: 20 },
          { id: '3', name: 'Journal reflections', completed: false, xpReward: 5 }
        ],
        completions: this.generateCompletions(30),
        milestones: [],
        createdDate: new Date('2024-02-01'),
        updatedDate: new Date('2024-05-18')
      },
      {
        id: '3',
        name: 'Read',
        subtitle: 'Expand knowledge daily',
        description: 'Read for at least 30 minutes to expand knowledge and imagination',
        category: 'study',
        frequency: 'daily',
        status: 'active',
        icon: 'school',
        primaryColor: '#d4af37',
        secondaryColor: '#4dd9ff',
        xpReward: 40,
        startDate: new Date('2024-03-01'),
        tasks: [
          { id: '1', name: 'Choose book', completed: true, xpReward: 10 },
          { id: '2', name: 'Read 30 pages', completed: true, xpReward: 30 }
        ],
        completions: this.generateCompletions(38),
        milestones: [],
        createdDate: new Date('2024-03-01'),
        updatedDate: new Date('2024-05-18')
      },
      {
        id: '4',
        name: 'Save Money',
        subtitle: 'Financial stability',
        description: 'Save a portion of daily income for future goals',
        category: 'finance',
        frequency: 'daily',
        status: 'active',
        icon: 'attach_money',
        primaryColor: '#d4af37',
        secondaryColor: '#4dd9ff',
        xpReward: 35,
        startDate: new Date('2024-01-15'),
        tasks: [],
        completions: this.generateCompletions(50),
        milestones: [],
        createdDate: new Date('2024-01-15'),
        updatedDate: new Date('2024-05-18')
      }
    ];

    this.habitsSubject.next(mockHabits);
    this.updateStats();
  }

  private generateCompletions(daysBack: number): any[] {
    const completions = [];
    const today = new Date();
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      completions.push({
        date: date,
        completed: Math.random() > 0.3,
        xpEarned: Math.random() > 0.3 ? Math.floor(Math.random() * 50) + 20 : 0,
        notes: ''
      });
    }
    return completions;
  }

  getHabits(): Observable<Habit[]> {
    return this.habits$;
  }

  getHabitById(id: string): Observable<Habit | undefined> {
    return new Observable(observer => {
      this.habits$.subscribe(habits => {
        observer.next(habits.find(h => h.id === id));
      });
    });
  }

  createHabit(habit: Omit<Habit, 'id' | 'createdDate' | 'updatedDate'>): void {
    const habits = this.habitsSubject.value;
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      createdDate: new Date(),
      updatedDate: new Date()
    };
    this.habitsSubject.next([...habits, newHabit]);
    this.updateStats();
  }

  updateHabit(id: string, updates: Partial<Habit>): void {
    const habits = this.habitsSubject.value;
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
      habits[index] = {
        ...habits[index],
        ...updates,
        updatedDate: new Date()
      };
      this.habitsSubject.next([...habits]);
      this.updateStats();
    }
  }

  deleteHabit(id: string): void {
    const habits = this.habitsSubject.value.filter(h => h.id !== id);
    this.habitsSubject.next(habits);
    this.updateStats();
  }

  completeHabit(habitId: string, xpEarned: number = 50, notes: string = ''): void {
    const habits = this.habitsSubject.value;
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const completion = {
        date: new Date(),
        completed: true,
        xpEarned: xpEarned,
        notes: notes
      };
      habit.completions.push(completion);
      this.updateHabit(habitId, habit);
    }
  }

  getStats(): Observable<HabitStats> {
    return this.stats$;
  }

  private updateStats(): void {
    const habits = this.habitsSubject.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalXp = 0;
    let completedToday = 0;
    let completedThisWeek = 0;
    let completedThisMonth = 0;
    let totalCompletions = 0;
    let totalDays = 0;

    habits.forEach(habit => {
      habit.completions.forEach(completion => {
        if (completion.completed) {
          totalXp += completion.xpEarned;
          totalCompletions++;
        }
        totalDays++;

        const completionDate = new Date(completion.date);
        completionDate.setHours(0, 0, 0, 0);

        if (completionDate.getTime() === today.getTime() && completion.completed) {
          completedToday++;
        }

        // This week
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (completionDate >= weekAgo && completion.completed) {
          completedThisWeek++;
        }

        // This month
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        if (completionDate >= monthAgo && completion.completed) {
          completedThisMonth++;
        }
      });
    });

    const stats: HabitStats = {
      totalHabits: habits.length,
      activeHabits: habits.filter(h => h.status === 'active').length,
      currentXp: totalXp,
      totalXpEarned: totalXp,
      currentStreak: this.calculateCurrentStreak(habits),
      longestStreak: this.calculateLongestStreak(habits),
      completionPercentage: totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0,
      thisWeekCompletion: completedThisWeek,
      thisMonthCompletion: completedThisMonth
    };

    this.statsSubject.next(stats);
  }

  private calculateCurrentStreak(habits: Habit[]): number {
    let maxStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    habits.forEach(habit => {
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

      maxStreak = Math.max(maxStreak, streak);
    });

    return maxStreak;
  }

  private calculateLongestStreak(habits: Habit[]): number {
    let maxStreak = 0;

    habits.forEach(habit => {
      const sortedCompletions = [...habit.completions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let streak = 0;
      let lastDate: Date | null = null;

      sortedCompletions.forEach(completion => {
        if (completion.completed) {
          const currentDate = new Date(completion.date);
          currentDate.setHours(0, 0, 0, 0);

          if (lastDate === null) {
            streak = 1;          } else {
            const prevDate = new Date(lastDate);
            prevDate.setDate(prevDate.getDate() + 1);

            if (prevDate.getTime() === currentDate.getTime()) {
              streak++;
            } else {
              maxStreak = Math.max(maxStreak, streak);
              streak = 1;
            }
          }
          lastDate = currentDate;
        }
      });

      maxStreak = Math.max(maxStreak, streak);
    });

    return maxStreak;
  }
}
