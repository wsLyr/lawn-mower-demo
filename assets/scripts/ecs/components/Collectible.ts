import { Component } from '@esengine/ecs-framework';

export enum CollectibleType {
    AIR_STRIKE = 'air_strike'
}

export class Collectible extends Component {
    public type: CollectibleType;
    public value: number = 1;
    public isCollected: boolean = false;
    
    constructor(type: CollectibleType, value: number = 1) {
        super();
        this.type = type;
        this.value = value;
    }
    
    public collect(): void {
        this.isCollected = true;
    }
} 