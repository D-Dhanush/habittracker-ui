import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Quest } from '../../models/quest.model';

@Component({
  selector: 'app-quest-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './quest-card.component.html',
  styleUrls: ['./quest-card.component.scss']
})
export class QuestCardComponent {
  @Input() quest!: Quest;
  @Output() editQuest = new EventEmitter<Quest>();
  @Output() deleteQuest = new EventEmitter<Quest>();

  onEdit(): void {
    this.editQuest.emit(this.quest);
  }

  onDelete(): void {
    this.deleteQuest.emit(this.quest);
  }
}
