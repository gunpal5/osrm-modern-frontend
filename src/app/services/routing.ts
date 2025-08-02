import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as L from 'leaflet';

export interface Waypoint {
  lat?: number;
  lng?: number;
  name?: string;
  address?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
  mode: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  private waypoints = new BehaviorSubject<Waypoint[]>([]);
  public waypoints$ = this.waypoints.asObservable();
  
  private route = new BehaviorSubject<any>(null);
  public route$ = this.route.asObservable();
  
  private directions = new BehaviorSubject<RouteStep[]>([]);
  public directions$ = this.directions.asObservable();
  
  private mapCenter = new BehaviorSubject<{lat: number, lng: number, zoom: number} | null>(null);
  public mapCenter$ = this.mapCenter.asObservable();
  
  // Additional OSRM-compatible options
  private language: string = 'en';
  private alternative: number = 0;
  private service: string = 'default';

  constructor() {
    // Initialize with two empty waypoints
    this.waypoints.next([{ address: '' }, { address: '' }]);
    // Parse waypoints and center from URL on initialization
    this.parseUrlParams();
  }

  private async parseUrlParams(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for OSRM-style 'loc' parameters first
    const locParams = urlParams.getAll('loc');
    if (locParams.length > 0) {
      try {
        const parsedWaypoints = await Promise.all(
          locParams.map(async (loc, index) => {
            const [lat, lng] = loc.split(',').map(coord => parseFloat(coord));
            if (isNaN(lat) || isNaN(lng)) return null;
            
            // Try to reverse geocode to get address
            // This will return coordinates as fallback if geocoding fails
            const address = await this.reverseGeocode(lat, lng);
            
            return {
              lat,
              lng,
              name: address,
              address: address
            };
          })
        );
        
        const validWaypoints = parsedWaypoints.filter(wp => wp !== null) as Waypoint[];
        
        if (validWaypoints.length > 0) {
          // Ensure we have at least 2 waypoints
          while (validWaypoints.length < 2) {
            validWaypoints.push({ address: '' });
          }
          this.waypoints.next(validWaypoints);
        }
      } catch (error) {
        console.error('Error parsing loc waypoints from URL:', error);
      }
    } else {
      // Fall back to old format for backward compatibility
      const waypointsParam = urlParams.get('waypoints');
      if (waypointsParam) {
        try {
          // Expected format: lat1,lng1;lat2,lng2;lat3,lng3...
          const waypointStrings = waypointsParam.split(';');
          const parsedWaypoints = await Promise.all(
            waypointStrings.map(async (wp, index) => {
              const [lat, lng] = wp.split(',').map(coord => parseFloat(coord));
              if (isNaN(lat) || isNaN(lng)) return null;
              
              // Try to reverse geocode to get address
              // This will return coordinates as fallback if geocoding fails
              const address = await this.reverseGeocode(lat, lng);
              
              return {
                lat,
                lng,
                name: address,
                address: address
              };
            })
          );
          
          const validWaypoints = parsedWaypoints.filter(wp => wp !== null) as Waypoint[];
          
          if (validWaypoints.length > 0) {
            // Ensure we have at least 2 waypoints
            while (validWaypoints.length < 2) {
              validWaypoints.push({ address: '' });
            }
            this.waypoints.next(validWaypoints);
          }
        } catch (error) {
          console.error('Error parsing waypoints from URL:', error);
        }
      }
    }
    
    // Parse center (both formats supported)
    const centerParam = urlParams.get('center');
    const zoomParam = urlParams.get('z') || urlParams.get('zoom'); // Support both 'z' and 'zoom'
    if (centerParam) {
      try {
        const [lat, lng] = centerParam.split(',').map(coord => parseFloat(coord));
        const zoom = zoomParam ? parseInt(zoomParam, 10) : 13;
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
          this.mapCenter.next({ lat, lng, zoom });
        }
      } catch (error) {
        console.error('Error parsing center from URL:', error);
      }
    }
    
    // Parse other OSRM parameters
    const hlParam = urlParams.get('hl');
    if (hlParam) this.language = hlParam;
    
    const altParam = urlParams.get('alt');
    if (altParam) this.alternative = parseInt(altParam, 10) || 0;
    
