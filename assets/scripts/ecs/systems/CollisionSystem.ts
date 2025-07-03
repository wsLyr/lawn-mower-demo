import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { Transform, ColliderComponent, Health, ParticleEffect, DamageCooldown } from '../components';
import { PhysicsWorld, CollisionPair } from '../PhysicsWorld';
import { EntityTags } from '../EntityTags';

export class CollisionSystem extends EntitySystem {
    private physicsWorld: PhysicsWorld;
    
    constructor() {
        super(Matcher.empty().all(Transform, ColliderComponent));
        this.physicsWorld = new PhysicsWorld();
    }
    
    protected process(entities: Entity[]): void {
        const collisionPairs = this.physicsWorld.detectCollisions(entities);
        
        for (const pair of collisionPairs) {
            this.handleCollision(pair);
        }
    }
    
    private handleCollision(pair: CollisionPair): void {
        const entity1 = pair.entity1;
        const entity2 = pair.entity2;
        
        if (entity1.tag === EntityTags.BULLET && entity2.tag === EntityTags.ENEMY) {
            this.handleBulletEnemyCollision(entity1, entity2);
        } else if (entity1.tag === EntityTags.ENEMY && entity2.tag === EntityTags.BULLET) {
            this.handleBulletEnemyCollision(entity2, entity1);
        } else if (entity1.tag === EntityTags.PLAYER && entity2.tag === EntityTags.ENEMY) {
            this.handlePlayerEnemyCollision(entity1, entity2);
        } else if (entity1.tag === EntityTags.ENEMY && entity2.tag === EntityTags.PLAYER) {
            this.handlePlayerEnemyCollision(entity2, entity1);
        }
    }
    
    private handleBulletEnemyCollision(bullet: Entity, enemy: Entity): void {
        const enemyHealth = enemy.getComponent(Health);
        const bulletTransform = bullet.getComponent(Transform);
        
        if (enemyHealth && bulletTransform) {
            enemyHealth.takeDamage(30);
            
            if (enemyHealth.current <= 0) {
                this.createDeathParticles(bulletTransform.position.x, bulletTransform.position.y);
                enemy.destroy();
            }
        }
        
        bullet.destroy();
    }
    
    private handlePlayerEnemyCollision(player: Entity, enemy: Entity): void {
        const playerHealth = player.getComponent(Health);
        const damageCooldown = enemy.getComponent(DamageCooldown);
        
        if (!playerHealth || !damageCooldown) return;
        
        const currentTime = Time.totalTime;
        
        if (damageCooldown.canDealDamage(currentTime)) {
            playerHealth.takeDamage(1);
            damageCooldown.dealDamage(currentTime);
            
            if (playerHealth.current <= 0) {
                const playerTransform = player.getComponent(Transform);
                if (playerTransform) {
                    this.createDeathParticles(playerTransform.position.x, playerTransform.position.y);
                }
                player.destroy();
            }
        }
    }
    
    private createDeathParticles(x: number, y: number): void {
        const particleEntity = this.scene.createEntity("DeathParticles");
        const transform = new Transform(x, y, 0);
        const particles = ParticleEffect.createDeathExplosion();
        
        particleEntity.addComponent(transform);
        particleEntity.addComponent(particles);
        
        particles.emitterPosition.set(x, y);
        particles.burst(15);
    }
}