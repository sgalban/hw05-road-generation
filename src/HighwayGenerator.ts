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

function vsub(v1: vec2, v2: vec2): vec2 {
    return vec2.subtract(vec2.create(), v1, v2);
}

function between(num: number, end1: number, end2: number) {
    return (end1 < num && num < end2) || (end2 < num && num < end1);
}

function intersects(e1: [vec2, vec2], e2: [vec2, vec2]): vec2 {
    let m1 = (e1[0][1] - e1[1][1]) / (e1[0][0] - e1[1][0]);
    let m2 = (e2[0][1] - e2[1][1]) / (e2[0][0] - e2[1][0]);
    let x = (e2[0][1] - e1[0][1] + e1[0][0] * m1 - e2[0][0] * m2) / (m1 - m2);
    let y = m1 * (x - e1[0][0]) + e1[0][1];
    if (between(x, e1[0][0], e1[1][0]) && between(x, e2[0][0], e2[1][0])) {
        

        return vec2.fromValues(x, y);
    }
    else {
        return undefined;
    }
}

export default class HighwayGenerator {
    turtle: Turtle;
    turtleHistory: Turtle[];
    network: SpatialGraph;
    backRoads: SpatialGraph;
    endpoints: number[];
    numRoads: number;
    snapRadius: number;

    constructor() {
        this.turtle = new Turtle();
        this.network = new SpatialGraph();
        this.backRoads = new SpatialGraph();
        this.endpoints = [];
        this.numRoads = 0.0;
        this.snapRadius = 0;
    }

    isWater(pos: vec2) {
        return getTerrainHeight(pos) < 0.0125;
    }

