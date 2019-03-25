import {vec2} from 'gl-matrix';

export class Node {
    readonly position: vec2;
    readonly x: number;
    readonly y: number;

    constructor(_position: vec2) {
        this.position = vec2.fromValues(_position[0], _position[1]);
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
    private nodeGrid: Map<string, Node[]>;
    private numEdges: number;

    constructor() {
        this.adjacency = new Map<Node, Node[]>();
        this.numEdges = 0;
        this.nodeGrid = new Map<string, Node[]>();
    }

    getNumEdges(): number {
        return this.numEdges;
    }

    addNode(n: Node) {
        if (!this.adjacency.has(n)) {
            this.adjacency.set(n, []);
            let pos = JSON.stringify([Math.floor(n.x), Math.floor(n.y)]);
            if (this.nodeGrid.has(pos)) {
                this.nodeGrid.get(pos).push(n);
            }
            else {
                this.nodeGrid.set(pos, [n]);
            }
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
            this.addNode(n1);
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
            this.addNode(n2);
            this.adjacency.set(n2, [n1]);
            success = true;
        }
        else {
            let adj2 = this.adjacency.get(n2);
            if (adj2.indexOf(n1) === -1) {
                adj2.push(n1);
                this.adjacency.set(n2, adj2);
                success = true;
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

    getNodeIterator(): IterableIterator<Node> {
        return this.adjacency.keys();
    }

    getAdjacentEdges(node: Node): Node[] {
        return this.adjacency.get(node);
    }

    getNodesNear(node: Node, radius: number): Node[] {
        let gridRad = Math.ceil(radius) + 1;
        let gridPos = JSON.stringify([Math.floor(node.x), Math.floor(node.y)]);
        let nodes: Node[] = [];

        for (let i = -gridRad; i <= gridRad; i++) {
            for (let j = -gridRad; j <= gridRad; j++) {
                let pos = JSON.stringify([Math.floor(i + node.x), Math.floor(j + node.y)]);
                if (this.nodeGrid.has(pos)){
                    let gridNodes: Node[] = this.nodeGrid.get(pos);
                    for (let n of gridNodes) {
                        if (n.distance(node) < radius) {
                            nodes.push(n);
                        }
                    }
                }
            }
        }
        let output: Node[] = nodes.filter((n: Node) => !n.equal(node));
        return output
    }

    getConnectedComponents(): Node[][] {
        console.log("Test");
        let ccs: Node[][] = [];
        let unseenNodes: Set<Node> = new Set(this.getNodeIterator());
        let seenNodes: Set<Node> = new Set();
        while(unseenNodes.size > 0) {
            let root: Node = unseenNodes.values().next().value;
            unseenNodes.delete(root);
            seenNodes.add(root);
            let cc = [root]
            let frontier: Set<Node> = new Set<Node>([root]);
            while (frontier.size > 0) {
                let nextNode: Node = frontier.values().next().value;
                frontier.delete(nextNode);
                for (let neighbor of this.getAdjacentEdges(nextNode)) {
                    if (!seenNodes.has(neighbor)) {
                        seenNodes.add(neighbor);
                        unseenNodes.delete(neighbor);
                        cc.push(neighbor);
                        frontier.add(neighbor);
                    }
                }
            }
            ccs.push(cc);
        }
        return ccs;
    }
}