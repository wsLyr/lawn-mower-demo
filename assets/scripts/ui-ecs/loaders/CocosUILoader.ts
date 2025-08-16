import { resources, Prefab, instantiate } from 'cc';
import { IUILoader, UIConfig } from '@esengine/mvvm-ui-framework';

export class CocosUILoader implements IUILoader {
    async loadUI(config: UIConfig): Promise<any> {
        return new Promise((resolve, reject) => {
            resources.load(config.path, Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                    return;
                }
                const uiNode = instantiate(prefab);
                resolve(uiNode);
            });
        });
    }

    async unloadUI(config: UIConfig): Promise<void> {
        resources.release(config.path);
    }

    isLoaded(config: UIConfig): boolean {
        return resources.get(config.path) !== null;
    }
}