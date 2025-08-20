import { Scene, Entity, World } from '@esengine/ecs-framework';
import { NetworkPlayer, NetworkInput, NetworkEvents } from '../networkcomponents';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('Room');

/**
 * 房间配置接口
 */
export interface RoomConfig {
    id: string;
    name: string;
    maxPlayers: number;
    gameMode?: string;
    isPrivate?: boolean;
}

/**
 * 房间状态枚举
 */
export enum RoomState {
    WAITING = 'waiting',     // 等待玩家
    STARTING = 'starting',   // 开始游戏
    PLAYING = 'playing',     // 游戏中
    ENDED = 'ended'          // 游戏结束
}

/**
 * 玩家会话信息
 */
export interface PlayerSession {
    id: string;
    name: string;
    entity: Entity;
    joinTime: number;
    isReady: boolean;
}

/**
 * 房间类 - 管理单个游戏房间
 * 
 * 每个房间拥有独立的ECS Scene，实现完全隔离的游戏环境
 */
export class Room {
    public readonly id: string;
    public readonly name: string;
    public readonly maxPlayers: number;
    public readonly gameMode: string;
    public readonly isPrivate: boolean;
    
    private _state: RoomState = RoomState.WAITING;
    private _world: World;
    private _gameScene: Scene;
    private _players: Map<string, PlayerSession> = new Map();
    private _createdAt: number;

    constructor(config: RoomConfig) {
        this.id = config.id;
        this.name = config.name;
        this.maxPlayers = config.maxPlayers;
        this.gameMode = config.gameMode || 'default';
        this.isPrivate = config.isPrivate || false;
        this._createdAt = Date.now();

        // 创建房间专用的World和Scene
        this._world = new World({
            name: `room_${this.id}`,
            maxScenes: 5, // 游戏Scene + UI Scene等
            autoCleanup: true
        });
        
        // 在World中创建游戏Scene
        this._gameScene = this._world.createScene('game', new Scene());
        this._gameScene.name = this.name;
        
        // 激活World和Scene
        this._world.start();
        this._world.setSceneActive('game', true);

        logger.info(`房间创建成功: ${this.name} (${this.id}), 最大玩家数: ${this.maxPlayers}`);
    }

    // ===== 属性访问器 =====

    public get state(): RoomState {
        return this._state;
    }

    public get world(): World {
        return this._world;
    }

    public get gameScene(): Scene {
        return this._gameScene;
    }

    public get playerCount(): number {
        return this._players.size;
    }

    public get players(): PlayerSession[] {
        return Array.from(this._players.values());
    }

    public get isFull(): boolean {
        return this._players.size >= this.maxPlayers;
    }

    public get isEmpty(): boolean {
        return this._players.size === 0;
    }

    public get createdAt(): number {
        return this._createdAt;
    }

    // ===== 玩家管理 =====

    /**
     * 玩家加入房间
     */
    public addPlayer(playerId: string, playerName: string): boolean {
        if (this.isFull) {
            logger.warn(`房间已满，无法加入: ${playerId}`);
            return false;
        }

        if (this._players.has(playerId)) {
            logger.warn(`玩家已在房间中: ${playerId}`);
            return false;
        }

        if (this._state !== RoomState.WAITING && this._state !== RoomState.STARTING) {
            logger.warn(`房间状态不允许加入: ${this._state}`);
            return false;
        }

        // 在房间的游戏Scene中创建玩家实体
        const playerEntity = this._gameScene.createEntity(`Player_${playerId}`);
        
        // 添加网络组件
        const networkPlayer = new NetworkPlayer();
        networkPlayer.init(playerId, false, playerName);
        playerEntity.addComponent(networkPlayer);

        const networkInput = new NetworkInput();
        playerEntity.addComponent(networkInput);

        const networkEvents = new NetworkEvents();
        playerEntity.addComponent(networkEvents);

        // 创建玩家会话
        const session: PlayerSession = {
            id: playerId,
            name: playerName,
            entity: playerEntity,
            joinTime: Date.now(),
            isReady: false
        };

        this._players.set(playerId, session);
        logger.info(`玩家加入房间: ${playerName} (${playerId}) -> ${this.name}`);

        return true;
    }

    /**
     * 玩家离开房间
     */
    public removePlayer(playerId: string): boolean {
        const session = this._players.get(playerId);
        if (!session) {
            return false;
        }

        // 销毁玩家实体
        session.entity.destroy();
        
        // 从玩家列表中移除
        this._players.delete(playerId);
        
        logger.info(`玩家离开房间: ${session.name} (${playerId}) <- ${this.name}`);

        // 如果房间为空，可能需要销毁房间
        if (this.isEmpty && this._state !== RoomState.ENDED) {
            this._state = RoomState.ENDED;
            logger.info(`房间变为空，标记为结束: ${this.name}`);
        }

        return true;
    }

