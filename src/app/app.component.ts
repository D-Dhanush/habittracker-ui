import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeftnavComponent } from './layout/leftnav/leftnav.component';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LeftnavComponent, RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'HabitTracker';
  showLogoPreview = false;

  toggleLogoPreview(): void {
    this.showLogoPreview = !this.showLogoPreview;
  }

  closeLogoPreview(): void {
    this.showLogoPreview = false;
  }
}
