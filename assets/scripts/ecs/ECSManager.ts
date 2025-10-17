import { Core, createLogger } from '@esengine/ecs-framework';
import { Component, _decorator } from 'cc';
import { GameScene } from './scenes/GameScene';
import { NetworkClient, NetworkClientConfig, MessageType } from '@esengine/network-client';
import { ECSConsoleDebug } from './debug/ECSConsoleDebug';

const { ccclass, property } = _decorator;

@ccclass('ECSManager')
export class ECSManager extends Component {
    
    @property({
        tooltip: '是否启用调试模式'
    })
    public debugMode: boolean = true;

    @property({
        tooltip: '是否启用网络模式'
    })
    public enableNetwork: boolean = true;

    @property({
        tooltip: '服务器地址'
    })
    public serverUrl: string = 'ws://localhost:8080';

    @property({
        tooltip: '玩家名称'
    })
    public playerName: string = 'Player';
    
    private logger = createLogger('ECSManager');
    private isInitialized: boolean = false;
    private networkClient: NetworkClient | null = null;
    private gameScene: GameScene | null = null;
    private consoleDebug: ECSConsoleDebug | null = null;
    
    async start() {
        await this.initializeECS();
    }
    
    private async initializeECS(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            this.logger.info('🚀 初始化ECS框架...');
            
            // 初始化ECS Core
            if (this.debugMode) {
                Core.create({
                    debugConfig: {
                        enabled: true,
                        websocketUrl: 'ws://localhost:8080/ecs-debug',
                        autoReconnect: true,
                        updateInterval: 100,
                        channels: {
                            entities: true,
                            systems: true,
                            performance: true,
                            components: true,
                            scenes: true
                        }
                    }
                });
            } else {
                Core.create(false);
            }
            
            // 创建游戏场景
            this.gameScene = new GameScene();
            Core.setScene(this.gameScene);
            
            // 设置ECS管理器到游戏场景
            this.gameScene.setECSManager(this);
            
            // 如果启用网络，初始化网络管理器
            if (this.enableNetwork) {
                await this.initializeNetwork();
            }

            // 如果启用调试模式，初始化控制台调试工具
            if (this.debugMode) {
                this.consoleDebug = ECSConsoleDebug.getInstance();
                this.consoleDebug.init(this);
            }
            
            this.isInitialized = true;
            this.logger.info('✅ ECS框架初始化完成');
            
        } catch (error) {
            this.logger.error('❌ ECS框架初始化失败:', error);
        }
    }

    private async initializeNetwork(): Promise<void> {
        try {
            this.logger.info('🌐 初始化网络系统...');
            
            // 创建网络客户端配置
            const config: Partial<NetworkClientConfig> = {
                features: {
                    enableHeartbeat: true,
                    enableReconnection: true,
                    enableCompression: true,
                    enableMessageQueue: true
                },
                authentication: {
                    autoAuthenticate: true,
                    credentials: {
                        playerName: this.playerName,
                        gameVersion: '1.0.0'
                    }
                }
            };

            this.networkClient = new NetworkClient(config);
            this.setupNetworkEvents();
            
            // 连接到服务器
            await this.networkClient.connect(this.serverUrl);
            this.logger.info('✅ 网络连接成功');
            
            // 网络初始化完成
            
        } catch (error) {
            this.logger.error('❌ 网络初始化失败:', error);
        }
    }

    private setupNetworkEvents(): void {
        if (!this.networkClient) return;

        this.networkClient.on('connected', () => {
            this.logger.info('✅ 已连接到服务器');
        });

        this.networkClient.on('disconnected', (reason: string) => {
            this.logger.info(`❌ 与服务器断开连接: ${reason}`);
        });

        this.networkClient.on('authenticated', (clientId: string) => {
            this.logger.info(`🎮 认证成功，客户端ID: ${clientId}`);
            this.onPlayerAuthenticated(clientId);
        });

        this.networkClient.on('messageReceived', (message: any) => {
            this.logger.info('📨 收到服务器消息:', message);
            this.handleNetworkMessage(message);
        });

        this.networkClient.on('error', (error: Error) => {
            this.logger.error('🚨 网络错误:', error);
        });

        this.networkClient.on('reconnected', () => {
            this.logger.info('🔄 重连成功');
        });
    }

    private createGameMessage(messageType: string, data: any): any {
        return {
            messageId: this.generateMessageId(),
            type: MessageType.GAME_EVENT,
            timestamp: Date.now(),
            senderId: this.networkClient?.getClientId() || 'unknown',
            data: {
                gameMessageType: messageType,
                payload: data,
                playerName: this.playerName
            }
        };
    }

    private generateMessageId(): string {
        return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    
    /**
     * 处理网络消息
     */
    private handleNetworkMessage(message: any): void {
        if (!message.data) return;
        
        // 直接转发给GameScene处理
        if (this.gameScene && (this.gameScene as any).handleNetworkMessage) {
            (this.gameScene as any).handleNetworkMessage(message);
        }
    }
    
    /**
     * 玩家认证成功后创建本地网络玩家
     */
    private onPlayerAuthenticated(clientId: string): void {
        if (this.gameScene && (this.gameScene as any).createLocalPlayer) {
            // 通知GameScene创建本地网络玩家
            (this.gameScene as any).createLocalPlayer(clientId, this.playerName);
            this.logger.info(`🎮 创建本地网络玩家: ${this.playerName} (${clientId})`);
        }
    }

    
    /**
     * 每帧更新ECS框架
     */
    update(deltaTime: number) {
        if (this.isInitialized) {
            // 更新ECS核心系统
            Core.update(deltaTime);
        }
    }
    
    /**
     * 组件销毁时清理ECS
     */
    async onDestroy() {
        if (this.isInitialized) {
            this.logger.info('🧹 清理ECS框架...');
            
            // 清理网络连接
            if (this.networkClient) {
                await this.networkClient.destroy();
                this.networkClient = null;
            }

            // 清理控制台调试工具
            if (this.consoleDebug) {
                this.consoleDebug.destroy();
                this.consoleDebug = null;
            }
            
            // ECS框架会自动处理场景清理
            this.isInitialized = false;
        }
    }

    // 提供给外部调用的方法
    public getNetworkClient(): NetworkClient | null {
        return this.networkClient;
    }

    public sendTestMessage(message: string): boolean {
        if (this.networkClient && this.networkClient.getClientId()) {
            const testMessage = this.createGameMessage('test', {
                content: message,
                timestamp: Date.now()
            });
            
            const success = this.networkClient.send(testMessage);
            this.logger.info(`💬 发送测试消息: ${message}`);
            return success;
        }
        return false;
    }

    public sendTestPosition(x: number, y: number): boolean {
        if (this.networkClient && this.networkClient.getClientId()) {
            const positionMessage = this.createGameMessage('player_position', {
                position: { x, y, z: 0 },
                rotation: 0,
                velocity: { x: 0, y: 0 },
                timestamp: Date.now()
            });
            
            const success = this.networkClient.send(positionMessage);
            this.logger.info(`📍 发送测试位置: (${x}, ${y})`);
            return success;
        }
        return false;
    }

    public getNetworkStats(): any {
        if (this.networkClient) {
            return {
                connected: !!this.networkClient.getClientId(),
                clientId: this.networkClient.getClientId(),
                state: this.networkClient.getState(),
                latency: this.networkClient.getLatency(),
                stats: this.networkClient.getStats()
            };
        }
        return { connected: false };
    }

    /**
     * 发送玩家位置更新
     */
    public sendPlayerPosition(position: { x: number, y: number }, rotation: number = 0, velocity?: { x: number, y: number }): boolean {
        if (this.networkClient && this.networkClient.getClientId()) {
            const positionMessage = this.createGameMessage('player_position', {
                position,
                rotation,
                velocity: velocity || { x: 0, y: 0 },
                timestamp: Date.now()
            });
            
            return this.networkClient.send(positionMessage);
        }
        return false;
    }

    /**
     * 发送射击事件
     */
    public sendShootEvent(targetPosition: { x: number, y: number }, weaponType: string = 'default'): boolean {
        if (this.networkClient && this.networkClient.getClientId()) {
            const shootMessage = this.createGameMessage('player_shoot', {
                targetPosition,
                weaponType,
                timestamp: Date.now()
            });
            
            return this.networkClient.send(shootMessage);
        }
        return false;
    }

    /**
     * 发送自定义消息
     */
    public sendCustomMessage(messageType: string, payload: any): boolean {
        if (this.networkClient && this.networkClient.getClientId()) {
            const message = this.createGameMessage(messageType, payload);
            return this.networkClient.send(message);
        }
        return false;
    }
}
