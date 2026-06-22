import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestDto } from '../../../models/quest.model';

/**
 * Replaces the old src/app/arclord/components/quest-card component,
 * which was confirmed dead code (imported by nothing, built against
 * a Quest model with fields like `streak` that the backend never had).
 * This version uses the real, persisted QuestProgress rollup fields.
 */
@Component({
  selector: 'app-quest-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quest-card.component.html',
  styleUrls: ['./quest-card.component.scss']
})
export class QuestCardComponent {
  @Input() quest!: QuestDto;
  @Output() questClick = new EventEmitter<string>();

  get difficultyClass(): string {
    const d = (this.quest?.difficulty ?? '').toLowerCase();
    if (d === 'hard' || d === 'gold') return 'difficulty-hard';
    if (d === 'medium' || d === 'silver') return 'difficulty-medium';
    return 'difficulty-easy';
  }

  get taskSummary(): string {
    const total = this.quest?.totalTasks ?? 0;
    const done = this.quest?.completedTasks ?? 0;
    return `${done}/${total} tasks`;
  }

  onCardClick(): void {
    this.questClick.emit(this.quest.id);
  }
}
