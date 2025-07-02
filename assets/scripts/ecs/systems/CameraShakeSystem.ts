import { PassiveSystem, Time } from '@esengine/ecs-framework';
import { director, Vec3, tween } from 'cc';

/**
 * 屏幕震动效果数据
 */
interface ShakeEffect {
    intensity: number;
    duration: number;
    frequency: number;
    currentTime: number;
    dampening: number;
}

/**
 * 屏幕震动系统 - 提供各种震动效果来增强游戏反馈
 */
export class CameraShakeSystem extends PassiveSystem {
    private currentShake: ShakeEffect | null = null;
    private originalCameraPosition: Vec3 = new Vec3();
    private cameraNode: any = null;
    
    /**
     * 系统初始化
     */
    public initialize(): void {
        super.initialize();
        
        // 获取摄像机节点
        const scene = director.getScene();
        if (scene) {
            const canvas = scene.getChildByName('Canvas');
            if (canvas) {
                // 在Cocos Creator中，通常使用Canvas作为根节点
                this.cameraNode = canvas;
                this.originalCameraPosition = canvas.position.clone();
            }
        }
    }
    
    /**
     * 系统更新
     */
    public update(): void {
        const deltaTime = Time.deltaTime;
        
        if (!this.currentShake || !this.cameraNode) return;
        
        // 更新震动时间
        this.currentShake.currentTime += deltaTime;
        
        // 检查震动是否结束
        if (this.currentShake.currentTime >= this.currentShake.duration) {
            this.stopShake();
            return;
        }
        
        // 计算震动强度（随时间衰减）
        const progress = this.currentShake.currentTime / this.currentShake.duration;
        const dampening = Math.pow(1 - progress, this.currentShake.dampening);
        const currentIntensity = this.currentShake.intensity * dampening;
        
        // 计算震动偏移
        const time = this.currentShake.currentTime * this.currentShake.frequency;
        const offsetX = Math.sin(time * 1.3) * currentIntensity;
        const offsetY = Math.cos(time * 1.7) * currentIntensity;
        
        // 应用震动
        this.cameraNode.setPosition(
            this.originalCameraPosition.x + offsetX,
            this.originalCameraPosition.y + offsetY,
            this.originalCameraPosition.z
        );
    }
    
    /**
     * 开始震动效果
     */
    public startShake(intensity: number, duration: number, frequency: number = 20, dampening: number = 2): void {
        this.currentShake = {
            intensity,
            duration,
            frequency,
            currentTime: 0,
            dampening
        };
    }
    
    /**
     * 停止震动效果
     */
    public stopShake(): void {
        this.currentShake = null;
        
        if (this.cameraNode) {
            // 平滑回到原位置
            tween(this.cameraNode)
                .to(0.1, { position: this.originalCameraPosition })
                .start();
        }
    }
    
    /**
     * 预设震动效果 - 轻微震动（命中敌人）
     */
    public lightShake(): void {
        this.startShake(2, 0.1, 30, 3);
    }
    
    /**
     * 预设震动效果 - 中等震动（玩家受伤）
     */
    public mediumShake(): void {
        this.startShake(5, 0.2, 25, 2);
    }
    
    /**
     * 预设震动效果 - 强烈震动（敌人死亡）
     */
    public strongShake(): void {
        this.startShake(8, 0.3, 20, 2);
    }
    
    /**
     * 预设震动效果 - 爆炸震动（大范围效果）
     */
    public explosionShake(): void {
        this.startShake(12, 0.5, 15, 1.5);
    }
    
    /**
     * 自定义震动效果
     */
    public customShake(type: 'light' | 'medium' | 'strong' | 'explosion'): void {
        switch (type) {
            case 'light':
                this.lightShake();
                break;
            case 'medium':
                this.mediumShake();
                break;
            case 'strong':
                this.strongShake();
                break;
            case 'explosion':
                this.explosionShake();
                break;
        }
    }
    
    /**
     * 检查是否正在震动
     */
    public get isShaking(): boolean {
        return this.currentShake !== null;
    }
    
    /**
     * 获取当前震动强度
     */
    public get currentIntensity(): number {
        if (!this.currentShake) return 0;
        
        const progress = this.currentShake.currentTime / this.currentShake.duration;
        const dampening = Math.pow(1 - progress, this.currentShake.dampening);
        return this.currentShake.intensity * dampening;
    }
} 