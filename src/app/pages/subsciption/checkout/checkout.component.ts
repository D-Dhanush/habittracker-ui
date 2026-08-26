import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../../services/subscription.service';
import {
  SubscriptionPlan,
  PaymentMethodOption,
  PaymentMethodType,
  PlanId
} from '../../../models/subscription.models';
import { PaymentProviderFactory, PaymentProviderNotConfiguredError } from '../../../services/payment.provider.service';

type CheckoutStep = 'select-method' | 'processing' | 'verifying' | 'success' | 'failed';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  readonly plan = signal<SubscriptionPlan | null>(null);
  readonly paymentMethods = signal<PaymentMethodOption[]>([]);
  readonly selectedMethod = signal<PaymentMethodType | null>(null);
  readonly step = signal<CheckoutStep>('select-method');
  readonly errorMessage = signal<string | null>(null);
  readonly loadingPlan = signal(true);

  readonly groupedMethods = computed(() => {
    const groups: Record<string, PaymentMethodOption[]> = { upi: [], card: [], netbanking: [], wallet: [] };
    for (const m of this.paymentMethods()) groups[m.group].push(m);
    return groups;
  });

  readonly isProcessing = computed(() => this.step() === 'processing' || this.step() === 'verifying');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subs: SubscriptionService,
    private providerFactory: PaymentProviderFactory
  ) {}

  ngOnInit(): void {
    const planId = this.route.snapshot.queryParamMap.get('plan') as PlanId | null;

    this.subs.getPaymentMethods().subscribe(methods => this.paymentMethods.set(methods));

    this.subs.getPlans().subscribe(plans => {
      const match = plans.find(p => p.id === planId) ?? null;
      this.plan.set(match);
      this.loadingPlan.set(false);
      if (!match) {
        // No/invalid plan in the URL — send them back to pick one rather
        // than showing a broken checkout screen.
        this.router.navigate(['/subscription/plans']);
      }
    });
  }

  selectMethod(method: PaymentMethodType): void {
    if (this.isProcessing()) return;
    this.selectedMethod.set(method);
    this.errorMessage.set(null);
  }

  pay(): void {
    const plan = this.plan();
    const method = this.selectedMethod();
    if (!plan || !method) return;

    this.errorMessage.set(null);
    this.step.set('processing');

    this.subs.createCheckoutSession({ planId: plan.id, paymentMethod: method }).subscribe({
      next: (session) => {
        const provider = this.providerFactory.resolve(session.provider);
        provider.loadSdk()
          .then(() => provider.openCheckout(session))
          .then((result) => {
            this.step.set('verifying');
            this.subs.verifyPayment({
              checkoutSessionId: session.checkoutSessionId,
              providerOrderId: result.providerOrderId,
              providerPaymentId: result.providerPaymentId,
              providerSignature: result.providerSignature
            }).subscribe({
              next: (verifyRes) => {
                if (verifyRes.status === 'success') {
                  this.step.set('success');
                } else {
                  this.step.set('failed');
                  this.errorMessage.set(verifyRes.failureReason ?? 'Payment could not be verified.');
                }
              },
              error: () => {
                this.step.set('failed');
                this.errorMessage.set('We could not confirm your payment with the server. If money was deducted, it will be auto-refunded within 5-7 days, or contact support.');
              }
            });
          })
          .catch((err) => {
            this.step.set('failed');
            if (err instanceof PaymentProviderNotConfiguredError) {
              this.errorMessage.set('Payments aren\'t live yet — this checkout is wired up and waiting on the backend gateway integration.');
            } else {
              this.errorMessage.set('Payment was cancelled or could not be started.');
            }
          });
      },
      error: () => {
        this.step.set('failed');
        this.errorMessage.set('Could not start checkout. Please try again.');
      }
    });
  }

  retry(): void {
    this.step.set('select-method');
    this.errorMessage.set(null);
  }

  goToStatus(): void {
    this.router.navigate(['/subscription/status']);
  }
}