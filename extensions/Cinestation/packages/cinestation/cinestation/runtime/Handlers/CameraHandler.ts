import { Node } from "cc";
import { Base } from "../Datas/Base";
import { IVCam } from "../Datas/IVCam";

export class CameraHandler<T extends IVCam = any> extends Base {
    constructor(protected _vcam: T) { super() }
    public updateCamera(deltaTime: number) { }
    public onLookAtChanged(target: Node) { };
    public onFollowChanged(target: Node) { }
}