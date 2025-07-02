import { Component } from '@esengine/ecs-framework';
import { Graphics, Color, Node } from 'cc';

/**
 * 渲染组件 - 负责Graphics绘制
 */
export class Renderable extends Component {
    public graphics: Graphics;
    public node: Node;
    
    // 视觉属性
    public color: Color = Color.WHITE.clone();
    public originalColor: Color = Color.WHITE.clone();
    public strokeColor: Color = Color.BLACK.clone();
    public strokeWidth: number = 2;
    public alpha: number = 1;
    
    // 形状类型
    public shapeType: 'circle' | 'rect' | 'polygon' = 'circle';
    public radius: number = 10;
    public width: number = 20;
    public height: number = 20;
    public sides: number = 6; // 多边形边数
    
    // 视觉效果
    public enableShadow: boolean = true;
    public shadowOffset: { x: number, y: number } = { x: 2, y: 2 };
    public shadowColor: Color = new Color(0, 0, 0, 100);
    public shadowBlur: number = 4;
    
    // 动画属性
    public scale: number = 1;
    public targetScale: number = 1;
    public scaleSpeed: number = 5;
    
    // 颜色动画属性
    public targetColor: Color | null = null;
    public colorLerpSpeed: number = 5;
    
    // 缩放动画属性
    public originalScale: number = 1;
    public punchScaleTarget: number = 1;
    public punchScaleTimer: number = 0;
    public punchScaleDuration: number = 0;
    
    constructor(node: Node, graphics: Graphics) {
        super();
        this.node = node;
        this.graphics = graphics;
    }
    
    /**
     * 绘制形状
     */
    public draw(): void {
        if (!this.graphics) {
            console.error('Graphics component is null!');
            return;
        }
        
        // 清除之前的绘制
        this.graphics.clear();
        
        // 设置透明度
        const color = this.color.clone();
        color.a = Math.floor(this.alpha * 255);
        
        // 绘制阴影
        if (this.enableShadow) {
            this.drawShadow();
        }
        
        // 设置绘制属性
        this.graphics.fillColor = color;
        this.graphics.strokeColor = this.strokeColor;
        this.graphics.lineWidth = this.strokeWidth;
        
        const scaledRadius = this.radius * this.scale;
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        
        // 开始绘制路径
        switch (this.shapeType) {
            case 'circle':
                this.graphics.circle(0, 0, scaledRadius);
                break;
            case 'rect':
                this.graphics.rect(-scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);
                break;
            case 'polygon':
                this.drawPolygon(scaledRadius);
                break;
        }
        
        // 执行绘制
        this.graphics.fill();
        if (this.strokeWidth > 0) {
            this.graphics.stroke();
        }
    }
    
    /**
     * 绘制阴影
     */
    private drawShadow(): void {
        if (!this.graphics) return;
        
        const shadowColor = this.shadowColor.clone();
        shadowColor.a = Math.floor(this.alpha * shadowColor.a);
        
        // 保存当前填充颜色
        const originalFillColor = this.graphics.fillColor;
        
        // 设置阴影颜色
        this.graphics.fillColor = shadowColor;
        
        const scaledRadius = this.radius * this.scale;
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        
        switch (this.shapeType) {
            case 'circle':
                this.graphics.circle(this.shadowOffset.x, this.shadowOffset.y, scaledRadius);
                break;
            case 'rect':
                this.graphics.rect(
                    -scaledWidth/2 + this.shadowOffset.x, 
                    -scaledHeight/2 + this.shadowOffset.y, 
                    scaledWidth, 
                    scaledHeight
                );
                break;
            case 'polygon':
                this.drawPolygon(scaledRadius, this.shadowOffset.x, this.shadowOffset.y);
                break;
        }
        
        // 填充阴影
        this.graphics.fill();
        
        // 恢复原始填充颜色
        this.graphics.fillColor = originalFillColor;
    }
    
