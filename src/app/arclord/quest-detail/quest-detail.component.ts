import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuestService } from '../../services/quest.service';
import { ToastService } from '../../toast.service';
import { QuestDto, QuestTaskDto } from '../../models/quest.model';

/**
 * Replaces the old src/app/arclord/quest-detail/quest-detail.component.ts,
 * which despite its name and route never touched QuestService at all — it
 * called HabitService.getHabitById() and rendered Habit data. This is the
 * genuine Quest detail page: shows a Quest's Tasks, lets you add new tasks,
 * and completing a task calls the cascade endpoint (Task -> Quest -> Habit
 * -> UserProgress) rather than a plain "mark done" toggle.
 */
@Component({
  selector: 'app-quest-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quest-detail.component.html',
  styleUrls: ['./quest-detail.component.scss']
})
export class QuestDetailComponent implements OnInit {
  quest: QuestDto | null = null;
  habitId = '';
  questId = '';
  loading = true;
  error = false;

  newTaskName = '';
  newTaskXp = 10;
  addingTask = false;

  completingTaskId: string | null = null;

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
    this.loading = true;
    this.error = false;

    this.questService.getQuestById(this.questId).subscribe({
      next: (quest) => {
        this.quest = quest;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.toast.show('Could not load this quest.', 'failure');
      }
    });
  }

  get tasks(): QuestTaskDto[] {
    return this.quest?.tasks ?? [];
  }

  get pendingTasks(): QuestTaskDto[] {
    return this.tasks.filter(t => !t.completed);
  }

  get completedTasks(): QuestTaskDto[] {
    return this.tasks.filter(t => t.completed);
  }

  completeTask(task: QuestTaskDto): void {
    if (task.completed || this.completingTaskId) return;

    this.completingTaskId = task.id;

    this.questService.completeTask(this.questId, task.id).subscribe({
      next: (result) => {
        this.completingTaskId = null;

        if (!result.success) {
          this.toast.show(result.message || 'Could not complete task.', 'failure');
          return;
        }

        // Update the task in place rather than re-fetching the whole quest —
        // the cascade response already carries everything that changed.
        if (this.quest && result.task) {
          const idx = this.quest.tasks?.findIndex(t => t.id === task.id) ?? -1;
          if (idx >= 0 && this.quest.tasks) {
            this.quest.tasks[idx] = result.task;
          }
        }

        if (this.quest && result.questProgress) {
          this.quest.currentXP = result.questProgress.currentXP;
          this.quest.completedTasks = result.questProgress.completedTasks;
          this.quest.completionPercent = result.questProgress.completionPercent;
          this.quest.progress = result.questProgress.completionPercent;
        }

        const xpGained = result.task?.xpReward ?? 0;
        this.toast.show(`+${xpGained} XP earned!`, 'success');

        if (result.habitProgress) {
          this.toast.show(`Habit streak: ${result.habitProgress.streak} days`, 'info');
        }
      },
      error: () => {
        this.completingTaskId = null;
        this.toast.show('Could not complete task. Try again.', 'failure');
      }
    });
  }

  addTask(): void {
    if (!this.newTaskName.trim()) return;

    this.addingTask = true;

    this.questService.addTask(this.questId, {
      name: this.newTaskName.trim(),
      xpReward: this.newTaskXp || 10
    }).subscribe({
      next: (task) => {
        this.addingTask = false;
        this.newTaskName = '';
        this.newTaskXp = 10;

        if (this.quest) {
          this.quest.tasks = [...(this.quest.tasks ?? []), task];
          this.quest.totalTasks = (this.quest.totalTasks ?? 0) + 1;
        }

        this.toast.show('Task added.', 'success');
      },
      error: () => {
        this.addingTask = false;
        this.toast.show('Could not add task.', 'failure');
      }
    });
  }

  deleteTask(task: QuestTaskDto): void {
    this.questService.deleteTask(this.questId, task.id).subscribe({
      next: () => {
        if (this.quest) {
          this.quest.tasks = this.tasks.filter(t => t.id !== task.id);
        }
        this.toast.show('Task removed.', 'success');
      },
      error: () => this.toast.show('Could not remove task.', 'failure')
    });
  }

  goBackToHabit(): void {
    this.router.navigate(['/habit', this.habitId]);
  }
}
