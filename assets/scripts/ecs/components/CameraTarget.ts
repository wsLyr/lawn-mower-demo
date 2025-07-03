import { Component } from '@esengine/ecs-framework';

/**
 * 相机目标组件 - 标记实体为相机跟随目标
 */
export class CameraTarget extends Component {
    public priority: number = 1; // 优先级，数字越大优先级越高
    public smoothing: number = 0.1; // 平滑因子
    public offset: { x: number, y: number } = { x: 0, y: 0 }; // 偏移量
    
    constructor(priority: number = 1) {
        super();
        this.priority = priority;
    }
    
    /**
     * 设置偏移量
     */
    public setOffset(x: number, y: number): void {
        this.offset.x = x;
        this.offset.y = y;
    }
    
    /**
     * 设置平滑因子
     */
    public setSmoothing(smoothing: number): void {
        this.smoothing = Math.max(0, Math.min(1, smoothing));
    }
} 