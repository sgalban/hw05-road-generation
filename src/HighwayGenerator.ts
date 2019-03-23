import {vec2, vec3} from 'gl-matrix';
import {getTerrainHeight, getPopulationDensity} from './GeoDataGenerator';
import Turtle from './Turtle';
import SpatialGraph, {Node} from './SpatialGraph';
import Drawable from './rendering/gl/Drawable';
import Square from './geometry/Square';

function random1(p: vec2, seed: vec2) : number {
    return fract(Math.sin(vec2.dot(
        vec2.add(vec2.create(), p, seed),
        vec2.fromValues(127.1, 311.7))
    ) * 41352.5245);
}

function random2(p: vec2, seed: vec2): vec2 {
    let vec: vec2 = 
        vfract(vec2.scale(vec2.create(), vsin(vec2.fromValues(
            vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(311.7, 127.1)),
            vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(269.5, 183.3)))), 
            85734.3545)
        )
    return vec;
}

function remap(num: number, x1: number, y1: number, x2: number, y2: number) {
    return num * (x2 - y2) / (x1 - y1) - x1 * ((x2 - y2) / (x1 - y1)) + x2;

}

function randomInRange(min: vec2, max: vec2, seed: vec2): vec2 {
    let random: vec2 = random2(vec2.create(), seed);
    let x = remap(random[0], 0.0, 1.0, min[0], max[0]);
    let y = remap(random[1], 0.0, 1.0, min[1], max[1]);
    return vec2.fromValues(x, y);
}

function fract(x: number): number {
    return x - Math.floor(x);
}

function vfract(v: vec2): vec2 {
    return vec2.fromValues(fract(v[0]), fract(v[1]));
}

function vsin(v: vec2): vec2 {
    return vec2.fromValues(Math.sin(v[0]), Math.sin(v[1]));
}

export default class HighwayGenerator {
    turtle: Turtle;
    turtleHistory: Turtle[];
    network: SpatialGraph;
    endpoints: number[];
    numRoads: number;

    constructor() {
        this.turtle = new Turtle();
        this.network = new SpatialGraph();
        this.endpoints = [];
        this.numRoads = 0.0;
    }

    isWater(pos: vec2) {
        return getTerrainHeight(pos) < 0.0125;
    }

    generateRoadNetwork() {
        this.numRoads = 0;
        this.endpoints = [];
        const MAX_ROADS = 200;
        let sinceLastBranch = 0;

        // Seed is arbitrary. Can be safely changed without changing anything else
        let seed1: vec2 = vec2.fromValues(0.178234, 0.64141);
        let seed2: vec2 = vec2.fromValues(0.229524, 0.76456);

        // Find an appropriate point to begin the highway system
        function findValidPoint() {
            let startPoint: vec2 = randomInRange(vec2.fromValues(-20, -10), vec2.fromValues(20, 10), seed1);
            while (getPopulationDensity(startPoint) < 0.5) {
                seed1[0] += startPoint[0];
                seed1[1] += startPoint[1];
                startPoint = randomInRange(vec2.fromValues(0, 0), vec2.fromValues(20, 10), seed1);
            }
            seed1[0] += startPoint[0];
            seed1[1] += startPoint[1];
            return startPoint;
        }
        
        let startPoint = findValidPoint();
        this.turtle.setPosition(startPoint);
        this.turtle.makeNode();
        this.network.addNode(this.turtle.node);

        // Continue branching
        while(this.numRoads < MAX_ROADS) {
            let curPos = this.turtle.position;
            let curAngle = this.turtle.angle;
            let length = 2.0 * (1.2 - getPopulationDensity(curPos));

            // Send out 4 rays to test for population
            let angle1 = random1(curPos, seed2) * 45.0 - 90;
            vec2.add(seed2, seed2, curPos);
            let angle2 = random1(curPos, seed2) * 45.0 - 45;
            vec2.add(seed2, seed2, curPos);
            let angle3 = random1(curPos, seed2) * 45.0;
            vec2.add(seed2, seed2, curPos);
            let angle4 = random1(curPos, seed2) * 45.0 + 40;
            vec2.add(seed2, seed2, curPos);
            let test1: vec2 = this.turtle.dryMove(angle1, length);
            let test2: vec2 = this.turtle.dryMove(angle2, length);
            let test3: vec2 = this.turtle.dryMove(angle3, length);
            let test4: vec2 = this.turtle.dryMove(angle4, length);
            // The positions are included for debugging purposes
            let tests = [
                {density: getPopulationDensity(test1), angle: angle1, position: test1},
                {density: getPopulationDensity(test2), angle: angle2, position: test2},
                {density: getPopulationDensity(test3), angle: angle3, position: test3},
                {density: getPopulationDensity(test4), angle: angle4, position: test4},
            ].sort((a, b) => b.density - a.density);

            //this.network.connect(this.turtle.node, new Node(test1));
            //this.network.connect(this.turtle.node, new Node(test2));
            //this.network.connect(this.turtle.node, new Node(test3));
            //this.network.connect(this.turtle.node, new Node(test4));

            if (tests[0].density < 0.000 || sinceLastBranch > 10) {
                if (this.turtle.endBranch()) {
                    sinceLastBranch = 0;
                    this.turtle.moveForward(length);
                    this.network.connect(this.turtle.node, this.turtle.makeNode());
                    this.numRoads++;
                }
                else {
                    break;
                }
                continue;
            }

            // Decide whether or not to branch
            if (random1(curPos, seed2) < 0.5) {
                this.turtle.branch(tests[1].angle);
            }
            this.turtle.rotate(tests[0].angle);
            this.turtle.moveForward(length);
            this.network.connect(this.turtle.node, this.turtle.makeNode());
            this.numRoads++;
            sinceLastBranch++;

            /*let angle: number = random1(this.turtle.position, seed1) * -180.0 + 90.0;
            this.turtle.rotate(angle);
            this.turtle.moveForward(random1(this.turtle.position, seed2) * 2.0 + 1.0);
            let lastNode: Node = this.turtle.node;
            let newNode: Node = this.turtle.makeNode();
            this.network.connect(lastNode, newNode);
            this.numRoads++;
            this.endpoints = this.endpoints.concat(lastNode.x, lastNode.y, newNode.x, newNode.y);*/
        }

    }

    drawHighwayNetwork(road: Square) {
        let seenEdges = new Set();

        this.network.adjacency.forEach((neighbors: Node[], node: Node) => {
            for (let neighbor of neighbors) {
                if (!seenEdges.has(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]))) {
                    seenEdges.add(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]));
                    seenEdges.add(JSON.stringify([neighbor.x, neighbor.y, node.x, node.y]));
                    this.endpoints = this.endpoints.concat(node.x, node.y, neighbor.x, neighbor.y);
                }
            }
        })
        road.setInstanceVBOs(new Float32Array(this.endpoints));
        road.setNumInstances(this.numRoads);
    }
}