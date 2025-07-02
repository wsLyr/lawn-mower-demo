import { EntitySystem, Matcher, Time, Entity } from '@esengine/ecs-framework';
import { Transform, Weapon, Renderable, Projectile, ColliderComponent, Health } from '../components';
import { RenderSystem } from './RenderSystem';
import { Color, Vec2, Vec3, ERigidBody2DType } from 'cc';

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
            const transform = entity.getComponent(Transform);
            const weapon = entity.getComponent(Weapon);
            
            if (!transform || !weapon) continue;
            
            weapon.updateTimer(deltaTime);
            
            if (weapon.autoFire && weapon.canFire()) {
                this.fireWeapon(entity, transform, weapon);
            }
        }
    }
    
    /**
     * 开火
     */
    private fireWeapon(entity: Entity, transform: Transform, weapon: Weapon): void {
        const queryResult = this.scene.querySystem.queryAll(Transform);
        const target = this.findNearestEnemy(transform.position, weapon.range, queryResult.entities);
        
        if (target) {
            const targetTransform = target.getComponent(Transform);
            if (targetTransform) {
                const direction = new Vec2(
                    targetTransform.position.x - transform.position.x,
                    targetTransform.position.y - transform.position.y
                );
                
                if (direction.length() > 0) {
                    direction.normalize();
                    const pos2D = new Vec2(transform.position.x, transform.position.y);
                    this.createProjectile(pos2D, direction, weapon);
                    weapon.resetFireTimer();
                }
            }
        } else {
            console.log('未找到射击目标');
        }
    }
    
    /**
     * 寻找最近的敌人
     */
    private findNearestEnemy(position: Vec3, range: number, entities: Entity[]): Entity | null {
        let nearestEnemy = null;
        let nearestDistance = range;
        
        entities.forEach(entity => {
            if (entity && entity.name && entity.name.includes('RedChaser')) {
                const enemyTransform = entity.getComponent(Transform);
                if (enemyTransform) {
                    const pos1 = new Vec2(position.x, position.y);
                    const pos2 = new Vec2(enemyTransform.position.x, enemyTransform.position.y);
                    const distance = Vec2.distance(pos1, pos2);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestEnemy = entity;
                    }
                }
            }
        });
        
        return nearestEnemy;
    }
    
    /**
     * 创建子弹
     */
    private createProjectile(position: Vec2, direction: Vec2, weapon: Weapon): void {
        const projectile = this.scene.createEntity("Bullet");
        
        const transform = new Transform(position.x, position.y, 0);
        projectile.addComponent(transform);
        
        const projectileComp = new Projectile(weapon.damage, weapon.bulletSpeed, weapon.bulletLifeTime);
        projectileComp.setDirection(direction);
        projectileComp.pierceCount = weapon.pierceCount;
        projectileComp.currentPierceCount = weapon.pierceCount;
        projectile.addComponent(projectileComp);
        
        const renderData = RenderSystem.createRenderableNode(this.gameContainer);
        const renderable = new Renderable(renderData.node, renderData.graphics);
        
        renderable.shapeType = 'circle';
        renderable.radius = weapon.bulletSize;
        renderable.setColor(new Color(255, 255, 100, 255));
        renderable.strokeColor = new Color(255, 200, 0, 255);
        renderable.strokeWidth = 1;
        renderable.enableShadow = false;
        
        projectile.addComponent(renderable);
        
        const collider = new ColliderComponent(renderData.node, 'circle', 'player_bullet', ERigidBody2DType.Dynamic);
        collider.setSize(weapon.bulletSize);
        collider.addTag('player_bullet');
        
        projectile.addComponent(collider);
    }
    

} 