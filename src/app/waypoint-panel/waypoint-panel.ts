import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoutingService, Waypoint } from '../services/routing';
import { GeocodingSuggestions, GeocodingSuggestion } from '../geocoding-suggestions/geocoding-suggestions';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-waypoint-panel',
  imports: [CommonModule, FormsModule, GeocodingSuggestions],
  template: `
    <div class="waypoint-panel">
      <div class="panel-header">
        <h3>Route Planner</h3>
        <button class="clear-btn" (click)="clearAll()" *ngIf="waypoints.length > 0">
          Clear All
        </button>
      </div>
      
      <div class="waypoint-list">
        <div class="waypoint-item" *ngFor="let waypoint of waypoints; let i = index">
          <div class="waypoint-marker" [class.start]="i === 0" [class.end]="i === waypoints.length - 1">
            {{ i === 0 ? 'A' : i === waypoints.length - 1 ? 'B' : i }}
          </div>
          
          <div class="waypoint-input">
            <div class="input-wrapper">
              <input 
                type="text" 
                [(ngModel)]="waypoint.address" 
                [placeholder]="getPlaceholder(i)"
                (input)="onAddressInput(i, waypoint.address || '')"
                (keyup.enter)="selectFirstSuggestion(i)"
                (keydown)="onKeyDown($event, i)"
                (focus)="onInputFocus(i)"
                (blur)="onInputBlur(i)"
                class="address-input"
              />
              
              <app-geocoding-suggestions
                *ngIf="activeInput === i && suggestions[i] && suggestions[i].length > 0"
                [suggestions]="suggestions[i]"
                [selectedIndex]="selectedSuggestionIndex[i]"
                (suggestionSelected)="onSuggestionSelected(i, $event)">
              </app-geocoding-suggestions>
            </div>
            
            <div class="waypoint-actions">
              <button class="remove-btn" (click)="removeWaypoint(i)" title="Remove waypoint" *ngIf="waypoints.length > 2">
                ×
              </button>
            </div>
          </div>
        </div>
        
        <button class="add-waypoint-btn" (click)="addEmptyWaypoint()">
          + Add waypoint
        </button>
      </div>
      
      <div class="action-section">
        <button class="calculate-route-btn" (click)="calculateRoute()" [disabled]="!canCalculateRoute()">
          Get Directions
        </button>
      </div>
      
      <div class="route-summary" *ngIf="routeSummary">
        <div class="summary-item">
          <span class="label">Distance:</span>
          <span class="value">{{ formatDistance(routeSummary.distance) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Duration:</span>
          <span class="value">{{ formatDuration(routeSummary.duration) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .waypoint-panel {
      position: absolute;
      top: 20px;
      left: 20px;
      width: 350px;
      max-height: calc(100vh - 40px);
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
    }
    
    .panel-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }
    
    .clear-btn {
      background: none;
      border: none;
      color: #4285F4;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .clear-btn:hover {
      background-color: #f0f0f0;
    }
    
    .waypoint-list {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    
    .waypoint-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      position: relative;
    }
    
    .waypoint-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #4285F4;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .waypoint-marker.start {
      background: #34A853;
    }
    
    .waypoint-marker.end {
      background: #EA4335;
    }
    
    .waypoint-input {
      flex: 1;
      display: flex;
      align-items: center;
    }
    
    .input-wrapper {
      flex: 1;
      position: relative;
    }
    
    .address-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .address-input:focus {
      border-color: #4285F4;
    }
    
    .waypoint-actions {
      margin-left: 8px;
    }
    
    .remove-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 18px;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .remove-btn:hover {
      background: #e0e0e0;
      color: #333;
    }
    
    .add-waypoint-btn {
      width: 100%;
      padding: 10px;
      border: 1px dashed #4285F4;
      background: none;
      color: #4285F4;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 8px;
      transition: all 0.2s;
    }
    
    .add-waypoint-btn:hover {
      background: #f0f7ff;
      border-style: solid;
    }
    
    .action-section {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }
    
    .calculate-route-btn {
      width: 100%;
      padding: 12px;
      background: #4285F4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .calculate-route-btn:hover {
      background: #3367D6;
    }
    
    .calculate-route-btn:active {
      background: #2851A3;
    }
    
    .route-summary {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
      border-radius: 0 0 8px 8px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .summary-item:last-child {
      margin-bottom: 0;
    }
    
    .summary-item .label {
      color: #666;
    }
    
    .summary-item .value {
      font-weight: bold;
      color: #333;
    }
    
    @media (max-width: 768px) {
      .waypoint-panel {
        width: calc(100% - 40px);
        max-width: 350px;
      }
    }
  `
})
export class WaypointPanel implements OnInit, OnDestroy {
  waypoints: Waypoint[] = [];
  routeSummary: any = null;
  suggestions: GeocodingSuggestion[][] = [];
  selectedSuggestionIndex: number[] = [];
  activeInput: number | null = null;
  
  private searchSubjects: Subject<string>[] = [];
  private destroy$ = new Subject<void>();
  private blurTimeout: any;

  constructor(private routingService: RoutingService) {}

