// ============================================================================
// ArcLord Premium — Subscription domain contracts.
//
// These types mirror the DTOs the .NET subscription microservice will expose.
// Keeping them in one file means the day the real API lands, only
// SubscriptionService's HTTP bodies need touching — every component below
// is already coded against these shapes.
//
// Backend service boundary (future): https://subscriptions.arclord.app/api/v1
// Suggested tables: SubscriptionPlans, UserSubscriptions, Payments,
// PaymentTransactions, PaymentLogs, PaymentStatusHistory, UserTrials.
// ============================================================================

export type PlanId = 'starter' | 'explorer' | 'hero' | 'legend';

export type BillingPeriod = 'day' | 'week' | 'month' | 'year';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceInr: number;
  durationValue: number;
  durationUnit: BillingPeriod;
  /** Human label e.g. "1 Day", "7 Days", "1 Month", "1 Year" */
  durationLabel: string;
  isBestValue: boolean;
  tagline?: string;
}

/** Feature matrix row. `included[planId]` drives the comparison table. */
export interface PlanFeature {
  id: string;
  label: string;
  description?: string;
  included: Record<PlanId, boolean>;
}

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'past_due'
  | 'none';

export interface UserSubscription {
  status: SubscriptionStatus;
  planId: PlanId | null;
  planName: string | null;
  startedAtUtc: string | null;
  expiresAtUtc: string | null;
  daysRemaining: number;
  autoRenew: boolean;
  isTrial: boolean;
}

export interface TrialState {
  hasUsedTrial: boolean;
  isActive: boolean;
  trialStartedAtUtc: string | null;
  trialEndsAtUtc: string | null;
  daysRemaining: number;
}

// ── Payments ────────────────────────────────────────────────────────────────

export type PaymentMethodType =
  | 'upi' | 'gpay' | 'phonepe' | 'paytm' | 'bhim'
  | 'credit_card' | 'debit_card' | 'netbanking' | 'wallet';

export interface PaymentMethodOption {
  type: PaymentMethodType;
  label: string;
  icon: string; // asset path or mat-icon name
  group: 'upi' | 'card' | 'netbanking' | 'wallet';
}

/** Which real gateway is behind the checkout. Backend decides via config;
 *  frontend never hardcodes gateway secrets — only ever gets a client token. */
export type PaymentProviderId = 'razorpay' | 'stripe' | 'cashfree';

/** POST /subscriptions/checkout/init */
export interface CreateCheckoutSessionRequest {
  planId: PlanId;
  paymentMethod: PaymentMethodType;
}

/** Response from backend — an opaque, provider-specific order the frontend
 *  hands to the provider's SDK. Frontend never computes amounts/signatures. */
export interface CreateCheckoutSessionResponse {
  provider: PaymentProviderId;
  providerOrderId: string;
  amountInPaise: number;
  currency: 'INR';
  /** Public/publishable key only — never a secret key. */
  providerPublicKey: string;
  checkoutSessionId: string;
}

/** Sent to backend after the provider SDK reports success client-side.
 *  Backend re-verifies signature/status server-to-server before activating
 *  anything — this payload is a claim, not a source of truth. */
export interface VerifyPaymentRequest {
  checkoutSessionId: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface VerifyPaymentResponse {
  status: PaymentStatus;
  subscription: UserSubscription | null;
  /** Present when the backend refreshed the JWT to include new premium claims. */
  refreshedToken?: string;
  failureReason?: string;
}

export interface PaymentHistoryItem {
  id: string;
  planName: string;
  amountInr: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  createdAtUtc: string;
  invoiceUrl?: string;
}

// ── Premium gating ──────────────────────────────────────────────────────────

/** Every premium-gated feature in the app keys off one of these — backend's
 *  JWT claims / entitlement check should use the same identifiers. */
export type PremiumFeatureKey =
  | 'unlimited_habits'
  | 'unlimited_quests'
  | 'unlimited_ai_commands'
  | 'advanced_analytics'
  | 'ai_coach'
  | 'priority_ai'
  | 'premium_themes'
  | 'premium_badges'
  | 'export_data'
  | 'cloud_backup'
  | 'premium_support';