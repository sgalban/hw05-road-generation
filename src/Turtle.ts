import {vec2, vec3, quat, mat4} from 'gl-matrix';
import {Node} from './SpatialGraph';

export default class Turtle {
    position: vec2;
    node: Node;
    angle: number;
    color: vec3;
    recursionDepth: number;
    private history: Turtle[];
    newBranch = false;

    constructor() {
        this.position = vec2.fromValues(0, 0);
        this.angle = 0;
        this.color = vec3.fromValues(0.6, 0.3, 0.2);
        this.recursionDepth = 0;
        this.node = null;
        this.history = [];
        this.newBranch = false;
    }

    setPosition(pos: vec2): void {
        this.position = pos;
    }

    setAngle(angle: number): void {
        this.angle = angle;
    }

    duplicate(): Turtle {
        let copy : Turtle = new Turtle();
        copy.position = vec2.clone(this.position);
        copy.angle = this.angle;
        copy.node = this.node;
        copy.history = this.history;
        //copy.recursionDepth = this.recursionDepth + 1;
        return copy;
    }

    copy(other: Turtle): void {
        this.position = other.position;
        this.angle = other.angle;
        this.node = other.node;
        this.history = other.history;
        //this.recursionDepth = other.recursionDepth - 1;
    }

    rotate(amount: number): void {
        this.angle = (this.angle + amount) % 360;
    }

    moveForward(amount: number): void {
        let radians = this.angle * Math.PI / 180.0;
        let delta: vec2 = vec2.fromValues(amount * Math.cos(radians), amount * Math.sin(radians));
        vec2.add(this.position, this.position, delta);
    }

    dryMove(angle: number, amount: number): vec2 {
        let radians = (this.angle + angle) * Math.PI / 180.0;
        let delta: vec2 = vec2.fromValues(amount * Math.cos(radians), amount * Math.sin(radians));
        return vec2.add(vec2.create(), this.position, delta);
    }

    branch(angle: number) {
        let newTurt: Turtle = this.duplicate();
        newTurt.rotate(angle);
        this.history.unshift(newTurt);
    }

    endBranch(): boolean {
        if (this.history.length > 0) {
            let newBranch: Turtle = this.history.pop();
            this.copy(newBranch);
            this.newBranch = true;
            return true;
        }
        return false;
    }

    makeNode(): Node {
        let newNode = new Node(this.position);
        this.node = newNode;
        return this.node;
    }
}