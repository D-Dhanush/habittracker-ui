import { Routes } from '@angular/router';
import { HabitDetailComponent } from './habit/habit-detail/habit-detail.component';
import { HabitCollectionComponent } from './habit/habit-collection/habit-collection.component';
import { HabitComponent } from './habit/habit.component';
import { ProgressComponent } from './pages/progress.component';
import { HelpComponent } from './pages/help.component';
import { SettingsComponent } from './pages/settings.component';
import { ProfileComponent } from './pages/profile.component';

export const routes: Routes = [
  { path: '', component: HabitCollectionComponent },
  { path: 'habits', component: HabitCollectionComponent },
  { path: 'habit/:id', component: HabitDetailComponent },
  { path: 'add-habit', component: HabitComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'help', component: HelpComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
