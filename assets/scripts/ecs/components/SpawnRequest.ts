import { Component } from '@esengine/ecs-framework';

/**
 * 生成请求组件 - 表示请求生成一个实体
 */
export class SpawnRequest extends Component {
    public entityType: string; // 要生成的实体类型
    public spawnX: number; // 生成X坐标
    public spawnY: number; // 生成Y坐标
    public spawnData: any = {}; // 额外的生成数据
    
    constructor(entityType: string, x: number, y: number, data: any = {}) {
        super();
        this.entityType = entityType;
        this.spawnX = x;
        this.spawnY = y;
        this.spawnData = data;
    }
} 