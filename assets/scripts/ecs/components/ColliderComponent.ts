import { Component } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

/**
 * 碰撞体组件
 */
export class ColliderComponent extends Component {
    public colliderType: 'circle' | 'rect' = 'circle';
    public radius: number = 10;
    public width: number = 20;
    public height: number = 20;
    public isTrigger: boolean = true;
    public layer: string = 'default';
    
    constructor(type: 'circle' | 'rect' = 'circle', layer: string = 'default') {
        super();
        this.colliderType = type;
        this.layer = layer;
        this.isTrigger = true;
    }
    
    public setSize(size: number): void {
        this.radius = size;
        this.width = size * 2;
        this.height = size * 2;
    }
    
    public setRect(width: number, height: number): void {
        this.colliderType = 'rect';
        this.width = width;
        this.height = height;
        this.radius = Math.max(width, height) / 2;
    }
    
    public setCircle(radius: number): void {
        this.colliderType = 'circle';
        this.radius = radius;
        this.width = radius * 2;
        this.height = radius * 2;
    }
    
    public getBounds(): { width: number; height: number; radius: number } {
        return {
            width: this.width,
            height: this.height,
            radius: this.radius
        };
    }
} 