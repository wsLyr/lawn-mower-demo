import { Node } from "cc";
import { clamp, EventMouse, Touch, EventTouch, toRadian, Vec2, Vec3, sys, view, log, isValid, director, input, Input } from "cc";
import { cinestation } from "../CinestationData";
import { quarticDamp, Spherical, Vec3_closeTo, Vec3_setFromMatrixColumn, Vec3_setFromSpherical, Vec3_smoothDamp } from "../CinestationMath";
import { IVCam } from "../Datas/IVCam";
import { CameraHandler } from "./CameraHandler";

const { abs, tan } = Math;

let __worldPos = new Vec3();
let __posDelta = new Vec3();
let __moveDelta = new Vec2();
let __armDelta = new Vec3();
let __xAxis = new Vec3();
let __yAxis = new Vec3();
let __loc0 = new Vec2();
let __loc1 = new Vec2();
let __preLoc0 = new Vec2();
let __preLoc1 = new Vec2();

export class FreeLookHandler extends CameraHandler<IVCam> {
    private _button: number = -1;
    private _needUpdateRotate: boolean = false;
    private _rotateDelta: Vec2 = new Vec2();
    private _panDelta: Vec2 = new Vec2();
    private _distanceScale: number = 1;
    private _spherical: Spherical = new Spherical();

    public onEnable() {
        if (cinestation.input) this._registInputEvents();
        director.on("VCam.enableInput", this._onEnableInput, this);
    }

    public onDisable() {
        if (cinestation.input) this._clearInputEvents();
        director.off("VCam.enableInput", this._onEnableInput, this);
    }

    public onLookAtChanged(target: Node): void {
        this._needUpdateRotate = true;
    }

