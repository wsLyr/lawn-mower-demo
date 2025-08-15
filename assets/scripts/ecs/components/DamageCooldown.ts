import { Component, ECSComponent } from '@esengine/ecs-framework';

@ECSComponent('DamageCooldown')
export class DamageCooldown extends Component {
    public cooldownTime: number = 1.0;
    public lastDamageTime: number = 0;
    
    constructor(cooldownTime: number = 1.0) {
        super();
        this.cooldownTime = cooldownTime;
    }
    
    public canDealDamage(currentTime: number): boolean {
        return (currentTime - this.lastDamageTime) >= this.cooldownTime;
    }
    
    public dealDamage(currentTime: number): void {
        this.lastDamageTime = currentTime;
    }
} 