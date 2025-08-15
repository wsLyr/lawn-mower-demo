import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { Transform, ParticleEffect, Particle } from '../components';
import { Graphics, Node, Layers } from 'cc';

@ECSSystem('VectorizedParticleSystem')
export class VectorizedParticleSystem extends EntitySystem {
    private particleGraphics: Graphics | null = null;
    private particleNode: Node | null = null;
    private gameContainer: Node | null = null;
    
    constructor() {
        super(Matcher.all(Transform, ParticleEffect));
    }
    
    public setGameContainer(container: Node): void {
        this.gameContainer = container;
        this.initializeParticleGraphics();
    }
    
    private initializeParticleGraphics(): void {
        if (!this.gameContainer) return;
        
        this.particleNode = new Node('ParticleLayer');
        this.particleNode.parent = this.gameContainer;
        this.particleNode.layer = Layers.Enum.UI_2D;
        
        this.particleGraphics = this.particleNode.addComponent(Graphics);
    }
    
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        if (!this.particleGraphics) return;
        
        this.particleGraphics.clear();
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const particleEffect = entity.getComponent(ParticleEffect);
            
            if (!transform || !particleEffect) continue;
            
            this.updateParticleEffect(particleEffect, deltaTime);
            this.renderParticles(particleEffect);
            
            if (!particleEffect.isEmitting && particleEffect.particles.length === 0) {
                entity.destroy();
            }
        }
    }
    
    private updateParticleEffect(effect: ParticleEffect, deltaTime: number): void {
        if (effect.isEmitting) {
            effect.currentTime += deltaTime;
            
            if (effect.autoStop && effect.currentTime >= effect.duration) {
                effect.stopEmission();
            }
            
            effect.emissionTimer += deltaTime;
            const emissionInterval = 1 / effect.emissionRate;
            
            while (effect.emissionTimer >= emissionInterval) {
                effect.createParticle();
                effect.emissionTimer -= emissionInterval;
            }
        }
        
        for (let i = effect.particles.length - 1; i >= 0; i--) {
            const particle = effect.particles[i];
            
            if (!this.updateParticle(particle, deltaTime)) {
                effect.particles.splice(i, 1);
            }
        }
    }
    
    private updateParticle(particle: Particle, deltaTime: number): boolean {
        particle.life -= deltaTime;
        
        if (particle.life <= 0) {
            return false;
        }
        
        const lifeProgress = 1 - (particle.life / particle.maxLife);
        
        particle.velocity.x += particle.gravity.x * deltaTime;
        particle.velocity.y += particle.gravity.y * deltaTime;
        
        particle.velocity.x *= particle.drag;
        particle.velocity.y *= particle.drag;
        
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        
        particle.size = this.lerp(particle.startSize, particle.endSize, lifeProgress);
        
        particle.color.r = this.lerp(particle.startColor.r, particle.endColor.r, lifeProgress);
        particle.color.g = this.lerp(particle.startColor.g, particle.endColor.g, lifeProgress);
        particle.color.b = this.lerp(particle.startColor.b, particle.endColor.b, lifeProgress);
        particle.color.a = this.lerp(particle.startColor.a, particle.endColor.a, lifeProgress);
        
        return true;
    }
    
    private renderParticles(effect: ParticleEffect): void {
        if (!this.particleGraphics) return;
        
        for (const particle of effect.particles) {
            this.particleGraphics.fillColor = particle.color;
            this.particleGraphics.circle(particle.position.x, particle.position.y, particle.size);
            this.particleGraphics.fill();
        }
    }
    
    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
    
    public onDestroy(): void {
        if (this.particleNode) {
            this.particleNode.destroy();
            this.particleNode = null;
            this.particleGraphics = null;
        }
    }
}