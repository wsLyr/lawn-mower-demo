import { director, game, _decorator, CCBoolean } from "cc";
import { CinestationSmoothPath } from "../CinestationSmoothPath";
import { CinestationEvent } from "../Common/Events";
import { Nullable } from "../Common/Types";
import { VCamAutoDoly } from "./VCamAutoDolly";
import { Enum } from "cc";
const { ccclass, property } = _decorator;

export enum VCamUp {
    DEFAULT,
    PATH,
}

@ccclass("VCamTracked")
export class VCamTracked {
    @property({ visible: false })
    private _progress: number = 0;

    @property({
        tooltip: "i18n:cinestation.VCamTracked.path",
        animatable: false, type: CinestationSmoothPath
    })
    path: Nullable<CinestationSmoothPath> = null;

    @property({
        tooltip: "i18n:cinestation.VCamTracked.progress",
    })
    get progress() {
        return this._progress;
    }
    set progress(v: number) {
        if (this._progress !== v) {
            this._progress = v;
            if (CC_EDITOR) director.emit(CinestationEvent.EDITOR_CHANGED);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VCamTracked.damping",
        animatable: false, range: [0.1, 5], step: 0.1, slide: true
    })
    damping: number = 1;

    @property({
        type: Enum(VCamUp),
        animatable: false,
    })
    cameraUp: VCamUp = VCamUp.DEFAULT;

    @property({
        type: VCamAutoDoly,
        animatable: false,
    })
    autoDolly: VCamAutoDoly = new VCamAutoDoly();

}