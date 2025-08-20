import { Room, RoomConfig, RoomState } from './Room';
import { WorldManager, Core } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('RoomManager');

/**
 * 房间管理器接口
 */
export interface IRoomManager {
    createRoom(config: RoomConfig): Room | null;
    removeRoom(roomId: string): boolean;
    getRoom(roomId: string): Room | null;
    getAllRooms(): Room[];
    findRoomForPlayer(minPlayers?: number, maxPlayers?: number): Room | null;
    getRoomCount(): number;
    getPlayerCount(): number;
    cleanup(): void;
}

/**
 * 房间管理器 - 管理所有游戏房间
 * 
 * 提供房间的创建、销毁、查找等功能，支持自动清理和负载均衡
 */
export class RoomManager implements IRoomManager {
    private _rooms: Map<string, Room> = new Map();
    private _worldManager: WorldManager;
    private _cleanupInterval: NodeJS.Timeout | null = null;
    private readonly _cleanupIntervalMs: number = 30000; // 30秒清理一次

    constructor() {
        // 使用Core管理的WorldManager实例
        this._worldManager = Core.getWorldManager();
        
        this.startCleanupTask();
        logger.info('房间管理器已初始化，使用Core.WorldManager');
    }

    /**
     * 创建新房间
     */
    public createRoom(config: RoomConfig): Room | null {
        if (this._rooms.has(config.id)) {
            logger.warn(`房间ID已存在: ${config.id}`);
            return null;
        }

        try {
            const room = new Room(config);
            this._rooms.set(config.id, room);
            
            logger.info(`创建房间成功: ${config.name} (${config.id}), 最大玩家数: ${config.maxPlayers}`);
            return room;
        } catch (error) {
            logger.error(`创建房间失败: ${config.id}`, error);
            return null;
        }
    }

    /**
     * 移除房间
     */
    public removeRoom(roomId: string): boolean {
        const room = this._rooms.get(roomId);
        if (!room) {
            return false;
        }

        // 销毁房间资源
        room.destroy();
        this._rooms.delete(roomId);
        
        logger.info(`移除房间: ${roomId}`);
        return true;
    }

    /**
     * 获取房间
     */
    public getRoom(roomId: string): Room | null {
        return this._rooms.get(roomId) || null;
    }

    /**
     * 获取所有房间
     */
    public getAllRooms(): Room[] {
        return Array.from(this._rooms.values());
    }

    /**
     * 查找适合加入的房间
     */
    public findRoomForPlayer(minPlayers: number = 0, maxPlayers?: number): Room | null {
        for (const room of this._rooms.values()) {
            if (room.state !== RoomState.WAITING && room.state !== RoomState.STARTING) {
                continue;
            }

            if (room.isFull) {
                continue;
            }

            if (room.playerCount < minPlayers) {
                continue;
            }

            if (maxPlayers && room.playerCount > maxPlayers) {
                continue;
            }

            return room;
        }

        return null;
    }

    /**
     * 获取房间总数
     */
    public getRoomCount(): number {
        return this._rooms.size;
    }

    /**
     * 获取总玩家数
     */
    public getPlayerCount(): number {
        let totalPlayers = 0;
        for (const room of this._rooms.values()) {
            totalPlayers += room.playerCount;
        }
        return totalPlayers;
    }

    /**
     * 根据玩家ID查找房间
     */
    public findRoomByPlayer(playerId: string): Room | null {
        for (const room of this._rooms.values()) {
            if (room.getPlayer(playerId)) {
                return room;
            }
        }
        return null;
    }

    /**
     * 获取房间统计信息
     */
    public getStats() {
        const stats = {
            totalRooms: this._rooms.size,
            totalPlayers: 0,
            roomsByState: {
                [RoomState.WAITING]: 0,
                [RoomState.STARTING]: 0,
                [RoomState.PLAYING]: 0,
                [RoomState.ENDED]: 0
            },
            averagePlayersPerRoom: 0,
            emptyRooms: 0,
            fullRooms: 0
        };

        for (const room of this._rooms.values()) {
            stats.totalPlayers += room.playerCount;
            stats.roomsByState[room.state]++;
            
            if (room.isEmpty) stats.emptyRooms++;
            if (room.isFull) stats.fullRooms++;
        }

        stats.averagePlayersPerRoom = stats.totalRooms > 0 
            ? Math.round((stats.totalPlayers / stats.totalRooms) * 100) / 100 
            : 0;

        return stats;
    }

