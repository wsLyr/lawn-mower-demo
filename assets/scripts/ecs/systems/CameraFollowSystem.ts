import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { Transform, CameraTarget } from '../components';
import { Camera, Vec3 } from 'cc';

/**
 * 相机跟随系统 - 让相机跟随指定的实体
 */
@ECSSystem('CameraFollowSystem')
export class CameraFollowSystem extends EntitySystem {
    private mainCamera: Camera | null = null;
    private shakeOffset: Vec3 = new Vec3();
    
    constructor() {
        super(Matcher.empty().all(Transform, CameraTarget));
    }
    
    public initialize(): void {
        super.initialize();
        this.scene.eventSystem.on('camera:shake:offset', this.onShakeOffset.bind(this));
    }
    
    private onShakeOffset(data: { offset: Vec3 }): void {
        this.shakeOffset.set(data.offset.x, data.offset.y, data.offset.z);
    }
    
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
        
        const cameraNode = this.mainCamera.node;
        
        cameraNode.setPosition(
            transform.position.x + this.shakeOffset.x,
            transform.position.y + this.shakeOffset.y,
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