    private _registInputEvents() {
        input.on(Input.EventType.MOUSE_DOWN, this._onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this._onMouseUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
        input.on(Input.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    private _clearInputEvents() {
        input.off(Input.EventType.MOUSE_DOWN, this._onMouseDown, this);
        input.off(Input.EventType.MOUSE_UP, this._onMouseUp, this);
        input.off(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
        input.off(Input.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    private _onEnableInput(v: boolean) {
        if (v) this._registInputEvents();
        else this._clearInputEvents();
    }

    private _getPreviousLocation(e: EventTouch | EventMouse | Touch, out: Vec2) {
        return e.getPreviousLocation(out);
    }

    private _getLocation(e: EventTouch | EventMouse | Touch, out: Vec2) {
        return e.getLocation(out);
    }

    private _onTouchMove(e: EventTouch) {
        if (!sys.isMobile) return;

        let freelook = this._vcam.body.freelook;
        let rotateTouchID = freelook.rotateTouchID;

        let touchs = e.getAllTouches();
        if (touchs.length > rotateTouchID + 1) {
            this._getPreviousLocation(touchs[rotateTouchID], __preLoc0);
            this._getPreviousLocation(touchs[rotateTouchID + 1], __preLoc1);
            this._getLocation(touchs[rotateTouchID], __loc0);
            this._getLocation(touchs[rotateTouchID + 1], __loc1);

            this._distanceScale *= this._calculateDistanceScale(Vec2.distance(__preLoc0, __preLoc1) / Vec2.distance(__loc0, __loc1));

            __preLoc0.add(__preLoc1).multiplyScalar(0.5);
            __loc0.add(__loc1).multiplyScalar(0.5);
            this._setPanDelta(this._calculatePanDelta(__moveDelta, __preLoc0, __loc0));
        }
        else if (touchs.length > rotateTouchID) {
            this._rotateDelta.add(this._calculateRotateDelta(__moveDelta, this._getPreviousLocation(touchs[rotateTouchID], __loc0), this._getLocation(touchs[rotateTouchID], __loc1)));
        }
    }

    private _onTouchEnd(e: EventTouch) {

    }

    private _onMouseDown(e: EventMouse) {
        this._button = e.getButton();
    }

    private _onMouseUp(e: EventMouse) {
        this._button = -1;
    }

    private _onMouseWheel(e: EventMouse) {
        if (e.getScrollY() > 0) {
            this._distanceScale *= this._calculateDistanceScale(0.95);
        }
        else if (e.getScrollY() < 0) {
            this._distanceScale *= this._calculateDistanceScale(1 / 0.95);
        }
    }

    private _onMouseMove(e: EventMouse) {
        switch (this._button) {
            case EventMouse.BUTTON_LEFT:
                this._rotateDelta.add(this._calculateRotateDelta(__moveDelta, this._getPreviousLocation(e, __loc0), this._getLocation(e, __loc1)));
                break;
            case EventMouse.BUTTON_MIDDLE:
                this._setPanDelta(this._calculatePanDelta(__moveDelta, this._getPreviousLocation(e, __loc0), this._getLocation(e, __loc1)));
                break;
        }
    }

    private _setPanDelta(delta: Vec2) {
        this._panDelta.add(delta);
    }

    private _calculateDistanceScale(scale: number) {
        return scale;
    }

    private _calculateRotateDelta(out: Vec2, loc0: Vec2, loc1: Vec2) {
        let freelook = this._vcam.body.freelook;
        Vec2.subtract(out, loc1, loc0).multiplyScalar(freelook.rotateSpeed * 2 * Math.PI / view.getVisibleSizeInPixel().height);
        return out;
    }

    private _calculatePanDelta(out: Vec2, loc0: Vec2, loc1: Vec2) {
        let freelook = this._vcam.body.freelook;
        Vec2.subtract(out, loc1, loc0).multiplyScalar(freelook.panSpeed / view.getVisibleSizeInPixel().height);
        return out;
    }

    public updateCamera(deltaTime: number) {
        let vcam = this._vcam;
        let freelook = vcam.body.freelook;

        let followChanged = 0;

        if (isValid(vcam.lookAt)) {
            Vec3.add(__worldPos, vcam.lookAt.worldPosition, vcam.aim.trackedObjectOffset);
            let dampFactor = quarticDamp(1, 0, freelook.rotateSmoothing, deltaTime);

            if (abs(this._rotateDelta.x) + abs(this._rotateDelta.y) > 0.01 || this._distanceScale !== 1 || this._needUpdateRotate) {
                Vec3.subtract(__posDelta, vcam.node.worldPosition, __worldPos);
                this._spherical.setFromVec3(__posDelta);

                if (!freelook.forbidX) {
                    this._spherical.theta = clamp(this._spherical.theta - this._rotateDelta.x * (1 - dampFactor), freelook.thetaMin, freelook.thetaMax);
                }
                if (!freelook.forbidY) {
                    this._spherical.phi = clamp(this._spherical.phi + this._rotateDelta.y * (1 - dampFactor), freelook.phiMin, freelook.phiMax);
                }
                if (!freelook.forbidZ) {
                    this._spherical.radius = clamp(this._spherical.radius * this._distanceScale, freelook.distanceMin, freelook.distanceMax);
                }

                Vec3_setFromSpherical(__posDelta, this._spherical);
                vcam.node.worldPosition = __posDelta.add(__worldPos);

                followChanged = (this._needUpdateRotate || this._distanceScale !== 1) ? 1 : 2;

                this._needUpdateRotate = false;
                this._rotateDelta.multiplyScalar(dampFactor);
                this._distanceScale = 1;
            }
            if (!freelook.forbidPan && abs(this._panDelta.x) + abs(this._panDelta.y) > 0.01) {
                Vec3.subtract(__posDelta, vcam.node.worldPosition, __worldPos);

                Vec3_setFromMatrixColumn(__xAxis, vcam.node.worldMatrix, 0);
                Vec3_setFromMatrixColumn(__yAxis, vcam.node.worldMatrix, 1);

                let length = __posDelta.length() * 2 * tan(toRadian(vcam.lens.fov * 0.5));

                let trackedObjectOffset = vcam.aim.trackedObjectOffset;
                trackedObjectOffset.subtract(__xAxis.multiplyScalar(this._panDelta.x * (1 - dampFactor) * length));
                trackedObjectOffset.subtract(__yAxis.multiplyScalar(this._panDelta.y * (1 - dampFactor) * length));

                Vec3.add(__worldPos, vcam.lookAt.worldPosition, trackedObjectOffset);
                vcam.node.worldPosition = __posDelta.add(__worldPos);
                this._panDelta.multiplyScalar(dampFactor);

                followChanged = 1;
            }
        }
        if (isValid(vcam.follow)) {
            if (followChanged === 1) {
                Vec3.subtract(freelook.followOffset, vcam.node.worldPosition, vcam.follow.worldPosition);
            }
            else if (followChanged === 2) {
                Vec3.subtract(__armDelta, freelook.followOffset, vcam.aim.trackedObjectOffset);
                Vec3.subtract(__posDelta, Vec3.subtract(__worldPos, vcam.node.worldPosition, vcam.follow.worldPosition), vcam.aim.trackedObjectOffset);
                Vec3.add(freelook.followOffset, __posDelta.normalize().multiplyScalar(__armDelta.length()), vcam.aim.trackedObjectOffset);
            }

            Vec3.add(__posDelta, vcam.follow.worldPosition, freelook.followOffset);

            if (freelook.followDamping > 0) {
               Vec3_smoothDamp(__worldPos, vcam.node.worldPosition, __posDelta, freelook.followDamping, deltaTime);
            }
            else {
                __worldPos.set(__posDelta);
            }
            if (!Vec3_closeTo(__worldPos, vcam.node.worldPosition)) {
                vcam.node.worldPosition = __worldPos;
            }
        }
    }
}