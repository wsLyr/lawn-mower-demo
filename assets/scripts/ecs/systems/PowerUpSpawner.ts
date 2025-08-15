import { EntitySystem, Matcher, Time, ECSSystem } from '@esengine/ecs-framework';
import { Transform, Collectible, CollectibleType, ColliderComponent } from '../components';
import { RenderSystem } from './RenderSystem';
import { EntityTags } from '../EntityTags';
import { Vec2 } from 'cc';

@ECSSystem('PowerUpSpawner')
export class PowerUpSpawner extends EntitySystem {
    private spawnTimer: number = 0;
    private spawnInterval: number = 10.0;
    private spawnRadius: number = 200;
    
    constructor() {
        super(Matcher.empty());
    }
    
    protected process(): void {
        const deltaTime = Time.deltaTime;
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnAirStrikePowerUp();
            this.spawnTimer = 0;
        }
    }
    
    private spawnAirStrikePowerUp(): void {
        const playerEntities = this.scene.findEntitiesByTag(EntityTags.PLAYER);
        if (playerEntities.length === 0) return;
        
        const player = playerEntities[0];
        const playerTransform = player.getComponent(Transform);
        if (!playerTransform) return;
        
        const spawnPosition = this.getRandomSpawnPosition(playerTransform);
        
        const powerUpEntity = this.scene.createEntity("AirStrikePowerUp");
        powerUpEntity.tag = EntityTags.COLLECTIBLE;
        
        const transform = new Transform(spawnPosition.x, spawnPosition.y, 0);
        powerUpEntity.addComponent(transform);
        
        const collectible = new Collectible(CollectibleType.AIR_STRIKE);
        powerUpEntity.addComponent(collectible);
        
        const renderable = RenderSystem.createCollectible();
        powerUpEntity.addComponent(renderable);
        
        const collider = new ColliderComponent('circle');
        collider.setSize(20);
        powerUpEntity.addComponent(collider);
    }
    
    private getRandomSpawnPosition(playerTransform: Transform): Vec2 {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * this.spawnRadius;
        
        const x = playerTransform.position.x + Math.cos(angle) * distance;
        const y = playerTransform.position.y + Math.sin(angle) * distance;
        
        return new Vec2(x, y);
    }
} 