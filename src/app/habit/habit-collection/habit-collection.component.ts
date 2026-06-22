import { HabitService } from '../../services/habit.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastService } from '../../toast.service';
import { HabitDto } from '../../models/habitdto';
import { HabitCardComponent } from '../habit-card/habit-card.component';

/**
 * This is the page the original /habits route never actually reached
 * (it redirected straight to /quests instead) — see app.routes.ts.
 * Fixed: now genuinely reachable. Also fixed a real bug where deleting
 * a habit only removed it from the local pagedHabits array — it never
 * called HabitService.deleteHabit(), so the "deleted" habit would
 * reappear on the next page refresh because nothing actually told the
 * backend to archive it.
 */
@Component({
  selector: 'app-habit-collection',
  standalone: true,
  imports: [CommonModule, RouterModule, HabitCardComponent],
  templateUrl: './habit-collection.component.html',
  styleUrls: ['./habit-collection.component.scss']
})
export class HabitCollectionComponent implements OnInit {
  habits: HabitDto[] = [];
  pagedHabits: HabitDto[] = [];
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  loading = true;

  constructor(
    private habitService: HabitService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadHabits();
  }

  loadHabits(): void {
    this.loading = true;
    this.habitService.getAllHabits().subscribe({
      next: (habits: HabitDto[]) => {
        this.habits = habits;
        this.totalPages = Math.max(1, Math.ceil(this.habits.length / this.pageSize));
        this.currentPage = 1;
        this.updatePagedHabits();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load habits.', 'failure');
      }
    });
  }

  onHabitClick(habitId: string): void {
    this.router.navigate(['/habit', habitId]);
  }

  // Fixed: previously only updated local state. Now actually deletes
  // server-side first, and only updates local state on success.
  onHabitDeleteConfirmed(id: string): void {
    this.habitService.deleteHabit(id).subscribe({
      next: () => {
        this.habits = this.habits.filter(habit => habit.id !== id);
        this.totalPages = Math.max(1, Math.ceil(this.habits.length / this.pageSize));
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
        this.updatePagedHabits();
        this.toast.show('Habit deleted.', 'success');
      },
      error: () => {
        this.toast.show('Could not delete habit. Try again.', 'failure');
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
