import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LeftnavComponent } from './layout/leftnav/leftnav.component';
import { ToastComponent } from './toast.component';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { AiShelfComponent } from './ai/ai-shelf.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LeftnavComponent, RouterOutlet, ToastComponent, AiShelfComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'HabitTracker';
  showLogoPreview = false;
  showMainShell   = true;

  constructor(
    private router: Router,
    private auth:   AuthService,
    private theme:  ThemeService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showMainShell = !['/login', '/unauthorized'].includes(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.theme.restoreTheme();
    this.auth.tryAutoLogin().subscribe(user => {
      if (!user && this.showMainShell) {
        this.router.navigate(['/login']);
      }
    });
  }

  toggleLogoPreview(): void { this.showLogoPreview = !this.showLogoPreview; }
  closeLogoPreview(): void  { this.showLogoPreview = false; }
}