import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TileLayer {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string;
}

@Component({
  selector: 'app-tile-layer-switcher',
  imports: [CommonModule],
  template: `
    <div class="tile-layer-switcher" [class.expanded]="isExpanded">
      <button class="layer-toggle" (click)="toggleExpanded()" title="Change map style">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </button>
      
      <div class="layer-options" *ngIf="isExpanded">
        <h3>Map Style</h3>
        <div class="layer-grid">
          <div 
            *ngFor="let layer of layers" 
            class="layer-option" 
            [class.active]="layer.name === selectedLayer"
            (click)="selectLayer(layer)">
            <div class="layer-preview" [style.background-image]="getPreviewUrl(layer)"></div>
            <span class="layer-name">{{ layer.name }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .tile-layer-switcher {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .layer-toggle {
      width: 44px;
      height: 44px;
      background: white;
      border: none;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .layer-toggle:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .layer-options {
      position: absolute;
      bottom: 54px;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      padding: 16px;
      min-width: 280px;
      max-width: 400px;
    }
    
    .layer-options h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .layer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .layer-option {
      cursor: pointer;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: all 0.2s;
    }
    
    .layer-option:hover {
      border-color: #4285F4;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .layer-option.active {
      border-color: #4285F4;
      box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.1);
    }
    
    .layer-preview {
      width: 100%;
      height: 80px;
      background-size: cover;
      background-position: center;
      background-color: #f0f0f0;
    }
    
    .layer-name {
      display: block;
      padding: 8px;
      text-align: center;
      font-size: 12px;
      color: #333;
      background: white;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .tile-layer-switcher {
        bottom: 80px;
        right: 10px;
      }
      
      .layer-options {
        right: -10px;
        left: auto;
        max-width: calc(100vw - 20px);
      }
    }
  `
})
export class TileLayerSwitcher implements OnInit {
  @Output() layerChanged = new EventEmitter<TileLayer>();
  
  isExpanded = false;
  selectedLayer = 'OpenStreetMap';
  
  layers: TileLayer[] = [
    {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    },
    {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      maxZoom: 19
    },
    {
      name: 'Terrain',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap',
      maxZoom: 17
    },
    {
      name: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO',
      maxZoom: 19
    },
    {
      name: 'Light',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO',
      maxZoom: 19
    },
    {
      name: 'Streets',
      url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
      attribution: '© Mapbox © OpenStreetMap',
      maxZoom: 20
    }
  ];
  
  ngOnInit(): void {
    // Emit the default layer on init
    const defaultLayer = this.layers.find(l => l.name === this.selectedLayer);
    if (defaultLayer) {
      this.layerChanged.emit(defaultLayer);
    }
  }
  
  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }
  
  selectLayer(layer: TileLayer): void {
    this.selectedLayer = layer.name;
    this.layerChanged.emit(layer);
    this.isExpanded = false;
  }
  
  getPreviewUrl(layer: TileLayer): string {
    // Generate a preview URL for each layer
    // These are static preview images at zoom level 10
    const previewUrls: { [key: string]: string } = {
      'OpenStreetMap': 'url(https://a.tile.openstreetmap.org/10/550/335.png)',
      'Satellite': 'url(https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/335/550)',
      'Terrain': 'url(https://a.tile.opentopomap.org/10/550/335.png)',
      'Dark': 'url(https://a.basemaps.cartocdn.com/dark_all/10/550/335.png)',
      'Light': 'url(https://a.basemaps.cartocdn.com/light_all/10/550/335.png)',
      'Streets': 'url(https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/10/550/335?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw)'
    };
    
    return previewUrls[layer.name] || '';
  }
}