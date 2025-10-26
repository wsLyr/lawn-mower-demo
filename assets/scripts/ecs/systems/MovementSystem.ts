import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { Transform, Movement, NetworkPlayer } from '../components';
import { Vec2 } from 'cc';

@ECSSystem('MovementSystem')
export class MovementSystem extends EntitySystem {
    private readonly tempVec2 = new Vec2();
    private readonly MOVEMENT_THRESHOLD = 0.1;
    private readonly ROTATION_THRESHOLD = 0.001;
    private ecsManager: any = null;
    
    constructor() {
        super(Matcher.all(Transform, Movement));
    }
    
    protected onInitialize(): void {
        // 获取ECS管理器引用
        if (this.scene && (this.scene as any).getECSManager) {
            this.ecsManager = (this.scene as any).getECSManager();
        }
    }
    
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            this.processEntityMovement(entity, deltaTime);
        }
    }
    
    private processEntityMovement(entity: Entity, deltaTime: number): void {
        const transform = entity.getComponent(Transform);
        const movement = entity.getComponent(Movement);
        const networkPlayer = entity.getComponent(NetworkPlayer);
        
        if (!transform || !movement) return;
        
        // 如果是网络玩家，使用不同的移动逻辑
        if (networkPlayer) {
            this.processNetworkPlayerMovement(entity, transform, movement, networkPlayer, deltaTime);
        } else {
            this.processLocalMovement(entity, transform, movement, deltaTime);
        }
    }
    
    /**
     * 处理本地玩家移动
     */
    private processLocalMovement(entity: Entity, transform: Transform, movement: Movement, deltaTime: number): void {
        const inputDirLen = movement.inputDirection.x * movement.inputDirection.x + 
                           movement.inputDirection.y * movement.inputDirection.y;
        
        if (inputDirLen > this.MOVEMENT_THRESHOLD * this.MOVEMENT_THRESHOLD) {
            const invLen = 1 / Math.sqrt(inputDirLen);
            const normalizedX = movement.inputDirection.x * invLen;
            const normalizedY = movement.inputDirection.y * invLen;
            
            const moveDistance = movement.maxSpeed * deltaTime;
            
            transform.previousPosition.set(transform.position);
            transform.position.x += normalizedX * moveDistance;
            transform.position.y += normalizedY * moveDistance;
            
            movement.velocity.set(normalizedX * movement.maxSpeed, normalizedY * movement.maxSpeed);
            
            const velocityLen = movement.velocity.x * movement.velocity.x + movement.velocity.y * movement.velocity.y;
            if (velocityLen > 100) {
                const targetRotation = Math.atan2(movement.velocity.y, movement.velocity.x);
                
                let angleDiff = targetRotation - transform.rotation;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                else if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                if (Math.abs(angleDiff) > this.ROTATION_THRESHOLD) {
                    transform.rotation += angleDiff * 8 * deltaTime;
                }
            }
        } else {
            movement.velocity.set(0, 0);
        }
    }
    
    /**
     * 处理网络玩家移动
     */
    private processNetworkPlayerMovement(entity: Entity, transform: Transform, movement: Movement, networkPlayer: NetworkPlayer, deltaTime: number): void {
        if (networkPlayer.isLocalPlayer) {
            // 本地玩家：正常处理输入，检测位置变化
            const previousPos = { x: transform.position.x, y: transform.position.y };
            this.processLocalMovement(entity, transform, movement, deltaTime);
            
            // 检测位置是否发生显著变化
            const dx = transform.position.x - previousPos.x;
            const dy = transform.position.y - previousPos.y;
            const distanceMoved = Math.sqrt(dx * dx + dy * dy);
            
            // 只有移动距离超过阈值或者定期更新时才同步
            const shouldUpdate = distanceMoved > 1.0 || networkPlayer.shouldSendNetworkUpdate(100); // 最少100ms更新一次
            
            if (shouldUpdate) {
                // 更新网络位置信息
                networkPlayer.updateNetworkTransform(
                    { x: transform.position.x, y: transform.position.y },
                    transform.rotation,
                    { x: movement.velocity.x, y: movement.velocity.y }
                );
                
                // 触发网络同步（通过事件或直接调用）
                this.triggerNetworkSync(entity, networkPlayer);
            }
        } else {
            // 远程玩家：使用网络位置进行插值
            if (networkPlayer.enableInterpolation) {
                const currentPos = { x: transform.position.x, y: transform.position.y };
                const targetPosition = networkPlayer.getInterpolatedPosition(currentPos, deltaTime);
                
                transform.previousPosition.set(transform.position);
                transform.position.set(targetPosition.x, targetPosition.y);
                
                // 计算实际移动速度
                const dx = transform.position.x - transform.previousPosition.x;
                const dy = transform.position.y - transform.previousPosition.y;
                movement.velocity.set(dx / deltaTime, dy / deltaTime);
                
                // 更新旋转角度
                if (movement.velocity.lengthSqr() > 100) {
                    const targetRotation = Math.atan2(movement.velocity.y, movement.velocity.x);
                    let angleDiff = targetRotation - transform.rotation;
                    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    else if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    
                    if (Math.abs(angleDiff) > this.ROTATION_THRESHOLD) {
                        transform.rotation += angleDiff * 8 * deltaTime;
                    }
                }
            } else {
                // 直接设置位置
                transform.previousPosition.set(transform.position);
                transform.position.set(networkPlayer.networkPosition.x, networkPlayer.networkPosition.y);
                transform.rotation = networkPlayer.networkRotation;
                movement.velocity.set(networkPlayer.networkVelocity.x, networkPlayer.networkVelocity.y);
            }
        }
    }
    
    /**
     * 触发网络同步
     */
    private triggerNetworkSync(entity: Entity, networkPlayer: NetworkPlayer): void {
        if (this.ecsManager) {
            // 使用统一的接口发送位置更新
            const success = this.ecsManager.sendPlayerPosition(
                networkPlayer.networkPosition,
                networkPlayer.networkRotation,
                networkPlayer.networkVelocity
            );
            
            if (!success) {
                this.logger.warn(`玩家 ${networkPlayer.clientId} 位置同步发送失败`);
            }
        }
    }
} 