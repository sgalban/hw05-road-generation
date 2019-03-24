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

function between(num: number, end1: number, end2: number) {
    return (end1 < num && num < end2) || (end2 < num && num < end1);
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

    generateRoadNetwork(branchingAngle: number, roadCount: number) {
        this.endpoints = [];
        this.network = new SpatialGraph();
        this.turtle = new Turtle();
        this.turtle.setAngle(20);
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
        this.network.addNode(this.turtle.makeNode());

        // Continue branching
        let i = -1;;
        while(this.network.getNumEdges() < roadCount) {
            i++;
            let curPos = vec2.fromValues(this.turtle.position[0], this.turtle.position[1]);
            let curAngle = this.turtle.angle;
            let length = 2.0 * (2.0 - getPopulationDensity(curPos));
            let curNode = this.turtle.node;

            let rotatingAngle = 0;
            if (!this.turtle.newBranch) {
                // Send out 5 rays to test for population
                let randomness = random1(curPos, seed2) * 6.0 - 3.0;
                let angle0 = randomness - branchingAngle * 2.0;
                let angle1 = randomness - branchingAngle
                let angle2 = randomness;
                let angle3 = randomness + branchingAngle;
                let angle4 = randomness + branchingAngle * 2.0;
                vec2.add(seed2, seed2, curPos);
                let test0: vec2 = this.turtle.dryMove(angle0, length);
                let test1: vec2 = this.turtle.dryMove(angle1, length);
                let test2: vec2 = this.turtle.dryMove(angle2, length);
                let test3: vec2 = this.turtle.dryMove(angle3, length);
                let test4: vec2 = this.turtle.dryMove(angle4, length);
                // The positions are included for debugging purposes
                let tests = [
                    {density: getPopulationDensity(test0), angle: angle0, position: test0},
                    {density: getPopulationDensity(test1), angle: angle1, position: test1},
                    {density: getPopulationDensity(test2), angle: angle2, position: test2},
                    {density: getPopulationDensity(test3), angle: angle3, position: test3},
                    {density: getPopulationDensity(test4), angle: angle4, position: test4},
                ].sort((a, b) => b.density - a.density);

                if (tests[0].density < 0.000 || sinceLastBranch > 10) {
                    if (this.turtle.endBranch()) {
                        sinceLastBranch = 0;
                        continue;
                    }
                    else {
                        this.turtle.setPosition(findValidPoint());
                        this.network.addNode(this.turtle.makeNode());
                        continue;
                    }
                }

                // Decide whether or not to branch
                if (random1(curPos, seed2) < 0.5 && tests[1].density > 0.0) {
                    this.turtle.branch(tests[1].angle);
                }
                rotatingAngle = tests[0].angle;
            }
            this.turtle.newBranch = false;

            this.turtle.rotate(rotatingAngle);
            this.turtle.moveForward(length);

            let newNode: Node = this.turtle.makeNode();

            // Check if the resulting edge will intersect with a preexisting on
            let intersections: any[] = [];
            this.network.adjacency.forEach((neighbors: Node[], node: Node) => {
                for (let neighbor of neighbors) {
                    let e1 = {x1: curNode.x, y1: curNode.y, x2: newNode.x, y2: newNode.y};
                    let e2 = {x1: node.x, y1: node.y, x2: neighbor.x, y2: neighbor.y};
                    let m1 = (e1.y1 - e1.y2) / (e1.x1 - e1.x2);
                    let m2 = (e2.y1 - e2.y2) / (e2.x1 - e2.x2);

                    let x = (e2.y1 - e1.y1 + e1.x1 * m1 - e2.x1 * m2) / (m1 - m2);
                    if (between(x, e1.x1, e1.x2) && between(x, e2.x1, e2.x2)) {
                        let y = m1 * (x - e1.x1) + e1.y1;
                        intersections.push({"x": x, "y": y, "distance": vec2.distance(curPos, [x, y])});
                    }
                }
            });
            // Find the closest of the intersections
            if (intersections.length > 0) {
                let closest = {"distance": 1000, "x": 0, "y": 0};
                for (let intersection of intersections) {
                    if (intersection.distance < closest.distance) {
                        closest = intersection;
                    }
                }
                this.turtle.setPosition(vec2.fromValues(closest.x, closest.y));
                this.network.connect(curNode, this.turtle.makeNode());

                // Truncate the road to this closest intersection
                if (this.turtle.endBranch()) {
                    sinceLastBranch = 0;
                    continue;
                }
                else {
                    this.turtle.setPosition(findValidPoint());
                    this.network.addNode(this.turtle.makeNode());
                    continue;
                };
            }

            this.network.connect(curNode, newNode);
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
        this.numRoads = 0;

        this.network.adjacency.forEach((neighbors: Node[], node: Node) => {
            for (let neighbor of neighbors) {
                if (!seenEdges.has(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]))) {
                    seenEdges.add(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]));
                    seenEdges.add(JSON.stringify([neighbor.x, neighbor.y, node.x, node.y]));
                    this.endpoints = this.endpoints.concat(node.x, node.y, neighbor.x, neighbor.y);
                    this.numRoads++;
                }
            }
        })
        //console.log(this.numRoads);
        //console.log(this.network.adjacency.size);
        road.setInstanceVBOs(new Float32Array(this.endpoints));
        road.setNumInstances(this.numRoads);
    }
}