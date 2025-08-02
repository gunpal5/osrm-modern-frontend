import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutingService } from '../services/routing';

@Component({
  selector: 'app-debug-panel',
  imports: [CommonModule],
  template: `
    <div class="debug-panel">
      <h4>Debug Panel</h4>
      <div class="debug-content">
        <h5>Current Waypoints:</h5>
        <pre>{{ waypoints | json }}</pre>
        
        <h5>Quick Actions:</h5>
        <button (click)="addBerlinWaypoints()">Add Berlin Waypoints</button>
        <button (click)="clearAll()">Clear All</button>
        
        <h5>Route Status:</h5>
        <pre>{{ routeStatus | json }}</pre>
      </div>
    </div>
  `,
  styles: `
    .debug-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10px;
      font-size: 12px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    }
    
    h4, h5 {
      margin: 0 0 10px 0;
    }
    
    pre {
      background: #f5f5f5;
      padding: 5px;
      margin: 5px 0;
      font-size: 11px;
      overflow-x: auto;
    }
    
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 5px 10px;
      margin: 2px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    
    button:hover {
      background: #0056b3;
    }
  `
})
export class DebugPanel implements OnInit {
  waypoints: any[] = [];
  routeStatus: any = { hasRoute: false, error: null };

  constructor(private routingService: RoutingService) {}

  ngOnInit() {
    this.routingService.waypoints$.subscribe(waypoints => {
      this.waypoints = waypoints;
      // Waypoints updated
    });

    this.routingService.route$.subscribe(route => {
      this.routeStatus = {
        hasRoute: !!route,
        distance: route?.summary?.totalDistance,
        duration: route?.summary?.totalTime,
        waypoints: route?.waypoints?.length
      };
      // Route updated
    });
    
    // Test immediately after init
    setTimeout(() => {
      // Current waypoints after init
    }, 100);
  }

  addBerlinWaypoints() {
    // Adding Berlin waypoints
    this.routingService.setWaypoints([
      { lat: 52.520008, lng: 13.404954, name: 'Brandenburg Gate', address: 'Brandenburg Gate, Berlin' },
      { lat: 52.516275, lng: 13.377704, name: 'Berlin Zoo', address: 'Berlin Zoological Garden' }
    ]);
  }

  clearAll() {
    // Clearing all waypoints
    this.routingService.clearWaypoints();
  }
}