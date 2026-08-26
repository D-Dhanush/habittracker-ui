import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  userId:  string;
  email:   string;
  name:    string;
  picture: string;
  role:    string;
}

export interface AuthResponse {
  token:            string;
  expiresAt:        string;
  refreshToken:     string;
  refreshExpiresAt: string;
  user:             UserProfile;
}

const TOKEN_KEY         = 'arclord_jwt';
const REFRESH_TOKEN_KEY = 'arclord_refresh_jwt';
const EXPIRES_AT_KEY    = 'arclord_expires_at';
const USER_KEY          = 'arclord_user';
const SESSION_KEY       = 'arclord_session'; // backwards-compat with Phase 1 guard

/** Refresh this long before the access token actually expires, so an active
 *  tab silently renews instead of ever hitting a hard 401. */
const REFRESH_MARGIN_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Reactive signal — components read currentUser() to get logged-in user. */
  readonly currentUser = signal<UserProfile | null>(this.loadUser());

  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  // ── Google Sign-In ────────────────────────────────────────────────────────

  /**
   * Called by login.component after Google GSI SDK fires the credential callback.
   * Sends the Google ID token to POST /api/auth/google, stores the resulting JWT.
   */
  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/google`, { idToken })
      .pipe(
        tap(res => this.storeSession(res)),
        catchError(err => { throw err; })
      );
  }

  // ── Email / Password ──────────────────────────────────────────────────────

  /**
   * POST /api/auth/login — standard email+password login.
   * Backend returns a signed JWT on success.
   */
  loginWithEmail(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(res => this.storeSession(res)),
        catchError(err => { throw err; })
      );
  }

  /**
   * POST /api/auth/register — create a new account with email+password.
   * Backend hashes the password, creates the user, returns a signed JWT.
   */
  registerWithEmail(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, { email, password, displayName })
      .pipe(
        tap(res => this.storeSession(res)),
        catchError(err => { throw err; })
      );
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/refresh — exchanges the stored refresh token for a fresh
   * access token (and a rotated refresh token). Used both proactively (timer)
   * and reactively (interceptor, on a 401).
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available.'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap(res => this.storeSession(res)));
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // ── Auto-login ────────────────────────────────────────────────────────────

  /**
   * Called once in app.component.ts ngOnInit.
   * Restores session silently if the stored JWT is still valid — or, if it has
   * expired but a refresh token is still on hand, silently renews it first.
   */
  tryAutoLogin(): Observable<UserProfile | null> {
    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      if (this.getRefreshToken()) {
        return this.refreshToken().pipe(
          map(res => res.user),
          catchError(() => { this.clearSession(); return of(null); })
        );
      }
      this.clearSession();
      return of(null);
    }

    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (expiresAt) this.scheduleRefresh(expiresAt);

    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  // ── Session ───────────────────────────────────────────────────────────────

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Persists a fresh access token in place, WITHOUT touching the refresh
   * token, expiry, or refresh timer — used when another service (e.g.
   * SubscriptionService, after a plan purchase changes entitlement claims)
   * receives a re-issued access token but the login session itself hasn't
   * changed length. Does not re-derive currentUser from the new token;
   * callers that need updated profile fields should still go through the
   * normal /api/auth/me flow (tryAutoLogin) if that ever becomes necessary.
   */
  updateAccessToken(newToken: string): void {
    localStorage.setItem(TOKEN_KEY, newToken);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY,         res.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(EXPIRES_AT_KEY,    res.expiresAt);
    localStorage.setItem(USER_KEY,          JSON.stringify(res.user));
    localStorage.setItem(SESSION_KEY,       'true');
    this.currentUser.set(res.user);
    this.scheduleRefresh(res.expiresAt);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private loadUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch { return true; }
  }

  /** Proactively refreshes the access token shortly before it expires, so an
   *  active session never hits a hard 401 while the tab stays open. */
  private scheduleRefresh(expiresAt: string): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const delay = new Date(expiresAt).getTime() - Date.now() - REFRESH_MARGIN_MS;
    if (delay <= 0) return; // already due — the interceptor's reactive refresh covers this

    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe({ error: () => this.clearSession() });
    }, delay);
  }
}
