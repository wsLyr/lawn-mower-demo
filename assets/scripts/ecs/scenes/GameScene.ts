import { Scene, Core, Time, Entity } from '@esengine/ecs-framework';
import { Transform, Renderable, Movement, Health, ParticleEffect, Weapon, ColliderComponent, PlayerInput, CameraTarget, EnemySpawner } from '../components';
import { RenderSystem, MovementSystem, WeaponSystem, ProjectileSystem, CollisionSystem, PlayerInputSystem, AISystem, CameraFollowSystem, HealthSystem, ParticleSystem, EnemySpawnSystem, PhysicsSystem } from '../systems';
import { director, Node, Color, Vec2, PhysicsSystem2D, Camera, Layers } from 'cc';
import { ITimer } from '@esengine/ecs-framework';
import { EntityTags } from '../EntityTags';

/**
 * 游戏场景
 */
export class GameScene extends Scene {
    
    private playerEntity: Entity = null;
    private gameContainer: Node = null;
    private mainCamera: Camera | null = null;
    private renderSystem: RenderSystem | null = null;
    private enemySpawnSystem: EnemySpawnSystem | null = null;
    
    /**
     * 场景初始化 - ECS框架标准
     */
    public initialize(): void {
        super.initialize();
        
        this.name = "LawnMowerShooterScene";
        this.enablePhysics();
        this.createGameContainer();
        
        this.addSystem(new PlayerInputSystem());
        this.addSystem(new MovementSystem());
        this.addSystem(new AISystem());
        this.addSystem(new WeaponSystem());
        this.addSystem(new ProjectileSystem());
        this.addSystem(new CollisionSystem());
        this.addSystem(new HealthSystem());
        this.addSystem(new ParticleSystem());
        this.addSystem(new CameraFollowSystem());
        this.addSystem(new PhysicsSystem());
        
        this.renderSystem = new RenderSystem();
        this.addSystem(this.renderSystem);
        
        this.enemySpawnSystem = new EnemySpawnSystem();
        this.addSystem(this.enemySpawnSystem);
        
        this.setupSystemDependencies();
        
        this.createPlayer();
        this.createEnemySpawner();
    }
    
    /**
     * 启用物理系统
     */
    private enablePhysics(): void {
        const physicsSystem = PhysicsSystem2D.instance;
        physicsSystem.enable = false;
    }
    
    /**
     * 创建游戏容器
     */
    private createGameContainer(): void {
        const scene = director.getScene();
        const canvas = scene?.getChildByName('Canvas');
        
        if (canvas) {
            this.gameContainer = new Node('GameContainer');
            this.gameContainer.parent = canvas;
            this.gameContainer.layer = Layers.Enum.UI_2D;
            
            this.mainCamera = canvas.getChildByName("Camera").getComponent(Camera);
        }
    }
    
    /**
     * 设置系统依赖关系
     */
    private setupSystemDependencies(): void {
        if (this.gameContainer) {
            this.renderSystem?.setGameContainer(this.gameContainer);
            
            const weaponSystem = this.getEntityProcessor(WeaponSystem);
            if (weaponSystem) {
                weaponSystem.setGameContainer(this.gameContainer);
            }
        }
        
        if (this.mainCamera) {
            const cameraFollowSystem = this.getEntityProcessor(CameraFollowSystem);
            if (cameraFollowSystem) {
                cameraFollowSystem.setCamera(this.mainCamera);
            }
        }
    }

    public onStart(): void {
        super.onStart();
    }
    
    private createPlayer(): void {
        this.playerEntity = this.createEntity("ShooterHero");
        this.playerEntity.tag = EntityTags.PLAYER;
        
        const transform = new Transform(0, 0, 0);
        this.playerEntity.addComponent(transform);
        
        const movement = new Movement(180);
        this.playerEntity.addComponent(movement);
        
        const playerInput = new PlayerInput();
        this.playerEntity.addComponent(playerInput);
        
        const cameraTarget = new CameraTarget(100);
        this.playerEntity.addComponent(cameraTarget);
        
        const renderable = RenderSystem.createPlayer();
        this.playerEntity.addComponent(renderable);
        
        const health = new Health(999999);
        this.playerEntity.addComponent(health);
        
        const weapon = new Weapon(30, 16);
        weapon.bulletSpeed = 600;
        weapon.bulletLifeTime = 2;
        weapon.bulletSize = 4;
        weapon.pierceCount = 1;
        weapon.autoFire = true;
        this.playerEntity.addComponent(weapon);
        
        const collider = new ColliderComponent('circle');
        collider.setSize(15);
        this.playerEntity.addComponent(collider);
    }
    
    private createEnemySpawner(): void {
        const spawnerEntity = this.createEntity("EnemySpawner");
        spawnerEntity.tag = EntityTags.SPAWNER;
        
        const spawner = new EnemySpawner(50.0);
        spawnerEntity.addComponent(spawner);
    }
    
    private handlePlayerHit(): void {
        const health = this.playerEntity?.getComponent(Health);
        if (health) {
            health.takeDamage(10);
            
            if (health.current <= 0) {
                
            }
        }
    }
    
    /**
     * 场景卸载
     */
    public unload(): void {
        if (this.gameContainer) {
            this.gameContainer.destroy();
            this.gameContainer = null;
        }
        
        this.playerEntity = null;
        this.mainCamera = null;
        this.renderSystem = null;
        this.enemySpawnSystem = null;
        
        super.unload();
    }
    
    public getPlayer(): Entity | null {
        return this.playerEntity;
    }
    
    public getRenderSystem(): RenderSystem | null {
        return this.renderSystem;
    }
} 