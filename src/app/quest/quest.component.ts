import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../toast.service';
import { HabitService } from '../habit.service';
import { CreateHabitDto } from '../models/createhabitdto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HabitDto } from '../models/habitdto';

@Component({
  selector: 'app-quest',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './quest.component.html',
  styleUrls: ['./quest.component.scss']
})
export class QuestComponent implements OnInit {
  categoryOptions = ['Fitness', 'Health', 'Study', 'Finance', 'Mindset', 'Productivity', 'Spiritual', 'Custom'];
  difficultyOptions = ['Bronze', 'Silver', 'Gold', 'Emerald', 'Platinum'];
  frequencyOptions = ['Daily', 'Weekly', 'Monthly', 'Custom'];
  statusOptions = ['Active', 'Paused', 'Completed'];

  habits: HabitDto[] = [];
  displayedHabits: HabitDto[] = [];
  filteredStatus = 'all';

  icons = [
    { id: 'star',    label: 'Star'  },
    { id: 'sword',   label: 'Sword' },
    { id: 'book',    label: 'Book'  },
    { id: 'leaf',    label: 'Leaf'  },
    { id: 'gem',     label: 'Gem'   }
  ];

  form = this.fb.group({
    questName:       ['', [Validators.required, Validators.minLength(3)]],
    subtitle:        [''],
    description:     [''],
    category:        ['Fitness', Validators.required],
    customCategory:  [''],
    difficulty:      ['Bronze', Validators.required],
    icon:            ['star', Validators.required],
    primaryColor:    ['#d4af37'],
    secondaryColor:  ['#6b4f1d'],
    frequency:       ['Daily', Validators.required],
    customFrequency: [''],
    startDate:       [null as string | null],
    endDate:         [null as string | null],
    tasks:           this.fb.array([]),
    status:          ['Active', Validators.required],
    xpReward:        [10, [Validators.min(0)]]
  });

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private habitService: HabitService
  ) {
    this.addTask();
  }

  ngOnInit(): void {
    this.form.get('category')?.valueChanges.subscribe(val => {
      const ctl = this.form.get('customCategory');
      if (val === 'Custom') {
        ctl?.setValidators([Validators.required]);
      } else {
        ctl?.clearValidators();
        ctl?.setValue('');
      }
      ctl?.updateValueAndValidity();
    });

    this.form.get('frequency')?.valueChanges.subscribe(val => {
      const ctl = this.form.get('customFrequency');
      if (val === 'Custom') {
        ctl?.setValidators([Validators.required]);
      } else {
        ctl?.clearValidators();
        ctl?.setValue('');
      }
      ctl?.updateValueAndValidity();
    });
  }

  get tasks(): FormArray {
    return this.form.get('tasks') as FormArray;
  }

  addTask(): void {
    this.tasks.push(this.fb.group({ title: ['', Validators.required], done: [false] }));
  }

  removeTask(index: number): void {
    this.tasks.removeAt(index);
  }

  showCustomCategory(): boolean {
    return this.form.get('category')?.value === 'Custom';
  }

  showCustomFrequency(): boolean {
    return this.form.get('frequency')?.value === 'Custom';
  }

  // Filter by isActive since HabitDto has no status field
  filterHabits(): void {
    if (this.filteredStatus === 'all') {
      this.displayedHabits = this.habits;
    } else if (this.filteredStatus === 'active') {
      this.displayedHabits = this.habits.filter(h => h.isActive === true);
    } else if (this.filteredStatus === 'inactive') {
      this.displayedHabits = this.habits.filter(h => h.isActive === false);
    } else {
      this.displayedHabits = this.habits;
    }
  }

  setFilter(status: string): void {
    this.filteredStatus = status;
    this.filterHabits();
  }

  private dateRangeValid(): boolean {
    const s = this.form.get('startDate')?.value;
    const e = this.form.get('endDate')?.value;
    if (!s || !e) return true;
    return new Date(e) >= new Date(s);
  }

  getDifficultyColor(): string {
    switch (this.form.get('difficulty')?.value) {
      case 'Bronze':   return '#b87333';
      case 'Silver':   return '#c0c0c0';
      case 'Gold':     return '#d4af37';
      case 'Emerald':  return '#50c878';
      case 'Platinum': return '#e5e4e2';
      default:         return '#d4af37';
    }
  }

  clearForm(): void {
    const save = confirm('Save quest before clearing? Press OK to save, Cancel to discard.');
    if (save) {
      this.createQuest();
      return;
    }
    this.form.reset({
      category: 'Fitness', difficulty: 'Bronze', icon: 'star',
      primaryColor: '#0a0a0a', secondaryColor: '#3b3b3b',
      frequency: 'Daily', status: 'Active', xpReward: 10
    });
    this.tasks.clear();
    this.addTask();
    this.toast.show('Form cleared', 'info');
  }

  createQuest(): void {
    if (this.form.invalid || !this.dateRangeValid()) {
      this.form.markAllAsTouched();
      this.toast.show('Please fix validation errors', 'failure');
      return;
    }

    const payload = this.form.value;

    if (payload.category === 'Custom' && !payload.customCategory) {
      this.toast.show('Provide custom category name', 'failure');
      return;
    }

    if (!this.tasks.length || this.tasks.controls.some(c => c.get('title')?.invalid)) {
      this.toast.show('Please add at least one valid task', 'failure');
      return;
    }

    const dto: CreateHabitDto = {
      Name: payload.questName!,
      Description: payload.description || payload.subtitle || undefined,
      StartDateUtc: payload.startDate
        ? new Date(payload.startDate).toISOString()
        : undefined,
      EndDateUtc: payload.endDate
        ? new Date(payload.endDate).toISOString()
        : undefined,
      Frequency: payload.frequency === 'Custom'
        ? payload.customFrequency || 'Custom'
        : payload.frequency!,
      Tags: [payload.category === 'Custom'
        ? payload.customCategory!
        : payload.category!],
      IsActive: payload.status !== 'Completed',
      Type: payload.category === 'Custom'
        ? payload.customCategory || undefined
        : payload.category || undefined,
      PrimaryIcon: payload.icon || undefined,
      SecondaryIcon: undefined,        // ← was null, must be string | undefined
      CustomName: payload.subtitle || undefined
    };

    this.habitService.createHabit(dto).subscribe({
      next: () => {
        this.toast.show('Quest created — may ARCLORD favor your path', 'success');
        this.form.reset({
          category: 'Fitness', difficulty: 'Bronze', icon: 'star',
          primaryColor: '#0a0a0a', secondaryColor: '#3b3b3b',
          frequency: 'Daily', status: 'Active', xpReward: 10
        });
        this.tasks.clear();
        this.addTask();
      },
      error: (err) => {
        console.error('Create quest error', err);
        this.toast.show('Failed to create quest', 'failure');
      }
    });
  }
}