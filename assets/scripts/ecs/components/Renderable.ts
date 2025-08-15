import { Color, SpriteFrame } from 'cc';
import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * 渲染组件 - Sprite图片渲染
 */
@ECSComponent('Renderable')
export class Renderable extends Component {
    public spritePath: string = '';
    public spriteFrame: SpriteFrame | null = null;
    
    public visible: boolean = true;
    public alpha: number = 1;
    
    public colorLerpSpeed: number = 10;
    public targetColor: Color = Color.WHITE;
    public currentColor: Color = Color.WHITE;
    
    public scaleMultiplier: number = 1;
    public targetScale: number = 1;
    public currentScale: number = 1;
    public scaleSpeed: number = 8;
    
    public punchScaleAmount: number = 0.2;
    public punchScaleDuration: number = 0.3;
    public punchScaleTimer: number = 0;
    
    constructor() {
        super();
        this.currentColor = Color.WHITE.clone();
        this.targetColor = Color.WHITE.clone();
    }
    
    public setSprite(spritePath: string, spriteFrame?: SpriteFrame): void {
        this.spritePath = spritePath;
        if (spriteFrame) {
            this.spriteFrame = spriteFrame;
        }
    }
    
    public setColor(color: Color): void {
        this.currentColor = color.clone();
        this.targetColor = color.clone();
    }
    
    public lerpToColor(color: Color): void {
        this.targetColor = color.clone();
    }
    
    public punchScale(amount: number = this.punchScaleAmount, duration: number = this.punchScaleDuration): void {
        this.punchScaleAmount = amount;
        this.punchScaleDuration = duration;
        this.punchScaleTimer = duration;
    }
    
    public updateAnimations(deltaTime: number): void {
        const colorLerpT = Math.min(1, this.colorLerpSpeed * deltaTime);
        this.currentColor.lerp(this.targetColor, colorLerpT);
        
        if (this.punchScaleTimer > 0) {
            this.punchScaleTimer -= deltaTime;
            const t = this.punchScaleTimer / this.punchScaleDuration;
            this.currentScale = this.targetScale + this.punchScaleAmount * (Math.sin(t * Math.PI));
        } else {
            const scaleLerpT = Math.min(1, this.scaleSpeed * deltaTime);
            this.currentScale = this.currentScale + (this.targetScale - this.currentScale) * scaleLerpT;
        }
    }
    
    public onRemovedFromEntity(): void {
        super.onRemovedFromEntity();
        this.spriteFrame = null;
    }
} 