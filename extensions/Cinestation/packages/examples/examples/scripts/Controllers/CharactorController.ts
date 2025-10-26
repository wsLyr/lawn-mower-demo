
import { _decorator, Component, Node, Animation, Vec3, Quat, lerp, director } from 'cc';
import { Nullable } from '../../../runtime/Common/Types';
const { ccclass, property, menu } = _decorator;

let __offset = new Vec3();
@ccclass('Cinestation.CharactorController')
@menu('Cinestation/examples/CharactorController')
export class CharactorController extends Component {
    protected _state: string = "";
    protected _animation: Nullable<Animation> = null;
    protected _rotationTo: Quat = new Quat();
    protected _movingSpeed: number = 0;
    protected _rotateSpeed: number = 0;
    protected _movingSpeedTo: number = 0;
    protected _rotateSpeedTo: number = 0;
    protected _maxMovingSpeed: number = 4;
    protected _maxRotateSpeed: number = 5;

    public onLoad() {
        this._animation = this.getComponent(Animation);
    }

    private _setState(state: string) {
        if (this._state !== state) {
            this._state = state;
            this._animation && this._animation.crossFade(state);
        }
    }

    public onEnable() {
        director.on("Keyboard.SetDirection", this.setMoveDirection, this);
        director.on("Joystick.SetDirection", this.setMoveDirection, this);
    }

    public onDisable() {
        director.off("Keyboard.SetDirection", this.setMoveDirection, this);
        director.off("Joystick.SetDirection", this.setMoveDirection, this);
    }

    public setMoveDirection(dir: Nullable<Vec3>) {
        if (dir) {
            Quat.fromViewUp(this._rotationTo, dir);
            this._movingSpeedTo = this._maxMovingSpeed;
            this._rotateSpeedTo = this._maxRotateSpeed;
            this._setState("Running");
        }
        else {
            this._movingSpeed = this._movingSpeedTo = 0;
            this._rotateSpeed = this._rotateSpeedTo = 0;
            this._setState("Idle");
        }
    }

    public update(dt: number) {
        const fix_dt = 1 / 60;
        this._rotateSpeed = lerp(this._rotateSpeed, this._rotateSpeedTo, 10 * fix_dt);
        this._movingSpeed = lerp(this._movingSpeed, this._movingSpeedTo, 5 * fix_dt);

        if (this._rotateSpeed > 0) {
            this.node.rotation = this.node.rotation.lerp(this._rotationTo, this._rotateSpeed * fix_dt);
        }
        if (this._movingSpeed > 0) {
            this.node.position = this.node.position.add(Vec3.multiplyScalar(__offset, this.node.forward.negative(), this._movingSpeed * fix_dt));
        }
    }
}

