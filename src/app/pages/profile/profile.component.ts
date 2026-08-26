import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { HabitService } from '../../services/habit.service';
import { ToastService } from '../../toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: ReturnType<AuthService['currentUser']>;
  stats: any = null;
  pwForm!: FormGroup;
  pwError      = '';
  pwSubmitting = false;
  resetSent    = false;

  get isGoogleAccount(): boolean {
    return !!(this.user?.picture && this.user.picture.includes('googleusercontent'));
  }

  get initials(): string {
    const name  = this.user?.name || this.user?.email || '?';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  constructor(
    private auth:         AuthService,
    private userService:  UserService,
    private habitService: HabitService,
    private toast:        ToastService,
    private fb:           FormBuilder,
    private http:         HttpClient
  ) {
    this.user = this.auth.currentUser();
  }

  ngOnInit(): void {
    this.buildPwForm();
    this.loadStats();
    // Refresh latest user data from backend and merge into local view
    this.userService.getCurrentUser().subscribe({
      next: u => {
        if (u && this.user) {
          this.user = { ...this.user, name: u.displayName || this.user.name, email: u.email };
        }
      },
      error: () => {}
    });
  }

  private buildPwForm(): void {
    this.pwForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: (g: FormGroup) =>
        g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true }
    });
  }

  private loadStats(): void {
    this.habitService.getStats().subscribe({ next: s => this.stats = s, error: () => {} });
  }

  changePassword(): void {
    if (this.pwForm.invalid || this.pwSubmitting) return;
    this.pwSubmitting = true;
    this.pwError = '';
    const { currentPassword, newPassword } = this.pwForm.value;
    this.http.post(`${environment.apiBaseUrl}/api/auth/change-password`, { currentPassword, newPassword })
      .subscribe({
        next: () => {
          this.pwSubmitting = false;
          this.pwForm.reset();
          this.toast.show('Password updated successfully.', 'success');
        },
        error: err => {
          this.pwSubmitting = false;
          this.pwError = err?.error?.message ?? 'Could not update password.';
        }
      });
  }

  sendForgotPassword(): void {
    if (!this.user?.email) return;
    this.http.post(`${environment.apiBaseUrl}/api/auth/forgot-password`, { email: this.user.email })
      .subscribe({
        next: () => { this.resetSent = true; this.toast.show('Reset email sent.', 'success'); },
        error: () => this.toast.show('Could not send reset email.', 'failure')
      });
  }

  logout(): void { this.auth.logout(); }
}
