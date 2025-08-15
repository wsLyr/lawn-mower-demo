import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * 敌人生成器组件
 */
@ECSComponent('EnemySpawner')
export class EnemySpawner extends Component {
    public spawnRate: number = 1.0; // 每秒生成数量
    public spawnDistance: number = 400; // 生成距离
    public enemyTypes: string[] = ['RedChaser']; // 敌人类型列表
    
    // 内部状态
    public lastSpawnTime: number = 0;
    public spawnTimer: number = 0;
    
    constructor(spawnRate: number = 1.0) {
        super();
        this.spawnRate = spawnRate;
    }
    
    /**
     * 检查是否可以生成敌人
     */
    public canSpawn(currentEnemyCount: number, deltaTime: number, globalMaxEnemies: number): boolean {
        this.spawnTimer += deltaTime;
        const spawnInterval = 1.0 / this.spawnRate;
        
        if (this.spawnTimer >= spawnInterval && currentEnemyCount < globalMaxEnemies) {
            this.spawnTimer = 0;
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取随机生成位置（围绕指定中心点）
     */
    public getRandomSpawnPosition(centerX: number, centerY: number): { x: number, y: number } {
        const angle = Math.random() * Math.PI * 2;
        const x = centerX + Math.cos(angle) * this.spawnDistance;
        const y = centerY + Math.sin(angle) * this.spawnDistance;
        return { x, y };
    }
    
    /**
     * 获取随机敌人类型
     */
    public getRandomEnemyType(): string {
        const index = Math.floor(Math.random() * this.enemyTypes.length);
        return this.enemyTypes[index];
    }
} 