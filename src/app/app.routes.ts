import { Routes } from '@angular/router';
import { HabitDetailComponent } from './habit/habit-detail/habit-detail.component';
import { HabitCollectionComponent } from './habit/habit-collection/habit-collection.component';

export const routes: Routes = [
  { path: '', component: HabitCollectionComponent },
    { path: 'habit/:id', component:  HabitDetailComponent }

];
