import { HabitDto } from '../../models/Habit.dto';
import { HabitService } from '../../habit.service';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitCardComponent } from '../habit-card/habit-card.component';

@Component({
  selector: 'app-habit-collection',
  standalone: true,
  imports: [CommonModule, HabitCardComponent],
  templateUrl: './habit-collection.component.html',
  styleUrls: ['./habit-collection.component.scss']
})
export class HabitCollectionComponent implements OnInit {
  habits: HabitDto[] = [];
  pagedHabits: HabitDto[] = [];
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  
  constructor(private habitService: HabitService) {}

  ngOnInit(): void {
    this.loadHabits();
  }

  loadHabits(): void {
    this.habitService.getAllHabits().subscribe({
      next: (habits: HabitDto[]) => {
        this.habits = habits;
        this.totalPages = Math.max(1, Math.ceil(this.habits.length / this.pageSize));
        this.currentPage = 1;
        this.updatePagedHabits();
      },
      error: (error: any) => {
        console.error('Error loading habits', error);
      }
    });
  }

  updatePagedHabits(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedHabits = this.habits.slice(start, end);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.updatePagedHabits();
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
}
