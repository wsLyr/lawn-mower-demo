import { Component } from '@esengine/ecs-framework';
import { Node, Collider2D, CircleCollider2D, BoxCollider2D, RigidBody2D, ERigidBody2DType, Contact2DType } from 'cc';

/**
 * 碰撞体组件
 * 用于ECS框架与Cocos Creator物理系统的桥接
 */
export class ColliderComponent extends Component {
    public node: Node | null = null;
    public collider: Collider2D | null = null;
    public rigidBody: RigidBody2D | null = null;
    
    public layer: string = 'default';
    public colliderType: 'circle' | 'box' = 'circle';
    public isTrigger: boolean = true; // 默认为触发器
    public rigidBodyType: ERigidBody2DType = ERigidBody2DType.Kinematic;
    public tags: Set<string> = new Set();
    
    public onCollisionEnter: ((otherNode: Node) => void) | null = null;
    public onCollisionStay: ((otherNode: Node) => void) | null = null;
    public onCollisionExit: ((otherNode: Node) => void) | null = null;
    
    constructor(node?: Node, colliderType: 'circle' | 'box' = 'circle', layer: string = 'default', rigidBodyType: ERigidBody2DType = ERigidBody2DType.Kinematic) {
        super();
        this.colliderType = colliderType;
        this.layer = layer;
        this.rigidBodyType = rigidBodyType;
        
        if (node) {
            this.setupCollider(node);
        }
    }
    
    /**
     * 设置节点并创建碰撞体
     */
    public setupCollider(node: Node): void {
        this.node = node;
        
        this.rigidBody = node.getComponent(RigidBody2D);
        if (!this.rigidBody) {
            this.rigidBody = node.addComponent(RigidBody2D);
        }
        
        this.rigidBody.type = this.rigidBodyType;
        // 关键：启用碰撞监听器
        this.rigidBody.enabledContactListener = true;
        
        if (this.colliderType === 'circle') {
            this.collider = node.addComponent(CircleCollider2D);
            (this.collider as CircleCollider2D).radius = 10;
        } else {
            this.collider = node.addComponent(BoxCollider2D);
            (this.collider as BoxCollider2D).size.set(20, 20);
        }
        
        this.collider.sensor = this.isTrigger;
        
        // 确保碰撞体启用
        this.collider.enabled = true;
        this.rigidBody.enabled = true;
        
        this.setupCollisionCallbacks();
    }
    
    /**
     * 设置碰撞体大小
     */
    public setSize(size: number): void {
        if (!this.collider) return;
        
        if (this.colliderType === 'circle' && this.collider instanceof CircleCollider2D) {
            this.collider.radius = size;
        } else if (this.colliderType === 'box' && this.collider instanceof BoxCollider2D) {
            this.collider.size.set(size, size);
        }
    }
    
    /**
     * 设置碰撞体尺寸（矩形专用）
     */
    public setBoxSize(width: number, height: number): void {
        if (this.colliderType === 'box' && this.collider instanceof BoxCollider2D) {
            this.collider.size.set(width, height);
        }
    }
    
    /**
     * 添加标签
     */
    public addTag(tag: string): void {
        this.tags.add(tag);
    }
    
    /**
     * 移除标签
     */
    public removeTag(tag: string): void {
        this.tags.delete(tag);
    }
    
    /**
     * 检查是否有标签
     */
    public hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }
    
    /**
     * 设置是否为触发器
     */
    public setTrigger(isTrigger: boolean): void {
        this.isTrigger = isTrigger;
        if (this.collider) {
            this.collider.sensor = isTrigger;
        }
    }
    
    /**
     * 设置碰撞回调
     */
    private setupCollisionCallbacks(): void {
        if (!this.collider) return;
        
        if (this.isTrigger) {
            // 触发器事件
            this.collider.on(Contact2DType.BEGIN_CONTACT, (selfCollider: Collider2D, otherCollider: Collider2D) => {
                if (this.onCollisionEnter) {
                    this.onCollisionEnter(otherCollider.node);
                }
            }, this);
            
            this.collider.on(Contact2DType.END_CONTACT, (selfCollider: Collider2D, otherCollider: Collider2D) => {
                if (this.onCollisionExit) {
                    this.onCollisionExit(otherCollider.node);
                }
            }, this);
        } else {
            // 物理碰撞事件
            this.collider.on(Contact2DType.BEGIN_CONTACT, (selfCollider: Collider2D, otherCollider: Collider2D) => {
                if (this.onCollisionEnter) {
                    this.onCollisionEnter(otherCollider.node);
                }
            }, this);
            
            this.collider.on(Contact2DType.PRE_SOLVE, (selfCollider: Collider2D, otherCollider: Collider2D) => {
                if (this.onCollisionStay) {
                    this.onCollisionStay(otherCollider.node);
                }
            }, this);
            
            this.collider.on(Contact2DType.END_CONTACT, (selfCollider: Collider2D, otherCollider: Collider2D) => {
                if (this.onCollisionExit) {
                    this.onCollisionExit(otherCollider.node);
                }
            }, this);
        }
    }
    
    /**
     * 启用碰撞体
     */
    public enable(): void {
        if (this.collider) {
            this.collider.enabled = true;
        }
        if (this.rigidBody) {
            this.rigidBody.enabled = true;
        }
    }
    
    /**
     * 禁用碰撞体
     */
    public disable(): void {
        if (this.collider) {
            this.collider.enabled = false;
        }
        if (this.rigidBody) {
            this.rigidBody.enabled = false;
        }
    }
    
    /**
     * 检查与另一个碰撞体的距离
     */
    public getDistanceTo(other: ColliderComponent): number {
        if (!this.node || !other.node) return Infinity;
        
        const pos1 = this.node.getWorldPosition();
        const pos2 = other.node.getWorldPosition();
        
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + 
            Math.pow(pos2.y - pos1.y, 2)
        );
    }
    
    /**
     * 组件从实体移除时的清理回调 - ECS框架标准
     */
    public override onRemovedFromEntity(): void {
        // 清理事件监听
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT);
            this.collider.off(Contact2DType.PRE_SOLVE);
            this.collider.off(Contact2DType.END_CONTACT);
        }
        
        // 注意：这里不销毁node，因为Renderable组件会负责销毁
        // 只清理引用和回调
        this.node = null;
        this.collider = null;
        this.rigidBody = null;
        this.onCollisionEnter = null;
        this.onCollisionStay = null;
        this.onCollisionExit = null;
        
        super.onRemovedFromEntity();
    }
} 