    generateHighwayNetwork(branchingAngle: number, roadCount: number, snapRadius: number) {
        this.endpoints = [];
        this.network = new SpatialGraph();
        this.turtle = new Turtle();
        this.turtle.setAngle(20);
        this.snapRadius = snapRadius;
        let sinceLastBranch = 0;

        // Seed is arbitrary. Can be safely changed without changing anything else
        let seed1: vec2 = vec2.fromValues(0.178244, 0.64141);
        let seed2: vec2 = vec2.fromValues(0.229524, 0.76456);

        // Find an appropriate point to begin the highway system
        function findValidPoint() {
            let startPoint: vec2 = randomInRange(vec2.fromValues(-20, -10), vec2.fromValues(20, 10), seed1);
            while (getPopulationDensity(startPoint) < 0.25) {
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
            let length = 2.0 * (1.75 - getPopulationDensity(curPos)); //Max length 3.5, min is 1.5
            let curNode = this.turtle.node;

            let rotatingAngle = 0;
            if (!this.turtle.newBranch) {
                // Send out 5 rays to test for population
                let randomness = 0//;random1(curPos, seed2) * 6.0 - 3.0;
                let angle0 = randomness - branchingAngle / 2.0;
                let angle1 = randomness - branchingAngle / 4.0;
                let angle2 = randomness;
                let angle3 = randomness + branchingAngle / 4.0;
                let angle4 = randomness + branchingAngle / 2.0;
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
                if (/*random1(curPos, seed2) < 0.5 &&*/ tests[1].density > 0.0) {
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
            for (let node of this.network.getNodeIterator()) {
                for (let neighbor of this.network.getAdjacentEdges(node)) {
                    let e1 = {x1: curNode.x, y1: curNode.y, x2: newNode.x, y2: newNode.y};
                    let e2 = {x1: node.x, y1: node.y, x2: neighbor.x, y2: neighbor.y};
                    let m1 = (e1.y1 - e1.y2) / (e1.x1 - e1.x2);
                    let m2 = (e2.y1 - e2.y2) / (e2.x1 - e2.x2);

                    let x = (e2.y1 - e1.y1 + e1.x1 * m1 - e2.x1 * m2) / (m1 - m2);
                    if (between(x, e1.x1, e1.x2) && between(x, e2.x1, e2.x2)) {
                        let y = m1 * (x - e1.x1) + e1.y1;
                        intersections.push({
                            "x": x,
                            "y": y,
                            "distance": vec2.distance(curPos, [x, y]),
                            "n1": node,
                            "n2": neighbor
                        });
                    }
                }
            }

            // Find the closest of the intersections
            if (intersections.length > 0) {
                let closest = intersections[0];
                for (let intersection of intersections) {
                    if (intersection.distance < closest.distance) {
                        closest = intersection;
                    }
                }
                this.turtle.setPosition(vec2.fromValues(closest.x, closest.y));
                this.network.connect(curNode, this.turtle.makeNode());
                this.network.connect(closest.n1, this.turtle.node);
                this.network.connect(closest.n2, this.turtle.node);

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

            // Check if the resulting edge will intersect with a preexisting one when extended
            let extNode: Node = new Node(this.turtle.dryMove(0, snapRadius)); 
            let extTintersections: any[] = [];
            for (let node of this.network.getNodeIterator()) {
                for (let neighbor of this.network.getAdjacentEdges(node)) {
                    let e1 = {x1: curNode.x, y1: curNode.y, x2: extNode.x, y2: extNode.y};
                    let e2 = {x1: node.x, y1: node.y, x2: neighbor.x, y2: neighbor.y};
                    let m1 = (e1.y1 - e1.y2) / (e1.x1 - e1.x2);
                    let m2 = (e2.y1 - e2.y2) / (e2.x1 - e2.x2);

                    let x = (e2.y1 - e1.y1 + e1.x1 * m1 - e2.x1 * m2) / (m1 - m2);
                    if (between(x, e1.x1, e1.x2) && between(x, e2.x1, e2.x2)) {
                        let y = m1 * (x - e1.x1) + e1.y1;
                        intersections.push({
                            "x": x,
                            "y": y,
                            "distance": vec2.distance(curPos, [x, y]),
                            "n1": node,
                            "n2": neighbor
                        });
                    }
                }
            }

            // Find the closest of the intersections
            if (intersections.length > 0) {
                let closest = intersections[0];
                for (let intersection of intersections) {
                    if (intersection.distance < closest.distance) {
                        closest = intersection;
                    }
                }
                this.turtle.setPosition(vec2.fromValues(closest.x, closest.y));
                this.network.connect(curNode, this.turtle.makeNode());
                this.network.connect(closest.n1, this.turtle.node);
                this.network.connect(closest.n2, this.turtle.node);

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
        }

        // Connect any nearby, lingering nodes
        let nodes: Node[] = this.network.getNodes();
        for (let node1 of nodes) {
            if (this.network.getAdjacentEdges(node1).length == 1) {
                for (let node2 of this.network.getNodesNear(node1, snapRadius)) {
                    if (!this.network.areAdjacent(node1, node2)) {
                        this.network.connect(node1, node2);
                        console.log("Connected");
                    }
                }
            }
        }

    }

    generateRoadGrid() {
        this.backRoads = new SpatialGraph();

        let seed1: vec2 = vec2.fromValues(0.178244, 0.64141);
        let highPopPoints = [];
        for (let x = -20; x < 11; x++) {
            for (let y = -10; y < 10; y++) {
                if (getPopulationDensity(vec2.fromValues(x, y)) > 0.5) {
                    highPopPoints.push([x, y]);
                };
            }
        }

        let neighborhoods = new SpatialGraph();
        for (let point of highPopPoints) {
            let x = point[0];
            let y = point[1];
            let newNode = new Node(vec2.fromValues(x, y));
            for (let node of neighborhoods.getNodeIterator()) {
                if (Math.abs(x - node.x) <= 1.1 && Math.abs(y - node.y) <= 1.1) {
                    neighborhoods.connect(node, newNode);
                    break;
                }
            }
            neighborhoods.addNode(newNode);
        }

        let ccs = neighborhoods.getConnectedComponents();
        let finishedNeighborhoods: vec2[] = [];
        const HOOD_RADIUS = 3.0;

        for (let cc of ccs) {
            let center: vec2 = vec2.create();
            for (let node of cc) {
                vec2.add(center, center, node.position);
            }
            vec2.scale(center, center, 1.0 / cc.length);

            let cont = false;
            for (let other of finishedNeighborhoods) {
                if (vec2.distance(center, other) < HOOD_RADIUS * 2) {
                    cont = true;
                    break;
                }
            }
            if (cont) {
                continue;
            }

            let doesIntersect = false;
            let neighborhoodNodes: Node[] = [];

            // Test population to find the boundaries of the neighborhood
            let hoodAngle = random1(center, seed1) * Math.PI * 2.0;
            let hoodDirection = vec2.fromValues(Math.cos(hoodAngle), Math.sin(hoodAngle));
            let hoodPerp = vec2.fromValues(-hoodDirection[1], hoodDirection[0]);
            let hoodFor = HOOD_RADIUS;
            let hoodBack = HOOD_RADIUS;
            let hoodRight = HOOD_RADIUS;
            let hoodLeft = HOOD_RADIUS;

            let curPosFor: vec2 = vec2.scaleAndAdd(vec2.create(), center, hoodDirection, hoodFor);
            let curPosBack: vec2 = vec2.scaleAndAdd(vec2.create(), center, hoodDirection, -hoodBack);
            let curPosRight: vec2 = vec2.scaleAndAdd(vec2.create(), center, hoodPerp, hoodRight);
            let curPosLeft: vec2 = vec2.scaleAndAdd(vec2.create(), center, hoodPerp, -hoodLeft);
            let i = [0, 0, 0, 0];
            while(getPopulationDensity(curPosFor) < 0.1) {
                i[0]++;
                if (i[0] >= 10) {
                    break;
                }
                hoodFor *= 0.75;
                curPosFor = vec2.scaleAndAdd(vec2.create(), center, hoodDirection, hoodFor);
            }
            while(getPopulationDensity(curPosBack) < 0.1) {
                i[1]++;
                if (i[1] >= 10) {
                    break;
                }
                hoodBack *= 0.75;
                curPosBack = vec2.scaleAndAdd(vec2.create(), center, hoodDirection, -hoodBack);
            }
            while(getPopulationDensity(curPosRight) < 0.1) {
                i[2]++;
                if (i[2] >= 10) {
                    break;
                }
                hoodRight *= 0.75;
                curPosRight = vec2.scaleAndAdd(vec2.create(), center, hoodPerp, hoodRight);
            }
            while(getPopulationDensity(curPosLeft) < 0.1) {
                i[3]++;
                if (i[3] >= 10) {
                    break;
                }
                hoodLeft *= 0.75;
                curPosLeft = vec2.scaleAndAdd(vec2.create(), center, hoodPerp, -hoodLeft);
            }

            // Lay out roads along the neighborhoods horizontal axis
            for (let tx = 0; tx < 1.01; tx += 0.1) {
                let curX = vec2.fromValues(
                    tx * curPosRight[0] + (1 - tx) * curPosLeft[0],
                    tx * curPosRight[1] + (1 - tx) * curPosLeft[1]
                )
                let curXNode = new Node(curX);

                // Check if the new backroad intersects with a highway
                let testForward = vec2.scaleAndAdd(vec2.create(), curX, hoodDirection, hoodFor);
                let intersectionsFor: vec2[] = [];
                for (let node of this.network.getNodesNear(new Node(testForward), 5.0)) {
                    for (let neighbor of this.network.getAdjacentEdges(node)) {
                        let intersection = intersects([curX, testForward], [node.position, neighbor.position]);
                        if (intersection) {
                            intersectionsFor.push(intersection);
                        }
                    }
                }
                if (intersectionsFor.length > 0) {
                    // Find the closest intersection and readjust the road
                    let closestDist = 1000;
                    let curClosest: vec2;
                    for (let intersection of intersectionsFor) {
                        let curDist = vec2.distance(curX, intersection);
                        if (curDist < closestDist) {
                            closestDist = curDist
                            curClosest = intersection;
                        }
                    }
                    testForward = curClosest;
                    doesIntersect = true;
                }
                else {
                    // Case where it doesn't intersect in this direction
                }

                // Now lay down another road in the opposite direction
                let testBackward = vec2.scaleAndAdd(vec2.create(), curX, hoodDirection, -hoodBack);
                let intersectionsBack: vec2[] = [];
                for (let node of this.network.getNodesNear(new Node(testBackward), 5.0)) {
                    for (let neighbor of this.network.getAdjacentEdges(node)) {
                        let intersection = intersects([curX, testBackward], [node.position, neighbor.position]);
                        if (intersection) {
                            intersectionsBack.push(intersection);
                        }
                    }
                }
                if (intersectionsBack.length > 0) {
                    // Find the closest intersection and readjust the road
                    let closestDist = 1000;
                    let curClosest: vec2;
                    for (let intersection of intersectionsBack) {
                        let curDist = vec2.distance(curX, intersection);
                        if (curDist < closestDist) {
                            closestDist = curDist
                            curClosest = intersection;
                        }
                    }
                    testBackward = curClosest;
                    doesIntersect = true;
                }
                else {
                    // Case where it doesn't intersect in this direction
                }

                neighborhoodNodes = neighborhoodNodes.concat(curXNode, new Node(testForward));
                neighborhoodNodes = neighborhoodNodes.concat(curXNode, new Node(testBackward));
            }

            // Lay out roads along the neighborhoods vertical axis
            for (let ty = 0; ty < 1.01; ty += 0.1) {
                let curY = vec2.fromValues(
                    ty * curPosBack[0] + (1 - ty) * curPosFor[0],
                    ty * curPosBack[1] + (1 - ty) * curPosFor[1]
                )
                let curYNode = new Node(curY);

                // Check if the new backroad intersects with a highway
                let testRight = vec2.scaleAndAdd(vec2.create(), curY, hoodPerp, hoodRight);
                let intersectionsRight: vec2[] = [];
                for (let node of this.network.getNodesNear(new Node(testRight), 5.0)) {
                    for (let neighbor of this.network.getAdjacentEdges(node)) {
                        let intersection = intersects([curY, testRight], [node.position, neighbor.position]);
                        if (intersection) {
                            intersectionsRight.push(intersection);
                        }
                    }
                }
                if (intersectionsRight.length > 0) {
                    // Find the closest intersection and readjust the road
                    let closestDist = 1000;
                    let curClosest: vec2;
                    for (let intersection of intersectionsRight) {
                        let curDist = vec2.distance(curY, intersection);
                        if (curDist < closestDist) {
                            closestDist = curDist
                            curClosest = intersection;
                        }
                    }
                    testRight = curClosest;
                    doesIntersect = true;
                }
                else {
                    // Case where it doesn't intersect in this direction
                }

                // Now lay down another road in the opposite direction
                let testLeft = vec2.scaleAndAdd(vec2.create(), curY, hoodPerp, -hoodLeft);
                let intersectionsLeft: vec2[] = [];
                for (let node of this.network.getNodesNear(new Node(testLeft), 5.0)) {
                    for (let neighbor of this.network.getAdjacentEdges(node)) {
                        let intersection = intersects([curY, testLeft], [node.position, neighbor.position]);
                        if (intersection) {
                            intersectionsLeft.push(intersection);
                        }
                    }
                }
                if (intersectionsLeft.length > 0) {
                    // Find the closest intersection and readjust the road
                    let closestDist = 1000;
                    let curClosest: vec2;
                    for (let intersection of intersectionsLeft) {
                        let curDist = vec2.distance(curY, intersection);
                        if (curDist < closestDist) {
                            closestDist = curDist
                            curClosest = intersection;
                        }
                    }
                    testLeft = curClosest;
                    doesIntersect = true;
                }
                else {
                    // Case where it doesn't intersect in this direction
                }
                
                neighborhoodNodes = neighborhoodNodes.concat(curYNode, new Node(testRight));
                neighborhoodNodes = neighborhoodNodes.concat(curYNode, new Node(testLeft));
            }
            if (doesIntersect) {
                for (let i = 0; i < neighborhoodNodes.length; i += 2) {
                    this.backRoads.connect(neighborhoodNodes[i], neighborhoodNodes[i + 1]);
                }
                finishedNeighborhoods.push(center);
            }

            /*for (let x = minX; x < maxX; x++){
                for (let y = minY; y < maxY; y++) {
                    if (getPopulationDensity(vec2.fromValues(x, y)) > 0.25) {
                        let corner1 = new Node(vec2.fromValues(x + 0.0, y + 0.0));
                        let corner2 = new Node(vec2.fromValues(x + 0.0, y + 0.5));
                        let corner3 = new Node(vec2.fromValues(x + 0.0, y + 1.0));
                        let corner4 = new Node(vec2.fromValues(x + 1.0, y + 0.0));
                        let corner5 = new Node(vec2.fromValues(x + 1.0, y + 0.5));
                        let corner6 = new Node(vec2.fromValues(x + 1.0, y + 1.0));

                        this.backRoads.connect(corner1, corner2);
                        this.backRoads.connect(corner2, corner3);
                        this.backRoads.connect(corner4, corner5);
                        this.backRoads.connect(corner5, corner6);
                        this.backRoads.connect(corner1, corner4);
                        this.backRoads.connect(corner2, corner5);
                        this.backRoads.connect(corner3, corner6);
                    }
                }
            }*/
        }

        // Get all the highways of sufficient length
        /*let seed1: vec2 = vec2.fromValues(0.178244, 0.64141);
        let seed2: vec2 = vec2.fromValues(0.229524, 0.76456);
        const MIN_LENGTH = 1.5;
        let usableRoads: Map<string, [Node, Node]> = new Map();
        for (let node of this.network.getNodeIterator()) {
            for (let neighbor of this.network.getAdjacentEdges(node)) {
                if (node.distance(neighbor) >= MIN_LENGTH) {
                    let index = [node.x, node.y, neighbor.x, neighbor.y].toString();
                    if (!usableRoads.has(index)) {
                        usableRoads.set(index, [node, neighbor]);
                    }
                }
            }
        }

        for (let road of usableRoads.values()) {
            let random = random1(road[0].position, seed1);
            vec2.scale(seed1, seed2, random);
            if (random < 0.7) {
                console.log(random);
                continue;
            }
            let start: Node = road[0];
            let end: Node = road[1];
            let direction: vec2 = vec2.normalize(vec2.create(), vsub(end.position, start.position));
            let perp: vec2 = vec2.fromValues(-direction[1], direction[0]);
            let length = start.distance(end);
            let curPos: vec2 = vec2.fromValues(start.position[0], start.position[1]);

            while(vec2.distance(curPos, start.position) < length) {
                console.log(start.position);
                let roadStart = new Node(curPos);
                let roadEnd = new Node(vec2.add(vec2.create(), curPos, vec2.scale(vec2.create(), perp, 3.0)));
                this.backRoads.connect(roadStart, roadEnd);
                vec2.scaleAndAdd(curPos, curPos, direction, 0.5);
            }
        }*/


        /*let nodes: any[] = [];
        for (let x = -20; x < 11; x++){
            for (let y = -10; y < 10; y++) {
                if (getPopulationDensity(vec2.fromValues(x, y)) > 0.25) {
                    let corner1 = new Node(vec2.fromValues(x + 0.0, y + 0.0));
                    let corner2 = new Node(vec2.fromValues(x + 0.0, y + 0.5));
                    let corner3 = new Node(vec2.fromValues(x + 0.0, y + 1.0));
                    let corner4 = new Node(vec2.fromValues(x + 1.0, y + 0.0));
                    let corner5 = new Node(vec2.fromValues(x + 1.0, y + 0.5));
                    let corner6 = new Node(vec2.fromValues(x + 1.0, y + 1.0));

                    this.backRoads.connect(corner1, corner2);
                    this.backRoads.connect(corner2, corner3);
                    this.backRoads.connect(corner4, corner5);
                    this.backRoads.connect(corner5, corner6);
                    this.backRoads.connect(corner1, corner4);
                    this.backRoads.connect(corner2, corner5);
                    this.backRoads.connect(corner3, corner6);
                }
            }
        }*/
    }

    drawRoadNetwork(road: Square, highwayThickness: number) {
        let seenEdges = new Set();
        this.numRoads = 0;

        for (let node of this.network.getNodeIterator()) {
            for (let neighbor of this.network.getAdjacentEdges(node)) {
                if (!seenEdges.has(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]))) {
                    seenEdges.add(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]));
                    seenEdges.add(JSON.stringify([neighbor.x, neighbor.y, node.x, node.y]));
                    this.endpoints = this.endpoints.concat(node.x, node.y, neighbor.x, neighbor.y);
                    this.numRoads++;
                }
            }
        }
        let highwayThicknesses = Array(this.numRoads).fill(highwayThickness);

        let seenBackEdges = new Set();

        for (let node of this.backRoads.getNodeIterator()) {
            for (let neighbor of this.backRoads.getAdjacentEdges(node)) {
                if (!seenBackEdges.has(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]))) {
                    seenBackEdges.add(JSON.stringify([node.x, node.y, neighbor.x, neighbor.y]));
                    seenBackEdges.add(JSON.stringify([neighbor.x, neighbor.y, node.x, node.y]));
                    this.endpoints = this.endpoints.concat(node.x, node.y, neighbor.x, neighbor.y);
                    this.numRoads++;
                    highwayThicknesses.push(highwayThickness * 0.5);
                }
            }
        }

        //console.log(this.numRoads);
        //console.log(this.network.adjacency.size);
        road.setInstanceVBOs(new Float32Array(this.endpoints), new Float32Array(highwayThicknesses));
        road.setNumInstances(this.numRoads);
    }
}