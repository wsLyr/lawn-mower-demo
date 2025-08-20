import { createLogger } from '@esengine/ecs-framework';
import { 
    RpcCallHandler, 
    RpcMetadataManager,
    RpcCallProxy,
    RpcCallRequest,
    RpcCallResponse 
} from '@esengine/network-server';

/**
 * 玩家数据
 */
interface PlayerData {
    clientId: string;
    playerName: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    health: number;
    score: number;
    kills: number;
    deaths: number;
    team: number;
    isReady: boolean;
    joinTime: number;
    lastUpdateTime: number;
}

/**
 * 游戏状态
 */
interface GameState {
    players: PlayerData[];
    enemies: Array<{
        id: string;
        position: { x: number; y: number; z: number };
        health: number;
        type: string;
    }>;
    collectibles: Array<{
        id: string;
        position: { x: number; y: number; z: number };
        type: string;
    }>;
    gameTime: number;
    waveNumber: number;
}

/**
 * 游戏服务器RPC处理器
 * 处理客户端发送的RPC请求
 */
export class GameServerRpcHandler {
    private logger = createLogger('GameServerRpcHandler');
    private rpcHandler: RpcCallHandler;
    private metadataManager: RpcMetadataManager;
    private clientProxies: Map<string, RpcCallProxy> = new Map();
    
    // 游戏状态
    private players: Map<string, PlayerData> = new Map();
    private gameState: GameState = {
        players: [],
        enemies: [],
        collectibles: [],
        gameTime: 0,
        waveNumber: 1
    };
    private gameStartTime: number = Date.now();
    private hostPlayerId: string | null = null;

    constructor() {
        this.metadataManager = new RpcMetadataManager();
        this.rpcHandler = new RpcCallHandler(this.metadataManager);

        // 注册RPC方法
        this.metadataManager.registerClass(this);
        this.setupGameLoop();
    }

    /**
     * 添加客户端代理
     */
    public addClientProxy(clientId: string, proxy: RpcCallProxy): void {
        this.clientProxies.set(clientId, proxy);
    }

    /**
     * 移除客户端代理
     */
    public removeClientProxy(clientId: string): void {
        this.clientProxies.delete(clientId);
        this.handlePlayerLeave(clientId);
    }

    /**
     * 处理RPC调用
     */
    public async handleRpcCall(request: RpcCallRequest): Promise<RpcCallResponse> {
        return await this.rpcHandler.handleCall(request);
    }

    /**
     * 玩家加入游戏
     */
    public async joinGame(playerName: string, gameVersion: string, senderId: string): Promise<{ success: boolean; playerId: string; isHost: boolean }> {
        this.logger.info(`玩家 ${playerName} 尝试加入游戏`);

        // 检查游戏版本
        if (gameVersion !== '1.0.0') {
            return { success: false, playerId: '', isHost: false };
        }

        // 检查玩家是否已存在
        if (this.players.has(senderId)) {
            const existingPlayer = this.players.get(senderId)!;
            return { 
                success: true, 
                playerId: existingPlayer.clientId, 
                isHost: this.hostPlayerId === senderId 
            };
        }

        // 创建新玩家
        const isHost = this.players.size === 0;
        if (isHost) {
            this.hostPlayerId = senderId;
        }

        const playerData: PlayerData = {
            clientId: senderId,
            playerName,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            health: 100,
            score: 0,
            kills: 0,
            deaths: 0,
            team: 0,
            isReady: false,
            joinTime: Date.now(),
            lastUpdateTime: Date.now()
        };

        this.players.set(senderId, playerData);
        this.updateGameState();

        // 通知所有其他客户端有新玩家加入
        await this.broadcastToOthers('onPlayerJoined', [playerData], senderId);

        // 向新玩家发送当前游戏状态
        const clientProxy = this.clientProxies.get(senderId);
        if (clientProxy) {
            try {
                await clientProxy.call('onGameStateUpdate', [this.gameState]);
                
                // 发送所有现有玩家信息
                for (const [playerId, player] of this.players) {
                    if (playerId !== senderId) {
                        await clientProxy.call('onPlayerJoined', [player]);
                    }
                }
            } catch (error) {
                this.logger.warn(`向新玩家发送游戏状态失败: ${error}`);
            }
        }

        return { success: true, playerId: senderId, isHost };
    }

