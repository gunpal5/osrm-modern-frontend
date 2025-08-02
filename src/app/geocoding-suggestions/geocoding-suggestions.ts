import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GeocodingSuggestion {
  lat: number;
  lng: number;
  display_name: string;
  place_id: string;
}

@Component({
  selector: 'app-geocoding-suggestions',
  imports: [CommonModule],
  template: `
    <div class="suggestions-container" *ngIf="suggestions.length > 0">
      <div 
        class="suggestion-item" 
        *ngFor="let suggestion of suggestions; let i = index"
        [class.selected]="selectedIndex === i"
        (click)="selectSuggestion(suggestion)"
        (mouseenter)="selectedIndex = i">
        <div class="suggestion-text">{{ suggestion.display_name }}</div>
      </div>
    </div>
  `,
  styles: `
    .suggestions-container {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1001;
    }
    
    .suggestion-item {
      padding: 10px 12px;
      cursor: pointer;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }
    
    .suggestion-item:last-child {
      border-bottom: none;
    }
    
    .suggestion-item:hover,
    .suggestion-item.selected {
      background-color: #f5f5f5;
    }
    
    .suggestion-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #333;
    }
  `
})
export class GeocodingSuggestions {
  @Input() suggestions: GeocodingSuggestion[] = [];
  @Input() selectedIndex: number = -1;
  @Output() suggestionSelected = new EventEmitter<GeocodingSuggestion>();

  selectSuggestion(suggestion: GeocodingSuggestion): void {
    this.suggestionSelected.emit(suggestion);
  }
}