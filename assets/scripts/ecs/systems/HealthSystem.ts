import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { Health, Renderable } from '../components';
import { Color } from 'cc';

/**
 * 血量系统 - 处理血量相关逻辑
 */
@ECSSystem('HealthSystem')
export class HealthSystem extends EntitySystem {
    
    constructor() {
        super(Matcher.all(Health));
    }
    
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const health = entity.getComponent(Health);
            if (!health) continue;
            
            // 更新受击效果计时器
            health.updateHitEffect(deltaTime);
            
            // 处理受击视觉效果
            this.updateHitEffect(entity, health);
        }
    }
    
    /**
     * 更新受击效果
     */
    private updateHitEffect(entity: Entity, health: Health): void {
        const renderable = entity.getComponent(Renderable);
        if (!renderable) return;
        
        if (health.isShowingHitEffect) {
            // 受击时的闪烁效果 - 红色闪光
            const flashIntensity = Math.sin(health.hitEffectTimer * 30) * 0.5 + 0.5;
            const flashColor = new Color(255, 255 * flashIntensity, 255 * flashIntensity, 255);
            renderable.lerpToColor(flashColor);
            
            // 轻微的缩放效果
            const scaleAmount = 0.15 * Math.sin(health.hitEffectTimer * 25);
            renderable.punchScale(1 + scaleAmount, 0.05);
        } else {
            // 恢复正常颜色
            renderable.lerpToColor(Color.WHITE);
        }
    }

} 