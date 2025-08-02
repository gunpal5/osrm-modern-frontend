import { Component, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { RoutingService } from '../services/routing';
import { environment } from '../../environments/environment';
import { TileLayer } from '../tile-layer-switcher/tile-layer-switcher';

@Component({
  selector: 'app-map',
  imports: [],
  template: `
    <div id="map" class="map-container"></div>
  `,
  styles: `
    .map-container {
      height: 100vh;
      width: 100%;
      position: relative;
    }
  `
})
export class Map implements OnInit, AfterViewInit {
  private map!: L.Map;
  private routingControl!: L.Routing.Control;
  private currentTileLayer!: L.TileLayer;
  private highlightLayer?: L.Polyline;
  private currentRoute: any;
  @Output() routeChanged = new EventEmitter<any>();
  @Output() waypointsChanged = new EventEmitter<any[]>();
  
  // Routing profile - can be 'driving', 'walking', 'cycling' depending on your OSRM data
  private routingProfile = 'driving';
  private mapMoveTimeout: any;
  private isUpdatingWaypoints = false;

  constructor(private routingService: RoutingService) {}

  ngOnInit(): void {
    // Make map available globally for debugging
    (window as any).mapComponent = this;
    // Fix marker icons with absolute paths - using original OSRM dimensions
    const iconRetinaUrl = '/assets/marker-icon-2x.png';
    const iconUrl = '/assets/marker-icon.png';
    const shadowUrl = '/assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [20, 56], // Original OSRM dimensions
      iconAnchor: [10, 28],
      popupAnchor: [1, -34],
      tooltipAnchor: [10, -28],
      shadowSize: [50, 50]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.setupRouting();
    
    // Subscribe to waypoint changes
    this.routingService.waypoints$.subscribe(waypoints => {
      // Always update waypoints, even if empty
      this.updateWaypoints(waypoints);
    });
    
    // Listen for map movement and update URL (debounced)
    this.map.on('moveend', () => {
      // Clear any existing timeout
      if (this.mapMoveTimeout) {
        clearTimeout(this.mapMoveTimeout);
      }
      
      // Set a new timeout to update URL after 500ms of no movement
      this.mapMoveTimeout = setTimeout(() => {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        this.routingService.setMapCenter(center.lat, center.lng, zoom);
      }, 500);
    });
  }

  private initializeMap(): void {
    // Get initial center from URL or use default
    const savedCenter = this.routingService.getMapCenter();
    // Default to a world view instead of Berlin
    const defaultCenter: [number, number] = [20, 0]; // World center
    const defaultZoom = 2; // Zoom out to see more
    
    this.map = L.map('map', {
      center: savedCenter ? [savedCenter.lat, savedCenter.lng] : defaultCenter,
      zoom: savedCenter ? savedCenter.zoom : defaultZoom,
      zoomControl: true
    });

    // Add default tile layer
    this.currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });
    this.currentTileLayer.addTo(this.map);

    // Add click handler for adding waypoints
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const waypoints = this.routingService.getWaypoints();
      if (waypoints.length < 2) {
        this.routingService.addWaypoint(e.latlng);
      } else {
        // Replace the last waypoint
        this.routingService.updateWaypoint(waypoints.length - 1, e.latlng);
      }
    });
  }

  private setupRouting(): void {
    const plan = L.Routing.plan([], {
      createMarker: (i: number, wp: any, n: number) => {
        // Creating marker
        const marker = L.marker(wp.latLng, {
          draggable: true,
          icon: this.createIcon(i, n)
        });
        
        marker.on('click', () => {
          this.routingService.removeWaypoint(i);
        });
        
        return marker;
      },
      addWaypoints: false, // Don't allow adding waypoints by dragging route
      dragStyles: []  // Disable drag styling
    });

    // Create custom OSRM router with proper URL construction
    const osrmRouter = L.Routing.osrmv1({
      serviceUrl: environment.osrmUrl + '/route/v1',
      profile: this.routingProfile,
      useHints: false,
      suppressDemoServerWarning: true
    });
    
    // OSRM Router created
    
    this.routingControl = L.Routing.control({
      plan: plan,
      router: osrmRouter,
      routeWhileDragging: false,
      autoRoute: true, // Automatically calculate route when waypoints change
      lineOptions: {
        styles: [
          {color: '#4285F4', opacity: 0.8, weight: 6}
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 100
      },
      showAlternatives: false, // Disable alternatives for better performance with many waypoints
      show: false, // Hide default UI
      addWaypoints: false, // Disable adding waypoints by clicking
      fitSelectedRoutes: false // We'll handle fitting bounds manually
    }).addTo(this.map);
    
    // Hide any Leaflet routing UI elements that might still appear
    setTimeout(() => {
      const routingContainer = document.querySelector('.leaflet-routing-container');
      if (routingContainer) {
        (routingContainer as HTMLElement).style.display = 'none';
      }
    }, 100);

    // Listen to routing events
    this.routingControl.on('routesfound', (e: any) => {
      // Routes found
      this.currentRoute = e.routes[0];
      this.routeChanged.emit(e.routes[0]);
      this.routingService.updateRoute(e.routes[0]);
    });

    this.routingControl.on('waypointschanged', (e: any) => {
      // Waypoints changed event
      // Only emit changes, don't update the service to avoid circular updates
      const waypoints = e.waypoints.map((wp: any) => ({
        lat: wp.latLng?.lat,
        lng: wp.latLng?.lng,
        name: wp.name || ''
      }));
      this.waypointsChanged.emit(waypoints);
    });
    
    // Handle routing errors
    this.routingControl.on('routingerror', (e: any) => {
      console.error('Map: Routing error:', e.error);
      if (e.error && e.error.message) {
        if (e.error.message.includes('CORS')) {
          // CORS error
          alert('Unable to connect to routing server. Please check your connection.');
        } else if (e.error.message.includes('Failed to fetch')) {
          // Failed to connect to OSRM backend
          alert('Failed to connect to OSRM backend. Please check your connection.');
        } else {
          // Other routing error
        }
      }
    });
    
    // Log successful route calculations
    this.routingControl.on('routeselected', (e: any) => {
      // Route selected
    });
    
    // Log when routing starts
    this.routingControl.on('routingstart', (e: any) => {
      // Routing started
    });
  }

  private createIcon(index: number, total: number): L.Icon {
    let iconUrl = '/assets/marker-icon.png';
    let shadowUrl = '/assets/marker-shadow.png';
    let className = 'waypoint-marker';
    
    if (index === 0) {
      iconUrl = '/assets/marker-start.png';
      className = 'start-marker';
    } else if (index === total - 1) {
      iconUrl = '/assets/marker-end.png';
      className = 'end-marker';
    } else {
      iconUrl = '/assets/marker-via.png';
      className = 'via-marker';
    }

    // Creating icon for waypoint

    // Use original OSRM dimensions
    return L.icon({
      iconUrl,
      shadowUrl,
      iconSize: [20, 56],
      iconAnchor: [10, 28],
      popupAnchor: [1, -34],
      shadowSize: [50, 50],
      className
    });
  }

  private updateWaypoints(waypoints: any[]): void {
    // Prevent recursive updates
    if (this.isUpdatingWaypoints) {
      // Skipping waypoint update - already updating
      return;
    }
    
    this.isUpdatingWaypoints = true;
    
    const validWaypoints = waypoints.filter(wp => wp.lat && wp.lng);
    const latLngs = validWaypoints.map(wp => L.latLng(wp.lat, wp.lng));
    
    // Updating waypoints
    
    // Always update routing control waypoints
    // Setting waypoints on routing control
    
    this.routingControl.setWaypoints(latLngs);
    
    if (latLngs.length === 0) {
      // No valid waypoints
    } else if (latLngs.length === 1) {
      // Only center on first waypoint if map is at default world view
      const currentCenter = this.map.getCenter();
      const currentZoom = this.map.getZoom();
      if (currentZoom <= 3) {
        // Centering on single waypoint
        this.map.setView(latLngs[0], 15);
      }
    } else if (latLngs.length >= 2) {
      // Two or more waypoints - fit bounds to show all and calculate route
      // Have multiple waypoints - should calculate route
      
      // Only fit bounds if this is the first route or if waypoints are outside current view
      const bounds = L.latLngBounds(latLngs);
      const currentBounds = this.map.getBounds();
      
      // Check if any waypoint is outside current view
      const shouldFitBounds = latLngs.some(latlng => !currentBounds.contains(latlng));
      
      if (shouldFitBounds || this.map.getZoom() <= 3) {
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
      
      // Force route calculation
      // Calling route() on routing control
      try {
        this.routingControl.route();
      } catch (error) {
        // Error calling route
      }
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      this.isUpdatingWaypoints = false;
    }, 300);
  }

  public zoomIn(): void {
    this.map.zoomIn();
  }

  public zoomOut(): void {
    this.map.zoomOut();
  }

  public panTo(latLng: L.LatLng): void {
    this.map.panTo(latLng);
  }
  
  public calculateRoute(): void {
    if (this.routingControl) {
      this.routingControl.route();
    }
  }

  public changeTileLayer(layer: TileLayer): void {
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }
    
    this.currentTileLayer = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom || 19,
      subdomains: layer.subdomains || 'abc'
    });
    
    this.currentTileLayer.addTo(this.map);
  }

  public highlightRouteSegment(index: number, step: any): void {
    // Clear any existing highlight
    this.clearRouteHighlight();
    
    if (!this.currentRoute || !this.currentRoute.coordinates) {
      // No route coordinates available for highlighting
      return;
    }
    
    // Get the current and next instruction to find the segment
    const instructions = this.currentRoute.instructions;
    if (!instructions || index >= instructions.length) {
      // Invalid instruction index
      return;
    }
    
    const currentInstruction = instructions[index];
    const nextInstruction = instructions[index + 1];
    
    // Get coordinate indices
    const startIndex = currentInstruction.index || 0;
    const endIndex = nextInstruction ? nextInstruction.index : this.currentRoute.coordinates.length;
    
    // Highlighting segment
    
    // Extract the segment coordinates
    const segmentCoords = this.currentRoute.coordinates.slice(startIndex, endIndex);
    
    if (segmentCoords.length < 2) {
      // Not enough coordinates for segment
      return;
    }
    
    // Create a highlighted polyline
    this.highlightLayer = L.polyline(segmentCoords, {
      color: '#FF6B6B',
      weight: 8,
      opacity: 0.8,
      className: 'route-highlight'
    }).addTo(this.map);
    
    // Optionally pan to the segment
    const bounds = this.highlightLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  public clearRouteHighlight(): void {
    if (this.highlightLayer) {
      this.map.removeLayer(this.highlightLayer);
      this.highlightLayer = undefined;
    }
  }
}