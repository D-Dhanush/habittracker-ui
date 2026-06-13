import { Routes } from '@angular/router';
import { HabitDetailComponent } from './habit/habit-detail/habit-detail.component';
import { HabitCollectionComponent } from './habit/habit-collection/habit-collection.component';
import { HabitComponent } from './habit/habit.component';
import { ProgressComponent } from './pages/progress.component';
import { HelpComponent } from './pages/help.component';
import { SettingsComponent } from './pages/settings.component';
import { ProfileComponent } from './pages/profile.component';
import { LoginComponent } from './login/login.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { DashboardComponent } from './arclord/dashboard/dashboard.component';
import { QuestsComponent } from './arclord/quests/quests.component';
import { QuestDetailComponent } from './arclord/quest-detail/quest-detail.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'quests', component: QuestsComponent },
  { path: 'quest/:id', component: QuestDetailComponent },
  { path: 'create-quest', component: QuestsComponent },
  { path: 'habits', redirectTo: 'quests', pathMatch: 'full' },
  { path: 'habit/:id', component: HabitDetailComponent },
  { path: 'add-habit', component: HabitComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'help', component: HelpComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
