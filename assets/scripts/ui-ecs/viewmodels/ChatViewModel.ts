import { Node } from 'cc';
import { ViewModel, observable, command, viewModel, ui, UIOperations, DEFAULT_UI_LAYERS } from '@esengine/mvvm-ui-framework';
import { UIAnimations } from '../animations/UIAnimations';

@viewModel
@ui<ChatViewModel, Node>({
    name: 'ChatUI',
    path: 'prefabs/ui/chat/Chat',
    modal: false,
    cacheable: true,
    layer: DEFAULT_UI_LAYERS.MAIN,
    animation: {
        showAnimation: UIAnimations.elasticScaleIn,
        hideAnimation: UIAnimations.scaleOut
    }
})
export class ChatViewModel extends ViewModel {
    public get name(): string {
        return 'ChatViewModel';
    }

    protected onInitialize(): void {
    }

    @command()
    public close(): void {
        UIOperations.closeUI(this);
    }
}