  ngOnInit(): void {
    // Subscribe to waypoints changes
    this.routingService.waypoints$.subscribe(waypoints => {
      // Received waypoints from service
      
      // Always sync with service waypoints to handle URL loading
      this.waypoints = waypoints.map(wp => ({ ...wp }));
      
      // Ensure we have at least 2 waypoints
      while (this.waypoints.length < 2) {
        this.waypoints.push({ address: '' });
      }
      
      // Initialize search subjects for new waypoints
      while (this.searchSubjects.length < this.waypoints.length) {
        const index = this.searchSubjects.length;
        const subject = new Subject<string>();
        this.searchSubjects.push(subject);
        
        // Setup debounced search
        subject.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap(query => this.searchAddress(query)),
          takeUntil(this.destroy$)
        ).subscribe(results => {
          this.suggestions[index] = results;
          this.selectedSuggestionIndex[index] = -1;
        });
      }
      
      // Initialize suggestions arrays
      while (this.suggestions.length < this.waypoints.length) {
        this.suggestions.push([]);
        this.selectedSuggestionIndex.push(-1);
      }
    });
    
    // Subscribe to route changes
    this.routingService.route$.subscribe(route => {
      if (route) {
        this.routeSummary = {
          distance: route.summary?.totalDistance,
          duration: route.summary?.totalTime
        };
      } else {
        this.routeSummary = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
  }

  getPlaceholder(index: number): string {
    if (index === 0) return 'Choose starting point';
    if (index === this.waypoints.length - 1) return 'Choose destination';
    return 'Add waypoint';
  }

  onAddressInput(index: number, address: string): void {
    // Update the local waypoint address immediately
    if (this.waypoints[index]) {
      this.waypoints[index].address = address;
    }
    
    if (address.trim()) {
      this.searchSubjects[index].next(address);
    } else {
      this.suggestions[index] = [];
      this.selectedSuggestionIndex[index] = -1;
    }
  }

  onInputFocus(index: number): void {
    this.activeInput = index;
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }
  }

  onInputBlur(index: number): void {
    // Delay blur to allow clicking on suggestions
    this.blurTimeout = setTimeout(() => {
      if (this.activeInput === index) {
        this.activeInput = null;
        // Clear suggestions if no selection was made
        this.suggestions[index] = [];
        this.selectedSuggestionIndex[index] = -1;
      }
    }, 200);
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const suggestions = this.suggestions[index] || [];
    if (suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex[index] = Math.min(
          this.selectedSuggestionIndex[index] + 1,
          suggestions.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex[index] = Math.max(
          this.selectedSuggestionIndex[index] - 1,
          -1
        );
        break;
      case 'Escape':
        this.suggestions[index] = [];
        this.selectedSuggestionIndex[index] = -1;
        break;
    }
  }

  selectFirstSuggestion(index: number): void {
    const suggestions = this.suggestions[index] || [];
    if (suggestions.length > 0) {
      const selectedIndex = this.selectedSuggestionIndex[index];
      const suggestion = selectedIndex >= 0 
        ? suggestions[selectedIndex] 
        : suggestions[0];
      this.onSuggestionSelected(index, suggestion);
    }
  }

  async onSuggestionSelected(index: number, suggestion: GeocodingSuggestion): Promise<void> {
    const waypoint: Waypoint = {
      lat: suggestion.lat,
      lng: suggestion.lng,
      name: suggestion.display_name,
      address: suggestion.display_name
    };
    
    // Selected suggestion for waypoint
    
    // Update local waypoint with full information
    this.waypoints[index] = { ...waypoint };
    
    // Clear suggestions
    this.suggestions[index] = [];
    this.selectedSuggestionIndex[index] = -1;
    this.activeInput = null;
    
    // Update routing service with the waypoint
    // Calling routingService.updateWaypoint()
    this.routingService.updateWaypoint(index, waypoint);
    
    // Force change detection to ensure UI updates
    this.waypoints = [...this.waypoints];
    
    // The map component will automatically:
    // 1. Center on the first waypoint
    // 2. Calculate route when 2+ waypoints are available
  }

  private async searchAddress(query: string): Promise<GeocodingSuggestion[]> {
    if (!query || query.trim().length < 2) return [];
    
    try {
      const url = `${environment.nominatimUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.map((result: any) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        place_id: result.place_id
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  removeWaypoint(index: number): void {
    if (this.waypoints.length > 2) {
      this.routingService.removeWaypoint(index);
    }
  }

  addEmptyWaypoint(): void {
    // Insert new waypoint before the last one
    const insertIndex = this.waypoints.length - 1;
    this.routingService.insertWaypoint(insertIndex, { address: '' });
  }

  clearAll(): void {
    this.routingService.clearWaypoints();
  }

  formatDistance(meters: number): string {
    if (!meters) return '0 m';
    
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  }
  
  canCalculateRoute(): boolean {
    const validWaypoints = this.waypoints.filter(wp => wp.lat && wp.lng);
    return validWaypoints.length >= 2;
  }
  
  calculateRoute(): void {
    // Force the routing service to recalculate the route
    const validWaypoints = this.waypoints.filter(wp => wp.lat && wp.lng);
    // Calculate route called with valid waypoints
    if (validWaypoints.length >= 2) {
      // Update the routing service with all current waypoints
      // Setting all waypoints in routing service
      this.routingService.setWaypoints([...this.waypoints]);
    }
  }
  
  async testOsrm(): Promise<void> {
    // Testing OSRM connection
    
    try {
      // Test with a simple route request
      const url = `${environment.osrmUrl}/route/v1/driving/13.388860,52.517037;13.397634,52.529407?overview=false`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      const data = await response.json();
      
      if (data.code === 'Ok') {
        alert('OSRM connection successful!');
      } else {
        alert('OSRM returned: ' + (data.message || data.code));
      }
    } catch (error) {
      console.error('OSRM test failed:', error);
      if (error instanceof TypeError && error.message.includes('CORS')) {
        alert('CORS error: OSRM backend needs to enable CORS headers.');
      } else {
        alert('Failed to connect to OSRM. Check console for details.');
      }
    }
  }
}