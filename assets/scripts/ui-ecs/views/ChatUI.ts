import { _decorator, Component, Button } from 'cc';
import { uiComponent, getCurrentViewModel } from '@esengine/mvvm-ui-framework';
import { ChatViewModel } from '../viewmodels/ChatViewModel';

const { ccclass, property } = _decorator;

@ccclass('ChatUI')
@uiComponent(ChatViewModel)
export class ChatUI extends Component {
    @property({ type: Button, tooltip: '关闭按钮' })
    public closeButton: Button | null = null;

    private _viewModel: ChatViewModel | null = null;

    protected onLoad(): void {
        this._viewModel = getCurrentViewModel<ChatViewModel>(this);
        this._bindUI();
    }

    protected onDestroy(): void {
        this._unbindUI();
    }

    private _bindUI(): void {
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this._onCloseButtonClick, this);
        }
    }

    private _unbindUI(): void {
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK, this._onCloseButtonClick, this);
        }
    }

    private _onCloseButtonClick(): void {
        if (this._viewModel) {
            this._viewModel.executeCommand('close');
        }
    }

    public getViewModel(): ChatViewModel | null {
        return this._viewModel;
    }
}