# Debug Commands for OSRM Angular Frontend

Open the browser console (F12) and use these commands to debug:

## Test waypoint flow:
```javascript
// Get the routing service
const rs = window.mapComponent.routingService;

// Check current waypoints
console.log('Current waypoints:', rs.getWaypoints());

// Set test waypoints directly
rs.setWaypoints([
  { lat: 52.520008, lng: 13.404954, name: 'Brandenburg Gate', address: 'Brandenburg Gate, Berlin' },
  { lat: 52.516275, lng: 13.377704, name: 'Berlin Zoo', address: 'Berlin Zoological Garden' }
]);

// Force route calculation
window.mapComponent.calculateRoute();
```

## Check routing control:
```javascript
// Get the routing control
const rc = window.mapComponent.routingControl;

// Check waypoints on routing control
console.log('Routing control waypoints:', rc.getWaypoints());

// Force route calculation
rc.route();
```

## Test OSRM directly:
```javascript
// Test OSRM connection
fetch('/route/v1/driving/13.388860,52.517037;13.397634,52.529407?overview=false')
  .then(r => r.json())
  .then(data => console.log('OSRM Response:', data))
  .catch(err => console.error('OSRM Error:', err));
```

## Monitor waypoint updates:
```javascript
// Subscribe to waypoint changes
window.mapComponent.routingService.waypoints$.subscribe(waypoints => {
  console.log('Waypoints changed:', waypoints);
});
```