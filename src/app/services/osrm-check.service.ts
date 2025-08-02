import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OsrmCheckService {
  
  async checkOsrmAvailability(): Promise<boolean> {
    try {
      // Try a simple nearest query to check if OSRM is running
      const testCoord = '13.388860,52.517037'; // Berlin coordinates
      
      // Always use the direct URL from environment
      const url = `${environment.osrmUrl}/nearest/v1/driving/${testCoord}`;
      
      // Checking OSRM availability
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // OSRM check response received
        return data.code === 'Ok';
      }
      
      // OSRM check failed
      return false;
    } catch (error) {
      // OSRM availability check failed
      return false;
    }
  }
}