import { EntitySystem, Entity, Matcher, Time, ECSSystem } from '@esengine/ecs-framework';
import { Transform, Health, Movement, DamageCooldown } from '../components';
import { EnemySpawner } from '../components/EnemySpawner';
import { AIComponent } from '../systems/AISystem';
import { RenderSystem } from './RenderSystem';
import { ColliderComponent } from '../components/ColliderComponent';
import { EntityTags } from '../EntityTags';

/**
 * 敌人生成系统
 */
@ECSSystem('EnemySpawnSystem')
export class EnemySpawnSystem extends EntitySystem {
    
    constructor() {
        super(Matcher.all(EnemySpawner));
    }
    
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            const spawner = entity.getComponent(EnemySpawner);
            if (!spawner) continue;
            
            while (spawner.canSpawn(deltaTime)) {
                this.spawnEnemy(spawner);
                break;
            }
        }
    }
    
    private spawnEnemy(spawner: EnemySpawner): void {
        const playerEntities = this.scene.findEntitiesByTag(EntityTags.PLAYER);
        if (playerEntities.length === 0) return;
        
        const player = playerEntities[0];
        const playerTransform = player.getComponent(Transform);
        if (!playerTransform) return;
        
        const spawnPosition = this.getRandomSpawnPosition(playerTransform, spawner.spawnDistance);
        
        const enemy = this.scene.createEntity("Enemy");
        enemy.tag = EntityTags.ENEMY;
        
        const transform = new Transform(spawnPosition.x, spawnPosition.y, 0);
        enemy.addComponent(transform);
        
        const health = new Health(25);
        enemy.addComponent(health);
        
        const movement = new Movement(60);
        enemy.addComponent(movement);
        
        const ai = new AIComponent();
        enemy.addComponent(ai);
        
        const renderable = RenderSystem.createEnemy();
        enemy.addComponent(renderable);
        
        const collider = new ColliderComponent('circle');
        collider.setSize(8);
        enemy.addComponent(collider);
        
        const damageCooldown = new DamageCooldown(1.0);
        enemy.addComponent(damageCooldown);
        
        spawner.spawnTimer = 0;
    }
    
    private getRandomSpawnPosition(playerTransform: Transform, spawnDistance: number): { x: number; y: number } {
        const angle = Math.random() * Math.PI * 2;
        const x = playerTransform.position.x + Math.cos(angle) * spawnDistance;
        const y = playerTransform.position.y + Math.sin(angle) * spawnDistance;
        return { x, y };
    }
} 