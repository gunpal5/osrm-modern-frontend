# OSRM Modern Frontend

A modern, responsive web interface for OSRM (Open Source Routing Machine) built with Angular 18. This application provides an intuitive map-based interface for route planning and navigation using OpenStreetMap data.

## Features

- 🗺️ Interactive map interface powered by Leaflet
- 🚗 Multi-waypoint routing with drag-and-drop support
- 📍 Geocoding integration with Nominatim
- 🔄 Real-time route recalculation
- 📱 Responsive design for mobile and desktop
- 🎨 Multiple map layer options
- 📋 Turn-by-turn navigation instructions
- 🐛 Debug panel for development

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OSRM backend server running (Docker recommended)
- IIS with URL Rewrite module (for production deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gunpal5/osrm-modern-frontend.git
cd osrm-modern-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure the environment:
   - Development: Edit `src/environments/environment.ts`
   - Production: Edit `src/environments/environment.prod.ts`
   
   Update the OSRM backend URL:
   ```typescript
   export const environment = {
     production: false,
     osrmUrl: 'https://localhost:5000',  // Your OSRM backend URL
     nominatimUrl: 'https://nominatim.openstreetmap.org'
   };
   ```

## Development

Run the development server:
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

## Building for Production

Build the project:
```bash
npm run build
# or
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment on IIS

### Prerequisites
- IIS with URL Rewrite module installed
- Application Request Routing (ARR) for proxy functionality

### Setup Steps

1. Build the application for production
2. Copy the contents of `dist/browser/` to your IIS web directory
3. Ensure the `web.config` file is present in the root directory
4. Configure IIS application pool to use "No Managed Code"
5. Set up proper permissions for the IIS_IUSRS group

### CORS Configuration

The included `web.config` handles:
- CORS headers for API requests
- Proxying requests to the OSRM backend
- Angular route handling for client-side routing
- Static file MIME types

If your OSRM backend is not on `localhost:5000`, update the proxy rule in `web.config`:
```xml
<action type="Rewrite" url="http://your-osrm-server:port/{R:1}" />
```

## OSRM Backend Setup with Docker

Quick setup for OSRM backend:

```bash
# Download OSM data (example: Berlin)
wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

# Process the data
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/berlin-latest.osm.pbf
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/berlin-latest.osrm
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/berlin-latest.osrm

# Run the server
docker run -t -i -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/berlin-latest.osrm
```

## Project Structure

```
src/
├── app/
│   ├── debug-panel/          # Debug information display
│   ├── directions-panel/     # Turn-by-turn directions
│   ├── geocoding-suggestions/# Address search suggestions
│   ├── map/                  # Main map component
│   ├── services/             # Angular services
│   ├── tile-layer-switcher/  # Map layer selection
│   └── waypoint-panel/       # Waypoint management
├── assets/                   # Images and icons
├── environments/             # Environment configurations
└── styles.scss              # Global styles
```

## Key Components

- **MapComponent**: Core map functionality with Leaflet integration
- **WaypointPanelComponent**: Manages route waypoints
- **DirectionsPanelComponent**: Displays routing instructions
- **GeocodingSuggestionsComponent**: Provides location search
- **RoutingService**: Handles OSRM API communication
- **OsrmCheckService**: Validates OSRM backend connectivity

## Running Tests

### Unit Tests
Run unit tests with Karma:
```bash
npm test
# or
ng test
```

### End-to-End Tests
For e2e testing:
```bash
npm run e2e
# or
ng e2e
```

## Troubleshooting

### CORS Errors
- Ensure IIS URL Rewrite module is installed
- Verify the OSRM backend URL in environment files
- Check that the web.config proxy rules match your setup
- For development, ensure OSRM backend allows CORS from localhost:4200

### Routing Not Working
- Verify OSRM backend is running and accessible
- Check browser console for API errors
- Ensure the OSRM data covers your routing area
- Test OSRM endpoint directly: `http://localhost:5000/route/v1/driving/13.388860,52.517037;13.397634,52.529407`

### IIS Deployment Issues
- Install IIS URL Rewrite module
- Enable "Static Content" feature in IIS
- Check application pool is set to "No Managed Code"
- Verify file permissions for IIS_IUSRS
- Check Event Viewer for detailed error messages

## API Endpoints

The application uses the following external APIs:

- **OSRM API**: For routing calculations
  - Route: `/route/v1/{profile}/{coordinates}`
  - Table: `/table/v1/{profile}/{coordinates}`
  - Match: `/match/v1/{profile}/{coordinates}`

- **Nominatim API**: For geocoding
  - Search: `/search?q={query}&format=json`
  - Reverse: `/reverse?lat={lat}&lon={lon}&format=json`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [OSRM Project](http://project-osrm.org/) for the routing engine
- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [Leaflet](https://leafletjs.com/) for map visualization
- [Angular](https://angular.io/) framework
- [osrm-text-instructions](https://github.com/Project-OSRM/osrm-text-instructions) for turn-by-turn directions