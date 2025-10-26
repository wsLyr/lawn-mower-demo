import { Component, ECSComponent } from '@esengine/ecs-framework';
import { NetworkVector2 } from './NetworkPlayer';

/**
 * 网络输入数据结构
 */
export interface NetworkInputData {
    inputDirection: NetworkVector2;
    position: NetworkVector2;
    sequence: number;
    timestamp: number;
}

/**
 * 网络输入组件（服务端和客户端共享）
 */
@ECSComponent('NetworkInput')
export class NetworkInput extends Component {
    public inputSequence: number = 0;
    public lastInputTime: number = 0;
    public pendingInputs: NetworkInputData[] = [];
    
    // 输入预测相关
    public enablePrediction: boolean = true;
    public maxPendingInputs: number = 60; // 最多保存60帧的输入
    
    /**
     * 添加输入数据
     */
    public addInput(inputDirection: NetworkVector2, position: NetworkVector2): NetworkInputData {
        this.inputSequence++;
        const inputData: NetworkInputData = {
            inputDirection: { ...inputDirection },
            position: { ...position },
            sequence: this.inputSequence,
            timestamp: Date.now()
        };
        
        // 保存输入用于预测校正
        if (this.enablePrediction) {
            this.pendingInputs.push(inputData);
            
            // 限制队列长度
            if (this.pendingInputs.length > this.maxPendingInputs) {
                this.pendingInputs.shift();
            }
        }
        
        this.lastInputTime = Date.now();
        return inputData;
    }
    
    /**
     * 移除已确认的输入
     */
    public acknowledgeInput(sequence: number): void {
        this.pendingInputs = this.pendingInputs.filter(input => input.sequence > sequence);
    }
    
    /**
     * 获取未确认的输入
     */
    public getPendingInputs(): NetworkInputData[] {
        return [...this.pendingInputs];
    }
    
    /**
     * 清理过期的输入
     */
    public cleanupOldInputs(maxAge: number = 5000): void {
        const now = Date.now();
        this.pendingInputs = this.pendingInputs.filter(input => now - input.timestamp < maxAge);
    }
}