import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { ToastService } from '../toast.service';
import { HABIT_CATEGORIES, getCategoryIcon, getCategoryLabel } from '../models/category-constants';
import { HabitDto } from '../models/habitdto';

/**
 * Fixes from the original:
 *   - getCategoryIcon/getCategoryLabel were dead stubs (always returned
 *     'target' / echoed the input unchanged) despite a real lookup
 *     already existing elsewhere in the codebase but never imported
 *     here. Now uses the real shared lookup from category-constants.ts.
 *   - Removed the tasks FormArray entirely. Tasks belong to Quests now,
 *     not directly to Habits — a habit's tasks are created from inside
 *     a Quest (see QuestFormComponent / QuestDetailComponent), not at
 *     habit-creation time.
 *   - The create payload used PascalCase keys (Name, StartDateUtc, ...)
 *     against CreateHabitDto, inconsistent with the rest of the app.
 *     Now camelCase, matching the corrected CreateHabitDto.
 *   - The create payload also sent Type/PrimaryIcon/SecondaryIcon/
 *     CustomName — fields the backend never persisted or returned
 *     (confirmed dead fields, removed entirely from both DTOs).
 *   - The update payload silently dropped category, customCategory,
 *     xpReward, and tags on every save even though the form collected
 *     them — they're now actually included.
 *   - Both onSubmit() paths and onCancel() navigated to /quests, a
 *     route that no longer exists (it used to secretly browse Habits).
 *     Now navigates to the habit's own detail page / habit list.
 */
@Component({
  selector: 'app-habit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  existingHabit: HabitDto | null = null;
  submitting = false;

  readonly categories = HABIT_CATEGORIES;
  readonly frequencies = ['daily', 'weekly', 'bi-weekly', 'monthly'];
  readonly statuses = ['active', 'paused', 'completed', 'archived'];

  readonly colorOptions = [
    { name: 'Gold', value: '#d4af37' },
    { name: 'Blue', value: '#4dd9ff' },
    { name: 'Purple', value: '#a87ce0' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Red', value: '#f44336' },
    { name: 'Orange', value: '#ff9800' }
  ];

  readonly materialIcons = [
    'fitness_center', 'favorite', 'spa', 'school', 'attach_money',
    'schedule', 'psychology', 'nights_stay', 'book', 'run_circle',
    'health_and_safety', 'self_improvement', 'trending_up', 'star',
    'flash_on', 'bolt'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private toast: ToastService
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
      category: ['fitness', Validators.required],
      customCategory: [''],
      frequency: ['daily', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [''],
      status: ['active', Validators.required],
      xpReward: [50, [Validators.required, Validators.min(10), Validators.max(500)]],
      primaryColor: ['#4dd9ff', Validators.required],
      secondaryColor: ['#1a8fb5', Validators.required],
      icon: ['target', Validators.required],
      targetOccurrencesPerPeriod: [1, [Validators.min(1)]],
      notes: ['']
    });
  }

  private loadHabit(habitId: string): void {
    this.habitService.getHabitById(habitId).subscribe({
      next: (habit) => {
        if (habit) {
          this.existingHabit = habit;
          this.populateForm(habit);
        }
      },
      error: () => this.toast.show('Could not load habit for editing.', 'failure')
    });
  }

  private populateForm(habit: HabitDto): void {
    this.habitForm.patchValue({
      name: habit.name,
      subtitle: habit.subtitle || '',
      description: habit.description || '',
      category: habit.category || 'fitness',
      customCategory: habit.customCategory || '',
      frequency: habit.frequency,
      endDate: habit.endDt ?? '',
      status: habit.status ?? 'active',
      xpReward: habit.xpReward,
      primaryColor: habit.primaryColor || '#4dd9ff',
      secondaryColor: habit.secondaryColor || '#1a8fb5',
      icon: habit.icon || 'target',
      targetOccurrencesPerPeriod: habit.targetOccurrencesPerPeriod ?? 1,
      notes: habit.notes || ''
    });
  }

  getCategoryIcon(category: string): string {
    return getCategoryIcon(category);
  }

  getCategoryLabel(category: string): string {
    return getCategoryLabel(category);
  }

  onSubmit(): void {
    if (this.habitForm.invalid) {
      this.habitForm.markAllAsTouched();
      return;
    }

    const formValue = this.habitForm.value;
    this.submitting = true;

    if (this.isEditing && this.editingHabitId) {
      const updateInput = {
        name: formValue.name,
        subtitle: formValue.subtitle,
        description: formValue.description,
        category: formValue.category,
        customCategory: formValue.customCategory,
        status: formValue.status,
        frequency: formValue.frequency,
        endDateUtc: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined,
        icon: formValue.icon,
        primaryColor: formValue.primaryColor,
        secondaryColor: formValue.secondaryColor,
        xpReward: formValue.xpReward,
        targetOccurrencesPerPeriod: formValue.targetOccurrencesPerPeriod,
        notes: formValue.notes,
        isActive: true
      };

      this.habitService.updateHabit(this.editingHabitId, updateInput).subscribe({
        next: (updated) => {
          this.submitting = false;
          this.toast.show('Habit updated.', 'success');
          this.router.navigate(['/habit', updated.id]);
        },
        error: () => {
          this.submitting = false;
          this.toast.show('Could not update habit.', 'failure');
        }
      });

    } else {
      const createHabitDto = {
        name: formValue.name,
        subtitle: formValue.subtitle,
        description: formValue.description,
        category: formValue.category,
        customCategory: formValue.customCategory,
        startDateUtc: formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined,
        endDateUtc: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined,
        frequency: formValue.frequency,
        targetOccurrencesPerPeriod: formValue.targetOccurrencesPerPeriod,
        icon: formValue.icon,
        primaryColor: formValue.primaryColor,
        secondaryColor: formValue.secondaryColor,
        xpReward: formValue.xpReward,
        notes: formValue.notes,
        isActive: true,
        tags: formValue.customCategory ? [formValue.customCategory] : []
      };

      this.habitService.createHabit(createHabitDto).subscribe({
        next: (created) => {
          this.submitting = false;
          this.toast.show('Habit created.', 'success');
          this.router.navigate(['/habit', created.id]);
        },
        error: () => {
          this.submitting = false;
          this.toast.show('Could not create habit.', 'failure');
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditing && this.editingHabitId) {
      this.router.navigate(['/habit', this.editingHabitId]);
    } else {
      this.router.navigate(['/habits']);
    }
  }
}
