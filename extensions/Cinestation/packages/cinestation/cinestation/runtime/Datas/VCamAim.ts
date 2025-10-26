import { Enum, Vec3, _decorator } from "cc";
import { VCamComposer } from "./VCamComposer";
const { ccclass, property } = _decorator;

export enum AimType {
    None = 0,
    Composer = 1,
    HardLookAt = 2,
}

@ccclass("VCamAim")
export class VCamAim {

    @property({ type: Enum(AimType) })
    type: AimType = AimType.Composer;

    @property({
        tooltip: "i18n:cinestation.VCamAim.trackedObjectOffset",
    })
    trackedObjectOffset: Vec3 = new Vec3();

    @property({ type: VCamComposer, visible() { return this.type === AimType.Composer } })
    composer: VCamComposer = new VCamComposer();
}