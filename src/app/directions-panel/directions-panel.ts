import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutingService } from '../services/routing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import osrmTextInstructions from 'osrm-text-instructions';

@Component({
  selector: 'app-directions-panel',
  imports: [CommonModule],
  template: `
    <div class="directions-panel" [class.open]="isOpen">
      <div class="panel-header">
        <h3>Directions</h3>
        <button class="toggle-btn" (click)="togglePanel()">
          {{ isOpen ? '×' : '☰' }}
        </button>
      </div>
      
      <div class="directions-content" *ngIf="isOpen">
        <div class="route-info" *ngIf="route">
          <div class="info-item">
            <span class="label">Distance:</span>
            <span class="value">{{ formatDistance(route.summary?.totalDistance) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Duration:</span>
            <span class="value">{{ formatDuration(route.summary?.totalTime) }}</span>
          </div>
        </div>
        
        <div class="steps-container" *ngIf="directions.length > 0">
          <div class="step" *ngFor="let step of directions; let i = index" 
               [class.selected]="selectedStep === i"
               (click)="selectStep(i)">
            <div class="step-icon" [ngClass]="getDirectionIconClass(step)"></div>
            <div class="step-content">
              <div class="step-instruction">{{ step.instruction }}</div>
              <div class="step-details">
                <span class="distance">{{ formatDistance(step.distance) }}</span>
                <span class="separator">·</span>
                <span class="duration">{{ formatStepDuration(step.duration) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="no-directions" *ngIf="directions.length === 0">
          <p>Add waypoints to see directions</p>
        </div>
      </div>
    </div>
  `,
  styles: `
    .directions-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: calc(100vh - 40px);
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
    }
    
    .directions-panel:not(.open) {
      width: auto;
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
    
    .toggle-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    
    .toggle-btn:hover {
      background: #e0e0e0;
    }
    
    .directions-content {
      flex: 1;
      overflow-y: auto;
      max-height: calc(100vh - 120px);
    }
    
    .route-info {
      padding: 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 16px;
    }
    
    .info-item:last-child {
      margin-bottom: 0;
    }
    
    .info-item .label {
      color: #666;
    }
    
    .info-item .value {
      font-weight: bold;
      color: #333;
    }
    
    .steps-container {
      padding: 8px 0;
    }
    
    .step {
      display: flex;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      border-left: 3px solid transparent;
    }
    
    .step:hover {
      background: #f8f9fa;
    }
    
    .step.selected {
      background: #e3f2fd;
      border-left-color: #FF6B6B;
      border-left-width: 4px;
    }
    
    .step-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      flex-shrink: 0;
      background-image: url('/assets/leaflet-routing-icons.png');
      background-size: 240px 20px;
      background-repeat: no-repeat;
    }
    
    /* Direction icon sprite positions */
    .direction-icon-continue         { background-position: 0 0; }
    .direction-icon-sharp-right      { background-position: -20px 0; }
    .direction-icon-turn-right       { background-position: -40px 0; }
    .direction-icon-bear-right       { background-position: -60px 0; }
    .direction-icon-u-turn           { background-position: -80px 0; }
    .direction-icon-sharp-left       { background-position: -100px 0; }
    .direction-icon-turn-left        { background-position: -120px 0; }
    .direction-icon-bear-left        { background-position: -140px 0; }
    .direction-icon-depart           { background-position: -160px 0; }
    .direction-icon-enter-roundabout { background-position: -180px 0; }
    .direction-icon-arrive           { background-position: -200px 0; }
    .direction-icon-via              { background-position: -220px 0; }
    
    .step-content {
      flex: 1;
    }
    
    .step-instruction {
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    
    .step-details {
      font-size: 12px;
      color: #666;
    }
    
    .step-details .separator {
      margin: 0 4px;
    }
    
    .no-directions {
      padding: 40px 20px;
      text-align: center;
      color: #666;
    }
    
    .no-directions p {
      margin: 0;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .directions-panel {
        width: calc(100% - 40px);
        max-width: 400px;
        right: auto;
        left: 50%;
        transform: translateX(-50%);
      }
    }
  `
})
export class DirectionsPanel implements OnInit {
  @Input() isOpen: boolean = true;
  @Output() stepSelected = new EventEmitter<{index: number, step: any}>();
  @Output() stepDeselected = new EventEmitter<void>();
  route: any = null;
  directions: any[] = [];
  selectedStep: number | null = null;

  constructor(
    private routingService: RoutingService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.routingService.route$.subscribe(route => {
      this.route = route;
      if (route) {
        this.parseDirections(route);
      } else {
        this.directions = [];
      }
    });
  }

