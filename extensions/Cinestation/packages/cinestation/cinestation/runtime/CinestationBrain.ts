import { _decorator, Camera, lerp, clamp01, primitives, utils, Mesh, Material, Vec2, Vec3, Tween } from 'cc';
import { CinestationBlendDefinition, CinestationBlendFunc } from './CinestationBlendDefinition';
import { cinestation } from './CinestationData';
import { Nullable } from './Common/Types';
import { Visualization } from './Common/Visualization';
import { VirtualCamera } from './VirtualCamera';
const { ccclass, property, executionOrder, executeInEditMode } = _decorator;

let __point = new Vec2();

@ccclass('CinestationBrain')
@executeInEditMode
@executionOrder(-1)
export class CinestationBrain extends Visualization {
    protected __selectedCamera: Nullable<VirtualCamera> = null;
    protected _visibleInRuntime: boolean = true;

    @property(CinestationBlendDefinition)
    public brainBlend: CinestationBlendDefinition = new CinestationBlendDefinition;

    @property(Material)
    public debugMaterial: Material = null;

    public onLoad() {
        cinestation.mainCamera = this.getComponent(Camera);
        cinestation.lerpTime = this.brainBlend.time;
        this._material = this.debugMaterial;
    }

    protected _updateMesh(mesh: Mesh) {
        return utils.createMesh(primitives.quad(), mesh);
    }

    public update(dt: number) {
        super.update(dt);

        let vcam = this._getActiveCamera();
        if (vcam == null) return;

        vcam.updateCamera(dt);

        let blendTime = cinestation.blendTime > -1 ? cinestation.blendTime : this.brainBlend.time;
        if (cinestation.lerpTime < blendTime) {
            cinestation.lerpTime += dt;
            let t = clamp01(cinestation.lerpTime / blendTime);
            let blendFunc = CinestationBlendFunc[this.brainBlend.style];
            if (blendFunc) {
                t = blendFunc(t);
            }
            this._lerpToMainCamera(vcam, t);
        }
        else {
            this._lerpToMainCamera(vcam, 1);
        }
    }

    private _getActiveCamera() {
        let vcam = cinestation.vcam = cinestation.getPriorCamera();
        this.visible = CC_EDITOR ? !!this.__selectedCamera : vcam && vcam.debug;
        this._setDebugProperties(CC_EDITOR ? this.__selectedCamera : vcam);
        return vcam;
    }

    private _setDebugProperties(vcam: Nullable<VirtualCamera>) {
        if (!this.debugMaterial) return;

        if (vcam && (CC_EDITOR || vcam.debug)) {
            if (vcam._composerChanged) {
                vcam._composerChanged = false;
                let composer = vcam.aim.composer;
                this.debugMaterial.setProperty("deadZoneWidth", composer.deadZoneWidth);
                this.debugMaterial.setProperty("deadZoneWidth", composer.deadZoneWidth);
                this.debugMaterial.setProperty("deadZoneHeight", composer.deadZoneHeight);
                this.debugMaterial.setProperty("softZoneWidth", composer.softZoneWidth);
                this.debugMaterial.setProperty("softZoneHeight", composer.softZoneHeight);

            }
            if (vcam.lookAt) {
                this.debugMaterial.setProperty("lookatPoint", cinestation.worldToScreen(__point, vcam.lookaheadPosition));
            }
        }
    }

    private _lerpToMainCamera(vcam: VirtualCamera, t: number) {
        if (CC_EDITOR) return;
        if (!cinestation.mainCamera) return;

        let from = cinestation.mainCamera, to = vcam;
        from.node.worldPosition = from.node.worldPosition.lerp(to.finalPosition, t);
        from.node.worldRotation = from.node.worldRotation.lerp(to.finalRotation, t);
        from.fov = lerp(from.fov, to.lens.fov, t);
        from.near = lerp(from.near, to.lens.near, t);
        from.far = lerp(from.far, to.lens.far, t);
    }
}