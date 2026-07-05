import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl:`./unauthorized.component.html`,
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {
  get userRole(): string { return this.auth.currentUser()?.role ?? ''; }
  constructor(private auth: AuthService, private router: Router) {}
  logout(): void { this.auth.logout(); }
}
