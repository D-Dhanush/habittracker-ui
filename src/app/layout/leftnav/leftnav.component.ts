import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { ThemeService, THEME_OPTIONS, ThemeId } from '../../services/theme.service';

const ADMIN_ROLES = ['Admin', 'Super Admin', 'Platform Owner', 'Moderator'];

@Component({
  selector: 'app-leftnav',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatIconModule, MatTooltipModule, MatMenuModule, RouterModule],
  templateUrl: './leftnav.component.html',
  styleUrls: ['./leftnav.component.scss']
})
export class LeftnavComponent {
  readonly themeOptions = THEME_OPTIONS;
  readonly activeTheme: typeof this.themeSvc.activeTheme;

  constructor(private auth: AuthService, private themeSvc: ThemeService) {
    this.activeTheme = this.themeSvc.activeTheme;
  }

  get userName(): string { return this.auth.currentUser()?.name ?? ''; }
  get isAdmin(): boolean { return ADMIN_ROLES.includes(this.auth.currentUser()?.role ?? ''); }
  logout(): void { this.auth.logout(); }
  setTheme(id: ThemeId): void { this.themeSvc.setTheme(id); }
}
