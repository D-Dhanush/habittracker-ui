import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';
import { HabitCardComponent } from '../components/habit-card/habit-card.component';

@Component({
  selector: 'app-quests',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    HabitCardComponent
  ],
  templateUrl: './quests.component.html',
  styleUrls: ['./quests.component.scss']
})
export class QuestsComponent implements OnInit {
  habits: Habit[] = [];
  displayedHabits: Habit[] = [];
  filteredStatus = 'all';

  constructor(
    private habitService: HabitService,
    private router: Router
  ) {}

  
  ngOnInit(): void {
    this.habitService.getHabits().subscribe(habits => {
      this.habits = habits;
      this.filterHabits();
    });
  }

  filterHabits(): void {
    if (this.filteredStatus === 'all') {
      this.displayedHabits = this.habits;
    } else {
      this.displayedHabits = this.habits.filter(h => h.status === this.filteredStatus);
    }
  }

  setFilter(status: string): void {
    this.filteredStatus = status;
    this.filterHabits();
  }

  onHabitClick(habitId: string): void {
    this.router.navigate(['/quest', habitId]);
  }

  onCreateHabit(): void {
    this.router.navigate(['/add-habit']);
  }

  getDisplayedCount(): number {
    return this.displayedHabits.length;
  }

  getTotalCount(): number {
    return this.habits.length;
  }
}
