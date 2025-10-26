import { Node } from "cc";
import { Base } from "../Datas/Base";
import { IVCam } from "../Datas/IVCam";

export class BaseStage<T extends IVCam = any> extends Base {
    constructor(protected _vcam: T) { super() }
    public updateStage(deltaTime: number) { }
    public onLookAtChanged(target: Node) { }
    public onFollowChanged(target: Node) { }
}