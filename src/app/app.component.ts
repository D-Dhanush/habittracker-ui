import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeftnavComponent } from './layout/leftnav/leftnav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LeftnavComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'HabitTracker';
}
