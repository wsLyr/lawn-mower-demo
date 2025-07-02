import { Scene, Core, Time, Entity } from '@esengine/ecs-framework';
import { Transform, Renderable, Movement, Health, ParticleEffect, Weapon, ColliderComponent, PlayerInput, AIComponent, CameraTarget } from '../components';
import { RenderSystem, MovementSystem, WeaponSystem, ProjectileSystem, CollisionSystem, PlayerInputSystem, AISystem, CameraFollowSystem, HealthSystem } from '../systems';
import { director, Node, Graphics, Color, Vec2, PhysicsSystem2D, Camera } from 'cc';
import { ITimer } from '@esengine/ecs-framework';

/**
 * 游戏场景
 */
export class GameScene extends Scene {
    
    private playerEntity: Entity = null;
    private enemies: Entity[] = [];
    private gameContainer: Node = null;
    private enemySpawnTimer: ITimer | null = null;
    private mainCamera: Camera | null = null;
    

    
    /**
     * 场景初始化 - ECS框架标准
     */
    public initialize(): void {
        super.initialize();
        
        this.name = "LawnMowerShooterScene";
        this.enablePhysics();
        this.setupSystems();
        this.createGameContainer();
    }
    
    /**
     * 启用物理系统
     */
    private enablePhysics(): void {
        const physicsSystem = PhysicsSystem2D.instance;
        physicsSystem.enable = true;
        physicsSystem.gravity.set(0, 0);
    }
    
    /**
     * 设置所有系统 - 按照ECS框架标准
     */
    private setupSystems(): void {
        // 输入系统 - 处理玩家输入
        const playerInputSystem = new PlayerInputSystem();
        this.addEntityProcessor(playerInputSystem);
        
        // AI系统 - 处理敌人AI
        const aiSystem = new AISystem();
        this.addEntityProcessor(aiSystem);
        
        // 移动系统
        const movementSystem = new MovementSystem();
        this.addEntityProcessor(movementSystem);
        
        // 武器系统
        const weaponSystem = new WeaponSystem();
        this.addEntityProcessor(weaponSystem);
        
        // 子弹系统
        const projectileSystem = new ProjectileSystem();
        this.addEntityProcessor(projectileSystem);
        
        // 碰撞系统
        const collisionSystem = new CollisionSystem();
        this.addEntityProcessor(collisionSystem);
        
        // 血量系统
        const healthSystem = new HealthSystem();
        this.addEntityProcessor(healthSystem);
        
        // 相机跟随系统
        const cameraFollowSystem = new CameraFollowSystem();
        this.addEntityProcessor(cameraFollowSystem);
        
        // 渲染系统
        const renderSystem = new RenderSystem();
        this.addEntityProcessor(renderSystem);
        
        this.setSystemUpdateOrder();
    }
    
