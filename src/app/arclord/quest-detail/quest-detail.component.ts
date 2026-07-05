import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuestService } from '../../services/quest.service';
import { ToastService } from '../../toast.service';
import { QuestDto, QuestTaskDto, QuestTaskCompletionResultDto } from '../../models/quest.model';

@Component({
  selector: 'app-quest-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quest-detail.component.html',
  styleUrls: ['./quest-detail.component.scss']
})
export class QuestDetailComponent implements OnInit {
  quest: QuestDto | null = null;
  habitId = ''; questId = '';
  loading = true; error = false;

  newTaskName = ''; newTaskXp = 10; addingTask = false;
  completingTaskId: string | null = null;
  uncomletingTaskId: string | null = null;

  // ── Delete task state (inline bubble confirm) ─────────────────────────
  deletingTaskId: string | null = null;
  pendingDeleteTaskId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questService: QuestService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.habitId = this.route.snapshot.paramMap.get('habitId') ?? '';
    this.questId = this.route.snapshot.paramMap.get('questId') ?? '';
    this.loadQuest();
  }

  loadQuest(): void {
    this.loading = true; this.error = false;
    this.questService.getQuestById(this.questId).subscribe({
      next: q => { this.quest = q; this.loading = false; },
      error: () => { this.error = true; this.loading = false; this.toast.show('Could not load this quest.', 'failure'); }
    });
  }

  get tasks(): QuestTaskDto[] { return this.quest?.tasks ?? []; }

  // ── Complete / Uncomplete ─────────────────────────────────────────────

  completeTask(task: QuestTaskDto): void {
    // Guard: already completed, already in-flight, or another task loading
    if (task.completed || this.completingTaskId || this.uncomletingTaskId) return;
    this.completingTaskId = task.id;

    this.questService.completeTask(this.questId, task.id).subscribe({
      next: result => {
        this.completingTaskId = null;

        // Server-side no-op or error (e.g. "Already completed") — don't update UI state
        if (!result.success) {
          const msg = result.message === 'Already completed'
            ? 'Task was already completed.'
            : (result.message || 'Could not complete task.');
          this.toast.show(msg, 'info');
          return;
        }

        // Optimistically update the task row from server's returned task
        if (this.quest && result.task) {
          const idx = this.quest.tasks?.findIndex(t => t.id === task.id) ?? -1;
          if (idx >= 0 && this.quest.tasks) this.quest.tasks[idx] = result.task;
        }

        // Update quest-level stats from server rollup, or recompute locally
        if (this.quest && result.questProgress) {
          this.quest.currentXP         = result.questProgress.currentXP;
          this.quest.completedTasks    = result.questProgress.completedTasks;
          this.quest.completionPercent = result.questProgress.completionPercent;
          this.quest.progress          = result.questProgress.completionPercent;
        } else {
          this.recalcStats();
        }

        const xp = result.task?.xpReward ?? 0;
        this.toast.show(`+${xp} XP earned! ⚡`, 'success');
        if (result.habitProgress) this.toast.show(`Streak: ${result.habitProgress.streak} days 🔥`, 'info');
      },
      error: () => { this.completingTaskId = null; this.toast.show('Could not complete task. Try again.', 'failure'); }
    });
  }

  uncompleteTask(task: QuestTaskDto): void {
    if (!task.completed || this.uncomletingTaskId || this.completingTaskId) return;
    this.uncomletingTaskId = task.id;

    this.questService.uncompleteTask(this.questId, task.id).subscribe({
      next: result => {
        this.uncomletingTaskId = null;

        // Server returned "Already incomplete" or similar — nothing to update
        if (!result.success && result.message === 'Already incomplete') {
          this.toast.show('Task was already marked incomplete.', 'info');
          return;
        }

        if (this.quest) {
          // result is QuestTaskCompletionResultDto from POST /complete
          // .task may be null on no-ops — fall back to local copy
          const updatedTask: QuestTaskDto = result.task
            ?? { ...task, completed: false, completedDate: null };

          const idx = this.quest.tasks?.findIndex(t => t.id === task.id) ?? -1;
          if (idx >= 0 && this.quest.tasks) this.quest.tasks[idx] = updatedTask as QuestTaskDto;

          const qp = (result as QuestTaskCompletionResultDto).questProgress;
          if (qp) {
            this.quest.currentXP        = qp.currentXP;
            this.quest.completedTasks   = qp.completedTasks;
            this.quest.completionPercent = qp.completionPercent;
            this.quest.progress         = qp.completionPercent;
          } else {
            this.recalcStats(); // server returned no questProgress — compute locally
          }
        }
        this.toast.show('Task marked incomplete. XP reverted.', 'info');
      },
      error: () => { this.uncomletingTaskId = null; this.toast.show('Could not undo task. Try again.', 'failure'); }
    });
  }

  // ── Add task ──────────────────────────────────────────────────────────

  addTask(): void {
    if (!this.newTaskName.trim()) return;
    this.addingTask = true;
    this.questService.addTask(this.questId, { name: this.newTaskName.trim(), xpReward: this.newTaskXp || 10 }).subscribe({
      next: task => {
        this.addingTask = false; this.newTaskName = ''; this.newTaskXp = 10;
        if (this.quest) {
          this.quest.tasks = [...(this.quest.tasks ?? []), task];
          this.recalcStats(); // recomputes totalTasks, completionPercent from actual array
        }
        this.toast.show('Task added.', 'success');
      },
      error: () => { this.addingTask = false; this.toast.show('Could not add task.', 'failure'); }
    });
  }

  // ── Delete task (3-state: idle → confirm bubble → deleting) ──────────

  /** Step 1: show the inline confirmation bubble */
  requestDeleteTask(task: QuestTaskDto): void {
    this.pendingDeleteTaskId = task.id;
  }

  /** Step 2: user confirmed — execute the delete */
  confirmDeleteTask(task: QuestTaskDto): void {
    this.pendingDeleteTaskId = null;
    this.deletingTaskId = task.id;

    this.questService.deleteTask(this.questId, task.id).subscribe({
      next: () => {
        this.deletingTaskId = null;
        if (this.quest) {
          this.quest.tasks = this.tasks.filter(t => t.id !== task.id);
          this.recalcStats(); // recomputes totalTasks, completionPercent from actual array
        }
        this.toast.show('Task removed.', 'success');
      },
      error: () => { this.deletingTaskId = null; this.toast.show('Could not remove task.', 'failure'); }
    });
  }

  /** Step 2 (cancel): dismiss the bubble without deleting */
  cancelDeleteTask(): void {
    this.pendingDeleteTaskId = null;
  }

  /**
   * Recomputes totalTasks, completedTasks, completionPercent and currentXP
   * from the in-memory task array. Called after every local mutation
   * (addTask, deleteTask, uncompleteTask fallback) so the stats header
   * and progress bar always reflect the actual task list even when the
   * server returns no questProgress in the response.
   */
  private recalcStats(): void {
    if (!this.quest) return;
    const tasks = this.quest.tasks ?? [];
    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    this.quest.totalTasks       = total;
    this.quest.completedTasks   = done;
    this.quest.completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    this.quest.progress         = this.quest.completionPercent;
    // Recompute earned XP as sum of completed task rewards
    // (server questProgress takes priority when available, but this
    //  keeps the stat correct locally even when questProgress is null)
    this.quest.currentXP = tasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (t.xpReward ?? 0), 0);
  }

  goBackToHabit(): void { this.router.navigate(['/habit', this.habitId]); }
}
