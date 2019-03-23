import {vec2, vec3} from 'gl-matrix';
import {getTerrainHeight, getPopulationDensity} from './GeoDataGenerator';
import Turtle from './Turtle';
import SpatialGraph, {Node} from './SpatialGraph';
import Drawable from './rendering/gl/Drawable';
import Square from './geometry/Square';

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

        // Seed is arbitrary. Can be safely changed without changing anything else
        let seed: vec2 = vec2.fromValues(0.341234, 0.94141);

        // Find an appropriate point to begin the highway system
        let startPoint: vec2 = randomInRange(vec2.fromValues(-20, -10), vec2.fromValues(20, 10), seed);
        while (getPopulationDensity(startPoint) < 0.5) {
            seed[0] += startPoint[0];
            seed[1] += startPoint[1];
            startPoint = randomInRange(vec2.fromValues(0, 0), vec2.fromValues(20, 10), seed);
        }

        // Continue branching

    }

    drawHighwayNetwork(road: Square) {
        road.setInstanceVBOs(new Float32Array(this.endpoints));
        road.setNumInstances(this.numRoads);
    }
}