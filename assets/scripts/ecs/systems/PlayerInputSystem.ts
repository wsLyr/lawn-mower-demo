import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { Transform, Movement, PlayerInput } from '../components';
import { input, Input, EventKeyboard, KeyCode } from 'cc';

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
    
    constructor() {
        super(Matcher.all(Transform, Movement, PlayerInput));
        this.setupInputHandling();
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
            if (!movement) continue;
            
            // 重置输入方向
            movement.inputDirection.set(0, 0);
            
            // 根据输入状态设置移动方向
            if (this.inputState.left) movement.inputDirection.x -= 1;
            if (this.inputState.right) movement.inputDirection.x += 1;
            if (this.inputState.up) movement.inputDirection.y += 1;
            if (this.inputState.down) movement.inputDirection.y -= 1;
            
            // 标准化方向向量
            if (movement.inputDirection.lengthSqr() > 0) {
                movement.inputDirection.normalize();
            }
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
    public onRemoved(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
} 