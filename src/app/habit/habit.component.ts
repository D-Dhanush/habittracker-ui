import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HabitService } from '../habit.service'; // Adjusted path assuming habit.service.ts is in src/app
import { HabitCardComponent } from './habit-card/habit-card.component';
import { HabitDto } from '../models/Habit.dto';

@Component({
  selector: 'app-habit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HabitCardComponent],
  templateUrl: './habit.component.html',
  styleUrls: ['./habit.component.scss']
})
export class HabitComponent implements OnInit {
  habitForm!: FormGroup;
  habits: HabitDto[] = [];

  constructor(private fb: FormBuilder, private habitService: HabitService) {}

  ngOnInit(): void {
    this.habitForm = this.fb.group({
      Name: ['', [Validators.required, Validators.minLength(3)]],
      Description: [''],
      Tags: [[]],
      Frequency: ['Daily'],
      IsActive: [true]
    });

  }


  addHabit(): void {
    if (this.habitForm.valid) {
      this.habitService.createHabit(this.habitForm.value).subscribe({
        next: (response: HabitDto) => {
          console.log('Habit created successfully', response);
          this.habits.push(response); // Add to the list
          this.habitForm.reset();
        },
        error: (error: any) => {
          console.error('Error creating habit', error);
        }
      });
    }
  }
}