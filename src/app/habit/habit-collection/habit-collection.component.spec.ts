import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitCollectionComponent } from './habit-collection.component';

describe('HabitCollectionComponent', () => {
  let component: HabitCollectionComponent;
  let fixture: ComponentFixture<HabitCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitCollectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HabitCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
