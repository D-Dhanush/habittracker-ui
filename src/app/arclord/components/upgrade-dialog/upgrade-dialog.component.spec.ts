import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeDialogComponent } from './upgrade-dialog.component';

describe('UpgradeDialogComponent', () => {
  let component: UpgradeDialogComponent;
  let fixture: ComponentFixture<UpgradeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpgradeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
