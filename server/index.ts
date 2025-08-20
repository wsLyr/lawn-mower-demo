import { createLogger, Core, Entity, Scene } from '@esengine/ecs-framework';
import { NetworkServer, MessageType } from '@esengine/network-server';
import { NetworkPlayer, NetworkInput, NetworkEvents } from './networkcomponents';

const logger = createLogger('GameServer');

/**
 * 简化的游戏服务器
 */
class GameServer {
    private server: NetworkServer;
    private players: Map<string, Entity> = new Map();
    private gameScene: Scene;

    constructor() {
        // 初始化ECS Core - 创建Core实例并确保实例可用
        Core.create();
        
        // 验证Core实例已正确初始化
        if (!Core.Instance) {
            throw new Error('Core实例初始化失败');
        }
        
        // 创建游戏场景
        this.gameScene = new Scene();
        this.gameScene.name = 'ServerGameScene';
        Core.setScene(this.gameScene);
        
        // 使用默认配置创建服务器
        this.server = new NetworkServer({
            transport: {
                port: 8080,
                host: '0.0.0.0'
            },
            authentication: {
                required: false,
                timeout: 10000,
                maxAttempts: 3
            },
            rateLimit: {
                enabled: false,
                maxRequestsPerMinute: 60,
                banDuration: 300000
            },
            features: {
                enableCompression: true,
                enableHeartbeat: true,
                enableRooms: false,
                enableMetrics: true
            }
        });

        this.setupServerEvents();
    }

    /**
     * 启动服务器
     */
    public async start(): Promise<void> {
        try {
            await this.server.start();
            logger.info('游戏服务器启动成功，端口: 8080');
            
            // 启动ECS更新循环
            this.startGameLoop();
            
            // 定期输出服务器状态
            setInterval(() => {
                logger.info(`在线玩家数: ${this.players.size}`);
            }, 30000);
            
        } catch (error) {
            logger.error('启动服务器失败:', error);
            throw error;
        }
    }

    /**
     * 停止服务器
     */
    public async stop(): Promise<void> {
        // 停止游戏循环
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        await this.server.stop();
        logger.info('游戏服务器已停止');
    }

    private gameLoopInterval: NodeJS.Timeout | null = null;
    private lastUpdateTime: number = Date.now();

    /**
     * 启动游戏循环
     */
    private startGameLoop(): void {
        this.lastUpdateTime = Date.now();
        
        // 每16ms更新一次（约60FPS）
        this.gameLoopInterval = setInterval(() => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // 转换为秒
            this.lastUpdateTime = currentTime;
            
            // 更新ECS Core
            Core.update(deltaTime);
        }, 16);
        
