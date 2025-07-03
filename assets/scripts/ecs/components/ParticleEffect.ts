import { Component } from '@esengine/ecs-framework';
import { Vec2, Color } from 'cc';

/**
 * 粒子数据
 */
export class Particle {
    public position: Vec2 = new Vec2();
    public velocity: Vec2 = new Vec2();
    public life: number = 1;
    public maxLife: number = 1;
    public size: number = 2;
    public startSize: number = 2;
    public endSize: number = 0;
    public color: Color = Color.WHITE.clone();
    public startColor: Color = Color.WHITE.clone();
    public endColor: Color = Color.TRANSPARENT.clone();
    public gravity: Vec2 = new Vec2(0, -100);
    public drag: number = 0.95;
}

/**
 * 粒子效果组件 - 创建各种粒子效果
 */
export class ParticleEffect extends Component {
    public particles: Particle[] = [];
    public maxParticles: number = 20;
    public emissionRate: number = 10; // 每秒发射数量
    public emissionTimer: number = 0;
    
    // 发射器属性
    public emitterPosition: Vec2 = new Vec2();
    public emitterRadius: number = 5;
    public direction: Vec2 = new Vec2(0, 1);
    public spread: number = Math.PI / 4; // 发射角度范围
    public speed: number = 100;
    public speedVariation: number = 50;
    
    // 粒子属性
    public lifeTime: number = 1;
    public lifeTimeVariation: number = 0.5;
    public startSize: number = 4;
    public endSize: number = 0;
    public sizeVariation: number = 2;
    public startColor: Color = Color.WHITE.clone();
    public endColor: Color = Color.TRANSPARENT.clone();
    public gravity: Vec2 = new Vec2(0, -100);
    public drag: number = 0.95;
    
    // 控制属性
    public isEmitting: boolean = false;
    public autoStop: boolean = false;
    public duration: number = 1;
    public currentTime: number = 0;
    
    constructor() {
        super();
    }
    
    /**
     * 开始发射粒子
     */
    public startEmission(duration?: number): void {
        this.isEmitting = true;
        this.currentTime = 0;
        if (duration !== undefined) {
            this.duration = duration;
            this.autoStop = true;
        }
    }
    
    /**
     * 停止发射粒子
     */
    public stopEmission(): void {
        this.isEmitting = false;
    }
    
    /**
     * 爆发式发射粒子
     */
    public burst(count: number, position?: Vec2): void {
        if (position) {
            this.emitterPosition.set(position);
        }
        
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        for (let i = 0; i < actualCount; i++) {
            this.createParticle();
        }
    }
    
    /**
     * 创建单个粒子
     */
    public createParticle(): void {
        if (this.particles.length >= this.maxParticles) {
            // 移除最老的粒子
            this.particles.shift();
        }
        
        const particle = new Particle();
        
        // 设置位置
        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius = Math.random() * this.emitterRadius;
        particle.position.set(
            this.emitterPosition.x + Math.cos(randomAngle) * randomRadius,
            this.emitterPosition.y + Math.sin(randomAngle) * randomRadius
        );
        
        // 设置速度
        const baseAngle = Math.atan2(this.direction.y, this.direction.x);
        const angleVariation = (Math.random() - 0.5) * this.spread;
        const finalAngle = baseAngle + angleVariation;
        const speed = this.speed + (Math.random() - 0.5) * this.speedVariation;
        
        particle.velocity.set(
            Math.cos(finalAngle) * speed,
            Math.sin(finalAngle) * speed
        );
        
        // 设置生命周期
        particle.maxLife = this.lifeTime + (Math.random() - 0.5) * this.lifeTimeVariation;
        particle.life = particle.maxLife;
        
        // 设置大小
        particle.startSize = this.startSize + (Math.random() - 0.5) * this.sizeVariation;
        particle.endSize = this.endSize;
        particle.size = particle.startSize;
        
        // 设置颜色
        particle.startColor = this.startColor.clone();
        particle.endColor = this.endColor.clone();
        particle.color = particle.startColor.clone();
        
        // 设置物理属性
        particle.gravity = this.gravity.clone();
        particle.drag = this.drag;
        
        this.particles.push(particle);
    }
    
    /**
     * 清除所有粒子
     */
    public clear(): void {
        this.particles.length = 0;
    }
    
    /**
     * 创建预设效果
     */
    public static createHitEffect(): ParticleEffect {
        const effect = new ParticleEffect();
        effect.maxParticles = 8;
        effect.lifeTime = 0.3;
        effect.startSize = 2;
        effect.endSize = 0;
        effect.startColor = new Color(255, 100, 100, 255);
        effect.endColor = new Color(255, 100, 100, 0);
        effect.speed = 60;
        effect.speedVariation = 30;
        effect.spread = Math.PI * 2;
        effect.gravity.set(0, -150);
        return effect;
    }
    
    public static createDeathExplosion(): ParticleEffect {
        const effect = new ParticleEffect();
        effect.maxParticles = 12;
        effect.lifeTime = 0.6;
        effect.startSize = 3;
        effect.endSize = 1;
        effect.startColor = new Color(255, 150, 0, 255);
        effect.endColor = new Color(255, 0, 0, 0);
        effect.speed = 80;
        effect.speedVariation = 40;
        effect.spread = Math.PI * 2;
        effect.gravity.set(0, -120);
        return effect;
    }
    
    public static createCollectEffect(): ParticleEffect {
        const effect = new ParticleEffect();
        effect.maxParticles = 6;
        effect.lifeTime = 0.5;
        effect.startSize = 2;
        effect.endSize = 0;
        effect.startColor = new Color(255, 255, 100, 255);
        effect.endColor = new Color(255, 255, 100, 0);
        effect.speed = 40;
        effect.speedVariation = 20;
        effect.spread = Math.PI * 2;
        effect.gravity.set(0, 30);
        return effect;
    }
} 