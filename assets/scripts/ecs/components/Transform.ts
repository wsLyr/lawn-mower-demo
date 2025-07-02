import { Component } from '@esengine/ecs-framework';
import { Vec3, Vec2 } from 'cc';

/**
 * 变换组件 - 存储实体的位置、旋转、缩放信息
 */
export class Transform extends Component {
    public position: Vec3 = new Vec3();
    public rotation: number = 0; // 旋转角度（弧度）
    public scale: Vec3 = new Vec3(1, 1, 1);
    
    // 上一帧的位置，用于计算移动方向和距离
    public previousPosition: Vec3 = new Vec3();
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.position.set(x, y, z);
        this.previousPosition.set(x, y, z);
    }
    
    /**
     * 获取2D位置向量
     */
    public get position2D(): Vec2 {
        return new Vec2(this.position.x, this.position.y);
    }
    
    /**
     * 设置2D位置
     */
    public setPosition2D(x: number, y: number): void {
        this.previousPosition.set(this.position);
        this.position.set(x, y, this.position.z);
    }
    
    /**
     * 获取移动速度向量
     */
    public getVelocity(deltaTime: number): Vec2 {
        const dx = this.position.x - this.previousPosition.x;
        const dy = this.position.y - this.previousPosition.y;
        return new Vec2(dx / deltaTime, dy / deltaTime);
    }
} 