    /**
     * 根据游戏模式查找房间
     */
    public findRoomsByGameMode(gameMode: string): Room[] {
        const rooms: Room[] = [];
        for (const room of this._rooms.values()) {
            if (room.gameMode === gameMode) {
                rooms.push(room);
            }
        }
        return rooms;
    }

    /**
     * 自动分配房间给玩家
     */
    public assignRoomForPlayer(playerId: string, playerName: string, gameMode?: string): Room | null {
        // 首先查找相同游戏模式的房间
        let targetRooms = gameMode 
            ? this.findRoomsByGameMode(gameMode).filter(r => !r.isFull && r.state === RoomState.WAITING)
            : this.getAllRooms().filter(r => !r.isFull && r.state === RoomState.WAITING);

        // 按玩家数量排序，优先加入人多的房间
        targetRooms.sort((a, b) => b.playerCount - a.playerCount);

        for (const room of targetRooms) {
            if (room.addPlayer(playerId, playerName)) {
                logger.info(`玩家自动分配到房间: ${playerName} -> ${room.name}`);
                return room;
            }
        }

        return null;
    }

    /**
     * 创建并分配新房间
     */
    public createAndAssignRoom(playerId: string, playerName: string, roomConfig?: Partial<RoomConfig>): Room | null {
        const defaultConfig: RoomConfig = {
            id: `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: `Room_${this._rooms.size + 1}`,
            maxPlayers: 4,
            gameMode: 'default',
            isPrivate: false
        };

        const config = { ...defaultConfig, ...roomConfig };
        const room = this.createRoom(config);
        
        if (room && room.addPlayer(playerId, playerName)) {
            logger.info(`创建新房间并分配玩家: ${playerName} -> ${room.name}`);
            return room;
        }

        return null;
    }

    /**
     * 启动清理任务
     */
    private startCleanupTask(): void {
        this._cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this._cleanupIntervalMs);

        logger.debug(`启动房间清理任务，间隔: ${this._cleanupIntervalMs}ms`);
    }

    /**
     * 清理空房间和结束的房间
     */
    public cleanup(): void {
        const roomsToRemove: string[] = [];
        const currentTime = Date.now();

        for (const [roomId, room] of this._rooms.entries()) {
            const shouldRemove = 
                (room.state === RoomState.ENDED) ||
                (room.isEmpty && (currentTime - room.createdAt) > 300000); // 空房间超过5分钟

            if (shouldRemove) {
                roomsToRemove.push(roomId);
            }
        }

        for (const roomId of roomsToRemove) {
            this.removeRoom(roomId);
        }

        if (roomsToRemove.length > 0) {
            logger.debug(`清理了 ${roomsToRemove.length} 个房间`);
        }
    }

    /**
     * 处理玩家消息路由
     */
    public routePlayerMessage(playerId: string, message: any): boolean {
        const room = this.findRoomByPlayer(playerId);
        if (room) {
            room.handleGameMessage(playerId, message);
            return true;
        }
        
        logger.warn(`无法路由消息，玩家不在任何房间中: ${playerId}`);
        return false;
    }

    /**
     * 更新所有房间
     * 
     * 注意：现在由Core.update()自动处理World更新，
     * 此方法保留用于房间级别的特殊逻辑（如果需要）
     */
    public updateAll(deltaTime: number): void {
        // World的更新现在由Core.update()自动处理
        // 这里可以添加房间管理器特有的更新逻辑
        
        // 例如：检查房间状态变化、处理匹配逻辑等
        logger.debug(`房间管理器更新完成，活跃房间数: ${this._worldManager.activeWorldCount}`);
    }

    /**
     * 获取WorldManager实例
     */
    public getWorldManager(): WorldManager {
        return this._worldManager;
    }

    /**
     * 销毁房间管理器
     */
    public destroy(): void {
        logger.info('正在销毁房间管理器...');

        // 停止清理任务
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }

        // 销毁所有房间
        const roomIds = Array.from(this._rooms.keys());
        for (const roomId of roomIds) {
            this.removeRoom(roomId);
        }

        // 注意：不销毁WorldManager，因为它由Core管理
        // this._worldManager.destroy();

        this._rooms.clear();
        logger.info('房间管理器已销毁');
    }

    /**
     * 获取详细状态信息
     */
    public getDetailedStatus() {
        return {
            ...this.getStats(),
            rooms: Array.from(this._rooms.values()).map(room => room.getStatus()),
            cleanupInterval: this._cleanupIntervalMs,
            uptime: Date.now() // 可以记录启动时间来计算实际uptime
        };
    }
}