import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointPanel } from './waypoint-panel';

describe('WaypointPanel', () => {
  let component: WaypointPanel;
  let fixture: ComponentFixture<WaypointPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaypointPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaypointPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
