import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

@ECSComponent('RigidBody')
export class RigidBody extends Component {
    public velocity: Vec2 = new Vec2();
    public acceleration: Vec2 = new Vec2();
    public mass: number = 1;
    public drag: number = 0.98;
    public bounciness: number = 0;
    public isStatic: boolean = false;
    
    constructor(mass: number = 1, drag: number = 0.98) {
        super();
        this.mass = mass;
        this.drag = drag;
    }
    
    public addForce(force: Vec2): void {
        if (this.isStatic) return;
        
        this.acceleration.x += force.x / this.mass;
        this.acceleration.y += force.y / this.mass;
    }
    
    public addImpulse(impulse: Vec2): void {
        if (this.isStatic) return;
        
        this.velocity.x += impulse.x / this.mass;
        this.velocity.y += impulse.y / this.mass;
    }
    
    public applyDrag(): void {
        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;
    }
    
    public integrate(deltaTime: number): void {
        if (this.isStatic) return;
        
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        this.applyDrag();
        
        this.acceleration.set(0, 0);
    }
} 