import { isValid, Quat, Vec3 } from "cc";
import { Vec4_closeTo } from "../CinestationMath";
import { IVCam } from "../Datas/IVCam";
import { CameraHandler } from "./CameraHandler";
import { VCamUp } from "../Datas/VCamTracked";

let __worldPos = new Vec3();
let __rotation = new Quat();
let __cameraUp = new Vec3();
export class HardLookAtHandler extends CameraHandler<IVCam> {

    public updateCamera(deltaTime: number) {
        let vcam = this._vcam;
        if (isValid(vcam.lookAt)) {
            Vec3.add(__worldPos, vcam.lookAt.position, vcam.aim.trackedObjectOffset);
            if (vcam.lookAt.parent) {
                __worldPos.add(vcam.lookAt.parent.worldPosition);
            }
            vcam.lookaheadPosition.set(__worldPos);

            let tracked = vcam.body.tracked;
            if (tracked.path) {
                switch (tracked.cameraUp) {
                    case VCamUp.PATH:
                        tracked.path.evaluteUp(__cameraUp, tracked.progress);
                        break;
                    default:
                        __cameraUp.set(0, 1, 0);
                        break;
                }
            }
            else {
                __cameraUp.set(0, 1, 0);
            }

            Quat.fromViewUp(__rotation, Vec3.subtract(__worldPos, vcam.node.worldPosition, __worldPos).normalize(), __cameraUp);
            if (!Vec4_closeTo(__rotation, vcam.node.worldRotation)) {
                vcam.node.worldRotation = __rotation;
            }
        }
    }
}