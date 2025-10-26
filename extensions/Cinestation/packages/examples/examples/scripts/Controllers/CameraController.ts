import { _decorator, Component, Node, director } from 'cc';
import { cinestation } from '../../../runtime/CinestationData';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {

    public onEnable() {
        director.on("Joystick.TouchUsed", this._onJoystickTouchUsed, this);
    }

    public onDisable() {
        director.off("Joystick.TouchUsed", this._onJoystickTouchUsed, this);
    }

    private _onJoystickTouchUsed(used: boolean) {
        cinestation.vcam.body.freelook.rotateTouchID = used ? 1 : 0;
    }

}

