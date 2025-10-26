import { _decorator, Component, Node, director, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Joystick')
export class Joystick extends Component {
    @property(Node)
    stickNode: Node = null;
}

