import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentHistoryItem, TrialState, UserSubscription } from '../../../models/subscription.models';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-subscription-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class SubscriptionStatusComponent implements OnInit {
  readonly subscription = signal<UserSubscription | null>(null);
  readonly trial = signal<TrialState | null>(null);
  readonly history = signal<PaymentHistoryItem[]>([]);
  readonly loading = signal(true);
  readonly autoRenewBusy = signal(false);

  readonly hasActiveAccess = computed(() => {
    const s = this.subscription();
    return !!s && (s.status === 'active' || s.status === 'trial');
  });

  readonly expiryLabel = computed(() => {
    const s = this.subscription();
    if (!s?.expiresAtUtc) return '—';
    return new Date(s.expiresAtUtc).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  });

  constructor(private subs: SubscriptionService, private router: Router) {}

  ngOnInit(): void {
    this.subs.getMySubscription().subscribe(sub => {
      this.subscription.set(sub);
      this.loading.set(false);
    });
    this.subs.getMyTrialState().subscribe(t => this.trial.set(t));
    this.subs.getPaymentHistory().subscribe(h => this.history.set(h));
  }

  toggleAutoRenew(): void {
    const sub = this.subscription();
    if (!sub) return;
    this.autoRenewBusy.set(true);
    this.subs.setAutoRenew(!sub.autoRenew).subscribe({
      next: (updated) => { this.subscription.set(updated); this.autoRenewBusy.set(false); },
      error: () => { this.autoRenewBusy.set(false); }
    });
  }

  goToPlans(): void {
    this.router.navigate(['/subscription/plans']);
  }

  renew(): void {
    const sub = this.subscription();
    if (sub?.planId) {
      this.router.navigate(['/subscription/checkout'], { queryParams: { plan: sub.planId } });
    } else {
      this.goToPlans();
    }
  }

  trackByPayment(_i: number, p: PaymentHistoryItem): string { return p.id; }
}