import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { Transform } from '../components/Transform';
import { RigidBody } from '../components/RigidBody';
import { Vec2 } from 'cc';

export class PhysicsSystem extends EntitySystem {
    private gravity: Vec2 = new Vec2(0, -500);
    private worldBounds: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    } = {
        left: -1000,
        right: 1000,
        top: 1000,
        bottom: -1000
    };
    
    constructor() {
        super(Matcher.empty().all(Transform, RigidBody));
    }
    
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const rigidBody = entity.getComponent(RigidBody);
            
            if (!transform || !rigidBody) continue;
            
            this.applyGravity(rigidBody);
            this.updatePhysics(transform, rigidBody, deltaTime);
            this.enforceWorldBounds(transform, rigidBody);
        }
    }
    
    private applyGravity(rigidBody: RigidBody): void {
        if (rigidBody.isStatic) return;
        
        const gravityForce = new Vec2(
            this.gravity.x * rigidBody.mass,
            this.gravity.y * rigidBody.mass
        );
        rigidBody.addForce(gravityForce);
    }
    
    private updatePhysics(transform: Transform, rigidBody: RigidBody, deltaTime: number): void {
        if (rigidBody.isStatic) return;
        
        rigidBody.integrate(deltaTime);
        
        transform.previousPosition.set(transform.position);
        transform.position.x += rigidBody.velocity.x * deltaTime;
        transform.position.y += rigidBody.velocity.y * deltaTime;
    }
    
    private enforceWorldBounds(transform: Transform, rigidBody: RigidBody): void {
        if (rigidBody.isStatic) return;
        
        const pos = transform.position;
        let bounced = false;
        
        if (pos.x < this.worldBounds.left) {
            pos.x = this.worldBounds.left;
            rigidBody.velocity.x = -rigidBody.velocity.x * rigidBody.bounciness;
            bounced = true;
        } else if (pos.x > this.worldBounds.right) {
            pos.x = this.worldBounds.right;
            rigidBody.velocity.x = -rigidBody.velocity.x * rigidBody.bounciness;
            bounced = true;
        }
        
        if (pos.y < this.worldBounds.bottom) {
            pos.y = this.worldBounds.bottom;
            rigidBody.velocity.y = -rigidBody.velocity.y * rigidBody.bounciness;
            bounced = true;
        } else if (pos.y > this.worldBounds.top) {
            pos.y = this.worldBounds.top;
            rigidBody.velocity.y = -rigidBody.velocity.y * rigidBody.bounciness;
            bounced = true;
        }
        
        if (bounced && rigidBody.bounciness === 0) {
            rigidBody.velocity.set(0, 0);
        }
    }
    
    public setGravity(gravity: Vec2): void {
        this.gravity = gravity;
    }
    
    public setWorldBounds(left: number, right: number, top: number, bottom: number): void {
        this.worldBounds.left = left;
        this.worldBounds.right = right;
        this.worldBounds.top = top;
        this.worldBounds.bottom = bottom;
    }
} 