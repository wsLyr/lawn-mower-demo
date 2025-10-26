import { director, game, _decorator } from "cc";
import { CinestationEvent } from "../Common/Events";
const { ccclass, property } = _decorator;

@ccclass("VCamAutoDoly")
export class VCamAutoDoly {
    @property({ visible: false })
    private _enable: boolean = true;

    @property({ visible: false })
    private _searchRadius: number = 2;

    @property({ visible: false })
    private _searchResolution: number = 5;

    @property({
        tooltip: "i18n:cinestation.VCamAutoDoly.enable"
    })
    get enable() {
        return this._enable;
    }
    set enable(v: boolean) {
        if (this._enable !== v) {
            this._enable = v;
            if (CC_EDITOR) director.emit(CinestationEvent.EDITOR_CHANGED);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VCamAutoDoly.searchRadius"
    })
    get searchRadius() {
        return this._searchRadius;
    }
    set searchRadius(v: number) {
        if (this._searchRadius !== v) {
            this._searchRadius = v;
            if (CC_EDITOR) director.emit(CinestationEvent.EDITOR_CHANGED);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VCamAutoDoly.searchResolution"
    })
    get searchResolution() {
        return this._searchResolution;
    }
    set searchResolution(v: number) {
        if (this._searchResolution !== v) {
            this._searchResolution = v;
            if (CC_EDITOR) director.emit(CinestationEvent.EDITOR_CHANGED);
        }
    }
}