  private parseDirections(route: any): void {
    // Parsing route
    
    if (!route.instructions || route.instructions.length === 0) {
      // No instructions found in route
      this.directions = [];
      return;
    }
    
    const language = 'en';
    const instructions: any[] = [];
    
    route.instructions.forEach((instruction: any, index: number) => {
      // Processing instruction
      
      // Leaflet Routing Machine provides instructions with different structure
      if (instruction.type || instruction.text) {
        try {
          let text = '';
          
          // Check if instruction has OSRM format data
          if (instruction.type && instruction.modifier) {
            // OSRM format - use osrm-text-instructions
            const step = {
              type: instruction.type,
              modifier: instruction.modifier,
              name: instruction.name || instruction.road || '',
              exit: instruction.exit
            };
            
            text = osrmTextInstructions.compile(language, step, {
              legIndex: 0,
              legCount: 1
            });
          } else if (instruction.text) {
            // Plain text instruction from Leaflet
            text = instruction.text;
          }
          
          instructions.push({
            instruction: text || 'Continue',
            distance: instruction.distance || 0,
            duration: instruction.time || 0,
            name: instruction.name || instruction.road || '',
            mode: instruction.type || '',
            type: instruction.type || '',
            modifier: instruction.modifier || ''
          });
        } catch (error) {
          console.error('Error parsing instruction:', error);
          // Fallback to basic instruction
          instructions.push({
            instruction: instruction.text || this.getBasicInstruction(instruction),
            distance: instruction.distance || 0,
            duration: instruction.time || 0,
            name: instruction.name || instruction.road || '',
            mode: instruction.type || '',
            type: instruction.type || '',
            modifier: instruction.modifier || ''
          });
        }
      }
    });
    
    // Parsed directions
    this.directions = instructions;
  }

  private getBasicInstruction(step: any): string {
    const turnModifiers: { [key: string]: string } = {
      'straight': 'Continue straight',
      'slight right': 'Turn slightly right',
      'right': 'Turn right',
      'sharp right': 'Turn sharply right',
      'uturn': 'Make a U-turn',
      'sharp left': 'Turn sharply left',
      'left': 'Turn left',
      'slight left': 'Turn slightly left'
    };
    
    const type = step.type || '';
    const modifier = step.modifier || '';
    const name = step.name || 'the road';
    
    if (type === 'depart') {
      return `Head ${modifier} on ${name}`;
    } else if (type === 'arrive') {
      return `Arrive at your destination`;
    } else if (type === 'turn' || type === 'new name' || type === 'continue') {
      const turn = turnModifiers[modifier] || 'Continue';
      return `${turn} onto ${name}`;
    } else if (type === 'roundabout') {
      return `At the roundabout, take exit ${step.exit || 1} onto ${name}`;
    } else if (type === 'merge') {
      return `Merge onto ${name}`;
    } else {
      return `Continue on ${name}`;
    }
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  selectStep(index: number): void {
    if (this.selectedStep === index) {
      this.selectedStep = null;
      this.stepDeselected.emit();
    } else {
      this.selectedStep = index;
      const step = this.directions[index];
      
      // Find the coordinate indices for this step
      if (this.route && this.route.instructions) {
        const instruction = this.route.instructions[index];
        if (instruction) {
          this.stepSelected.emit({ 
            index, 
            step: {
              ...step,
              coordinateIndex: instruction.index,
              distance: instruction.distance,
              time: instruction.time
            }
          });
        }
      }
    }
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

  formatStepDuration(seconds: number): string {
    if (!seconds) return '0s';
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else {
      return `${Math.round(seconds / 60)} min`;
    }
  }

  getDirectionIconClass(step: any): string {
    const type = (step.type || step.mode || '').toLowerCase();
    const modifier = (step.modifier || '').toLowerCase();
    
    // Getting direction icon for step
    
    // Map OSRM types/modifiers to icon classes
    if (type === 'head') return 'direction-icon-depart';
    if (type === 'destinationreached' || type === 'arrive') return 'direction-icon-arrive';
    if (type === 'roundabout' || type === 'rotary') return 'direction-icon-enter-roundabout';
    if (type === 'merge') {
      if (modifier === 'left') return 'direction-icon-turn-left';
      if (modifier === 'right') return 'direction-icon-turn-right';
      return 'direction-icon-turn-right';
    }
    if (type === 'fork') {
      if (modifier === 'left') return 'direction-icon-bear-left';
      if (modifier === 'right') return 'direction-icon-bear-right';
      return 'direction-icon-continue';
    }
    if (type === 'offramp') {
      if (modifier === 'left') return 'direction-icon-bear-left';
      if (modifier === 'right') return 'direction-icon-bear-right';
      return 'direction-icon-continue';
    }
    if (type === 'continue') return 'direction-icon-continue';
    if (type === 'straight') return 'direction-icon-continue';
    
    // Handle turn types
    if (type === 'left') return 'direction-icon-turn-left';
    if (type === 'right') return 'direction-icon-turn-right';
    if (type === 'slightleft') return 'direction-icon-bear-left';
    if (type === 'slightright') return 'direction-icon-bear-right';
    if (type === 'sharpleft') return 'direction-icon-sharp-left';
    if (type === 'sharpright') return 'direction-icon-sharp-right';
    if (type === 'uturn') return 'direction-icon-u-turn';
    
    // Default to continue/straight
    return 'direction-icon-continue';
  }
}