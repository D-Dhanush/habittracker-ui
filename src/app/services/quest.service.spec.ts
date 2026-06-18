import { TestBed } from '@angular/core/testing';

import { QuestserviceService } from './questservice.service';

describe('QuestserviceService', () => {
  let service: QuestserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
