import { game, Vec3, _decorator } from "cc";
import { CinestationEvent } from "../Common/Events";
const { ccclass, property } = _decorator;

@ccclass("VCamComposer")
export class VCamComposer {

    @property({ visible: false })
    private _deadZoneWidth: number = 0.1;

    @property({ visible: false })
    private _deadZoneHeight: number = 0.1;

    @property({ visible: false })
    private _softZoneWidth: number = 0.8;

    @property({ visible: false })
    private _softZoneHeight: number = 0.8;

    @property({
        tooltip: "i18n:cinestation.VCamComposer.lookaheadTime",
        range: [0, 1], step: 0.1, slide: true,
    })
    lookaheadTime: number = 0.2;

    @property({
        tooltip: "i18n:cinestation.VCamComposer.lookaheadDamping",
        range: [0.1, 2], step: 0.1, slide: true,
    })
    lookaheadDamping: number = 0.5;

    @property({
        tooltip: "i18n:cinestation.VCamComposer.lookatDamping",
        range: [0.1, 2], step: 0.1, slide: true,
    })
    lookatDamping: number = 0.3;

    @property({
        tooltip: "i18n:cinestation.VCamComposer.deadZoneWidth",
        range: [0, 1], step: 0.01, slide: true,
    })
    get deadZoneWidth() {
        return this._deadZoneWidth;
    }
    set deadZoneWidth(v: number) {
        if (this._deadZoneWidth !== v) {
            this._deadZoneWidth = v;
            if (CC_EDITOR) game.emit(CinestationEvent.COMPOSER_CHANGED);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VCamComposer.deadZoneHeight",
        range: [0, 1], step: 0.01, slide: true,
    })
    get deadZoneHeight() {
        return this._deadZoneHeight;
    }
    set deadZoneHeight(v: number) {
        if (this._deadZoneHeight !== v) {
            this._deadZoneHeight = v;
            if (CC_EDITOR) game.emit(CinestationEvent.COMPOSER_CHANGED);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VCamComposer.softZoneWidth",
        range: [0, 1], step: 0.01, slide: true,
    })
    get softZoneWidth() {
        return this._softZoneWidth;
    }
    set softZoneWidth(v: number) {
        if (this._softZoneWidth !== v) {
            this._softZoneWidth = v;
            if (CC_EDITOR) game.emit(CinestationEvent.COMPOSER_CHANGED);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VCamComposer.softZoneHeight",
        range: [0, 1], step: 0.01, slide: true,
    })
    get softZoneHeight() {
        return this._softZoneHeight;
    }
    set softZoneHeight(v: number) {
        if (this._softZoneHeight !== v) {
            this._softZoneHeight = v;
            if (CC_EDITOR) game.emit(CinestationEvent.COMPOSER_CHANGED);
        }
    }
}
