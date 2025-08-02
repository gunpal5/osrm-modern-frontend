import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectionsPanel } from './directions-panel';

describe('DirectionsPanel', () => {
  let component: DirectionsPanel;
  let fixture: ComponentFixture<DirectionsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectionsPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectionsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
