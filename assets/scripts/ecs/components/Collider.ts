import { Component } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

/**
 * 碰撞体组件 - 用于碰撞检测
 */
export class Collider extends Component {
    public radius: number = 10;
    public colliderType: 'circle' | 'rect' = 'circle';
    public width: number = 20;
    public height: number = 20;
    public isTrigger: boolean = false; // 是否为触发器
    public layer: string = 'default'; // 碰撞层级
    
    // 碰撞标签
    public tags: Set<string> = new Set();
    
    constructor(radius: number = 10, layer: string = 'default') {
        super();
        this.radius = radius;
        this.layer = layer;
    }
    
    /**
     * 添加标签
     */
    public addTag(tag: string): void {
        this.tags.add(tag);
    }
    
    /**
     * 检查是否有标签
     */
    public hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }
    
    /**
     * 检查圆形碰撞
     */
    public static checkCircleCollision(pos1: Vec2, radius1: number, pos2: Vec2, radius2: number): boolean {
        const distance = Vec2.distance(pos1, pos2);
        return distance < (radius1 + radius2);
    }
    
    /**
     * 检查矩形碰撞
     */
    public static checkRectCollision(pos1: Vec2, size1: Vec2, pos2: Vec2, size2: Vec2): boolean {
        return Math.abs(pos1.x - pos2.x) < (size1.x + size2.x) / 2 &&
               Math.abs(pos1.y - pos2.y) < (size1.y + size2.y) / 2;
    }
}

// 别名导出，兼容之前的命名
export const ColliderComponent = Collider; 