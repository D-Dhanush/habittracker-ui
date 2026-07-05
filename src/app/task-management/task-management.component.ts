import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HabitDto } from '../models/habitdto';
import { ToastService } from '../toast.service';
import { TaskService } from '../services/task.service';
import { QuestDto } from '../models/quest.model';


/** Internal flat representation built client-side */
interface FlatTask {
  id: string;
  questId: string;
  questName: string;
  habitId: string;
  habitName: string;
  name: string;
  description?: string | null;
  xpReward: number;
  completed: boolean;
  completedDate?: string | null;
  priority: 'low' | 'medium' | 'high';
  createdDt: string;

  // UI state
  loadingComplete?: boolean;
  confirmDelete?: boolean;
}

type SortField = 'name' | 'habitName' | 'questName' | 'xpReward' | 'priority' | 'completed' | 'createdDt';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.scss']
})
export class TaskManagementComponent implements OnInit {
  // ── Data ──────────────────────────────────────────────────────────────
  habits: HabitDto[] = [];
  allTasks: FlatTask[] = [];
  filteredTasks: FlatTask[] = [];
  pagedTasks: FlatTask[] = [];

  // ── Loading ───────────────────────────────────────────────────────────
  loading = true;
  error = false;

  // ── Filters ───────────────────────────────────────────────────────────
  search = '';
  filterHabitId = '';
  filterQuestId = '';
  filterStatus: 'all' | 'pending' | 'completed' = 'all';
  filterPriority: 'all' | 'low' | 'medium' | 'high' = 'all';

  availableQuests: { id: string; name: string }[] = [];

  // ── Sort ──────────────────────────────────────────────────────────────
  sortField: SortField = 'createdDt';
  sortDir: SortDir = 'desc';

