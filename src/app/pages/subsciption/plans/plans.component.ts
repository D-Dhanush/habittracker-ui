import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../../services/subscription.service';
import { PlanFeature, PlanId, SubscriptionPlan } from '../../../models/subscription.models';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly features = signal<PlanFeature[]>([]);
  readonly loading = signal(true);
  readonly currentPlanId = computed(() => this.subs.currentSubscription()?.planId ?? null);

  constructor(private subs: SubscriptionService, private router: Router) {}

  ngOnInit(): void {
    this.subs.getPlans().subscribe(plans => {
      this.plans.set(plans);
      this.loading.set(false);
    });
    this.subs.getFeatureMatrix().subscribe(f => this.features.set(f));
    this.subs.getMySubscription().subscribe();
  }

  selectPlan(planId: PlanId): void {
    this.router.navigate(['/subscription/checkout'], { queryParams: { plan: planId } });
  }

  isCurrentPlan(planId: PlanId): boolean {
    return this.currentPlanId() === planId;
  }

  trackByPlan(_i: number, p: SubscriptionPlan): string { return p.id; }
  trackByFeature(_i: number, f: PlanFeature): string { return f.id; }
}