import { Component, ECSComponent } from '@esengine/ecs-framework';
import { NetworkVector2 } from './NetworkPlayer';

/**
 * 网络射击事件数据
 */
export interface NetworkShootEvent {
    targetPosition: NetworkVector2;
    weaponType: string;
    timestamp: number;
    sequence: number;
}

/**
 * 网络伤害事件数据
 */
export interface NetworkDamageEvent {
    damage: number;
    targetId: string;
    sourceId: string;
    timestamp: number;
}

/**
 * 网络事件组件（处理RPC事件）
 */
@ECSComponent('NetworkEvents')
export class NetworkEvents extends Component {
    public eventSequence: number = 0;
    
    /**
     * 创建射击事件
     */
    public createShootEvent(targetPosition: NetworkVector2, weaponType: string = 'default'): NetworkShootEvent {
        this.eventSequence++;
        return {
            targetPosition: { ...targetPosition },
            weaponType,
            timestamp: Date.now(),
            sequence: this.eventSequence
        };
    }
    
    /**
     * 创建伤害事件
     */
    public createDamageEvent(damage: number, targetId: string, sourceId: string): NetworkDamageEvent {
        return {
            damage,
            targetId,
            sourceId,
            timestamp: Date.now()
        };
    }
}