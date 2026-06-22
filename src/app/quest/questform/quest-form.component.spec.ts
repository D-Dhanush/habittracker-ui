import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestformComponent } from './quest-form.component';

describe('QuestformComponent', () => {
  let component: QuestformComponent;
  let fixture: ComponentFixture<QuestformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
