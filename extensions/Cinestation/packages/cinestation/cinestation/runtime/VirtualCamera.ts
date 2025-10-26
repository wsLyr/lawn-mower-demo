
import { Mat4, Mesh, toRadian, Node, utils, Vec3, view, _decorator, Quat, director } from 'cc';
import { cinestation } from './CinestationData';
import { CinestationEvent } from './Common/Events';
import { Nullable } from './Common/Types';
import { Visualization } from './Common/Visualization';
import { IVCam } from './Datas/IVCam';
import { VCamAim } from './Datas/VCamAim';
import { BodyType, VCamBody } from './Datas/VCamBody';
import { VCamImpulse } from './Datas/VCamImpulse';
import { VCamLens } from './Datas/VCamLens';
import { VCamNoise } from './Datas/VCamNoise';
import { AimStage } from './Stages/AimStage';
import { BaseStage } from './Stages/BaseStage';
import { BodyStage } from './Stages/BodyStage';
import { ImpulseStage } from './Stages/ImpulseStage';
import { NoiseStage } from './Stages/NoiseStage';

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('VirtualCamera')
@executeInEditMode
export class VirtualCamera extends Visualization implements IVCam {
    public _editorChanged: boolean = true;
    public _composerChanged: boolean = true;
    public _visibleDefault: boolean = false;

    @property({ visible: false })
    private _lookAt: Nullable<Node> = null;

    @property({ visible: false })
    private _follow: Nullable<Node> = null;

    @property({
        tooltip: "i18n:cinestation.VirtualCamera.debug"
    })
    debug: boolean = false;

    @property
    public get active() {
        return cinestation.vcam === this;
    }

    public set active(v: boolean) {
        if (v) {
            cinestation.activeCamera(this, 0);
        }
        else if (this.active) {
            cinestation.activeCamera(null, 0);
        }
    }

    @property({
        tooltip: "i18n:cinestation.VirtualCamera.priority"
    })
    priority: number = 10;

    @property({
        tooltip: "i18n:cinestation.VirtualCamera.lookAt",
        type: Node
    })
    get lookAt() {
        return this._lookAt;
    }
    set lookAt(target: Nullable<Node>) {
        if (this._lookAt !== target) {
            this._lookAt = target;
            this._editorChanged = CC_EDITOR;
            this._stages.forEach(v => v.onLookAtChanged(target));
        }
    }

    @property({
        tooltip: "i18n:cinestation.VirtualCamera.follow",
        type: Node
    })
    get follow() {
        return this._follow;
    }
    set follow(target: Nullable<Node>) {
        if (this._follow !== target) {
            this._follow = target;
            this._editorChanged = CC_EDITOR;
            this._stages.forEach(v => v.onFollowChanged(target));
        }
    }

    @property({ type: VCamLens })
    lens: VCamLens = new VCamLens();

    @property({ type: VCamBody })
    body: VCamBody = new VCamBody();

    @property({ animatable: false, type: VCamAim })
    aim: VCamAim = new VCamAim();

    @property({ animatable: false, type: VCamNoise })
    noise: VCamNoise = new VCamNoise();

    @property({ animatable: false, type: VCamImpulse })
    impulse: VCamImpulse = new VCamImpulse();

    private _stages: BaseStage[] = [
        new BodyStage(this),
        new AimStage(this),
        new NoiseStage(this),
        new ImpulseStage(this)
    ];

    private _finalPosition: Vec3 = new Vec3();
    private _finalRotation: Quat = new Quat();
    private _correctPosition: Vec3 = new Vec3();
    private _correctRotation: Quat = new Quat();
    private _lookaheadPosition: Vec3 = new Vec3();

    public get correctPosition() {
        return this._correctPosition;
    }

    public get correctRotation() {
        return this._correctRotation;
    }

    public get finalPosition() {
        return Vec3.add(this._finalPosition, this.node.worldPosition, this._correctPosition);
    }

    public get finalRotation() {
        return Quat.multiply(this._finalRotation, this.node.worldRotation, this._correctRotation);
    }

    public get lookaheadPosition() {
        return this._lookaheadPosition;
    }

    public onLoad() {
        if (CC_EDITOR) {
            director.on(CinestationEvent.LENS_CHANGED, () => this._modelChanged = true);
            director.on(CinestationEvent.EDITOR_CHANGED, () => this._editorChanged = true);
            director.on(CinestationEvent.COMPOSER_CHANGED, () => this._composerChanged = true);
        }
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this._onTransformChanged, this);
    }

    private _onTransformChanged(transBit: number) {
        if (CC_EDITOR) {
            if (!this.follow) return;
            if (transBit & Node.TransformBit.POSITION) {
                switch (this.body.type) {
                    case BodyType.Tracked:
                        this._editorChanged = true;
                        break;
                    case BodyType.FreeLook:
                        Vec3.subtract(this.body.freelook.followOffset, this.node.worldPosition, this.follow.worldPosition);
                        this._editorChanged = true;
                        break;
                }
            }
        }
    }

    public onEnable() {
        super.onEnable();
        cinestation.addCamera(this);
    }

    public onDisable() {
        super.onDisable();
        cinestation.removeCamera(this);
        this.onDeActive();
    }

    public onActive() {
        this._stages.forEach(v => v.enable = true);
    }

    public onDeActive() {
        this._stages.forEach(v => v.enable = false);
    }

    public updateCamera(dt: number) {
        if (CC_EDITOR && !this._isChangedInEditor()) {
            return;
        }

        Quat.identity(this._correctRotation);
        Vec3.zero(this._correctPosition);

        for (let stage of this._stages) {
            stage.updateStage(dt);
        }
    }

    private _isChangedInEditor() {
        if (this._editorChanged) { //fixbug: ccc inpector
            this._editorChanged = false;
            return true;
        }
        return false;
    }

    protected _updateMesh(mesh: Mesh) {
        let corners = [
            new Vec3(-1, -1, -1),
            new Vec3(1, -1, -1),
            new Vec3(-1, 1, -1),
            new Vec3(1, 1, -1),
            new Vec3(-1, -1, 1),
            new Vec3(1, -1, 1),
            new Vec3(-1, 1, 1),
            new Vec3(1, 1, 1),
        ];

        let lens = this.lens;
        let size = view.getDesignResolutionSize();
        let matProjInv = Mat4.perspective(new Mat4(), toRadian(lens.fov), size.width / size.height, lens.near, lens.far).invert();
        for (let i = 0; i < 8; i++) {
            corners[i].transformMat4(matProjInv);
        }

        let positions: number[] = [], colors: number[] = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 3; j++) {
                Vec3.toArray(positions, corners[i], positions.length);
                Vec3.toArray(positions, corners[i ^ (1 << j)], positions.length);
                colors.push(1, 1, 1, 1);
                colors.push(1, 1, 1, 1);
            }
        }

        return utils.createMesh({ positions, colors }, mesh);
    }
}
