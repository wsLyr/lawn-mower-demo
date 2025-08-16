import { Node } from 'cc';
import { IUIRenderer } from '@esengine/mvvm-ui-framework';

/**
 * Cocos Creator UI渲染器
 * 实现UI的显示、隐藏、层级管理等操作
 */
export class CocosUIRenderer implements IUIRenderer<Node> {
    private _uiRoot: Node | null = null;

    /**
     * 设置UI根节点
     */
    public setUIRoot(root: Node): void {
        this._uiRoot = root;
    }

    /**
     * 获取UI根节点
     */
    public getUIRoot(): Node | null {
        return this._uiRoot;
    }

    /**
     * 将UI添加到父节点
     */
    public addUIToParent(view: Node, parent: Node): void {
        parent.addChild(view);
    }

    /**
     * 从父节点移除UI
     */
    public removeUIFromParent(view: Node): void {
        if (view.parent) {
            view.removeFromParent();
        }
    }

    /**
     * 设置UI层级
     */
    public setUILayer(view: Node, layer: number): void {
        view.setSiblingIndex(layer);
    }

    /**
     * 设置UI可见性
     */
    public setUIVisible(view: Node, visible: boolean): void {
        view.active = visible;
    }
}