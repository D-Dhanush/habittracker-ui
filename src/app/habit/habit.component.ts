import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HabitService } from '../services/habit.service';
import { Habit, CATEGORY_ICONS, CATEGORY_LABELS, HabitStatus, HabitFrequency } from '../models/habit.model';

@Component({
  selector: 'app-habit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule
  ],
  templateUrl: './habit.component.html',
  styleUrls: ['./habit.component.scss']
})
export class HabitComponent implements OnInit {
  habitForm!: FormGroup;
  isEditing = false;
  editingHabitId: string | null = null;
  existingHabit: Habit | null = null;

  categories = Object.keys(CATEGORY_LABELS);
  frequencies: HabitFrequency[] = ['daily', 'weekly', 'bi-weekly', 'monthly'];
  statuses: HabitStatus[] = ['active', 'paused', 'completed', 'archived'];
  categoryIcons = CATEGORY_ICONS;
  categoryLabels = CATEGORY_LABELS;

  colorOptions = [
    { name: 'Gold', value: '#d4af37' },
    { name: 'Blue', value: '#4dd9ff' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Red', value: '#f44336' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Orange', value: '#ff9800' }
  ];

  materialIcons = [
    'fitness_center', 'favorite', 'spa', 'school', 'attach_money',
    'schedule', 'psychology', 'nights_stay', 'book', 'run_circle',
    'health_and_safety', 'self_improvement', 'trending_up', 'star',
    'flash_on', 'wave'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const habitId = params['id'];
      if (habitId) {
        this.isEditing = true;
        this.editingHabitId = habitId;
        this.loadHabit(habitId);
      }
    });
  }

  private initializeForm(): void {
    this.habitForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      subtitle: [''],
      description: [''],
      category: ['health', Validators.required],
      customCategory: [''],
      frequency: ['daily', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [''],
      status: ['active', Validators.required],
      xpReward: [50, [Validators.required, Validators.min(10), Validators.max(500)]],
      primaryColor: ['#d4af37', Validators.required],
      secondaryColor: ['#4dd9ff', Validators.required],
      icon: ['target', Validators.required],
      tasks: this.fb.array([])
    });
  }

  private loadHabit(habitId: string): void {
    this.habitService.getHabitById(habitId).subscribe(habit => {
      if (habit) {
        this.existingHabit = habit;
        this.populateForm(habit);
      }
    });
  }

  private populateForm(habit: Habit): void {
    this.habitForm.patchValue({
      name: habit.name,
      subtitle: habit.subtitle || '',
      description: habit.description || '',
      category: habit.category,
      customCategory: habit.customCategory || '',
      frequency: habit.frequency,
      endDate: habit.endDate ? new Date(habit.endDate) : '',
      status: habit.status,
      xpReward: habit.xpReward,
      primaryColor: habit.primaryColor || '#d4af37',
      secondaryColor: habit.secondaryColor || '#4dd9ff',
      icon: habit.icon || 'target'
    });

    const tasksArray = this.habitForm.get('tasks') as FormArray;
    tasksArray.clear();
    habit.tasks.forEach(task => {
      tasksArray.push(this.fb.group({
        name: [task.name, Validators.required],
        description: [task.description || ''],
        xpReward: [task.xpReward || 10]
      }));
    });
  }

  get tasksArray(): FormArray {
    return this.habitForm.get('tasks') as FormArray;
  }

  addTask(): void {
    const tasksArray = this.habitForm.get('tasks') as FormArray;
    tasksArray.push(this.fb.group({
      name: ['', Validators.required],
      description: [''],
      xpReward: [10]
    }));
  }

  removeTask(index: number): void {
    const tasksArray = this.habitForm.get('tasks') as FormArray;
    tasksArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.habitForm.invalid) {
      this.habitForm.markAllAsTouched();
      return;
    }

    const formValue = this.habitForm.value;
    const habit: Omit<Habit, 'id' | 'createdDate' | 'updatedDate'> = {
      name: formValue.name,
      subtitle: formValue.subtitle,
      description: formValue.description,
      category: formValue.category,
      customCategory: formValue.customCategory,
      frequency: formValue.frequency,
      startDate: new Date(formValue.startDate),
      endDate: formValue.endDate ? new Date(formValue.endDate) : undefined,
      status: formValue.status,
      icon: formValue.icon,
      primaryColor: formValue.primaryColor,
      secondaryColor: formValue.secondaryColor,
      xpReward: formValue.xpReward,
      tasks: formValue.tasks.map((task: any) => ({
        id: Date.now().toString() + Math.random(),
        name: task.name,
        description: task.description,
        completed: false,
        xpReward: task.xpReward
      })),
      completions: this.existingHabit?.completions || [],
      milestones: this.existingHabit?.milestones || []
    };

    if (this.isEditing && this.editingHabitId) {
      this.habitService.updateHabit(this.editingHabitId, habit);
    } else {
      this.habitService.createHabit(habit);
    }

    this.router.navigate(['/quests']);
  }

  onCancel(): void {
    this.router.navigate(['/quests']);
  }

  getCategoryIcon(category: string): string {
    return CATEGORY_ICONS[category] || 'target';
  }

  getCategoryLabel(category: string): string {
    return CATEGORY_LABELS[category] || category;
  }
}