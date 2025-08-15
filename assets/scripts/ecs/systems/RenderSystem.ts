import { EntitySystem, Entity, Matcher, Time, ECSSystem } from '@esengine/ecs-framework';
import { Node, Sprite, SpriteFrame, resources, ImageAsset, Texture2D, Vec3, Color, Layers } from 'cc';
import { Transform, Renderable } from '../components';

interface SpriteEntity {
    entity: Entity;
    sprite: Sprite;
    node: Node;
    lastX: number;
    lastY: number;
    lastRotation: number;
    lastScale: number;
    lastAlpha: number;
    lastVisible: boolean;
    lastSpritePath: string;
    lastColor: Color;
}


class NodePool {
    private pool: Node[] = [];
    private maxSize: number = 100;
    
    public getNode(entityId: number): Node {
        let node = this.pool.pop();
        if (!node) {
            node = new Node();
            node.addComponent(Sprite);
        }
        node.name = `Entity_${entityId}`;
        node.active = true;
        return node;
    }
    
    public releaseNode(node: Node): void {
        if (this.pool.length < this.maxSize) {
            node.name = 'PooledNode';
            node.active = false;
            node.parent = null;
            const sprite = node.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = null;
                sprite.color = Color.WHITE;
            }
            node.setPosition(0, 0);
            node.setRotationFromEuler(0, 0, 0);
            node.setScale(1, 1);
            this.pool.push(node);
        } else {
            node.destroy();
        }
    }
    
    public preWarm(count: number): void {
        for (let i = 0; i < count; i++) {
            const node = new Node();
            node.addComponent(Sprite);
            this.releaseNode(node);
        }
    }
    
    public clear(): void {
        this.pool.forEach(node => node.destroy());
        this.pool.length = 0;
    }
}


@ECSSystem('RenderSystem')
export class RenderSystem extends EntitySystem {
    private gameContainer: Node | null = null;
    private backgroundLayer: Node | null = null;
    private gameObjectLayer: Node | null = null;
    private uiLayer: Node | null = null;
    private spriteEntities: Map<number, SpriteEntity> = new Map();
    private spriteFrameCache: Map<string, SpriteFrame> = new Map();
    private loadingPromises: Map<string, Promise<SpriteFrame>> = new Map();
    private creatingEntities: Set<number> = new Set();
    private nodePool: NodePool = new NodePool();

    constructor() {
        super(Matcher.all(Renderable, Transform));
    }

    public setGameContainer(container: Node): void {
        this.gameContainer = container;
        this.initializeLayers();
    }
    
    private initializeLayers(): void {
        if (!this.gameContainer) return;
        
        this.backgroundLayer = new Node('BackgroundLayer');
        this.backgroundLayer.parent = this.gameContainer;
        
        this.gameObjectLayer = new Node('GameObjectLayer');
        this.gameObjectLayer.parent = this.gameContainer;
        
        this.uiLayer = new Node('UILayer');
        this.uiLayer.parent = this.gameContainer;
    }

    protected onAdded(entity: Entity): void {
        const renderable = entity.getComponent(Renderable);
        
        if (renderable && !this.creatingEntities.has(entity.id)) {
            this.creatingEntities.add(entity.id);
            this.createSpriteEntity(entity);
        }
    }

    protected onRemoved(entity: Entity): void {
        const spriteEntity = this.spriteEntities.get(entity.id);
        if (spriteEntity) {
            this.nodePool.releaseNode(spriteEntity.node);
            this.spriteEntities.delete(entity.id);
        }
        
        this.creatingEntities.delete(entity.id);
    }

    public onStart(): void {
        this.nodePool.preWarm(50);
        this.preloadSprites();
    }

    public onDestroy(): void {
        this.spriteEntities.forEach(spriteEntity => {
            this.nodePool.releaseNode(spriteEntity.node);
        });
        this.spriteEntities.clear();
        
        this.creatingEntities.clear();
        this.nodePool.clear();
    }

    private async preloadSprites(): Promise<void> {
        const spriteNames = ['player', 'enemy', 'bullet', 'collectible', 'grenade', 'explosion_warning'];

        for (const spriteName of spriteNames) {
            const path = `images/${spriteName}`;
            if (!this.spriteFrameCache.has(path)) {
                await this.loadSpriteFrame(path);
            }
        }
    }

