import { Component } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

/**
 * 移动组件 - 控制实体的移动行为
 */
export class Movement extends Component {
    public velocity: Vec2 = new Vec2();
    public maxSpeed: number = 100;
    public acceleration: number = 500;
    public friction: number = 800;
    
    // 目标移动方向
    public inputDirection: Vec2 = new Vec2();
    
    // 移动限制
    public enableBounds: boolean = false;
    public bounds: {
        minX: number,
        maxX: number,
        minY: number,
        maxY: number
    } = {
        minX: -400,
        maxX: 400,
        minY: -300,
        maxY: 300
    };
    
    constructor(maxSpeed: number = 100) {
        super();
        this.maxSpeed = maxSpeed;
    }
    
    /**
     * 设置移动方向
     */
    public setDirection(x: number, y: number): void {
        this.inputDirection.set(x, y);
        if (this.inputDirection.length() > 1) {
            this.inputDirection.normalize();
        }
    }
    
    /**
     * 添加冲击力
     */
    public addImpulse(impulse: Vec2): void {
        this.velocity.add(impulse);
    }
    
    /**
     * 获取当前速度大小
     */
    public get speed(): number {
        return this.velocity.length();
    }
    
    /**
     * 获取移动方向（单位向量）
     */
    public get direction(): Vec2 {
        if (this.speed > 0.1) {
            return this.velocity.clone().normalize();
        }
        return new Vec2();
    }
} 