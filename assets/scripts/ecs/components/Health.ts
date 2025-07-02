import { Component } from '@esengine/ecs-framework';

/**
 * 血量组件 - 管理实体的生命值
 */
export class Health extends Component {
    public current: number;
    public max: number;
    
    // 受击效果
    public hitEffectTimer: number = 0;
    public hitEffectDuration: number = 0.2;
    
    // 伤害事件
    public onDamage: ((damage: number) => void) | null = null;
    public onHeal: ((amount: number) => void) | null = null;
    public onDeath: (() => void) | null = null;
    
    constructor(maxHealth: number = 100) {
        super();
        this.max = maxHealth;
        this.current = maxHealth;
    }
    
    /**
     * 受到伤害
     */
    public takeDamage(damage: number): boolean {
        if (this.current <= 0) {
            return false;
        }
        
        this.current = Math.max(0, this.current - damage);
        this.hitEffectTimer = this.hitEffectDuration;
        
        if (this.onDamage) {
            this.onDamage(damage);
        }
        
        if (this.current <= 0 && this.onDeath) {
            this.onDeath();
        }
        
        return true;
    }
    
    /**
     * 恢复血量
     */
    public heal(amount: number): void {
        const oldHealth = this.current;
        this.current = Math.min(this.max, this.current + amount);
        
        if (this.current > oldHealth && this.onHeal) {
            this.onHeal(this.current - oldHealth);
        }
    }
    
    /**
     * 检查是否存活
     */
    public get isAlive(): boolean {
        return this.current > 0;
    }
    
    /**
     * 获取血量百分比
     */
    public get healthPercent(): number {
        return this.current / this.max;
    }
    
    /**
     * 检查是否正在显示受击效果
     */
    public get isShowingHitEffect(): boolean {
        return this.hitEffectTimer > 0;
    }
    
    /**
     * 更新受击效果计时器
     */
    public updateHitEffect(deltaTime: number): void {
        if (this.hitEffectTimer > 0) {
            this.hitEffectTimer -= deltaTime;
        }
    }

}