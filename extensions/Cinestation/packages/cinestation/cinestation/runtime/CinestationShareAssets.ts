import { game, Game, gfx, Material } from "cc";

class CinestationShareAssets {
    public lineMaterial!: Material;

    constructor() {
        this.lineMaterial = new Material();
        this.lineMaterial._uuid = "cinestation-line-material";
        game.on(Game.EVENT_GAME_INITED, this._compile, this);
    }

    private _compile() {
        this.lineMaterial.initialize({
            effectName: "builtin-unlit",
            defines: { USE_VERTEX_COLOR: true },
            states: { primitive: gfx.PrimitiveMode.LINE_LIST }
        });
        this.lineMaterial.passes.forEach(v => v.tryCompile());
    }
}

export const cinestationShareAssets = new CinestationShareAssets();

