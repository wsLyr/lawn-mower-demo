import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

@ECSComponent('Weapon')
export class Weapon extends Component {
    public damage: number = 10;
    public fireRate: number = 2;
    public range: number = 200;
    public bulletSpeed: number = 300;
    public fireTimer: number = 0;
    public autoFire: boolean = true;
    public weaponType: 'bullet' | 'laser' | 'explosion' = 'bullet';
    
    public bulletSize: number = 3;
    public bulletLifeTime: number = 2;
    public pierceCount: number = 1;
    
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
    
    public updateTimer(deltaTime: number): void {
        if (this.fireTimer > 0) {
            this.fireTimer -= deltaTime;
        }
    }
} 