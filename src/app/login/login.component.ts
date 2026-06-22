import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { ToastService } from '../toast.service';

type AuthMode = 'login' | 'signup';

/**
 * Phase 1 has no real authentication (no password hashing, no JWT/session
 * handling, no Google OAuth client registered anywhere in Program.cs —
 * see the project handoff doc, this was an explicit scope decision).
 *
 * This component is intentionally honest about that: the form looks and
 * behaves like a real login/signup screen, but submitting either one
 * resolves to the single seeded default user via UserService — there is
 * no password check. The Google button does NOT fake a successful Google
 * login; it shows a toast saying Google sign-in isn't wired up yet. When
 * real auth lands in Phase 2, only the submit handlers below need to
 * change — the template/UI shape stays the same.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  mode: AuthMode = 'login';
  submitting = false;

  authForm = this.fb.group({
    displayName: [''],
    emailOrUsername: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private toast: ToastService
  ) {}

  get displayName() {
    return this.authForm.get('displayName');
  }

  get emailOrUsername() {
    return this.authForm.get('emailOrUsername');
  }

  get password() {
    return this.authForm.get('password');
  }

  get isSignup(): boolean {
    return this.mode === 'signup';
  }

  switchMode(mode: AuthMode): void {
    this.mode = mode;
    this.authForm.reset();
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    // No real credential check yet (see class comment above) — this
    // resolves to the seeded default user regardless of what was typed,
    // so the rest of the app has someone to act as "the current user".
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.submitting = false;
        this.toast.show(
          this.isSignup ? `Welcome, ${user.displayName || user.email}!` : `Welcome back, ${user.displayName || user.email}!`,
          'success'
        );
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitting = false;
        this.toast.show('Could not sign in. Is the API running?', 'failure');
      }
    });
  }

  onGoogleSignIn(): void {
    this.toast.show('Google sign-in is coming in a future update.', 'info');
  }
}
