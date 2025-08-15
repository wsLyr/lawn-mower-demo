import { Core } from '@esengine/ecs-framework';
import { Component, _decorator } from 'cc';
import { GameScene } from './scenes/GameScene';

const { ccclass, property } = _decorator;

@ccclass('ECSManager')
export class ECSManager extends Component {
    
    @property({
        tooltip: '是否启用调试模式'
    })
    public debugMode: boolean = true;
    
    private isInitialized: boolean = false;
    
    start() {
        this.initializeECS();
    }
    
    private initializeECS(): void {
        if (this.isInitialized) return;
        
        try {
            if (this.debugMode) {
                Core.create({
                    debugConfig: {
                        enabled: true,
                        websocketUrl: 'ws://localhost:8080/ecs-debug',
                        autoReconnect: true,
                        updateInterval: 100,
                        channels: {
                            entities: true,
                            systems: true,
                            performance: true,
                            components: true,
                            scenes: true
                        }
                    }
                });
            } else {
                Core.create(false);
            }
            
            const gameScene = new GameScene();
            Core.setScene(gameScene);
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('ECS框架初始化失败:', error);
        }
    }
    
    /**
     * 每帧更新ECS框架
     */
    update(deltaTime: number) {
        if (this.isInitialized) {
            // 更新ECS核心系统
            Core.update(deltaTime);
        }
    }
    
    /**
     * 组件销毁时清理ECS
     */
    onDestroy() {
        if (this.isInitialized) {
            console.log('🧹 清理ECS框架...');
            // ECS框架会自动处理场景清理
            this.isInitialized = false;
        }
    }
}
