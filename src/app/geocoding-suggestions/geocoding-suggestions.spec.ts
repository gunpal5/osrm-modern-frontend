import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeocodingSuggestions } from './geocoding-suggestions';

describe('GeocodingSuggestions', () => {
  let component: GeocodingSuggestions;
  let fixture: ComponentFixture<GeocodingSuggestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeocodingSuggestions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeocodingSuggestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
