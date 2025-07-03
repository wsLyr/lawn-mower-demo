import { EntitySystem, Matcher, Time, Entity } from '@esengine/ecs-framework';
import { Transform, Projectile } from '../components';

/**
 * 投射物系统 - 处理子弹移动和生命周期
 */
export class ProjectileSystem extends EntitySystem {
    
    constructor() {
        super(Matcher.empty().all(Transform, Projectile));
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const projectile = entity.getComponent(Projectile);
            
            if (!transform || !projectile) continue;
            
            // 更新子弹位置
            transform.position.x += projectile.velocity.x * deltaTime;
            transform.position.y += projectile.velocity.y * deltaTime;
            
            // 更新生命周期
            if (!projectile.updateLife(deltaTime)) {
                entity.destroy();
            }
        }
    }
} 