import { EntitySystem, Matcher, Entity, Component } from '@esengine/ecs-framework';
import { Transform } from '../components';
import { Camera } from 'cc';

/**
 * 相机目标组件 - 标记相机应该跟随的实体
 */
export class CameraTarget extends Component {
    public priority: number = 0; // 优先级，数值越高优先级越高
    
    constructor(priority: number = 0) {
        super();
        this.priority = priority;
    }
}

/**
 * 相机跟随系统 - 让相机跟随指定的实体
 */
export class CameraFollowSystem extends EntitySystem {
    private mainCamera: Camera | null = null;
    
    constructor() {
        super(Matcher.empty().all(Transform, CameraTarget));
    }
    
    /**
     * 设置要控制的相机
     */
    public setCamera(camera: Camera): void {
        this.mainCamera = camera;
    }
    
    /**
     * 处理所有匹配的实体
     */
    protected process(entities: Entity[]): void {
        if (!this.mainCamera) return;
        
        // 找到优先级最高的目标
        const target = this.findHighestPriorityTarget(entities);
        if (!target) return;
        
        const transform = target.getComponent(Transform);
        if (!transform) return;
        
        // 直接跟随目标位置
        const cameraNode = this.mainCamera.node;
        cameraNode.setPosition(
            transform.position.x,
            transform.position.y,
            cameraNode.position.z
        );
    }
    
    /**
     * 寻找优先级最高的目标
     */
    private findHighestPriorityTarget(entities: Entity[]): Entity | null {
        let highestPriorityTarget = null;
        let highestPriority = -Infinity;
        
        for (const entity of entities) {
            const cameraTarget = entity.getComponent(CameraTarget);
            if (!cameraTarget) continue;
            
            if (cameraTarget.priority > highestPriority) {
                highestPriority = cameraTarget.priority;
                highestPriorityTarget = entity;
            }
        }
        
        return highestPriorityTarget;
    }
} 