import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HabitService } from './habit.service';

describe('HabitService', () => {
  let service: HabitService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(HabitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
