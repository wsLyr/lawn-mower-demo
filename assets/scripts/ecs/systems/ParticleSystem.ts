import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { Transform, ParticleEffect, Particle } from '../components';
import { Vec2 } from 'cc';

/**
 * 粒子系统 - 处理粒子效果的更新和渲染
 */
@ECSSystem('ParticleSystem')
export class ParticleSystem extends EntitySystem {
    
    constructor() {
        super(Matcher.empty().all(Transform, ParticleEffect));
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const particleEffect = entity.getComponent(ParticleEffect);
            
            if (!transform || !particleEffect) continue;
            
            this.updateParticleEffect(particleEffect, deltaTime);
            
            // 如果粒子效果结束且没有活跃粒子，销毁实体
            if (!particleEffect.isEmitting && particleEffect.particles.length === 0) {
                entity.destroy();
            }
        }
    }
    
    /**
     * 更新粒子效果
     */
    private updateParticleEffect(effect: ParticleEffect, deltaTime: number): void {
        // 更新发射器
        if (effect.isEmitting) {
            effect.currentTime += deltaTime;
            
            // 检查是否需要自动停止
            if (effect.autoStop && effect.currentTime >= effect.duration) {
                effect.stopEmission();
            }
            
            // 发射新粒子
            effect.emissionTimer += deltaTime;
            const emissionInterval = 1 / effect.emissionRate;
            
            while (effect.emissionTimer >= emissionInterval) {
                effect.createParticle();
                effect.emissionTimer -= emissionInterval;
            }
        }
        
        // 更新现有粒子
        for (let i = effect.particles.length - 1; i >= 0; i--) {
            const particle = effect.particles[i];
            
            if (!this.updateParticle(particle, deltaTime)) {
                // 粒子死亡，移除
                effect.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 更新单个粒子
     */
    private updateParticle(particle: Particle, deltaTime: number): boolean {
        // 更新生命周期
        particle.life -= deltaTime;
        
        if (particle.life <= 0) {
            return false; // 粒子死亡
        }
        
        // 计算生命周期进度
        const lifeProgress = 1 - (particle.life / particle.maxLife);
        
        // 应用重力
        particle.velocity.x += particle.gravity.x * deltaTime;
        particle.velocity.y += particle.gravity.y * deltaTime;
        
        // 应用阻力
        particle.velocity.x *= particle.drag;
        particle.velocity.y *= particle.drag;
        
        // 更新位置
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        
        // 插值大小
        particle.size = this.lerp(particle.startSize, particle.endSize, lifeProgress);
        
        // 插值颜色
        particle.color.r = this.lerp(particle.startColor.r, particle.endColor.r, lifeProgress);
        particle.color.g = this.lerp(particle.startColor.g, particle.endColor.g, lifeProgress);
        particle.color.b = this.lerp(particle.startColor.b, particle.endColor.b, lifeProgress);
        particle.color.a = this.lerp(particle.startColor.a, particle.endColor.a, lifeProgress);
        
        return true; // 粒子存活
    }
    
    /**
     * 线性插值
     */
    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
} 