    /**
     * 更新玩家位置
     */
    public async updatePlayerPosition(positionData: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; timestamp: number }, senderId: string): Promise<void> {
        const player = this.players.get(senderId);
        if (!player) {
            return;
        }

        player.position = positionData.position;
        player.rotation = positionData.rotation;
        player.lastUpdateTime = Date.now();

        // 广播位置更新给其他玩家
        await this.broadcastToOthers('onPlayerPositionUpdate', [senderId, positionData], senderId);
    }

    /**
     * 玩家射击
     */
    public async playerShoot(shootData: { targetPosition: { x: number; y: number; z: number }; weaponType: string; timestamp: number }, senderId: string): Promise<void> {
        const player = this.players.get(senderId);
        if (!player) {
            return;
        }

        this.logger.info(`玩家 ${player.playerName} 射击`);

        // 广播射击事件给所有其他玩家
        await this.broadcastToOthers('onPlayerShoot', [senderId, shootData], senderId);
    }

    /**
     * 发送聊天消息
     */
    public async sendChatMessage(chatData: { message: string; playerName: string; timestamp: number }, senderId: string): Promise<void> {
        const player = this.players.get(senderId);
        if (!player) {
            return;
        }

        this.logger.info(`玩家 ${player.playerName} 发送聊天: ${chatData.message}`);

        // 广播聊天消息给所有玩家（包括发送者）
        await this.broadcastToAll('onChatMessage', [senderId, chatData]);
    }

    /**
     * 玩家击中目标
     */
    public async playerHit(hitData: { targetId: string; damage: number; weaponType: string; hitPosition: { x: number; y: number; z: number } }, senderId: string): Promise<{ killed: boolean; newHealth: number }> {
        const attacker = this.players.get(senderId);
        const target = this.players.get(hitData.targetId);

        if (!attacker || !target) {
            return { killed: false, newHealth: 100 };
        }

        // 计算伤害
        target.health = Math.max(0, target.health - hitData.damage);
        target.lastUpdateTime = Date.now();

        const killed = target.health <= 0;
        if (killed) {
            target.deaths += 1;
            attacker.kills += 1;
            attacker.score += 100;
            
            // 重生目标玩家
            setTimeout(() => {
                target.health = 100;
                target.position = { x: 0, y: 0, z: 0 };
                this.updateGameState();
            }, 3000);
        }

        const result = { killed, newHealth: target.health };

        // 广播击中事件
        await this.broadcastToAll('onPlayerHit', [senderId, hitData, result]);
        
        this.updateGameState();
        return result;
    }

    /**
     * 设置玩家准备状态
     */
    public async setPlayerReady(isReady: boolean, senderId: string): Promise<void> {
        const player = this.players.get(senderId);
        if (!player) {
            return;
        }

        player.isReady = isReady;
        player.lastUpdateTime = Date.now();

        // 广播准备状态变化
        await this.broadcastToOthers('onPlayerReady', [senderId, isReady], senderId);
    }

    /**
     * 玩家离开游戏
     */
    public async leaveGame(senderId: string): Promise<void> {
        await this.handlePlayerLeave(senderId);
    }

    /**
     * 处理玩家离开
     */
    private async handlePlayerLeave(clientId: string): Promise<void> {
        const player = this.players.get(clientId);
        if (!player) {
            return;
        }

        this.logger.info(`玩家 ${player.playerName} 离开游戏`);
        this.players.delete(clientId);

        // 如果离开的是主机，选择新主机
        if (this.hostPlayerId === clientId && this.players.size > 0) {
            this.hostPlayerId = Array.from(this.players.keys())[0];
            this.logger.info(`新主机: ${this.hostPlayerId}`);
        }

        // 广播玩家离开事件
        await this.broadcastToAll('onPlayerLeft', [clientId]);
        this.updateGameState();
    }

    /**
     * 更新游戏状态
     */
    private updateGameState(): void {
        this.gameState.players = Array.from(this.players.values());
        this.gameState.gameTime = Date.now() - this.gameStartTime;
    }

    /**
     * 广播消息给所有玩家
     */
    private async broadcastToAll(methodName: string, args: unknown[]): Promise<void> {
        const promises: Promise<unknown>[] = [];
        
        for (const [clientId, proxy] of this.clientProxies) {
            promises.push(
                proxy.call(methodName, args).catch(error => {
                    this.logger.warn(`向客户端 ${clientId} 广播消息失败: ${error}`);
                })
            );
        }

        await Promise.allSettled(promises);
    }

    /**
     * 广播消息给除指定玩家外的所有玩家
     */
    private async broadcastToOthers(methodName: string, args: unknown[], excludeClientId: string): Promise<void> {
        const promises: Promise<unknown>[] = [];
        
        for (const [clientId, proxy] of this.clientProxies) {
            if (clientId !== excludeClientId) {
                promises.push(
                    proxy.call(methodName, args).catch(error => {
                        this.logger.warn(`向客户端 ${clientId} 广播消息失败: ${error}`);
                    })
                );
            }
        }

        await Promise.allSettled(promises);
    }

    /**
     * 设置游戏循环
     */
    private setupGameLoop(): void {
        // 每秒更新游戏状态
        setInterval(() => {
            this.updateGameState();
            
            // 向所有客户端广播游戏状态
            this.broadcastToAll('onGameStateUpdate', [this.gameState]).catch(error => {
                this.logger.warn(`广播游戏状态失败: ${error}`);
            });
        }, 1000);

        // 每30秒清理不活跃的玩家
        setInterval(() => {
            const now = Date.now();
            const inactivePlayers: string[] = [];
            
            for (const [clientId, player] of this.players) {
                if (now - player.lastUpdateTime > 60000) { // 60秒无活动
                    inactivePlayers.push(clientId);
                }
            }
            
            for (const clientId of inactivePlayers) {
                this.logger.info(`清理不活跃玩家: ${clientId}`);
                this.handlePlayerLeave(clientId);
            }
        }, 30000);
    }

    /**
     * 权限检查
     */
    private checkPermissions(request: RpcCallRequest): boolean {
        // 基本的权限检查
        const player = this.players.get(request.senderId);
        
        // 某些方法需要玩家已加入游戏
        const requiresPlayer = ['updatePlayerPosition', 'playerShoot', 'sendChatMessage', 'playerHit', 'setPlayerReady', 'leaveGame'];
        if (requiresPlayer.includes(request.methodName) && !player) {
            return false;
        }

        return true;
    }

    /**
     * 速率限制检查
     */
    private rateLimitCheck(request: RpcCallRequest): boolean {
        // 这里可以实现更复杂的速率限制逻辑
        // 暂时返回true允许所有请求
        return true;
    }

    /**
     * 获取游戏统计信息
     */
    public getGameStats() {
        return {
            playerCount: this.players.size,
            gameTime: this.gameState.gameTime,
            waveNumber: this.gameState.waveNumber,
            hostPlayerId: this.hostPlayerId
        };
    }
}