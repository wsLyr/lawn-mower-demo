import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { Transform, Renderable } from '../components';
import { Node, Graphics, director, Color, tween, Layers } from 'cc';

/**
 * 渲染系统 - 负责Graphics绘制和视觉效果
 */
export class RenderSystem extends EntitySystem {
    
    constructor() {
        super(Matcher.empty().all(Transform, Renderable));
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
    }
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const transform = entity.getComponent(Transform);
            const renderable = entity.getComponent(Renderable);
            
            if (!transform || !renderable) continue;
            
            // 更新节点位置
            if (renderable.node) {
                renderable.node.setPosition(transform.position.x, transform.position.y, transform.position.z);
                renderable.node.setRotationFromEuler(0, 0, transform.rotation * 180 / Math.PI);
                renderable.node.setScale(transform.scale.x, transform.scale.y, transform.scale.z);
            }
            
            // 更新动画效果
            renderable.updateAnimations(deltaTime);
            
            // 绘制图形
            renderable.draw();
        }
    }
    

    
    /**
     * 创建带有Graphics组件的节点
     */
    public static createRenderableNode(parent?: Node): { node: Node, graphics: Graphics } {
        const node = new Node();
        const graphics = node.addComponent(Graphics);
        
        if (parent) {
            node.parent = parent;
        } else {
            const canvas = director.getScene()?.getChildByName('Canvas');
            if (canvas) {
                node.parent = canvas;
            }
        }
        
        node.layer = Layers.Enum.UI_2D;
        
        return { node, graphics };
    }
    
    /**
     * 创建角色渲染组件
     */
    public static createPlayerRenderable(parent?: Node): Renderable {
        const { node, graphics } = this.createRenderableNode(parent);
        const renderable = new Renderable(node, graphics);
        
        // 玩家样式
        renderable.shapeType = 'polygon';
        renderable.sides = 3; // 三角形
        renderable.radius = 15;
        renderable.color = new Color(100, 200, 255, 255); // 蓝色
        renderable.strokeColor = new Color(255, 255, 255, 255); // 白色边框
        renderable.strokeWidth = 2;
        renderable.enableShadow = true;
        renderable.shadowOffset = { x: 3, y: 3 };
        renderable.shadowColor = new Color(0, 0, 0, 100);
        
        return renderable;
    }
    
    /**
     * 创建敌人渲染组件
     */
    public static createEnemyRenderable(parent?: Node): Renderable {
        const { node, graphics } = this.createRenderableNode(parent);
        const renderable = new Renderable(node, graphics);
        
        // 敌人样式
        renderable.shapeType = 'circle';
        renderable.radius = 12;
        renderable.color = new Color(255, 100, 100, 255); // 红色
        renderable.strokeColor = new Color(150, 0, 0, 255); // 深红色边框
        renderable.strokeWidth = 1;
        renderable.enableShadow = true;
        renderable.shadowOffset = { x: 2, y: 2 };
        renderable.shadowColor = new Color(0, 0, 0, 80);
        
        return renderable;
    }
    
    /**
     * 创建子弹渲染组件
     */
    public static createBulletRenderable(parent?: Node): Renderable {
        const { node, graphics } = this.createRenderableNode(parent);
        const renderable = new Renderable(node, graphics);
        
        // 子弹样式
        renderable.shapeType = 'circle';
        renderable.radius = 4;
        renderable.color = new Color(255, 255, 100, 255); // 黄色
        renderable.strokeColor = new Color(255, 200, 0, 255); // 橙色边框
        renderable.strokeWidth = 1;
        renderable.enableShadow = false; // 子弹不需要阴影
        
        return renderable;
    }
    
    /**
     * 创建收集物渲染组件
     */
    public static createCollectibleRenderable(parent?: Node): Renderable {
        const { node, graphics } = this.createRenderableNode(parent);
        const renderable = new Renderable(node, graphics);
        
        // 收集物样式
        renderable.shapeType = 'polygon';
        renderable.sides = 6; // 六边形
        renderable.radius = 8;
        renderable.color = new Color(100, 255, 100, 255); // 绿色
        renderable.strokeColor = new Color(0, 200, 0, 255); // 深绿色边框
        renderable.strokeWidth = 1;
        renderable.enableShadow = true;
        renderable.shadowOffset = { x: 1, y: 1 };
        renderable.shadowColor = new Color(0, 0, 0, 60);
        
        return renderable;
    }
    
    /**
     * 播放打击效果
     */
    public static playHitEffect(renderable: Renderable): void {
        // 缩放冲击效果
        renderable.targetScale = 1.3;
        
        // 颜色闪烁效果
        const originalColor = renderable.color.clone();
        renderable.color = Color.WHITE.clone();
        
        // 使用Cocos Creator的tween系统
        tween(renderable)
            .delay(0.1)
            .call(() => {
                renderable.color = originalColor;
                renderable.targetScale = 1.0;
            })
            .start();
    }
    
    /**
     * 播放死亡效果
     */
    public static playDeathEffect(renderable: Renderable): void {
        // 缩放消失效果
        renderable.targetScale = 0;
        
        // 透明度渐变
        tween(renderable)
            .to(0.3, { alpha: 0 })
            .call(() => {
                if (renderable.node) {
                    renderable.node.destroy();
                }
            })
            .start();
    }
} 