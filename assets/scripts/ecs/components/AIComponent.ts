import { Component } from '@esengine/ecs-framework';

/**
 * AI组件 - 定义AI行为类型和参数
 */
export class AIComponent extends Component {
    public behaviorType: string; // AI行为类型
    public targetTag: string; // 目标标签
    public detectionRange: number = 200; // 检测范围
    public attackRange: number = 50; // 攻击范围
    public maxSpeed: number = 100; // 最大速度
    public acceleration: number = 200; // 加速度
    
    // 状态变量
    public currentState: string = 'idle'; // 当前状态
    public lastStateChangeTime: number = 0; // 上次状态改变时间
    
    constructor(behaviorType: string, targetTag: string = 'player') {
        super();
        this.behaviorType = behaviorType;
        this.targetTag = targetTag;
    }
    
    /**
     * 改变AI状态
     */
    public changeState(newState: string): void {
        if (this.currentState !== newState) {
            this.currentState = newState;
            this.lastStateChangeTime = Date.now();
        }
    }
    
    /**
     * 检查是否在指定状态时间内
     */
    public isInStateFor(duration: number): boolean {
        return (Date.now() - this.lastStateChangeTime) >= duration;
    }
} 