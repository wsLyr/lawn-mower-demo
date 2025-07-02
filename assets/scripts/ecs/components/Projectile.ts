import { Component } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

/**
 * 投射物组件 - 子弹、激光等
 */
export class Projectile extends Component {
    public velocity: Vec2 = new Vec2();
    public damage: number = 10;
    public lifeTime: number = 2; // 存活时间
    public currentLife: number = 2;
    public pierceCount: number = 1; // 可穿透敌人数量
    public currentPierceCount: number = 1;
    public speed: number = 300;
    public owner: string = 'player'; // 'player' 或 'enemy'
    public isActive: boolean = true;
    
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
    
    /**
     * 处理击中目标
     */
    public onHit(): boolean {
        this.currentPierceCount--;
        return this.currentPierceCount > 0; // 返回是否还能继续穿透
    }
} 