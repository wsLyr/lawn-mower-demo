import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { Transform, Movement, PlayerInput, NetworkPlayer } from '../components';
import { input, Input, EventKeyboard, KeyCode, Vec2 } from 'cc';
import { ECSManager } from '../ECSManager';

/**
 * 玩家输入系统 - 处理键盘输入并控制玩家移动
 */
@ECSSystem('PlayerInputSystem')
export class PlayerInputSystem extends EntitySystem {
    
    // 输入状态
    private inputState = {
        left: false,
        right: false,
        up: false,
        down: false
    };
    
    private ecsManager: ECSManager | null = null;
    private lastInputSequence: number = 0;
    
    constructor() {
        super(Matcher.all(Transform, Movement, PlayerInput));
        this.setupInputHandling();
    }
    
    public setECSManager(ecsManager: ECSManager): void {
        this.ecsManager = ecsManager;
    }
    
    /**
     * 设置输入处理
     */
    private setupInputHandling(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            const movement = entity.getComponent(Movement);
            const networkPlayer = entity.getComponent(NetworkPlayer);
            if (!movement) continue;
            
            // 如果是网络玩家且不是本地玩家，跳过输入处理
            if (networkPlayer && !networkPlayer.isLocalPlayer) {
                continue;
            }
            
            // 重置输入方向
            movement.inputDirection.set(0, 0);
            
            // 根据输入状态设置移动方向
            if (this.inputState.left) movement.inputDirection.x -= 1;
            if (this.inputState.right) movement.inputDirection.x += 1;
            if (this.inputState.up) movement.inputDirection.y += 1;
            if (this.inputState.down) movement.inputDirection.y -= 1;
            
            // 标准化方向向量
            const inputVector = new Vec2(movement.inputDirection.x, movement.inputDirection.y);
            if (inputVector.lengthSqr() > 0) {
                inputVector.normalize();
                movement.inputDirection.set(inputVector.x, inputVector.y);
                
                // 如果是本地网络玩家，发送输入到服务器
                if (networkPlayer && networkPlayer.isLocalPlayer && this.ecsManager) {
                    this.sendInputToServer(networkPlayer, inputVector, entity);
                }
            }
        }
    }
    
    /**
     * 发送输入数据到服务器
     */
    private sendInputToServer(networkPlayer: NetworkPlayer, inputDirection: Vec2, entity: Entity): void {
        if (!this.ecsManager) return;
        
        const transform = entity.getComponent(Transform);
        if (!transform) return;
        
        // 记录输入序列用于预测校正
        this.lastInputSequence++;
        networkPlayer.lastInputSequence = this.lastInputSequence;
        
        // 使用ECSManager的接口发送输入（发送为自定义消息）
        const success = this.ecsManager.sendCustomMessage('player_input', {
            inputDirection: { x: inputDirection.x, y: inputDirection.y },
            position: { x: transform.position.x, y: transform.position.y },
            sequence: this.lastInputSequence,
            timestamp: Date.now()
        });
        
        if (!success) {
            this.logger.warn('发送输入消息失败');
        }
    }
    
    /**
     * 按键按下处理
     */
    private onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this.inputState.left = true;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this.inputState.right = true;
                break;
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this.inputState.up = true;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this.inputState.down = true;
                break;
        }
    }
    
    /**
     * 按键松开处理
     */
    private onKeyUp(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this.inputState.left = false;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this.inputState.right = false;
                break;
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this.inputState.up = false;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this.inputState.down = false;
                break;
        }
    }
    
    /**
     * 系统销毁时清理事件监听
     */
    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
} 