import { _decorator, Component, Node, EventTouch, Vec2, director, Vec3, input, Input, sys, Camera, Prefab, instantiate, Canvas, Size } from 'cc';
import { Joystick } from './Joystick';
const { ccclass, property } = _decorator;

let __loc = new Vec2();
let __dir2 = new Vec2();
let __dir3 = new Vec3();
@ccclass('JoystickInput')
export class JoystickInput extends Component {
    private _isUsed: boolean = false;
    private _touchStart: Vec2 = new Vec2();
    private _touchID: number = -1;
    private _joystick: Joystick = null;
    private _camera: Camera = null;

    @property
    radius: number = 128;

    @property(Prefab)
    joystickPrefab: Prefab = null;

    public onLoad() {
        this.enabled = sys.isMobile;
        this.enabled && this._loadJoystick();
        this._camera = this.node.scene.getComponentInChildren(Camera);
        director.on("JoystickInput.Enable", this._onJoystickEnable, this);
    }

    public onDestory() {
        director.off("JoystickInput.Enable", this._onJoystickEnable, this);
    }

    public onEnable() {
        if (this._joystick) this._joystick.node.active = true;
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    public onDisable() {
        if (this._joystick) this._joystick.node.active = false;
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    private _onJoystickEnable(v: boolean) {
        this.node.active = v;
    }

    private async _loadJoystick() {
        if (this.joystickPrefab) {
            let node = instantiate(this.joystickPrefab);
            node.parent = director.getScene().getChildByName('Canvas');
            node.setSiblingIndex(0);
            this._joystick = node.getComponent(Joystick);
            this._joystick.node._uiProps.uiTransformComp.setContentSize(new Size(this.radius * 2, this.radius * 2));
        }
    }

    private _onTouchStart(e: EventTouch) {
        if (!this._joystick) return;

        if (this._touchID === -1) {
            this._touchID = e.touch.getID();
            e.touch.getUILocation(__loc);
            this._touchStart.set(this._joystick.stickNode.worldPosition.x, this._joystick.stickNode.worldPosition.y);
            this._isUsed = this._joystick.node._uiProps.uiTransformComp.hitTest(__loc);
            director.emit("Joystick.TouchUsed", this._isUsed);
        }
    }

    private _onTouchMove(e: EventTouch) {
        if (!this._isUsed) return;

        if (this._touchID === e.touch.getID()) {
            e.touch.getUILocation(__loc);

            Vec2.subtract(__loc, __loc, this._touchStart);
            Vec2.normalize(__dir2, __loc);

            let length = __loc.length();
            if (length > this.radius) {
                length = this.radius;
                Vec2.multiplyScalar(__loc, __dir2, length);
            }
            this._joystick.stickNode.position = this._joystick.stickNode.position.set(__loc.x, __loc.y, 0);

            if (length < 20) {
                return;
            }

            if (this._camera) {
                Vec3.transformQuat(__dir3, __dir3.set(__dir2.x, 0, -__dir2.y), this._camera.node.worldRotation);
                __dir3.y = 0;
                __dir3.normalize();

                director.emit("Joystick.SetDirection", __dir3, length / this.radius);
            }
        }
    }

    private _onTouchEnd(e: EventTouch) {
        if (this._touchID === e.touch.getID()) {
            this._touchID = -1;
            this._joystick.stickNode.position = this._joystick.stickNode.position.set(0, 0, 0);
            director.emit("Joystick.SetDirection", null);
            director.emit("Joystick.TouchUsed", false);
        }
    }
}