    /**
     * 绘制多边形
     */
    private drawPolygon(radius: number, offsetX: number = 0, offsetY: number = 0): void {
        if (this.sides < 3) return;
        
        const angleStep = Math.PI * 2 / this.sides;
        let angle = -Math.PI / 2; // 从顶部开始
        
        // 移动到第一个点
        let x = Math.cos(angle) * radius + offsetX;
        let y = Math.sin(angle) * radius + offsetY;
        this.graphics.moveTo(x, y);
        
        // 绘制其余点
        for (let i = 1; i < this.sides; i++) {
            angle += angleStep;
            x = Math.cos(angle) * radius + offsetX;
            y = Math.sin(angle) * radius + offsetY;
            this.graphics.lineTo(x, y);
        }
        
        this.graphics.close();
    }
    
    /**
     * 设置基础颜色
     */
    public setColor(color: Color): void {
        this.color = color.clone();
        this.originalColor = color.clone();
    }
    
    /**
     * 设置颜色渐变效果
     */
    public setColorLerp(targetColor: Color, speed: number = 5): void {
        this.targetColor = targetColor.clone();
        this.colorLerpSpeed = speed;
    }
    
    /**
     * 缩放动画
     */
    public punchScale(scale: number = 1.2, duration: number = 0.2): void {
        this.originalScale = this.scale;
        this.punchScaleTarget = scale;
        this.punchScaleDuration = duration;
        this.punchScaleTimer = 0;
    }
    
    /**
     * 更新动画效果
     */
    public updateAnimations(deltaTime: number): void {
        // 更新颜色插值
        if (this.targetColor) {
            const lerpFactor = Math.min(1, this.colorLerpSpeed * deltaTime);
            this.color.r = this.color.r + (this.targetColor.r - this.color.r) * lerpFactor;
            this.color.g = this.color.g + (this.targetColor.g - this.color.g) * lerpFactor;
            this.color.b = this.color.b + (this.targetColor.b - this.color.b) * lerpFactor;
            this.color.a = this.color.a + (this.targetColor.a - this.color.a) * lerpFactor;
            
            // 如果接近目标颜色，停止插值
            const colorDistance = Math.abs(this.color.r - this.targetColor.r) + 
                                 Math.abs(this.color.g - this.targetColor.g) + 
                                 Math.abs(this.color.b - this.targetColor.b) + 
                                 Math.abs(this.color.a - this.targetColor.a);
            if (colorDistance < 0.04) {
                this.color = this.targetColor.clone();
                this.targetColor = null;
            }
        }
        
        // 更新缩放动画
        if (this.punchScaleDuration > 0) {
            this.punchScaleTimer += deltaTime;
            const progress = this.punchScaleTimer / this.punchScaleDuration;
            
            if (progress >= 1) {
                // 动画结束，恢复原始缩放
                this.scale = this.originalScale;
                this.punchScaleDuration = 0;
                this.punchScaleTimer = 0;
            } else {
                // 使用ease-out缓动函数
                const easeOut = 1 - Math.pow(1 - progress, 3);
                if (progress <= 0.5) {
                    // 前半段：放大到目标缩放
                    const scaleProgress = progress * 2;
                    this.scale = this.originalScale + (this.punchScaleTarget - this.originalScale) * easeOut * scaleProgress;
                } else {
                    // 后半段：缩回原始缩放
                    const scaleProgress = (progress - 0.5) * 2;
                    this.scale = this.punchScaleTarget - (this.punchScaleTarget - this.originalScale) * easeOut * scaleProgress;
                }
            }
        }
        
        // 更新普通缩放插值
        if (Math.abs(this.scale - this.targetScale) > 0.01) {
            const lerpFactor = Math.min(1, this.scaleSpeed * deltaTime);
            this.scale = this.scale + (this.targetScale - this.scale) * lerpFactor;
        }
    }
    
    /**
     * 组件从实体移除时的清理回调 - ECS框架标准
     */
    public override onRemovedFromEntity(): void {
        // 销毁对应的Cocos Creator节点
        if (this.node && this.node.isValid) {
            this.node.destroy();
        }
        
        this.node = null;
        this.graphics = null;
        
        super.onRemovedFromEntity();
    }
} 