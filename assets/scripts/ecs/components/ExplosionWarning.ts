import { Component } from '@esengine/ecs-framework';

export class ExplosionWarning extends Component {
    public radius: number = 80;
    public warningTime: number = 1.0;
    public currentTime: number = 0;
    public alpha: number = 0.8;
    
    constructor(radius: number = 80, warningTime: number = 1.0) {
        super();
        this.radius = radius;
        this.warningTime = warningTime;
    }
    
    public updateWarning(deltaTime: number): boolean {
        this.currentTime += deltaTime;
        
        const progress = this.currentTime / this.warningTime;
        this.alpha = 0.3 + 0.5 * Math.sin(progress * Math.PI * 8);
        
        return this.currentTime >= this.warningTime;
    }
    
    public getProgress(): number {
        return Math.min(this.currentTime / this.warningTime, 1.0);
    }
} 