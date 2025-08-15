import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

export enum ProjectileType {
    NORMAL = 'normal',
    GRENADE = 'grenade'
}

@ECSComponent('Projectile')
export class Projectile extends Component {
    public velocity: Vec2 = new Vec2();
    public damage: number = 10;
    public lifeTime: number = 2;
    public currentLife: number = 2;
    public pierceCount: number = 1;
    public currentPierceCount: number = 1;
    public speed: number = 300;
    public owner: string = 'player';
    public isActive: boolean = true;
    public type: ProjectileType = ProjectileType.NORMAL;
    
    public explosionRadius: number = 0;
    public explosionDamage: number = 0;
    
    public isParabolic: boolean = false;
    public startHeight: number = 0;
    public targetPosition: Vec2 = new Vec2();
    public arcHeight: number = 50;
    public travelProgress: number = 0;
    
    constructor(damage: number = 10, speed: number = 300, lifeTime: number = 2) {
        super();
        this.damage = damage;
        this.speed = speed;
        this.lifeTime = lifeTime;
        this.currentLife = lifeTime;
    }
    
    /**
     * 设置移动方向
     */
    public setDirection(direction: Vec2): void {
        this.velocity = direction.clone().normalize().multiplyScalar(this.speed);
    }
    
    /**
     * 更新生命周期
     */
    public updateLife(deltaTime: number): boolean {
        this.currentLife -= deltaTime;
        return this.currentLife > 0;
    }
    
    public onHit(): boolean {
        this.currentPierceCount--;
        return this.currentPierceCount > 0;
    }
    
    public setAsGrenade(explosionRadius: number = 80, explosionDamage: number = 50): void {
        this.type = ProjectileType.GRENADE;
        this.explosionRadius = explosionRadius;
        this.explosionDamage = explosionDamage;
        this.pierceCount = 1;
        this.isParabolic = true;
        this.arcHeight = 50;
    }
    
    public setTargetPosition(target: Vec2): void {
        this.targetPosition = target.clone();
    }
} 