import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LeftnavComponent } from './layout/leftnav/leftnav.component';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LeftnavComponent, RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'HabitTracker';
  showLogoPreview = false;
  showMainShell = true;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showMainShell = !['/login', '/unauthorized'].includes(event.urlAfterRedirects);
      }
    });
  }

  toggleLogoPreview(): void {
    this.showLogoPreview = !this.showLogoPreview;
  }

  closeLogoPreview(): void {
    this.showLogoPreview = false;
  }
}
