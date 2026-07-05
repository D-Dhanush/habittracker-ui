import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';

const ADMIN_ROLES = ['Admin', 'Super Admin', 'Platform Owner', 'Moderator'];

@Component({
  selector: 'app-leftnav',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './leftnav.component.html',
  styleUrls: ['./leftnav.component.scss']
})
export class LeftnavComponent {
  constructor(private auth: AuthService) {}

  get userName(): string { return this.auth.currentUser()?.name ?? ''; }
  get isAdmin(): boolean { return ADMIN_ROLES.includes(this.auth.currentUser()?.role ?? ''); }
  logout(): void { this.auth.logout(); }
}