    private async loadSpriteFrame(path: string): Promise<SpriteFrame> {
        if (this.spriteFrameCache.has(path)) {
            return this.spriteFrameCache.get(path)!;
        }

        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path)!;
        }

        const promise = new Promise<SpriteFrame>((resolve, reject) => {
            resources.load(path, ImageAsset, (err, imageAsset) => {
                if (err) {
                    reject(err);
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                this.spriteFrameCache.set(path, spriteFrame);
                this.loadingPromises.delete(path);
                resolve(spriteFrame);
            });
        });

        this.loadingPromises.set(path, promise);
        return promise;
    }

    private async createSpriteEntity(entity: Entity): Promise<void> {
        if (!this.gameObjectLayer) {
            this.creatingEntities.delete(entity.id);
            return;
        }

        const renderable = entity.getComponent(Renderable);
        if (!renderable) {
            this.creatingEntities.delete(entity.id);
            return;
        }

        const node = this.nodePool.getNode(entity.id);
        node.parent = this.gameObjectLayer;
        node.layer = Layers.Enum.UI_2D;

        const sprite = node.getComponent(Sprite)!;

        const spriteEntity: SpriteEntity = {
            entity,
            sprite,
            node,
            lastX: 0,
            lastY: 0,
            lastRotation: 0,
            lastScale: 1,
            lastAlpha: 1,
            lastVisible: true,
            lastSpritePath: renderable.spritePath,
            lastColor: Color.WHITE.clone()
        };

        this.spriteEntities.set(entity.id, spriteEntity);
        this.creatingEntities.delete(entity.id);

        try {
            const spriteFrame = await this.loadSpriteFrame(renderable.spritePath);
            if (this.spriteEntities.has(entity.id)) {
                sprite.spriteFrame = spriteFrame;
            }
        } catch (error) {
            // 图片加载失败，跳过
        }
    }


    protected process(entities: Entity[]): void {
        if (!this.gameContainer) return;

        for (const entity of entities) {
            const renderable = entity.getComponent(Renderable);
            
            if (renderable) {
                this.updateSpriteEntity(entity);
            }
        }
    }

    private updateSpriteEntity(entity: Entity): void {
        const spriteEntity = this.spriteEntities.get(entity.id);
        if (!spriteEntity) {
            if (!this.creatingEntities.has(entity.id)) {
                this.creatingEntities.add(entity.id);
                this.createSpriteEntity(entity);
            }
            return;
        }

        const transform = entity.getComponent(Transform);
        const renderable = entity.getComponent(Renderable);

        if (!transform || !renderable) return;

        renderable.updateAnimations(Time.deltaTime);

        const { sprite, node } = spriteEntity;

        if (renderable.spritePath !== spriteEntity.lastSpritePath) {
            this.loadSpriteFrame(renderable.spritePath).then(spriteFrame => {
                sprite.spriteFrame = spriteFrame;
                spriteEntity.lastSpritePath = renderable.spritePath;
            });
        }

        const x = transform.position.x;
        const y = transform.position.y;
        if (x !== spriteEntity.lastX || y !== spriteEntity.lastY) {
            node.setPosition(x, y);
            spriteEntity.lastX = x;
            spriteEntity.lastY = y;
        }

        const rotation = transform.rotation;
        if (rotation !== spriteEntity.lastRotation) {
            node.setRotationFromEuler(0, 0, rotation * 180 / Math.PI);
            spriteEntity.lastRotation = rotation;
        }

        const scale = renderable.currentScale * renderable.scaleMultiplier;
        if (scale !== spriteEntity.lastScale) {
            node.setScale(scale, scale);
            spriteEntity.lastScale = scale;
        }

        const currentColor = renderable.currentColor;
        const alpha = renderable.alpha;

        if (currentColor.r !== spriteEntity.lastColor.r ||
            currentColor.g !== spriteEntity.lastColor.g ||
            currentColor.b !== spriteEntity.lastColor.b ||
            alpha !== spriteEntity.lastAlpha) {

            sprite.color = new Color(currentColor.r, currentColor.g, currentColor.b, Math.floor(alpha * 255));
            spriteEntity.lastColor.set(currentColor);
            spriteEntity.lastAlpha = alpha;
        }

        if (renderable.visible !== spriteEntity.lastVisible) {
            node.active = renderable.visible;
            spriteEntity.lastVisible = renderable.visible;
        }
    }


    public static createPlayer(): Renderable {
        const renderable = new Renderable();
        renderable.setSprite('images/player');
        return renderable;
    }

    public static createEnemy(): Renderable {
        const renderable = new Renderable();
        renderable.setSprite('images/enemy');
        return renderable;
    }

    public static createBullet(): Renderable {
        const renderable = new Renderable();
        renderable.setSprite('images/bullet');
        return renderable;
    }

    public static createCollectible(): Renderable {
        const renderable = new Renderable();
        renderable.setSprite('images/collectible');
        return renderable;
    }

    public static createGrenade(): Renderable {
        const renderable = new Renderable();
        renderable.setSprite('images/grenade');
        renderable.currentColor = Color.WHITE;
        renderable.currentScale = 1.2;
        return renderable;
    }

    public static createExplosionWarning(): Renderable {
        const renderable = new Renderable();
        renderable.setSprite('images/explosion_warning');
        renderable.currentColor = Color.RED;
        renderable.alpha = 0.6;
        renderable.currentScale = 1.0;
        return renderable;
    }
} 