        logger.info('游戏循环已启动 (60FPS)');
    }

    /**
     * 设置服务器事件处理器
     */
    private setupServerEvents(): void {
        // 客户端连接
        this.server.on('clientConnected', (session) => {
            const clientId = session.id;
            logger.info(`客户端连接: ${clientId}`);
            
            // 创建网络玩家实体
            const playerEntity = this.gameScene.createEntity(`Player_${clientId}`);
            const networkPlayer = new NetworkPlayer();
            networkPlayer.init(clientId, false, `Player_${clientId.slice(-4)}`);
            playerEntity.addComponent(networkPlayer);
            
            const networkInput = new NetworkInput();
            playerEntity.addComponent(networkInput);
            
            const networkEvents = new NetworkEvents();
            playerEntity.addComponent(networkEvents);
            
            this.players.set(clientId, playerEntity);
        });

        // 客户端断开连接
        this.server.on('clientDisconnected', (session, reason) => {
            const clientId = session.id;
            logger.info(`客户端断开连接: ${clientId}, 原因: ${reason}`);
            
            // 移除玩家实体
            const playerEntity = this.players.get(clientId);
            if (playerEntity) {
                playerEntity.destroy();
                this.players.delete(clientId);
            }
        });

        // 接收消息
        this.server.on('messageReceived', (session, message) => {
            const clientId = session.id;
            logger.info(`收到消息 (${clientId}):`, message.type);
            
            // 处理游戏消息
            this.handleGameMessage(clientId, message);
        });

        // 认证成功
        this.server.on('clientAuthenticated', (session) => {
            const clientId = session.id;
            logger.info(`客户端认证成功: ${clientId}`);
        });
    }

    /**
     * 处理游戏消息
     */
    private handleGameMessage(clientId: string, message: any): void {
        const playerEntity = this.players.get(clientId);
        if (!playerEntity) return;

        if (message.type === MessageType.GAME_EVENT && message.data) {
            const { gameMessageType, payload } = message.data;

            switch (gameMessageType) {
                case 'player_input':
                    this.handlePlayerInput(playerEntity, payload);
                    break;
                case 'player_shoot':
                    this.handlePlayerShoot(playerEntity, payload);
                    break;
                default:
                    logger.debug(`未处理的游戏消息类型: ${gameMessageType}`);
            }
        }
    }

    /**
     * 处理玩家输入
     */
    private handlePlayerInput(playerEntity: Entity, payload: any): void {
        const networkPlayer = playerEntity.getComponent(NetworkPlayer);
        const networkInput = playerEntity.getComponent(NetworkInput);
        
        if (networkPlayer && networkInput && payload.inputDirection && payload.position) {
            // 更新玩家位置
            networkPlayer.updateNetworkTransform(
                payload.position,
                payload.rotation || 0,
                payload.velocity
            );

            // 记录输入用于预测校正
            networkInput.addInput(payload.inputDirection, payload.position);

            // 广播位置更新给其他玩家
            this.broadcastPlayerPosition(playerEntity);
        }
    }

    /**
     * 处理玩家射击
     */
    private handlePlayerShoot(playerEntity: Entity, payload: any): void {
        const networkEvents = playerEntity.getComponent(NetworkEvents);
        if (networkEvents && payload.targetPosition) {
            const shootEvent = networkEvents.createShootEvent(
                payload.targetPosition,
                payload.weaponType || 'default'
            );

            // 广播射击事件给所有玩家
            this.broadcastShootEvent(playerEntity, shootEvent);
        }
    }

    /**
     * 广播玩家位置给其他玩家
     */
    private broadcastPlayerPosition(playerEntity: Entity): void {
        const networkPlayer = playerEntity.getComponent(NetworkPlayer);
        if (!networkPlayer) return;

        const message = {
            messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: MessageType.GAME_EVENT,
            timestamp: Date.now(),
            senderId: networkPlayer.clientId,
            data: {
                gameMessageType: 'player_position',
                payload: {
                    position: networkPlayer.networkPosition,
                    rotation: networkPlayer.networkRotation,
                    velocity: networkPlayer.networkVelocity,
                    timestamp: Date.now()
                },
                playerName: networkPlayer.playerName
            }
        };

        // 发送给除了发送者之外的所有客户端
        this.server.broadcast(message, [networkPlayer.clientId]);
    }

    /**
     * 广播射击事件
     */
    private broadcastShootEvent(playerEntity: Entity, shootEvent: any): void {
        const networkPlayer = playerEntity.getComponent(NetworkPlayer);
        if (!networkPlayer) return;

        const message = {
            messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: MessageType.GAME_EVENT,
            timestamp: Date.now(),
            senderId: networkPlayer.clientId,
            data: {
                gameMessageType: 'player_shoot',
                payload: shootEvent,
                playerName: networkPlayer.playerName
            }
        };

        // 广播给所有客户端
        this.server.broadcast(message);
    }

    /**
     * 获取服务器统计信息
     */
    public getStats() {
        return {
            playerCount: this.players.size,
            serverStats: this.server.getStats()
        };
    }
}

// 启动服务器
async function main() {
    const gameServer = new GameServer();
    
    // 处理进程信号
    process.on('SIGINT', async () => {
        logger.info('收到SIGINT信号，正在关闭服务器...');
        await gameServer.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        logger.info('收到SIGTERM信号，正在关闭服务器...');
        await gameServer.stop();
        process.exit(0);
    });

    try {
        await gameServer.start();
    } catch (error) {
        logger.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
    main().catch(error => {
        logger.error('服务器异常:', error);
        process.exit(1);
    });
}

export { GameServer };