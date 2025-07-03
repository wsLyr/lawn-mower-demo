import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { Transform, Movement } from '../components';
import { Vec2 } from 'cc';

export class MovementSystem extends EntitySystem {
    private readonly tempVec2 = new Vec2();
    private readonly MOVEMENT_THRESHOLD = 0.1;
    private readonly ROTATION_THRESHOLD = 0.001;
    
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
        
        const inputDirLen = movement.inputDirection.x * movement.inputDirection.x + 
                           movement.inputDirection.y * movement.inputDirection.y;
        
        if (inputDirLen > this.MOVEMENT_THRESHOLD * this.MOVEMENT_THRESHOLD) {
            const invLen = 1 / Math.sqrt(inputDirLen);
            const normalizedX = movement.inputDirection.x * invLen;
            const normalizedY = movement.inputDirection.y * invLen;
            
            const moveDistance = movement.maxSpeed * deltaTime;
            
            transform.previousPosition.set(transform.position);
            transform.position.x += normalizedX * moveDistance;
            transform.position.y += normalizedY * moveDistance;
            
            movement.velocity.set(normalizedX * movement.maxSpeed, normalizedY * movement.maxSpeed);
            
            const velocityLen = movement.velocity.x * movement.velocity.x + movement.velocity.y * movement.velocity.y;
            if (velocityLen > 100) {
                const targetRotation = Math.atan2(movement.velocity.y, movement.velocity.x);
                
                let angleDiff = targetRotation - transform.rotation;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                else if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                if (Math.abs(angleDiff) > this.ROTATION_THRESHOLD) {
                    transform.rotation += angleDiff * 8 * deltaTime;
                }
            }
        } else {
            movement.velocity.set(0, 0);
        }
    }
} 