    /**
     * 设置系统执行顺序 - ECS框架标准做法
     */
    private setSystemUpdateOrder(): void {
        const systems = this.entityProcessors.processors;
        
        for (let i = 0; i < systems.length; i++) {
            const system = systems[i];
            system.setUpdateOrder(i * 10);
        }
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
            this.gameContainer.layer = 1 << 25;
            
            // 获取主摄像机
            this.mainCamera = canvas.getChildByName("Camera").getComponent(Camera);
            
            // 设置武器系统的游戏容器
            const weaponSystem = this.getEntityProcessor(WeaponSystem);
            if (weaponSystem) {
                weaponSystem.setGameContainer(this.gameContainer);
            }
            
            // 设置相机跟随系统的相机
            const cameraFollowSystem = this.getEntityProcessor(CameraFollowSystem);
            if (cameraFollowSystem && this.mainCamera) {
                cameraFollowSystem.setCamera(this.mainCamera);
            }
        }
    }
    
    /**
     * 场景开始运行
     */
    public onStart(): void {
        super.onStart();
        
        this.createPlayer();
        this.createInitialEnemies();
        this.startEnemySpawning();
    }
    
    /**
     * 创建玩家角色 - 射击游戏主角
     */
    private createPlayer(): void {
        this.playerEntity = this.createEntity("ShooterHero");
        
        const transform = new Transform(0, 0, 0);
        this.playerEntity.addComponent(transform);
        
        const movement = new Movement(180);
        this.playerEntity.addComponent(movement);
        
        // 添加玩家输入组件，让PlayerInputSystem处理输入
        const playerInput = new PlayerInput();
        this.playerEntity.addComponent(playerInput);
        
        // 添加相机目标组件，让CameraFollowSystem跟随玩家
        const cameraTarget = new CameraTarget(100); // 最高优先级
        this.playerEntity.addComponent(cameraTarget);
        
        const renderData = RenderSystem.createRenderableNode(this.gameContainer);
        const renderable = new Renderable(renderData.node, renderData.graphics);
        
        renderable.node.layer = 1 << 25;
        
        renderable.shapeType = 'polygon';
        renderable.sides = 4;
        renderable.radius = 18;
        renderable.setColor(new Color(100, 150, 255, 255));
        renderable.strokeColor = new Color(255, 255, 255, 255);
        renderable.strokeWidth = 2;
        renderable.enableShadow = true;
        renderable.shadowOffset = { x: 2, y: -2 };
        
        this.playerEntity.addComponent(renderable);
        
        const health = new Health(100);
        this.playerEntity.addComponent(health);
        
        const weapon = new Weapon(15, 3);
        weapon.range = 250;
        weapon.bulletSpeed = 400;
        weapon.bulletLifeTime = 2;
        weapon.bulletSize = 4;
        weapon.pierceCount = 1;
        weapon.autoFire = true;
        this.playerEntity.addComponent(weapon);
        
        const collider = new ColliderComponent(renderable.node, 'circle', 'player');
        collider.setSize(15);
        collider.addTag('player');
        this.playerEntity.addComponent(collider);
    }
    
    /**
     * 创建初始敌人
     */
    private createInitialEnemies(): void {
        for (let i = 0; i < 5; i++) {
            this.createEnemy();
        }
    }
    
    /**
     * 创建敌人实体 - 红色追击者
     */
    private createEnemy(): void {
        const enemy = this.createEntity("RedChaser");
        
        const spawnDistance = 400;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * spawnDistance;
        const y = Math.sin(angle) * spawnDistance;
        
        const transform = new Transform(x, y, 0);
        enemy.addComponent(transform);
        
        // 敌人移动速度适中，比主角慢一些但不会太慢
        const moveSpeed = 60 + Math.random() * 40; // 60-100速度
        const movement = new Movement(moveSpeed);
        enemy.addComponent(movement);
        
        // 添加AI组件，让AISystem处理敌人行为
        const aiComponent = new AIComponent('chaser', 'player');
        aiComponent.detectionRange = 2000; // 增加检测范围，让敌人能从更远的地方追击
        enemy.addComponent(aiComponent);
        
        const renderData = RenderSystem.createRenderableNode(this.gameContainer);
        const renderable = new Renderable(renderData.node, renderData.graphics);
        
        renderable.node.layer = 1 << 25;
        
        renderable.shapeType = 'circle';
        renderable.radius = 12;
        renderable.setColor(new Color(255, 80, 80, 255));
        renderable.strokeColor = new Color(180, 0, 0, 255);
        renderable.strokeWidth = 1;
        renderable.enableShadow = true;
        renderable.shadowOffset = { x: 1, y: -1 };
        
        enemy.addComponent(renderable);
        
        const health = new Health(25);
        enemy.addComponent(health);
        
        const collider = new ColliderComponent(renderable.node, 'circle', 'enemy');
        collider.setSize(12);
        collider.addTag('enemy');
        enemy.addComponent(collider);
        
        this.enemies.push(enemy);
    }
    
    /**
     * 开始敌人生成循环
     */
    private startEnemySpawning(): void {
        this.enemySpawnTimer = Core.schedule(0.8, true, this, (timer: ITimer) => {
            if (this.enemies.length < 50) {
                this.createEnemy();
            }
        });
    }
    
    /**
     * 处理玩家受伤
     */
    private handlePlayerHit(): void {
        const health = this.playerEntity?.getComponent(Health);
        if (health) {
            health.takeDamage(10);
            
            if (health.current <= 0) {
                console.log('游戏结束！');
            }
        }
    }
    
    /**
     * 场景卸载
     */
    public unload(): void {
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.stop();
            this.enemySpawnTimer = null;
        }
        
        if (this.gameContainer) {
            this.gameContainer.destroy();
            this.gameContainer = null;
        }
        
        this.playerEntity = null;
        this.enemies = [];
        this.mainCamera = null;
        
        super.unload();
    }
} 