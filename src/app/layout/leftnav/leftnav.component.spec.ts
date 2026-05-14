import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftnavComponent } from './leftnav.component';

describe('LeftnavComponent', () => {
  let component: LeftnavComponent;
  let fixture: ComponentFixture<LeftnavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftnavComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeftnavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
