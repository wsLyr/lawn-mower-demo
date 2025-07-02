import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';
import { Transform, ColliderComponent, Health, Projectile, ParticleEffect } from '../components';
import { Vec2 } from 'cc';

export class CollisionSystem extends EntitySystem {
    private collisionRules: Map<string, string[]> = new Map([
        ['player_bullet', ['enemy']],
        ['enemy_bullet', ['player']],
        ['player', ['enemy', 'pickup']]
    ]);
    
    constructor() {
        super(Matcher.empty().all(Transform, ColliderComponent));
    }
    
    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            const collider = entity.getComponent(ColliderComponent);
            if (!collider) continue;
            
            // 确保每个碰撞体都有碰撞回调
            if (!collider.onCollisionEnter) {
                collider.onCollisionEnter = (otherNode) => {
                    const otherEntity = this.findEntityByNode(otherNode, entities);
                    if (otherEntity) {
                        this.handleCollision(entity, otherEntity);
                    }
                };
            }
        }
    }
    
    private findEntityByNode(node: any, entities: Entity[]): Entity | null {
        return entities.find(entity => {
            const collider = entity.getComponent(ColliderComponent);
            return collider?.node === node;
        }) || null;
    }
    
    private handleCollision(entity1: Entity, entity2: Entity): void {
        const collider1 = entity1.getComponent(ColliderComponent);
        const collider2 = entity2.getComponent(ColliderComponent);
        
        if (!collider1 || !collider2) return;
        
        // 处理子弹击中敌人
        if (collider1.hasTag('player_bullet') && collider2.hasTag('enemy')) {
            this.handleBulletHitEnemy(entity1, entity2);
        } else if (collider2.hasTag('player_bullet') && collider1.hasTag('enemy')) {
            this.handleBulletHitEnemy(entity2, entity1);
        }
        // 处理敌人撞击玩家
        else if (collider1.hasTag('enemy') && collider2.hasTag('player')) {
            this.handleEnemyHitPlayer(entity1, entity2);
        } else if (collider2.hasTag('enemy') && collider1.hasTag('player')) {
            this.handleEnemyHitPlayer(entity2, entity1);
        }
    }
    
    private handleBulletHitEnemy(bullet: Entity, enemy: Entity): void {
        const projectile = bullet.getComponent(Projectile);
        const enemyHealth = enemy.getComponent(Health);
        const enemyTransform = enemy.getComponent(Transform);
        
        if (projectile && enemyHealth && enemyTransform) {
            console.log(`子弹击中敌人! 伤害: ${projectile.damage}, 敌人血量: ${enemyHealth.current}/${enemyHealth.max}`);
            
            const damageDealt = enemyHealth.takeDamage(projectile.damage);
            
            if (damageDealt) {
                const hitPos = new Vec2(enemyTransform.position.x, enemyTransform.position.y);
                this.createHitEffect(hitPos);
                
                console.log(`造成伤害! 敌人剩余血量: ${enemyHealth.current}`);
                
                if (enemyHealth.current <= 0) {
                    console.log('敌人死亡!');
                    this.createDeathExplosion(hitPos);
                    enemy.destroy();
                }
            } else {
                console.log('敌人已死亡，未造成伤害');
            }
            
            if (!projectile.onHit()) {
                bullet.destroy();
            }
        }
    }
    
    private handleEnemyHitPlayer(enemy: Entity, player: Entity): void {
        const playerHealth = player.getComponent(Health);
        const playerTransform = player.getComponent(Transform);
        
        if (playerHealth && playerTransform) {
            console.log(`敌人撞击玩家! 玩家血量: ${playerHealth.current}/${playerHealth.max}`);
            
            const damageDealt = playerHealth.takeDamage(10);
            
            if (damageDealt) {
                const hitPos = new Vec2(playerTransform.position.x, playerTransform.position.y);
                this.createHitEffect(hitPos);
                
                console.log(`玩家受到伤害! 剩余血量: ${playerHealth.current}`);
                
                if (playerHealth.current <= 0) {
                    console.log('游戏结束!');
                }
            } else {
                console.log('玩家已死亡，未受到伤害');
            }
        }
    }
    
    private createHitEffect(position: Vec2): void {
        if (!this.scene) return;
        
        const effect = this.scene.createEntity("HitEffect");
        effect.addComponent(new Transform(position.x, position.y, 0));
        
        const particle = ParticleEffect.createHitEffect();
        particle.emitterPosition.set(position);
        particle.burst(5);
        effect.addComponent(particle);
        
        setTimeout(() => effect?.destroy(), 1000);
    }
    
    private createDeathExplosion(position: Vec2): void {
        if (!this.scene) return;
        
        const explosion = this.scene.createEntity("DeathExplosion");
        explosion.addComponent(new Transform(position.x, position.y, 0));
        
        const particle = ParticleEffect.createDeathExplosion();
        particle.emitterPosition.set(position);
        particle.burst(10);
        explosion.addComponent(particle);
        
        setTimeout(() => explosion?.destroy(), 1500);
    }
}