    /**
     * 获取玩家会话
     */
    public getPlayer(playerId: string): PlayerSession | null {
        return this._players.get(playerId) || null;
    }

    /**
     * 设置玩家准备状态
     */
    public setPlayerReady(playerId: string, ready: boolean): boolean {
        const session = this._players.get(playerId);
        if (!session) {
            return false;
        }

        session.isReady = ready;
        logger.debug(`玩家准备状态更新: ${session.name} -> ${ready}`);

        return true;
    }

    /**
     * 检查所有玩家是否准备就绪
     */
    public areAllPlayersReady(): boolean {
        if (this._players.size === 0) {
            return false;
        }

        return Array.from(this._players.values()).every(player => player.isReady);
    }

    // ===== 房间状态管理 =====

    /**
     * 开始游戏
     */
    public startGame(): boolean {
        if (this._state !== RoomState.WAITING) {
            return false;
        }

        if (this._players.size === 0) {
            return false;
        }

        this._state = RoomState.STARTING;
        logger.info(`房间开始游戏: ${this.name}`);

        // 3秒后进入游戏状态
        setTimeout(() => {
            if (this._state === RoomState.STARTING) {
                this._state = RoomState.PLAYING;
                logger.info(`房间进入游戏状态: ${this.name}`);
            }
        }, 3000);

        return true;
    }

    /**
     * 结束游戏
     */
    public endGame(): void {
        this._state = RoomState.ENDED;
        logger.info(`房间游戏结束: ${this.name}`);
    }

    /**
     * 重置房间到等待状态
     */
    public reset(): void {
        this._state = RoomState.WAITING;
        
        // 重置所有玩家状态
        for (const session of this._players.values()) {
            session.isReady = false;
        }

        logger.info(`房间重置: ${this.name}`);
    }

    // ===== 消息处理 =====

    /**
     * 处理房间内的游戏消息
     */
    public handleGameMessage(senderId: string, message: any): void {
        const session = this._players.get(senderId);
        if (!session) {
            logger.warn(`收到未知玩家的消息: ${senderId}`);
            return;
        }

        const { gameMessageType, payload } = message.data;

        switch (gameMessageType) {
            case 'player_input':
                this.handlePlayerInput(session, payload);
                break;
            case 'player_shoot':
                this.handlePlayerShoot(session, payload);
                break;
            default:
                logger.debug(`未处理的房间消息类型: ${gameMessageType}`);
        }
    }

    /**
     * 处理玩家输入
     */
    private handlePlayerInput(session: PlayerSession, payload: any): void {
        const networkPlayer = session.entity.getComponent(NetworkPlayer);
        const networkInput = session.entity.getComponent(NetworkInput);
        
        if (networkPlayer && networkInput && payload.inputDirection && payload.position) {
            // 更新玩家位置
            networkPlayer.updateNetworkTransform(
                payload.position,
                payload.rotation || 0,
                payload.velocity
            );

            // 记录输入用于预测校正
            networkInput.addInput(payload.inputDirection, payload.position);
        }
    }

    /**
     * 处理玩家射击
     */
    private handlePlayerShoot(session: PlayerSession, payload: any): void {
        const networkEvents = session.entity.getComponent(NetworkEvents);
        if (networkEvents && payload.targetPosition) {
            const shootEvent = networkEvents.createShootEvent(
                payload.targetPosition,
                payload.weaponType || 'default'
            );

            logger.debug(`房间内射击事件: ${session.name} -> ${JSON.stringify(shootEvent)}`);
        }
    }

    /**
     * 向房间内所有玩家广播消息
     */
    public broadcast(message: any, excludePlayerId?: string): void {
        // 这个方法需要与上层的网络层集成
        // 暂时记录日志
        logger.debug(`房间广播消息 (排除: ${excludePlayerId}):`, message);
    }

    // ===== 资源清理 =====

    /**
     * 销毁房间
     */
    public destroy(): void {
        logger.info(`销毁房间: ${this.name} (${this.id})`);

        // 移除所有玩家
        const playerIds = Array.from(this._players.keys());
        for (const playerId of playerIds) {
            this.removePlayer(playerId);
        }

        // 销毁World（会自动销毁所有Scene）
        this._world.destroy();

        this._state = RoomState.ENDED;
    }

    // ===== 调试和状态信息 =====

    /**
     * 获取房间状态信息
     */
    public getStatus() {
        return {
            id: this.id,
            name: this.name,
            state: this._state,
            playerCount: this._players.size,
            maxPlayers: this.maxPlayers,
            players: Array.from(this._players.values()).map(p => ({
                id: p.id,
                name: p.name,
                isReady: p.isReady,
                joinTime: p.joinTime
            })),
            createdAt: this._createdAt,
            gameMode: this.gameMode,
            isPrivate: this.isPrivate
        };
    }
}