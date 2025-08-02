import { Component, ViewChild, OnInit } from '@angular/core';
import { Map } from './map/map';
import { WaypointPanel } from './waypoint-panel/waypoint-panel';
import { DirectionsPanel } from './directions-panel/directions-panel';
import { CommonModule } from '@angular/common';
import { TileLayerSwitcher, TileLayer } from './tile-layer-switcher/tile-layer-switcher';

@Component({
  selector: 'app-root',
  imports: [Map, WaypointPanel, DirectionsPanel, CommonModule, TileLayerSwitcher],
  template: `
    <div class="app-container">
      <app-map 
        (routeChanged)="onRouteChanged($event)"
        (waypointsChanged)="onWaypointsChanged($event)">
      </app-map>
      
      <app-waypoint-panel></app-waypoint-panel>
      <app-directions-panel 
        (stepSelected)="onStepSelected($event)"
        (stepDeselected)="onStepDeselected()">
      </app-directions-panel>
      
      <app-tile-layer-switcher (layerChanged)="onLayerChanged($event)"></app-tile-layer-switcher>
      
      <div class="map-controls">
        <button class="control-btn" (click)="zoomIn()" title="Zoom in">
          +
        </button>
        <button class="control-btn" (click)="zoomOut()" title="Zoom out">
          −
        </button>
      </div>
    </div>
  `,
  styles: `
    .app-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    
    .map-controls {
      position: absolute;
      bottom: 80px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    }
    
    .control-btn {
      width: 40px;
      height: 40px;
      background: white;
      border: 2px solid rgba(0,0,0,0.2);
      border-radius: 4px;
      cursor: pointer;
      font-size: 20px;
      font-weight: bold;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    
    .control-btn:hover {
      background: #f4f4f4;
    }
    
    .control-btn:active {
      background: #e8e8e8;
    }
  `
})
export class App implements OnInit {
  @ViewChild(Map) mapComponent!: Map;

  ngOnInit(): void {
    // OSRM availability will be checked when actual routing is attempted
  }

  onRouteChanged(route: any): void {
    // Route changed
  }

  onWaypointsChanged(waypoints: any[]): void {
    // Waypoints changed
  }

  zoomIn(): void {
    this.mapComponent?.zoomIn();
  }

  zoomOut(): void {
    this.mapComponent?.zoomOut();
  }

  onLayerChanged(layer: TileLayer): void {
    this.mapComponent?.changeTileLayer(layer);
  }

  onStepSelected(event: {index: number, step: any}): void {
    this.mapComponent?.highlightRouteSegment(event.index, event.step);
  }

  onStepDeselected(): void {
    this.mapComponent?.clearRouteHighlight();
  }
}
