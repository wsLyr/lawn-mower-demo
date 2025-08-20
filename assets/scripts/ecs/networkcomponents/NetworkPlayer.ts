import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * 网络位置数据结构（平台无关）
 */
export interface NetworkVector2 {
    x: number;
    y: number;
}

/**
 * 网络玩家组件（服务端和客户端共享）
 */
@ECSComponent('NetworkPlayer')
export class NetworkPlayer extends Component {
    public clientId: string = '';
    public isLocalPlayer: boolean = false;
    public isHost: boolean = false;
    public playerName: string = '';
    public team: number = 0;
    public score: number = 0;
    public kills: number = 0;
    public deaths: number = 0;
    public joinTime: number = 0;
    public lastUpdateTime: number = 0;
    public ping: number = 0;
    public isReady: boolean = false;
    
    // 网络同步的位置和状态（使用SyncVar）
    // @SyncVar
    public networkPosition: NetworkVector2 = { x: 0, y: 0 };
    // @SyncVar
    public networkRotation: number = 0;
    // @SyncVar
    public networkVelocity: NetworkVector2 = { x: 0, y: 0 };
    public lastNetworkUpdate: number = 0;
    
    // 插值相关
    public interpolationSpeed: number = 10;
    public enableInterpolation: boolean = true;
    
    // 预测相关（用于本地玩家）
    public enablePrediction: boolean = true;
    public lastInputSequence: number = 0;
    
    public customData: Record<string, any> = {};

    public init(clientId: string, isLocalPlayer: boolean = false, playerName: string = '') {
        this.clientId = clientId;
        this.isLocalPlayer = isLocalPlayer;
        this.playerName = playerName || `Player_${clientId.slice(-4)}`;
        this.joinTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.lastNetworkUpdate = Date.now();
        return this;
    }

    public updateStats(kills: number = 0, deaths: number = 0, score: number = 0) {
        this.kills += kills;
        this.deaths += deaths;
        this.score += score;
        this.lastUpdateTime = Date.now();
    }

    public updatePing(ping: number) {
        this.ping = ping;
        this.lastUpdateTime = Date.now();
    }

    public setReady(ready: boolean) {
        this.isReady = ready;
        this.lastUpdateTime = Date.now();
    }

    /**
     * 更新网络位置信息
     */
    public updateNetworkTransform(position: NetworkVector2, rotation: number = 0, velocity?: NetworkVector2) {
        this.networkPosition.x = position.x;
        this.networkPosition.y = position.y;
        this.networkRotation = rotation;
        if (velocity) {
            this.networkVelocity.x = velocity.x;
            this.networkVelocity.y = velocity.y;
        }
        this.lastNetworkUpdate = Date.now();
        this.lastUpdateTime = Date.now();
    }

    /**
     * 检查是否需要网络更新
     */
    public shouldSendNetworkUpdate(threshold: number = 1.0): boolean {
        const timeSinceLastUpdate = Date.now() - this.lastNetworkUpdate;
        return timeSinceLastUpdate > threshold;
    }

    public getSessionTime(): number {
        return Date.now() - this.joinTime;
    }

    public isActive(): boolean {
        return Date.now() - this.lastUpdateTime < 30000; // 30秒内有活动
    }

    public getNetworkLatency(): number {
        return this.ping;
    }

    /**
     * 获取插值后的位置（用于平滑移动）
     * 注意：这个方法在客户端需要特殊处理，因为需要具体的Vec2实现
     */
    public getInterpolatedPosition(currentPosition: NetworkVector2, deltaTime: number): NetworkVector2 {
        if (!this.enableInterpolation || this.isLocalPlayer) {
            return currentPosition;
        }

        const lerpFactor = Math.min(1.0, deltaTime * this.interpolationSpeed);
        return {
            x: currentPosition.x + (this.networkPosition.x - currentPosition.x) * lerpFactor,
            y: currentPosition.y + (this.networkPosition.y - currentPosition.y) * lerpFactor
        };
    }
}