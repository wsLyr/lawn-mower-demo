import { Core, Scene } from '@esengine/ecs-framework';
import { ECSManager } from '../ECSManager';

/**
 * ECS控制台调试工具
 * 提供控制台命令来查看ECS系统状态
 */
export class ECSConsoleDebug {
    private static instance: ECSConsoleDebug | null = null;
    private ecsManager: ECSManager | null = null;
    private updateInterval: number = 0;
    private isAutoUpdate: boolean = false;

    private constructor() {}

    public static getInstance(): ECSConsoleDebug {
        if (!ECSConsoleDebug.instance) {
            ECSConsoleDebug.instance = new ECSConsoleDebug();
        }
        return ECSConsoleDebug.instance;
    }

    /**
     * 初始化调试工具
     */
    public init(ecsManager?: ECSManager): void {
        this.ecsManager = ecsManager || null;
        
        // 注册全局调试命令
        this.registerGlobalCommands();
        
        console.log('ECS控制台调试工具已初始化');
        console.log('输入 ecsHelp() 查看可用命令');
    }

    /**
     * 注册全局调试命令
     */
    private registerGlobalCommands(): void {
        // @ts-ignore
        window.ecsHelp = () => this.showHelp();
        // @ts-ignore  
        window.ecsStats = () => this.showStats();
        // @ts-ignore
        window.ecsEntities = () => this.showEntities();
        // @ts-ignore
        window.ecsSystems = () => this.showSystems();
        // @ts-ignore
        window.ecsComponents = () => this.showComponents();
        // @ts-ignore
        window.ecsPerformance = () => this.showPerformance();
        // @ts-ignore
        window.ecsNetwork = () => this.showNetwork();
        // @ts-ignore
        window.ecsStartWatch = (interval?: number) => this.startAutoUpdate(interval);
        // @ts-ignore
        window.ecsStopWatch = () => this.stopAutoUpdate();
        // @ts-ignore
        window.ecsClear = () => console.clear();
    }

    /**
     * 显示帮助信息
     */
    private showHelp(): void {
        console.log(`
ECS调试控制台命令帮助

基础信息:
  ecsStats()          - 显示ECS系统总览
  ecsEntities()       - 显示所有实体信息
  ecsSystems()        - 显示所有系统信息
  ecsComponents()     - 显示组件统计信息
  
性能监控:
  ecsPerformance()    - 显示性能指标
  ecsNetwork()        - 显示网络状态
  
实时监控:
  ecsStartWatch(间隔) - 开始自动更新显示(默认2秒)
  ecsStopWatch()      - 停止自动更新
  
工具:
  ecsClear()          - 清空控制台
  ecsHelp()           - 显示此帮助信息

示例:
  ecsStartWatch(1)    - 每1秒自动显示统计信息
  ecsEntities()       - 查看当前所有实体
        `);
    }

    /**
     * 显示ECS系统总览
     */
    private showStats(): void {
        const scene = Core.scene;
        if (!scene) {
            console.warn('ECS未初始化或场景不存在');
            return;
        }

        const entityCount = scene.entities.count;
        const systemCount = scene.entityProcessors.count;
        
        console.log(`
ECS系统总览
════════════════
场景名称: ${scene.name}
实体数量: ${entityCount}
系统数量: ${systemCount}
        `);

        // 显示组件存储效率
        const sceneImpl = scene as Scene;
        if (sceneImpl.getStats) {
            const stats = sceneImpl.getStats();
            const { efficiency, activeTypes } = this.calculateStorageEfficiency(stats.componentStorageStats);
            
            console.log(`存储效率: ${efficiency.toFixed(1)}% (${activeTypes}个组件类型)`);
        }

        // 网络状态
        if (this.ecsManager) {
            const networkStats = this.ecsManager.getNetworkStats();
            const networkStatus = networkStats.connected ? '已连接' : '未连接';
            const latency = networkStats.latency ? ` (${networkStats.latency}ms)` : '';
            console.log(`网络状态: ${networkStatus}${latency}`);
        }
    }

    /**
     * 显示所有实体
     */
    private showEntities(): void {
        const scene = Core.scene;
        if (!scene) {
            console.warn('ECS未初始化或场景不存在');
            return;
        }

        const entities = scene.entities.buffer;
        console.log(`
实体列表 (共${entities.length}个)
═════════════════════════`);

        entities.forEach((entity, index) => {
            const componentCount = entity.components.length;
            const componentTypes = entity.components.map(c => c.constructor.name).join(', ');
            
            console.log(`${index + 1}. [ID:${entity.id}] ${entity.name}`);
            console.log(`   组件(${componentCount}): ${componentTypes || '无'}`);
            console.log(`   标签: ${entity.tag}`);
        });
    }

    /**
     * 显示所有系统
     */
    private showSystems(): void {
        const scene = Core.scene;
        if (!scene) {
            console.warn('ECS未初始化或场景不存在');
            return;
        }

        const systems = scene.entityProcessors.processors;
        console.log(`
系统列表 (共${systems.length}个)
═════════════════════════`);

        systems.forEach((system, index) => {
            const systemName = system.constructor.name;
            const updateOrder = system.updateOrder;
            
            console.log(`${index + 1}. ${systemName}`);
            console.log(`   更新顺序: ${updateOrder}`);
            
            // 尝试获取系统处理的实体数量
            const entityCount = (system as any)._entities?.length || 0;
            if (entityCount > 0) {
                console.log(`   处理实体: ${entityCount}个`);
            }
        });
    }

