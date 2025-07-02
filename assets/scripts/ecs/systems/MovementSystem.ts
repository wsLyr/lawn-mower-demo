import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { Transform, Movement } from '../components';
import { Vec2 } from 'cc';

export class MovementSystem extends EntitySystem {
    
    constructor() {
        super(Matcher.empty().all(Transform, Movement));
    }
    
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            this.processEntityMovement(entity, deltaTime);
        }
    }
    
    private processEntityMovement(entity: Entity, deltaTime: number): void {
        const transform = entity.getComponent(Transform);
        const movement = entity.getComponent(Movement);
        
        if (!transform || !movement) return;
        
        transform.previousPosition.set(transform.position);
        
        if (movement.inputDirection.length() > 0.1) {
            const normalizedDirection = movement.inputDirection.clone().normalize();
            const moveDistance = movement.maxSpeed * deltaTime;
            
            transform.position.x += normalizedDirection.x * moveDistance;
            transform.position.y += normalizedDirection.y * moveDistance;
            
            movement.velocity.set(normalizedDirection.x * movement.maxSpeed, normalizedDirection.y * movement.maxSpeed);
        } else {
            movement.velocity.set(0, 0);
        }
        
        this.updateRotation(transform, movement, deltaTime);
    }
    
    private updateRotation(transform: Transform, movement: Movement, deltaTime: number): void {
        if (movement.velocity.length() > 10) {
            const targetRotation = Math.atan2(movement.velocity.y, movement.velocity.x);
            
            let angleDiff = targetRotation - transform.rotation;
            
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            const rotationSpeed = 8;
            transform.rotation += angleDiff * rotationSpeed * deltaTime;
        }
    }
} 