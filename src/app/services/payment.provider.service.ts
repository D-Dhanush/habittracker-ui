import { Injectable } from '@angular/core';
import {
  CreateCheckoutSessionResponse,
  PaymentProviderId,
  VerifyPaymentRequest
} from '../models/subscription.models';

/**
 * Result the provider's checkout widget/redirect resolves with. Shaped to
 * map 1:1 onto VerifyPaymentRequest so callers just forward it to the
 * backend's /checkout/verify endpoint — no re-mapping per provider.
 */
export interface ProviderCheckoutResult {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}

/**
 * Every gateway integration implements this. Swapping Razorpay for Stripe
 * or Cashfree — or running two side by side for A/B — never touches
 * CheckoutComponent, only which provider gets injected.
 */
export interface IPaymentProvider {
  readonly id: PaymentProviderId;

  /** Loads the provider's checkout SDK, if not already loaded. */
  loadSdk(): Promise<void>;

  /**
   * Opens the provider's checkout UI for the session the backend already
   * created (see CreateCheckoutSessionResponse). Resolves once the user
   * completes payment client-side; this is still unverified at this point.
   */
  openCheckout(session: CreateCheckoutSessionResponse): Promise<ProviderCheckoutResult>;
}

// ── Razorpay (primary) ──────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RazorpayProvider implements IPaymentProvider {
  readonly id: PaymentProviderId = 'razorpay';

  loadSdk(): Promise<void> {
    return loadExternalScript('razorpay-checkout-js', 'https://checkout.razorpay.com/v1/checkout.js');
  }

  openCheckout(session: CreateCheckoutSessionResponse): Promise<ProviderCheckoutResult> {
    // TODO(backend live): replace with real `new (window as any).Razorpay({...}).open()`
    // wiring once the .NET service exposes /checkout/init. Left as a typed
    // stub so the rest of the checkout flow (UI, loading states, error
    // handling, verify-on-backend) can be built and tested today.
    console.warn('[RazorpayProvider] Stub checkout — no real gateway wired yet.', session);
    return Promise.reject(
      new PaymentProviderNotConfiguredError('razorpay', session.checkoutSessionId)
    );
  }
}

// ── Stripe (future) ─────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StripeProvider implements IPaymentProvider {
  readonly id: PaymentProviderId = 'stripe';

  loadSdk(): Promise<void> {
    return loadExternalScript('stripe-js', 'https://js.stripe.com/v3/');
  }

  openCheckout(session: CreateCheckoutSessionResponse): Promise<ProviderCheckoutResult> {
    console.warn('[StripeProvider] Stub checkout — Stripe integration not scheduled yet.', session);
    return Promise.reject(
      new PaymentProviderNotConfiguredError('stripe', session.checkoutSessionId)
    );
  }
}

// ── Cashfree (optional) ─────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CashfreeProvider implements IPaymentProvider {
  readonly id: PaymentProviderId = 'cashfree';

  loadSdk(): Promise<void> {
    return loadExternalScript('cashfree-js', 'https://sdk.cashfree.com/js/v3/cashfree.js');
  }

  openCheckout(session: CreateCheckoutSessionResponse): Promise<ProviderCheckoutResult> {
    console.warn('[CashfreeProvider] Stub checkout — Cashfree integration is optional/future.', session);
    return Promise.reject(
      new PaymentProviderNotConfiguredError('cashfree', session.checkoutSessionId)
    );
  }
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(public providerId: PaymentProviderId, public checkoutSessionId: string) {
    super(`Payment provider "${providerId}" is not yet configured for live checkout.`);
    this.name = 'PaymentProviderNotConfiguredError';
  }
}

/**
 * Resolves the right IPaymentProvider for whatever the backend says the
 * active session is using — CheckoutComponent asks this instead of picking
 * a provider itself, so provider selection stays a backend/config concern.
 */
@Injectable({ providedIn: 'root' })
export class PaymentProviderFactory {
  constructor(
    private razorpay: RazorpayProvider,
    private stripe: StripeProvider,
    private cashfree: CashfreeProvider
  ) {}

  resolve(providerId: PaymentProviderId): IPaymentProvider {
    switch (providerId) {
      case 'razorpay': return this.razorpay;
      case 'stripe':   return this.stripe;
      case 'cashfree': return this.cashfree;
    }
  }
}

function loadExternalScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}