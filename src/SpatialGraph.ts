import {vec2} from 'gl-matrix';

export class Node {
    position: vec2;
    x: number;
    y: number;

    constructor(_position: vec2) {
        this.position = _position;
        this.x = _position[0];
        this.y = _position[1];
    }

    distance(other: Node) {
        return vec2.distance(this.position, other.position);
    }

    equal(other: Node) {
        return this.x === other.x && this.y === other.y;
    }
}

export default class SpatialGraph {
    private adjacency: Map<Node, Node[]>;
    private numEdges: number;

    constructor() {
        this.adjacency = new Map<Node, Node[]>();
        this.numEdges = 0;
    }

    getNumEdges(): number {
        return this.numEdges;
    }

    addNode(n: Node) {
        if (!this.adjacency.has(n)) {
            this.adjacency.set(n, []);
        }
    }

    areAdjacent(n1: Node, n2: Node) {
        let equal = false;
        this.adjacency.forEach((neighbors: Node[], node: Node) => {
            for (let neighbor of neighbors) {
                if (n1.equal(node) && n2.equal(neighbor)) {
                    equal = true;
                }
            }
        });
        return equal;
    }

    connect(n1: Node, n2: Node): boolean {
        let success: boolean = false;
        if (n1.equal(n2)) {
            return false;
        }
        if (!this.adjacency.has(n1)) {
            this.adjacency.set(n1, [n2]);
            success = true;
        }
        else {
            let adj1 = this.adjacency.get(n1);
            if (adj1.indexOf(n2) === -1) {
                adj1.push(n2);
                this.adjacency.set(n1, adj1);
                success = true;
            }
        }
        if (!this.adjacency.has(n2)) {
            this.adjacency.set(n2, [n1]);
        }
        else {
            let adj2 = this.adjacency.get(n2);
            if (adj2.indexOf(n1) === -1) {
                adj2.push(n1);
                this.adjacency.set(n2, adj2);
            }
        }
        if (success) {
            this.numEdges++;
        }
        return success;
    }

    getNodes(): Node[] {
        let nodes: Node[] = [];
        this.adjacency.forEach((neighbors: Node[], node: Node) => {
            nodes.push(node);
        });
        return nodes;
    }
}