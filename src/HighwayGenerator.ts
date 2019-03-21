import {vec2, vec3} from 'gl-matrix';
import {getTerrainHeight, getPopulationDensity} from './GeoDataGenerator';
import Turtle from './Turtle';
import SpatialGraph, {Node} from './SpatialGraph';

function random2(p: vec2, seed: vec2) : vec2 {
    let vec: vec2 = 
        vfract(vec2.scale(vec2.create(), vsin(vec2.fromValues(
            vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(311.7, 127.1)),
            vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(269.5, 183.3)))), 
            85734.3545)
        )
    return vec2.fromValues(vec[0] * 2 - 1, vec[1] * 2 - 1);
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
    network: SpatialGraph;

    constructor() {
        this.turtle = new Turtle();
        this.network = new SpatialGraph();
    }

    isWater(pos: vec2) {
        return getTerrainHeight(pos) < 0.0125;
    }

    generateRoadNetwork() {
        let seed: vec2 = vec2.fromValues(0, 0);
        let startPoint: vec2 = random2(vec2.create(), seed);
        while (!this.isWater(startPoint)) {
            seed[0] += startPoint[0];
            seed[1] += startPoint[1];
            startPoint = random2(vec2.create(), seed);
        }
        this.network.addNode(new Node(startPoint));
        this.network.addNode(new Node(vec2.add(vec2.create(), startPoint, vec2.fromValues(0, 0.1))));
    }
}