    const srvParam = urlParams.get('srv');
    if (srvParam) this.service = srvParam;
  }

  getWaypoints(): Waypoint[] {
    return this.waypoints.value;
  }

  setWaypoints(waypoints: Waypoint[]): void {
    this.waypoints.next(waypoints);
    this.updateUrlParams();
  }

  addWaypoint(latLng: L.LatLng | Waypoint): void {
    const newWaypoint: Waypoint = 'lat' in latLng 
      ? latLng 
      : { lat: latLng.lat, lng: latLng.lng };
    
    const currentWaypoints = [...this.waypoints.value, newWaypoint];
    this.waypoints.next(currentWaypoints);
    this.updateUrlParams();
  }

  updateWaypoint(index: number, latLng: L.LatLng | Waypoint): void {
    const waypoints = [...this.waypoints.value];
    if (index >= 0 && index < waypoints.length) {
      waypoints[index] = 'lat' in latLng 
        ? latLng 
        : { lat: latLng.lat, lng: latLng.lng };
      // Updated waypoint
      this.waypoints.next(waypoints);
      this.updateUrlParams();
    }
  }

  removeWaypoint(index: number): void {
    const waypoints = [...this.waypoints.value];
    if (index >= 0 && index < waypoints.length) {
      waypoints.splice(index, 1);
      this.waypoints.next(waypoints);
      this.updateUrlParams();
    }
  }

  insertWaypoint(index: number, waypoint: Waypoint): void {
    const waypoints = [...this.waypoints.value];
    waypoints.splice(index, 0, waypoint);
    this.waypoints.next(waypoints);
    this.updateUrlParams();
  }

  clearWaypoints(): void {
    this.waypoints.next([]);
    this.route.next(null);
    this.directions.next([]);
    this.updateUrlParams();
  }

  updateRoute(route: any): void {
    this.route.next(route);
    if (route && route.instructions) {
      this.parseDirections(route);
    }
  }

  private parseDirections(route: any): void {
    const steps: RouteStep[] = route.instructions.map((instruction: any) => ({
      instruction: instruction.text || '',
      distance: instruction.distance || 0,
      duration: instruction.time || 0,
      name: instruction.road || '',
      mode: instruction.type || ''
    }));
    this.directions.next(steps);
  }

  private updateUrlParams(): void {
    const url = new URL(window.location.href);
    
    // Clear old parameters
    url.searchParams.delete('waypoints'); // Remove old format
    url.searchParams.delete('zoom'); // Remove old format
    
    // Remove all existing 'loc' parameters
    while (url.searchParams.has('loc')) {
      url.searchParams.delete('loc');
    }
    
    // Add waypoints in OSRM format (multiple 'loc' parameters)
    const waypoints = this.waypoints.value;
    const validWaypoints = waypoints.filter(wp => wp.lat && wp.lng);
    
    validWaypoints.forEach(wp => {
      const precision = 6;
      const coordStr = `${wp.lat!.toFixed(precision)},${wp.lng!.toFixed(precision)}`;
      url.searchParams.append('loc', coordStr);
    });
    
    // Update center if available
    const center = this.mapCenter.value;
    if (center) {
      const precision = 6;
      url.searchParams.set('center', `${center.lat.toFixed(precision)},${center.lng.toFixed(precision)}`);
      url.searchParams.set('z', center.zoom.toString());
    }
    
    // Add other OSRM parameters if they differ from defaults
    if (this.language && this.language !== 'en') {
      url.searchParams.set('hl', this.language);
    } else {
      url.searchParams.delete('hl');
    }
    
    if (this.alternative && this.alternative !== 0) {
      url.searchParams.set('alt', this.alternative.toString());
    } else {
      url.searchParams.delete('alt');
    }
    
    if (this.service && this.service !== 'default') {
      url.searchParams.set('srv', this.service);
    } else {
      url.searchParams.delete('srv');
    }
    
    window.history.replaceState({}, '', url);
  }

  geocodeAddress(address: string): Promise<Waypoint[]> {
    // Use proxied Nominatim URL to avoid CORS issues
    const url = `/nominatim/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
    
    return fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        return data.map((result: any) => ({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          name: result.display_name,
          address: result.display_name
        }));
      })
      .catch(error => {
        console.warn('Geocoding failed:', error);
        // Return empty array on error
        return [];
      });
  }
  
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Add small delay to respect Nominatim rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use proxied URL to avoid CORS issues
      const url = `/nominatim/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      return '';
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinates as fallback:', error);
      // Return formatted coordinates as fallback
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
  
  getMapCenter(): {lat: number, lng: number, zoom: number} | null {
    return this.mapCenter.value;
  }
  
  setMapCenter(lat: number, lng: number, zoom: number): void {
    this.mapCenter.next({ lat, lng, zoom });
    this.updateUrlParams();
  }
  
  getLanguage(): string {
    return this.language;
  }
  
  setLanguage(language: string): void {
    this.language = language;
    this.updateUrlParams();
  }
  
  getAlternative(): number {
    return this.alternative;
  }
  
  setAlternative(alternative: number): void {
    this.alternative = alternative;
    this.updateUrlParams();
  }
  
  getService(): string {
    return this.service;
  }
  
  setService(service: string): void {
    this.service = service;
    this.updateUrlParams();
  }
}