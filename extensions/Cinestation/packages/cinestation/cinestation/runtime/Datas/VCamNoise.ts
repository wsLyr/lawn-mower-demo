import { Enum, Vec3, _decorator } from "cc";
import { NoiseProfile } from "../NoiseGenerator";
const { ccclass, property } = _decorator;

export enum NoiseType {
    None,
    Perlin,
}

@ccclass("VCamNoise")
export class VCamNoise {

    @property({ type: Enum(NoiseType) })
    type: NoiseType = NoiseType.None;

    @property({
        tooltip: "i18n:cinestation.VCamNoise.profile",
        type: Enum(NoiseProfile), visible() { return this.type !== NoiseType.None }
    })
    profile: NoiseProfile = NoiseProfile.Noise_CM_4;

    @property({
        tooltip: "i18n:cinestation.VCamNoise.amplitudeGain",
        visible() { return this.type !== NoiseType.None }
    })
    amplitudeGain: number = 1;

    @property({
        tooltip: "i18n:cinestation.VCamNoise.frequncyGain",
        visible() { return this.type !== NoiseType.None }
    })
    frequncyGain: number = 1;
}
