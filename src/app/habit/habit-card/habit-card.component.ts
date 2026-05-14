import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../habit.service';
import { HabitDto } from '../../models/Habit.dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-card.component.html',
  styleUrls: ['./habit-card.component.scss']
})
export class HabitCardComponent implements OnInit {
  @Input() habitId!: string;
  @Input() habit: HabitDto | null = null;

  constructor(private habitService: HabitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.habitId && !this.habit) {
      this.habitService.getHabitById(this.habitId).subscribe({
        next: (habit: HabitDto) => {
          this.habit = habit;
        },
        error: (error: any) => {
          console.error('Error fetching habit', error);
        }

      });
    }
  }

  onCardClick(): void {
    if (this.habit) {
      this.router.navigate(['/habit', this.habit.id]);
    }
}
}