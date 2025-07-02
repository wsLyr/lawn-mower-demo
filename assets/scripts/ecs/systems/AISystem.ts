import { EntitySystem, Matcher, Entity, Component, Time } from '@esengine/ecs-framework';
import { Transform, Movement } from '../components';
import { Vec2 } from 'cc';

/**
 * AI组件 - 标记需要AI控制的实体
 */
export class AIComponent extends Component {
    public aiType: string = 'chaser'; // 'chaser', 'patrol', 'guard' 等
    public targetTag: string = 'player'; // 追击目标的标签
    public detectionRange: number = 500; // 检测范围
    public lastKnownPlayerPosition: Vec2 | null = null; // 最后已知的玩家位置
    public searchTimer: number = 0; // 搜索计时器
    public maxSearchTime: number = 3; // 最大搜索时间
    
    constructor(aiType: string = 'chaser', targetTag: string = 'player') {
        super();
        this.aiType = aiType;
        this.targetTag = targetTag;
    }
}

/**
 * AI系统 - 处理敌人AI行为
 */
export class AISystem extends EntitySystem {
    
    constructor() {
        super(Matcher.empty().all(Transform, Movement, AIComponent));
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        // 先找到所有玩家实体
        const players = this.findPlayerEntities();
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const movement = entity.getComponent(Movement);
            const ai = entity.getComponent(AIComponent);
            
            if (!transform || !movement || !ai) continue;
            
            // 根据AI类型执行不同行为
            switch (ai.aiType) {
                case 'chaser':
                    this.updateChaserAI(entity, transform, movement, ai, players);
                    break;
                default:
                    this.updateChaserAI(entity, transform, movement, ai, players);
                    break;
            }
        }
    }
    
    /**
     * 更新追击者AI
     */
    private updateChaserAI(
        entity: Entity, 
        transform: Transform, 
        movement: Movement, 
        ai: AIComponent,
        players: Entity[]
    ): void {
        const deltaTime = Time.deltaTime;
        
        if (players.length === 0) {
            // 没有玩家，停止移动
            movement.inputDirection.set(0, 0);
            return;
        }
        
        // 找到最近的玩家
        const nearestPlayer = this.findNearestTarget(transform, players, ai.detectionRange);
        
        if (nearestPlayer) {
            const playerTransform = nearestPlayer.getComponent(Transform);
            if (playerTransform) {
                // 更新最后已知的玩家位置
                ai.lastKnownPlayerPosition = new Vec2(
                    playerTransform.position.x, 
                    playerTransform.position.y
                );
                ai.searchTimer = 0; // 重置搜索计时器
                
                // 计算朝向玩家的方向
                const direction = new Vec2(
                    playerTransform.position.x - transform.position.x,
                    playerTransform.position.y - transform.position.y
                );
                
                // 如果距离太近，稍微减速避免重叠
                const distance = direction.length();
                if (distance > 20) { // 保持一定距离
                    direction.normalize();
                    movement.inputDirection.set(direction.x, direction.y);
                } else {
                    movement.inputDirection.set(0, 0);
                }
            }
        } else {
            // 没有检测到玩家，但如果有最后已知位置，继续朝那个方向移动
            if (ai.lastKnownPlayerPosition) {
                ai.searchTimer += deltaTime;
                
                if (ai.searchTimer < ai.maxSearchTime) {
                    const direction = new Vec2(
                        ai.lastKnownPlayerPosition.x - transform.position.x,
                        ai.lastKnownPlayerPosition.y - transform.position.y
                    );
                    
                    // 如果已经很接近最后已知位置，停止移动
                    if (direction.length() > 30) {
                        direction.normalize();
                        movement.inputDirection.set(direction.x, direction.y);
                    } else {
                        movement.inputDirection.set(0, 0);
                        ai.lastKnownPlayerPosition = null; // 清除最后已知位置
                    }
                } else {
                    // 搜索时间到了，停止移动
                    movement.inputDirection.set(0, 0);
                    ai.lastKnownPlayerPosition = null;
                }
            } else {
                movement.inputDirection.set(0, 0);
            }
        }
    }
    
    /**
     * 寻找所有玩家实体
     */
    private findPlayerEntities(): Entity[] {
        const queryResult = this.scene.querySystem.queryAll(Transform);
        const players: Entity[] = [];
        
        for (const entity of queryResult.entities) {
            if (entity.name && entity.name.includes('ShooterHero')) {
                players.push(entity);
            }
        }
        
        return players;
    }
    
    /**
     * 寻找最近的目标
     */
    private findNearestTarget(transform: Transform, targets: Entity[], maxRange: number): Entity | null {
        let nearestTarget = null;
        let nearestDistance = maxRange;
        
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