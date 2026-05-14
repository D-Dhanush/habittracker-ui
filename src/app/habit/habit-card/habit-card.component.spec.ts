import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HabitCardComponent } from './habit-card.component';

describe('HabitCardComponent', () => {
  let component: HabitCardComponent;
  let fixture: ComponentFixture<HabitCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitCardComponent, HttpClientTestingModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HabitCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