  // ── Pagination ────────────────────────────────────────────────────────
  page = 1;
  pageSize = 15;
  total = 0;
  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  constructor(
    private taskService: TaskService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void { this.loadAll(); }
  // ── Load ──────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loading = true;
    this.error = false;

    this.taskService.getHabits().subscribe({
      next: habits => {
        this.habits = habits;
        if (!habits.length) { this.allTasks = []; this.applyFilters(); this.loading = false; return; }

        // Fetch quests (with tasks) for every habit in parallel
        const questCalls = habits.map(h => this.taskService.getQuestsByHabit(h.id));
        forkJoin(questCalls).subscribe({
          next: questsPerHabit => {
            // For each quest we need the full detail (with tasks[])
            const allQuests: { habit: HabitDto; quest: QuestDto }[] = [];
            questsPerHabit.forEach((quests, idx) => {
              quests.forEach(q => allQuests.push({ habit: habits[idx], quest: q }));
            });

            if (!allQuests.length) { this.allTasks = []; this.applyFilters(); this.loading = false; return; }

            const detailCalls = allQuests.map(({ quest }) => this.taskService.getQuestDetail(quest.id));
            forkJoin(detailCalls).subscribe({
              next: details => {
                const flat: FlatTask[] = [];
                details.forEach((q, i) => {
                  const habit = allQuests[i].habit;
                  (q.tasks ?? []).forEach(t => {
                    flat.push({
                      id: t.id, questId: q.id, questName: q.name,
                      habitId: habit.id, habitName: habit.name,
                      name: t.name, description: t.description,
                      xpReward: t.xpReward, completed: t.completed,
                      completedDate: t.completedDate,
                      priority: 'medium',   // backend doesn't have priority yet; default
                      createdDt: t.createdDt
                    });
                  });
                });

                // Build quest filter list
                this.availableQuests = allQuests.map(({ quest }) => ({ id: quest.id, name: quest.name }));
                this.allTasks = flat;
                this.applyFilters();
                this.loading = false;
              },
              error: () => { this.error = true; this.loading = false; }
            });
          },
          error: () => { this.error = true; this.loading = false; }
        });
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  // ── Filters & Sort ───────────────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.allTasks];

    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      );
    }
    if (this.filterHabitId) result = result.filter(t => t.habitId === this.filterHabitId);
    if (this.filterQuestId) result = result.filter(t => t.questId === this.filterQuestId);
    if (this.filterStatus === 'pending')   result = result.filter(t => !t.completed);
    if (this.filterStatus === 'completed') result = result.filter(t =>  t.completed);
    if (this.filterPriority !== 'all')     result = result.filter(t => t.priority === this.filterPriority);

    // Sort
    result.sort((a, b) => {
      let av: any = a[this.sortField]; let bv: any = b[this.sortField];
      if (this.sortField === 'priority') {
        const p: Record<string,number> = { high: 3, medium: 2, low: 1 };
        av = p[av] ?? 0; bv = p[bv] ?? 0;
      }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return this.sortDir === 'asc' ? -1 : 1;
      if (av > bv) return this.sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    this.total = result.length;
    this.filteredTasks = result;
    this.goToPage(this.page > this.totalPages ? 1 : this.page);
  }

  setSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field; this.sortDir = 'asc';
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.search = ''; this.filterHabitId = ''; this.filterQuestId = '';
    this.filterStatus = 'all'; this.filterPriority = 'all';
    this.applyFilters();
  }

  onHabitFilterChange(): void {
    // Reset quest filter when habit changes
    this.filterQuestId = '';
    // Narrow available quests to selected habit
    if (this.filterHabitId) {
      this.availableQuests = this.allTasks
        .filter(t => t.habitId === this.filterHabitId)
        .reduce<{ id: string; name: string }[]>((acc, t) => {
          if (!acc.find(q => q.id === t.questId)) acc.push({ id: t.questId, name: t.questName });
          return acc;
        }, []);
    } else {
      this.availableQuests = this.allTasks.reduce<{ id: string; name: string }[]>((acc, t) => {
        if (!acc.find(q => q.id === t.questId)) acc.push({ id: t.questId, name: t.questName });
        return acc;
      }, []);
    }
    this.applyFilters();
  }

  // ── Pagination ────────────────────────────────────────────────────────

  goToPage(p: number): void {
    this.page = Math.max(1, Math.min(p, this.totalPages));
    const start = (this.page - 1) * this.pageSize;
    this.pagedTasks = this.filteredTasks.slice(start, start + this.pageSize);
  }

  // ── Task Actions ─────────────────────────────────────────────────────

  toggleComplete(task: FlatTask): void {
    if (task.loadingComplete) return;
    task.loadingComplete = true;

    if (task.completed) {
      // Uncomplete — revert XP
      this.taskService.uncompleteTask(task.questId, task.id).subscribe({
        next: (_result: any) => {
          task.completed = false;
          task.completedDate = null;
          task.loadingComplete = false;
          this.toast.show('Task marked incomplete. XP reverted.', 'info');
          this.applyFilters();
        },
        error: () => { task.loadingComplete = false; this.toast.show('Could not undo task.', 'failure'); }
      });
    } else {
      // Complete — grant XP
      this.taskService.completeTask(task.questId, task.id).subscribe({
        next: result => {
          task.completed = true;
          task.completedDate = result.task?.completedDate ?? new Date().toISOString();
          task.loadingComplete = false;
          const xp = result.task?.xpReward ?? task.xpReward;
          this.toast.show(`+${xp} XP earned! ⚡`, 'success');
          this.applyFilters();
        },
        error: () => { task.loadingComplete = false; this.toast.show('Could not complete task.', 'failure'); }
      });
    }
  }

  promptDelete(task: FlatTask): void {
    task.confirmDelete = true;
  }

  cancelDelete(task: FlatTask): void {
    task.confirmDelete = false;
  }

  confirmDeleteTask(task: FlatTask): void {
    task.confirmDelete = false;
    this.taskService.deleteTask(task.questId, task.id).subscribe({
      next: () => {
        this.allTasks = this.allTasks.filter(t => t.id !== task.id);
        this.toast.show('Task deleted.', 'success');
        this.applyFilters();
      },
      error: () => this.toast.show('Could not delete task.', 'failure')
    });
  }

  navigateToQuest(task: FlatTask): void {
    this.router.navigate(['/habit', task.habitId, 'quest', task.questId]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  get completedCount(): number { return this.allTasks.filter(t => t.completed).length; }
  get pendingCount(): number   { return this.allTasks.filter(t => !t.completed).length; }
  get totalXP(): number        { return this.allTasks.filter(t => t.completed).reduce((s, t) => s + t.xpReward, 0); }

  priorityLabel(p: string): string {
    return p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Med' : '🟢 Low';
  }

  sortIcon(field: SortField): string {
    if (this.sortField !== field) return 'unfold_more';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  trackById(_: number, t: FlatTask): string { return t.id; }
}
