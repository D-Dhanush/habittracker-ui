import { Component, OnInit, NgZone, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, AuthResponse } from '../services/auth.service';
import { ToastService } from '../toast.service';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize:        (cfg: object) => void;
          renderButton:      (el: HTMLElement, cfg: object) => void;
          prompt:            () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

// Module-level flag — survives component destroy/recreate so GSI is only
// initialized once per page load, preventing the "called multiple times" warning.
let gsiInitialized = false;

type AuthMode = 'login' | 'signup';
type View     = 'login' | 'signup' | 'forgot';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls:  ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {

  view: View     = 'login';
  mode: AuthMode = 'login';

  submitting  = false;
  loading     = false;
  googleReady = false;
  error       = '';
  sessionMsg  = '';

  authForm = this.fb.group({
    displayName:     [''],
    emailOrUsername: ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]]
  });

  resetEmail      = '';
  resetSubmitting = false;
  resetSent       = false;
  resetError      = '';

  constructor(
    private fb:     FormBuilder,
    private router: Router,
    private route:  ActivatedRoute,
    private auth:   AuthService,
    private toast:  ToastService,
    private zone:   NgZone,
    private http:   HttpClient
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) { this.router.navigate(['/']); return; }

    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionMsg = 'Your session has expired. Please sign in again.';
    }

    this.loadGoogleScript();
  }

  // AfterViewInit ensures the #google-signin-btn div is in the DOM
  // before renderButton() tries to find it.
  ngAfterViewInit(): void {
    if (gsiInitialized && window.google?.accounts?.id) {
      // SDK already initialized — just re-render the button into the (now visible) div
      this.renderGoogleButton();
    }
  }

  // ── View / mode switching ─────────────────────────────────────────────────

  switchView(v: View): void {
    this.view       = v;
    this.error      = '';
    this.resetSent  = false;
    this.resetError = '';
    if (v === 'login' || v === 'signup') {
      this.mode = v;
      this.authForm.reset();
    }
  }

  switchMode(m: AuthMode): void {
    this.mode  = m;
    this.view  = m;
    this.error = '';
    this.authForm.reset();
  }

  // ── Email / Password ──────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.authForm.invalid) { this.authForm.markAllAsTouched(); return; }
    this.submitting = true;
    this.error = '';

    const email    = this.authForm.value.emailOrUsername ?? '';
    const password = this.authForm.value.password ?? '';
    const name     = this.authForm.value.displayName ?? '';

    const call = this.isSignup
      ? this.auth.registerWithEmail(email, password, name)
      : this.auth.loginWithEmail(email, password);

    call.subscribe({
      next: (res: AuthResponse) => {
        this.submitting = false;
        this.toast.show(
          this.isSignup
            ? `Account created! Welcome, ${res.user.name}! 🎮`
            : `Welcome back, ${res.user.name}! 🎮`,
          'success'
        );
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.submitting = false;
        this.error = err?.error?.message
          ?? (this.isSignup ? 'Registration failed.' : 'Invalid email or password.');
      }
    });
  }

  // ── Forgot password ───────────────────────────────────────────────────────

  sendForgotPassword(): void {
    if (!this.resetEmail.trim()) return;
    this.resetSubmitting = true;
    this.resetError = '';

    this.http.post(`${environment.apiBaseUrl}/api/auth/forgot-password`, {
      email: this.resetEmail.trim()
    }).subscribe({
      next: () => {
        this.resetSubmitting = false;
        this.resetSent = true;
      },
      error: () => {
        // Always show success — prevents email enumeration
        this.resetSubmitting = false;
        this.resetSent = true;
      }
    });
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────

  private loadGoogleScript(): void {
    if (document.getElementById('gsi-script')) {
      // Script already in DOM — wait for SDK then init (won't double-init)
      this.waitForGSI();
      return;
    }
    const s  = document.createElement('script');
    s.id     = 'gsi-script';
    s.src    = 'https://accounts.google.com/gsi/client';
    s.async  = true;
    s.defer  = true;
    s.onload = () => this.waitForGSI();
    document.head.appendChild(s);
  }

  private waitForGSI(attempts = 0): void {
    if (window.google?.accounts?.id) { this.initGoogleSignIn(); return; }
    if (attempts < 30) setTimeout(() => this.waitForGSI(attempts + 1), 200);
  }

  private initGoogleSignIn(): void {
    const clientId = environment.googleClientId;
    if (!clientId || clientId.includes('YOUR_GOOGLE')) {
      this.googleReady = false;
      return;
    }

    // Guard: only call initialize() once per page load
    if (!gsiInitialized) {
      window.google!.accounts.id.initialize({
        client_id:             clientId,
        callback:              (response: { credential: string }) => {
          this.zone.run(() => this.handleGoogleCredential(response.credential));
        },
        auto_select:           false,
        cancel_on_tap_outside: true
      });
      gsiInitialized = true;
    }

    this.googleReady = true;
    this.renderGoogleButton();
  }

  private renderGoogleButton(): void {
    // Use setTimeout to ensure Angular has rendered the div into the DOM
    setTimeout(() => {
      const btnEl = document.getElementById('google-signin-btn');
      if (btnEl && window.google?.accounts?.id) {
        window.google!.accounts.id.renderButton(btnEl, {
          type:  'standard',
          theme: 'filled_black',
          size:  'large',
          shape: 'rectangular',
          width: btnEl.offsetWidth || 340,
          text:  'continue_with'
        });
      }
    }, 0);
  }

  private handleGoogleCredential(idToken: string): void {
    this.loading = true;
    this.error   = '';

    this.auth.loginWithGoogle(idToken).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        this.toast.show(`Welcome, ${res.user.name}! 🎮`, 'success');
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Google sign-in failed. Please try again.';
        window.google?.accounts.id.disableAutoSelect();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get isSignup(): boolean { return this.mode === 'signup'; }
  get emailOrUsername()   { return this.authForm.get('emailOrUsername'); }
  get password()          { return this.authForm.get('password'); }
  get displayName()       { return this.authForm.get('displayName'); }
}
