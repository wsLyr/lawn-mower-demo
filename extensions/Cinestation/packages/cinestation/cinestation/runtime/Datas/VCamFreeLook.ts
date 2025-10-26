import { Vec3, _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass("VCamFreeLook")
export class VCamFreeLook {
    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.forbidX",
        animatable: false
    })
    forbidX: boolean = false;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.forbidY",
        animatable: false
    })
    forbidY: boolean = false;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.forbidZ",
        animatable: false
    })
    forbidZ: boolean = false;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.forbidPan",
        animatable: false
    })
    forbidPan: boolean = false;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.rotateSpeed",
        animatable: false, range: [0.1, 5], step: 0.1, slide: true
    })
    rotateSpeed: number = 1;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.rotateSmoothing",
        animatable: false, range: [0.1, 5], step: 0.1, slide: true
    })
    rotateSmoothing: number = 0.5;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.panSpeed",
        animatable: false, range: [0.1, 5], step: 0.1, slide: true
    })
    panSpeed: number = 1;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.panSmoothing",
        animatable: false, range: [0.1, 5], step: 0.1, slide: true
    })
    panSmoothing: number = 0.5;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.followOffset",
    })
    followOffset: Vec3 = new Vec3(0, 0, -10);

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.followDamping",
        animatable: false, range: [0, 1], step: 0.1, slide: true
    })
    followDamping: number = 1;

    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.distanceMin",
    })
    distanceMin: number = -10000;
    @property({
        tooltip: "i18n:cinestation.VCamFreeLook.distanceMax",
    })
    distanceMax: number = 10000;

    phiMin: number = 0.001;
    phiMax: number = Math.PI - 0.001;
    thetaMin: number = -Infinity;
    thetaMax: number = Infinity;
    rotateTouchID: number = 0;
}
