import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap, delay } from 'rxjs';
import {
  SubscriptionPlan,
  PlanFeature,
  UserSubscription,
  TrialState,
  PaymentMethodOption,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentHistoryItem,
  PlanId
} from '../models/subscription.models';
import { environment } from '../../environments/environment';

/**
 * Base URL for the standalone subscription microservice — deliberately its
 * own service base, not the main API's, so this can live behind its own
 * deployment/scaling/circuit breaker without the main app knowing or caring.
 * Set SUBSCRIPTION_API_BASE_URL in environment.ts once the .NET service has
 * a real address.
 */
const API_BASE = ((environment as any).subscriptionApiBaseUrl ?? environment.apiBaseUrl) || '/api/subscriptions';

/**
 * NOTE ON STUBBING: every method here calls the real HttpClient endpoint
 * first. If that fails (404/backend not built yet), it falls back to local
 * mock data via `catchError`, so pages are fully functional today and need
 * zero changes once the .NET microservice actually exists — the fallback
 * simply stops triggering.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  /** Cached current-user subscription state, read by trial banners/guards. */
  readonly currentSubscription = signal<UserSubscription | null>(null);
  readonly currentTrial = signal<TrialState | null>(null);

  constructor(private http: HttpClient) {}

  // ── Plans & features ───────────────────────────────────────────────────

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${API_BASE}/plans`).pipe(
      catchError(() => of(MOCK_PLANS).pipe(delay(200)))
    );
  }

  getFeatureMatrix(): Observable<PlanFeature[]> {
    return this.http.get<PlanFeature[]>(`${API_BASE}/plans/features`).pipe(
      catchError(() => of(MOCK_FEATURES).pipe(delay(200)))
    );
  }

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http.get<PaymentMethodOption[]>(`${API_BASE}/payment-methods`).pipe(
      catchError(() => of(MOCK_PAYMENT_METHODS).pipe(delay(150)))
    );
  }

  // ── Current user's subscription / trial state ──────────────────────────
  // Frontend only ever DISPLAYS this — every premium gate must still be
  // enforced backend-side per-request; this signal is UX convenience only.

  getMySubscription(): Observable<UserSubscription> {
    return this.http.get<UserSubscription>(`${API_BASE}/me/subscription`).pipe(
      tap(sub => this.currentSubscription.set(sub)),
      catchError(() => {
        const mock = MOCK_NO_SUBSCRIPTION;
        this.currentSubscription.set(mock);
        return of(mock).pipe(delay(200));
      })
    );
  }

  getMyTrialState(): Observable<TrialState> {
    return this.http.get<TrialState>(`${API_BASE}/me/trial`).pipe(
      tap(trial => this.currentTrial.set(trial)),
      catchError(() => {
        const mock = MOCK_TRIAL_ACTIVE;
        this.currentTrial.set(mock);
        return of(mock).pipe(delay(200));
      })
    );
  }

  getPaymentHistory(): Observable<PaymentHistoryItem[]> {
    return this.http.get<PaymentHistoryItem[]>(`${API_BASE}/me/payments`).pipe(
      catchError(() => of(MOCK_PAYMENT_HISTORY).pipe(delay(200)))
    );
  }

  // ── Checkout flow ───────────────────────────────────────────────────────
  // POST /checkout/init  -> backend creates the real gateway order and
  // returns only a public token/order id. POST /checkout/verify -> backend
  // re-checks the payment server-to-server before activating anything.
  // Neither step is mocked with a fake "success" — see payment-provider.ts.

  createCheckoutSession(req: CreateCheckoutSessionRequest): Observable<CreateCheckoutSessionResponse> {
    return this.http.post<CreateCheckoutSessionResponse>(`${API_BASE}/checkout/init`, req);
  }

  verifyPayment(req: VerifyPaymentRequest): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(`${API_BASE}/checkout/verify`, req).pipe(
      tap(res => { if (res.subscription) this.currentSubscription.set(res.subscription); })
    );
  }

  // ── Subscription management ─────────────────────────────────────────────

  setAutoRenew(enabled: boolean): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(`${API_BASE}/me/subscription/auto-renew`, { enabled }).pipe(
      tap(sub => this.currentSubscription.set(sub))
    );
  }

  cancelAutoRenew(): Observable<UserSubscription> {
    return this.setAutoRenew(false);
  }

  upgradePlan(planId: PlanId): Observable<CreateCheckoutSessionResponse> {
    return this.createCheckoutSession({ planId, paymentMethod: 'upi' });
  }
}

// ============================================================================
// Mock fallback data — used only while the .NET microservice isn't live yet.
// Mirrors exactly what the real endpoints are expected to return.
// ============================================================================

const MOCK_PLANS: SubscriptionPlan[] = [
  { id: 'starter',  name: 'Starter',  priceInr: 9,   durationValue: 1, durationUnit: 'day',   durationLabel: '1 Day',   isBestValue: false },
  { id: 'explorer', name: 'Explorer', priceInr: 29,  durationValue: 7, durationUnit: 'day',   durationLabel: '7 Days',  isBestValue: false },
  { id: 'hero',     name: 'Hero',     priceInr: 99,  durationValue: 1, durationUnit: 'month', durationLabel: '1 Month', isBestValue: false, tagline: 'Most popular' },
  { id: 'legend',   name: 'Legend',   priceInr: 199, durationValue: 1, durationUnit: 'year',  durationLabel: '1 Year',  isBestValue: true,  tagline: 'Best Value' },
];

const MOCK_FEATURES: PlanFeature[] = [
  { id: 'unlimited_habits',      label: 'Unlimited Habits',      included: { starter: false, explorer: true,  hero: true, legend: true } },
  { id: 'unlimited_quests',      label: 'Unlimited Quests',      included: { starter: false, explorer: true,  hero: true, legend: true } },
  { id: 'unlimited_ai_commands', label: 'Unlimited AI Commands', included: { starter: false, explorer: false, hero: true, legend: true } },
  { id: 'advanced_analytics',    label: 'Advanced Analytics',    included: { starter: false, explorer: false, hero: true, legend: true } },
  { id: 'ai_coach',              label: 'Future AI Coach',       included: { starter: false, explorer: false, hero: false, legend: true } },
  { id: 'priority_ai',           label: 'Priority AI',           included: { starter: false, explorer: false, hero: true, legend: true } },
  { id: 'themes',                label: 'Themes',                included: { starter: true,  explorer: true,  hero: true, legend: true } },
  { id: 'premium_badges',        label: 'Premium Badges',        included: { starter: false, explorer: true,  hero: true, legend: true } },
  { id: 'future_features',       label: 'Future Features',       included: { starter: false, explorer: false, hero: false, legend: true } },
  { id: 'storage',               label: 'Storage',               included: { starter: false, explorer: true,  hero: true, legend: true } },
  { id: 'export_data',           label: 'Export Data',           included: { starter: false, explorer: false, hero: true, legend: true } },
  { id: 'cloud_backup',          label: 'Cloud Backup',          included: { starter: false, explorer: false, hero: true, legend: true } },
  { id: 'premium_support',       label: 'Premium Support',       included: { starter: false, explorer: false, hero: false, legend: true } },
];

const MOCK_PAYMENT_METHODS: PaymentMethodOption[] = [
  { type: 'upi',         label: 'UPI',           icon: 'account_balance_wallet', group: 'upi' },
  { type: 'gpay',        label: 'Google Pay',    icon: 'account_balance_wallet', group: 'upi' },
  { type: 'phonepe',     label: 'PhonePe',       icon: 'account_balance_wallet', group: 'upi' },
  { type: 'paytm',       label: 'Paytm',         icon: 'account_balance_wallet', group: 'wallet' },
  { type: 'bhim',        label: 'BHIM',          icon: 'account_balance_wallet', group: 'upi' },
  { type: 'credit_card', label: 'Credit Card',   icon: 'credit_card',            group: 'card' },
  { type: 'debit_card',  label: 'Debit Card',    icon: 'credit_card',            group: 'card' },
  { type: 'netbanking',  label: 'Net Banking',   icon: 'account_balance',        group: 'netbanking' },
  { type: 'wallet',      label: 'Wallets',       icon: 'wallet',                 group: 'wallet' },
];

const MOCK_NO_SUBSCRIPTION: UserSubscription = {
  status: 'none', planId: null, planName: null,
  startedAtUtc: null, expiresAtUtc: null,
  daysRemaining: 0, autoRenew: false, isTrial: false,
};

const MOCK_TRIAL_ACTIVE: TrialState = {
  hasUsedTrial: true,
  isActive: true,
  trialStartedAtUtc: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  trialEndsAtUtc: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
  daysRemaining: 2,
};

const MOCK_PAYMENT_HISTORY: PaymentHistoryItem[] = [];