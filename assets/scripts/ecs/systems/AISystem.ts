import { EntitySystem, Matcher, Entity, Component, Time, ECSSystem, ECSComponent } from '@esengine/ecs-framework';
import { Transform, Movement } from '../components';
import { Vec2 } from 'cc';
import { EntityTags } from '../EntityTags';

/**
 * AI组件 - 标记需要AI控制的实体
 */
@ECSComponent('AIComponent')
export class AIComponent extends Component {
    public aiType: string = 'chaser'; // 'chaser', 'patrol', 'guard' 等
    
    constructor(aiType: string = 'chaser') {
        super();
        this.aiType = aiType;
    }
}

/**
 * AI系统 - 处理敌人AI行为
 */
@ECSSystem('AISystem')
export class AISystem extends EntitySystem {
    
    constructor() {
        super(Matcher.all(Transform, Movement, AIComponent));
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        const players = this.findPlayerEntities();
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const movement = entity.getComponent(Movement);
            const ai = entity.getComponent(AIComponent);
            
            if (!transform || !movement || !ai) continue;
            
            this.updateChaserAI(entity, transform, movement, players);
        }
    }
    
    /**
     * 更新追击者AI
     */
    private updateChaserAI(
        entity: Entity, 
        transform: Transform, 
        movement: Movement, 
        players: Entity[]
    ): void {
        if (players.length === 0) {
            movement.inputDirection.set(0, 0);
            return;
        }
        
        const nearestPlayer = this.findNearestTarget(transform, players);
        
        if (nearestPlayer) {
            const playerTransform = nearestPlayer.getComponent(Transform);
            if (playerTransform) {
                const direction = new Vec2(
                    playerTransform.position.x - transform.position.x,
                    playerTransform.position.y - transform.position.y
                );
                
                const distance = direction.length();
                if (distance > 20) {
                    direction.normalize();
                    movement.inputDirection.set(direction.x, direction.y);
                } else {
                    movement.inputDirection.set(0, 0);
                }
            }
        } else {
            movement.inputDirection.set(0, 0);
        }
    }
    
    private findPlayerEntities(): Entity[] {
        return this.scene.findEntitiesByTag(EntityTags.PLAYER);
    }
    
    /**
     * 寻找最近的目标
     */
    private findNearestTarget(transform: Transform, targets: Entity[]): Entity | null {
        let nearestTarget = null;
        let nearestDistance = Infinity;
        
        for (const target of targets) {
            const targetTransform = target.getComponent(Transform);
            if (!targetTransform) continue;
            
            const distance = Vec2.distance(
                new Vec2(transform.position.x, transform.position.y),
                new Vec2(targetTransform.position.x, targetTransform.position.y)
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = target;
            }
        }
        
        return nearestTarget;
    }
} 