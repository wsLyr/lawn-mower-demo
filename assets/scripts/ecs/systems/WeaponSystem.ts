import { EntitySystem, Matcher, Time, Entity } from '@esengine/ecs-framework';
import { Transform, Weapon, Renderable, Projectile, ColliderComponent, Health } from '../components';
import { RenderSystem } from './RenderSystem';
import { Color, Vec2, Vec3 } from 'cc';
import { EntityTags } from '../EntityTags';

/**
 * 武器系统 - 处理自动攻击和子弹生成
 */
export class WeaponSystem extends EntitySystem {
    private gameContainer: any = null;
    
    constructor() {
        super(Matcher.empty().all(Transform, Weapon));
    }
    
    public setGameContainer(container: any): void {
        this.gameContainer = container;
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const weapon = entity.getComponent(Weapon);
            const transform = entity.getComponent(Transform);
            
            if (!weapon || !transform) continue;
            
            weapon.updateTimer(deltaTime);
            
            if (weapon.autoFire && weapon.canFire()) {
                const target = this.findNearestTarget(new Vec2(transform.position.x, transform.position.y));
                if (target) {
                    const direction = target.clone().subtract(new Vec2(transform.position.x, transform.position.y)).normalize();
                    this.createProjectile(new Vec2(transform.position.x, transform.position.y), direction, weapon);
                    weapon.resetFireTimer();
                }
            }
        }
    }
    
    private findNearestTarget(position: Vec2): Vec2 | null {
        const enemyEntities = this.scene.findEntitiesByTag(EntityTags.ENEMY);
        let nearestTarget: Vec2 | null = null;
        let nearestDistance = Infinity;
        
        for (const entity of enemyEntities) {
            const transform = entity.getComponent(Transform);
            if (transform) {
                const targetPos = new Vec2(transform.position.x, transform.position.y);
                const distance = Vec2.distance(position, targetPos);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTarget = targetPos;
                }
            }
        }
        
        return nearestTarget;
    }
    
    /**
     * 创建子弹
     */
    private createProjectile(position: Vec2, direction: Vec2, weapon: Weapon): void {
        const projectile = this.scene.createEntity("Bullet");
        projectile.tag = EntityTags.BULLET;
        
        const transform = new Transform(position.x, position.y, 0);
        transform.rotation = Math.atan2(direction.y, direction.x);
        projectile.addComponent(transform);
        
        const projectileComponent = new Projectile(weapon.damage, weapon.bulletSpeed, weapon.bulletLifeTime);
        projectileComponent.setDirection(direction);
        projectile.addComponent(projectileComponent);
        
        const renderable = RenderSystem.createBullet();
        projectile.addComponent(renderable);
        
        const collider = new ColliderComponent('circle');
        collider.setSize(weapon.bulletSize);
        projectile.addComponent(collider);
    }
} 