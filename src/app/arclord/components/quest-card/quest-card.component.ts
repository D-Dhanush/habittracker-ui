import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestDto } from '../../../models/quest.model';

@Component({
  selector: 'app-quest-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quest-card.component.html',
  styleUrls: ['./quest-card.component.scss']
})
export class QuestCardComponent {
  @Input() quest!: QuestDto;
  @Output() questClick   = new EventEmitter<string>();
  @Output() deleteQuest  = new EventEmitter<string>();

  confirmDelete = false;

  get difficultyClass(): string {
    const d = (this.quest?.difficulty ?? '').toLowerCase();
    if (d === 'hard' || d === 'gold') return 'difficulty-hard';
    if (d === 'medium' || d === 'silver') return 'difficulty-medium';
    return 'difficulty-easy';
  }

  get taskSummary(): string {
    return `${this.quest?.completedTasks ?? 0}/${this.quest?.totalTasks ?? 0} tasks`;
  }

  onCardClick(): void {
    if (this.confirmDelete) return;
    this.questClick.emit(this.quest.id);
  }

  promptDelete(e: Event): void {
    e.stopPropagation();
    this.confirmDelete = true;
  }

  confirmDeleteQuest(e: Event): void {
    e.stopPropagation();
    this.confirmDelete = false;
    this.deleteQuest.emit(this.quest.id);
  }

  cancelDelete(e: Event): void {
    e.stopPropagation();
    this.confirmDelete = false;
  }
}
