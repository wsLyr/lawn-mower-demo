
import { _decorator, Component, Node, Label, Color } from 'cc';
import { cinestation } from '../../../runtime/CinestationData';
import { Nullable } from '../../../runtime/Common/Types';
const { ccclass, property, menu } = _decorator;

@ccclass('Cinestation.DebugController')
@menu('Cinestation/examples/DebugController')
export class DebugController extends Component {
    private _index: number = 0;

    @property(Label)
    label: Nullable<Label> = null;

    public onDebug() {
        let vcam = cinestation.vcam;
        if (vcam && this.label) {
            vcam.debug = !vcam.debug;
            this._setLabelColor(vcam.debug);
        }
    }

    public onSwitch() {
        let vcams = cinestation.vcams;
        let vcam = vcams[++this._index % vcams.length];
        cinestation.activeCamera(vcam);
        this._setLabelColor(vcam.debug);
    }

    private _setLabelColor(debug: boolean) {
        if (this.label) {
            this.label.color = debug ? Color.WHITE : Color.GRAY;
        }
    }
}