    /**
     * 显示组件统计
     */
    private showComponents(): void {
        const scene = Core.scene;
        if (!scene) {
            console.warn('ECS未初始化或场景不存在');
            return;
        }

        const sceneImpl = scene as Scene;
        if (!sceneImpl.getStats) {
            console.warn('当前场景实现不支持组件统计');
            return;
        }

        const stats = sceneImpl.getStats();
        console.log(`
组件存储统计
══════════════════════════`);

        for (const [componentType, componentStats] of stats.componentStorageStats) {
            if (componentStats.usedSlots > 0) {
                const efficiency = componentStats.totalSlots > 0 
                    ? ((componentStats.usedSlots / componentStats.totalSlots) * 100).toFixed(1)
                    : '100.0';
                
                console.log(`${componentType}:`);
                console.log(`   使用: ${componentStats.usedSlots}/${componentStats.totalSlots} (${efficiency}%)`);
                console.log(`   碎片: ${componentStats.fragmentation.toFixed(2)}`);
            }
        }
    }

    /**
     * 显示性能指标
     */
    private showPerformance(): void {
        const scene = Core.scene;
        if (!scene) {
            console.warn('ECS未初始化或场景不存在');
            return;
        }

        console.log(`
性能指标
═════════════════`);

        // 基础指标
        console.log(`实体数量: ${scene.entities.count}`);
        console.log(`系统数量: ${scene.entityProcessors.count}`);

        // 存储效率（稀疏集合优化后的关键指标）
        const sceneImpl = scene as Scene;
        if (sceneImpl.getStats) {
            const stats = sceneImpl.getStats();
            const { efficiency, totalSlots, usedSlots } = this.calculateStorageEfficiency(stats.componentStorageStats);
            
            console.log(`存储效率: ${efficiency.toFixed(1)}%`);
            console.log(`存储槽位: ${usedSlots}/${totalSlots}`);
            
            // 显示零碎片的优势
            let totalFragmentation = 0;
            let fragmentedTypes = 0;
            
            for (const [_, componentStats] of stats.componentStorageStats) {
                totalFragmentation += componentStats.fragmentation || 0;
                if (componentStats.fragmentation > 0) {
                    fragmentedTypes++;
                }
            }
            
            console.log(`碎片率: ${totalFragmentation.toFixed(2)}% (${fragmentedTypes}个类型有碎片)`);
        }

        // 网络延迟
        if (this.ecsManager) {
            const networkStats = this.ecsManager.getNetworkStats();
            if (networkStats.connected && networkStats.latency) {
                console.log(`网络延迟: ${networkStats.latency}ms`);
            }
        }
    }

    /**
     * 显示网络状态
     */
    private showNetwork(): void {
        if (!this.ecsManager) {
            console.warn('ECSManager不可用');
            return;
        }

        const networkStats = this.ecsManager.getNetworkStats();
        console.log(`
网络状态
═══════════════`);

        console.log(`连接状态: ${networkStats.connected ? '已连接' : '未连接'}`);
        
        if (networkStats.connected) {
            console.log(`客户端ID: ${networkStats.clientId || '未知'}`);
            console.log(`连接状态: ${networkStats.state || '未知'}`);
            
            if (networkStats.latency) {
                console.log(`延迟: ${networkStats.latency}ms`);
            }
            
            if (networkStats.stats) {
                console.log(`统计信息:`, networkStats.stats);
            }
        }
    }

    /**
     * 开始自动更新显示
     */
    private startAutoUpdate(intervalSeconds: number = 2): void {
        this.stopAutoUpdate(); // 先停止之前的
        
        console.log(`开始自动监控 (每${intervalSeconds}秒更新)`);
        console.log('输入 ecsStopWatch() 停止监控');
        
        this.isAutoUpdate = true;
        this.updateInterval = setInterval(() => {
            if (!this.isAutoUpdate) return;
            
            console.clear();
            console.log(`自动更新 - ${new Date().toLocaleTimeString()}`);
            this.showStats();
        }, intervalSeconds * 1000);
    }

    /**
     * 停止自动更新
     */
    private stopAutoUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = 0;
        }
        
        if (this.isAutoUpdate) {
            this.isAutoUpdate = false;
            console.log('已停止自动监控');
        }
    }

    /**
     * 计算存储效率
     */
    private calculateStorageEfficiency(componentStats: Map<string, any>): {
        efficiency: number;
        activeTypes: number;
        totalSlots: number;
        usedSlots: number;
    } {
        let totalSlots = 0;
        let usedSlots = 0;
        let activeTypes = 0;
        
        for (const [_, stats] of componentStats) {
            if (stats.usedSlots > 0) {
                activeTypes++;
                totalSlots += stats.totalSlots || 0;
                usedSlots += stats.usedSlots || 0;
            }
        }
        
        const efficiency = totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 100;
        
        return {
            efficiency,
            activeTypes,
            totalSlots,
            usedSlots
        };
    }

    /**
     * 销毁调试工具
     */
    public destroy(): void {
        this.stopAutoUpdate();
        
        // 清理全局命令
        // @ts-ignore
        delete window.ecsHelp;
        // @ts-ignore
        delete window.ecsStats;
        // @ts-ignore
        delete window.ecsEntities;
        // @ts-ignore
        delete window.ecsSystems;
        // @ts-ignore
        delete window.ecsComponents;
        // @ts-ignore
        delete window.ecsPerformance;
        // @ts-ignore
        delete window.ecsNetwork;
        // @ts-ignore
        delete window.ecsStartWatch;
        // @ts-ignore
        delete window.ecsStopWatch;
        // @ts-ignore
        delete window.ecsClear;
        
        console.log('ECS控制台调试工具已清理');
    }
}