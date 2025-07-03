import { Vec2 } from 'cc';
import { Entity } from '@esengine/ecs-framework';
import { Transform, ColliderComponent } from './components';

export enum CollisionLayer {
    PLAYER = 1,
    ENEMY = 2,
    BULLET = 4,
    WALL = 8,
    PICKUP = 16
}

export class CollisionPair {
    public entity1: Entity;
    public entity2: Entity;
    public distance: number;
    
    constructor(entity1: Entity, entity2: Entity, distance: number) {
        this.entity1 = entity1;
        this.entity2 = entity2;
        this.distance = distance;
    }
}

export class SpatialGrid {
    private cellSize: number;
    private worldWidth: number;
    private worldHeight: number;
    private cols: number;
    private rows: number;
    private cells: Entity[][];
    
    constructor(worldWidth: number = 2000, worldHeight: number = 2000, cellSize: number = 100) {
        this.cellSize = cellSize;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        this.cells = [];
        
        for (let i = 0; i < this.cols * this.rows; i++) {
            this.cells[i] = [];
        }
    }
    
    public clear(): void {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].length = 0;
        }
    }
    
    public insert(entity: Entity): void {
        const transform = entity.getComponent(Transform);
        if (!transform) return;
        
        const cellIndex = this.getCellIndex(transform.position.x, transform.position.y);
        if (cellIndex >= 0 && cellIndex < this.cells.length) {
            this.cells[cellIndex].push(entity);
        }
    }
    
    public getNearbyEntities(entity: Entity): Entity[] {
        const transform = entity.getComponent(Transform);
        if (!transform) return [];
        
        const collider = entity.getComponent(ColliderComponent);
        const radius = collider ? collider.radius : 10;
        
        const nearby: Entity[] = [];
        const x = transform.position.x;
        const y = transform.position.y;
        
        const startCol = Math.max(0, Math.floor((x - radius + this.worldWidth/2) / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + radius + this.worldWidth/2) / this.cellSize));
        const startRow = Math.max(0, Math.floor((y - radius + this.worldHeight/2) / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + radius + this.worldHeight/2) / this.cellSize));
        
        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const cellIndex = row * this.cols + col;
                if (cellIndex >= 0 && cellIndex < this.cells.length) {
                    nearby.push(...this.cells[cellIndex]);
                }
            }
        }
        
        return nearby;
    }
    
    private getCellIndex(x: number, y: number): number {
        const col = Math.floor((x + this.worldWidth/2) / this.cellSize);
        const row = Math.floor((y + this.worldHeight/2) / this.cellSize);
        
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return -1;
        }
        
        return row * this.cols + col;
    }
}

export class PhysicsWorld {
    private spatialGrid: SpatialGrid;
    private collisionMatrix: Map<number, number[]>;
    
    constructor() {
        this.spatialGrid = new SpatialGrid();
        this.setupCollisionMatrix();
    }
    
    private setupCollisionMatrix(): void {
        this.collisionMatrix = new Map();
        this.collisionMatrix.set(CollisionLayer.BULLET, [CollisionLayer.ENEMY, CollisionLayer.WALL]);
        this.collisionMatrix.set(CollisionLayer.ENEMY, [CollisionLayer.PLAYER, CollisionLayer.BULLET, CollisionLayer.WALL]);
        this.collisionMatrix.set(CollisionLayer.PLAYER, [CollisionLayer.ENEMY, CollisionLayer.PICKUP, CollisionLayer.WALL]);
    }
    
    public detectCollisions(entities: Entity[]): CollisionPair[] {
        this.spatialGrid.clear();
        
        for (const entity of entities) {
            this.spatialGrid.insert(entity);
        }
        
        const collisionPairs: CollisionPair[] = [];
        const processedPairs = new Set<string>();
        
        for (const entity of entities) {
            const layer = this.getEntityLayer(entity);
            if (!layer) continue;
            
            const allowedLayers = this.collisionMatrix.get(layer);
            if (!allowedLayers) continue;
            
            const nearby = this.spatialGrid.getNearbyEntities(entity);
            
            for (const other of nearby) {
                if (entity === other) continue;
                
                const otherLayer = this.getEntityLayer(other);
                if (!otherLayer || allowedLayers.indexOf(otherLayer) === -1) continue;
                
                const pairKey = this.getPairKey(entity, other);
                if (processedPairs.has(pairKey)) continue;
                processedPairs.add(pairKey);
                
                const collision = this.testCollision(entity, other);
                if (collision) {
                    collisionPairs.push(collision);
                }
            }
        }
        
        return collisionPairs;
    }
    
    private getEntityLayer(entity: Entity): CollisionLayer | null {
        switch (entity.tag) {
            case 1: return CollisionLayer.PLAYER;
            case 2: return CollisionLayer.ENEMY;
            case 3: return CollisionLayer.BULLET;
            default: return null;
        }
    }
    
    private getPairKey(entity1: Entity, entity2: Entity): string {
        const id1 = entity1.id;
        const id2 = entity2.id;
        return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    }
    
    private testCollision(entity1: Entity, entity2: Entity): CollisionPair | null {
        const transform1 = entity1.getComponent(Transform);
        const transform2 = entity2.getComponent(Transform);
        const collider1 = entity1.getComponent(ColliderComponent);
        const collider2 = entity2.getComponent(ColliderComponent);
        
        if (!transform1 || !transform2 || !collider1 || !collider2) {
            return null;
        }
        
        const pos1 = new Vec2(transform1.position.x, transform1.position.y);
        const pos2 = new Vec2(transform2.position.x, transform2.position.y);
        const distance = Vec2.distance(pos1, pos2);
        const minDistance = collider1.radius + collider2.radius;
        
        if (distance < minDistance) {
            return new CollisionPair(entity1, entity2, distance);
        }
        
        return null;
    }
} 