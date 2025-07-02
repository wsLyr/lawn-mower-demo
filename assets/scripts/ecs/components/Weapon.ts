import { Component } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

/**
 * 武器组件 - 处理自动攻击
 */
export class Weapon extends Component {
    public damage: number = 10;
    public fireRate: number = 2; // 每秒发射次数
    public range: number = 200; // 攻击范围
    public bulletSpeed: number = 300;
    public fireTimer: number = 0;
    public autoFire: boolean = true; // 自动开火
    public weaponType: 'bullet' | 'laser' | 'explosion' = 'bullet';
    
    // 子弹属性
    public bulletSize: number = 3;
    public bulletLifeTime: number = 2; // 子弹存活时间
    public pierceCount: number = 1; // 穿透敌人数量
    
    constructor(damage: number = 10, fireRate: number = 2) {
        super();
        this.damage = damage;
        this.fireRate = fireRate;
    }
    
    /**
     * 检查是否可以开火
     */
    public canFire(): boolean {
        return this.fireTimer <= 0;
    }
    
    /**
     * 重置开火计时器
     */
    public resetFireTimer(): void {
        this.fireTimer = 1.0 / this.fireRate;
    }
    
    /**
     * 更新武器计时器
     */
    public updateTimer(deltaTime: number): void {
        if (this.fireTimer > 0) {
            this.fireTimer -= deltaTime;
        }
    }
} 