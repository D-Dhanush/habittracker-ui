import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuestService } from '../../services/quest.service';
import { ToastService } from '../../toast.service';


@Component({
  selector: 'app-quest-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quest-form.component.html',
  styleUrls: ['./quest-form.component.scss']
})
export class QuestFormComponent {
  habitId = '';

  name = '';
  category = '';
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
  xp = 50;
  icon = 'flag';
  description = '';
  notes = '';

  submitting = false;

  readonly difficultyOptions: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questService: QuestService,
    private toast: ToastService
  ) {
    this.habitId = this.route.snapshot.paramMap.get('habitId') ?? '';
  }

  get isValid(): boolean {
    return this.name.trim().length > 0 && this.category.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid || this.submitting || !this.habitId) return;

    this.submitting = true;

    this.questService.createQuest({
      habitId: this.habitId,
      name: this.name.trim(),
      category: this.category.trim(),
      difficulty: this.difficulty,
      xp: this.xp,
      icon: this.icon || undefined,
      description: this.description.trim() || undefined,
      notes: this.notes.trim() || undefined
    }).subscribe({
      next: (created) => {
        this.submitting = false;
        this.toast.show(`Quest "${created.name}" created.`, 'success');
        this.router.navigate(['/habit', this.habitId, 'quest', created.id]);
      },
      error: () => {
        this.submitting = false;
        this.toast.show('Could not create quest. Try again.', 'failure');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/habit', this.habitId]);
  }
}
