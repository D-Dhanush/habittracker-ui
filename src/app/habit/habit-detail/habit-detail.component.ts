import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HabitService } from '../../habit.service';
import { HabitDto } from '../../models/Habit.dto';

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-detail.component.html',
  styleUrls: ['./habit-detail.component.scss']
})
export class HabitDetailComponent implements OnInit {
  habit?: HabitDto;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private habitService: HabitService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Habit ID is missing.';
      return;
    }

    this.habitService.getHabitById(id).subscribe({
      next: (habit) => {
        this.habit = habit;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load habit details.';
      }
    });
  }
}
