import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../../services/subscription.service';

/**
 * Drop <app-trial-banner /> into Dashboard, Subscription Page, and Profile
 * as requested. It reads SubscriptionService's cached signals so all three
 * placements stay in sync without three separate API calls — whichever one
 * mounts first triggers the fetch, the others just read the signal.
 */
@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trial-banner.component.html',
  styleUrls: ['./trial-banner.component.scss']
})
export class TrialBannerComponent implements OnInit {
  private get trial() {
    return this.subs.currentTrial;
  }

  readonly visible = computed(() => {
    const t = this.trial();
    return !!t && t.isActive && t.daysRemaining >= 0;
  });

  readonly isUrgent = computed(() => (this.trial()?.daysRemaining ?? 99) <= 1);

  constructor(private subs: SubscriptionService, private router: Router) {}

  ngOnInit(): void {
    // Cheap no-op if another instance already populated the signal this
    // session; SubscriptionService itself doesn't dedupe in-flight calls,
    // so keep this component light — it's fine to occasionally re-fetch.
    if (!this.subs.currentTrial()) {
      this.subs.getMyTrialState().subscribe();
    }
  }

  upgrade(): void {
    this.router.navigate(['/subscription/plans']);
  }
}