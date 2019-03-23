import {vec2, vec3} from 'gl-matrix';

// This seed is synced with the one on the GPU. Must be changed in tandem
const SEED2: vec2 = vec2.fromValues(0.5415, 0.5056);

function mix(x1: number, x2: number, t: number) {
    t = t < 0 ? 0 : t;
    t = t > 1 ? 1 : t;
    return t * x2 + (1 - t) * x1;
}

function fract(x: number): number {
    return x - Math.floor(x);
}

function cubicFalloff(t: number) {
    return t * t * (3.0 - 2.0 * t);
}

function vfract(v: vec2): vec2 {
    return vec2.fromValues(fract(v[0]), fract(v[1]));
}

function vsin(v: vec2): vec2 {
    return vec2.fromValues(Math.sin(v[0]), Math.sin(v[1]));
}

function vfloor(v: vec2): vec2 {
    return vec2.fromValues(Math.floor(v[0]), Math.floor(v[1]));
}

function vscale(v: vec2, s: number) {
    return vec2.scale(vec2.create(), v, s);
}

function vadd(v: vec2, u: vec2) {
    return vec2.add(vec2.create(), v, u);
}

function vsub(v: vec2, u: vec2) {
    return vec2.subtract(vec2.create(), v, u);
}


function random1(p: vec2, seed: vec2) : number {
    return fract(Math.sin(vec2.dot(
        vec2.add(vec2.create(), p, seed),
        vec2.fromValues(127.1, 311.7))
    ) * 1.0);
}

function random2(p: vec2, seed: vec2) : vec2 {
    return (
        vfract(vec2.scale(vec2.create(), vsin(vec2.fromValues(
            vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(311.7, 127.1)),
            vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(269.5, 183.3)))), 
            1.0)
        )
    );
}

function perlin(noisePos: vec2, frequency: number) : number {
    let pos: vec2 = vec2.scale(vec2.create(), noisePos, frequency);
    let cellPos: vec2 = vfloor(pos);

    let corner0: vec2 = vec2.add(vec2.create(), cellPos, vec2.fromValues(0, 0));
    let corner1: vec2 = vec2.add(vec2.create(), cellPos, vec2.fromValues(1, 0));
    let corner2: vec2 = vec2.add(vec2.create(), cellPos, vec2.fromValues(0, 1));
    let corner3: vec2 = vec2.add(vec2.create(), cellPos, vec2.fromValues(1, 1));

    let posVec0: vec2 = vec2.subtract(vec2.create(), pos, corner0);
    let posVec1: vec2 = vec2.subtract(vec2.create(), pos, corner1);
    let posVec2: vec2 = vec2.subtract(vec2.create(), pos, corner2);
    let posVec3: vec2 = vec2.subtract(vec2.create(), pos, corner3); 

    let gradient0: vec2 = vec2.normalize(vec2.create(), vsub(vscale(random2(corner0, SEED2), 2.0), vec2.fromValues(1, 1)));
    let gradient1: vec2 = vec2.normalize(vec2.create(), vsub(vscale(random2(corner1, SEED2), 2.0), vec2.fromValues(1, 1)));
    let gradient2: vec2 = vec2.normalize(vec2.create(), vsub(vscale(random2(corner2, SEED2), 2.0), vec2.fromValues(1, 1)));
    let gradient3: vec2 = vec2.normalize(vec2.create(), vsub(vscale(random2(corner3, SEED2), 2.0), vec2.fromValues(1, 1)));
    let val0: number = vec2.dot(posVec0, gradient0);
    let val1: number = vec2.dot(posVec1, gradient1);
    let val2: number = vec2.dot(posVec2, gradient2);
    let val3: number = vec2.dot(posVec3, gradient3);

    let tx: number = cubicFalloff(fract(pos[0]));
    let ty: number = cubicFalloff(fract(pos[0]));
    let lerpedCol: number = mix(mix(val0, val1, tx), mix(val2, val3, tx), ty);

    return (lerpedCol + 1.0) / 2.0;
}

function recursivePerlin(noisePos: vec2, octaves : number, frequency : number) : number {
    const PERSISTENCE : number = 0.5;
    const FREQUENCY_FACTOR : number = 2.0;

    let total: number = 0.0;
    let curAmplitude: number = 1.0;
    let curFrequency: number = frequency;
    for (let curOctave = 0; curOctave < octaves; curOctave++) {
        curAmplitude *= PERSISTENCE;
        total += perlin(noisePos, curFrequency) * curAmplitude;
        curFrequency *= FREQUENCY_FACTOR;
    }
    return total;
}

function brownianNoise(noisePos: vec2, seed: vec2) : number {
    let boxPos: vec2 = vfloor(noisePos);

    // Get the noise at the corners of the cells
    let corner0: number = random1(vadd(boxPos, vec2.fromValues(0.0, 0.0)), seed);
    let corner1: number = random1(vadd(boxPos, vec2.fromValues(1.0, 0.0)), seed);
    let corner2: number = random1(vadd(boxPos, vec2.fromValues(0.0, 1.0)), seed);
    let corner3: number = random1(vadd(boxPos, vec2.fromValues(1.0, 1.0)), seed);

    // Get cubic interpolation factors
    let tx: number = cubicFalloff(fract(noisePos[0]));
    let ty: number = cubicFalloff(fract(noisePos[1]));

    // Perform bicubic interpolation
    return mix(mix(corner0, corner1, tx), mix(corner2, corner3, tx), ty);
}

function fbm(noisePos: vec2, numOctaves: number, startFrequency: number) : number {
    let totalNoise: number = 0.0;
    let normalizer: number = 0.0;
    const PERSISTENCE : number = 0.5;

    let frequency: number = startFrequency;
    let amplitude: number = PERSISTENCE;

    for (let i = 0; i < numOctaves; i++) {
        normalizer += amplitude;
        totalNoise += brownianNoise(vscale(noisePos, frequency), SEED2) * amplitude;
        frequency *= 2.0;
        amplitude *= PERSISTENCE;
    }
    return totalNoise / normalizer;
}

export function getTerrainHeight(pos: vec2) : number {
    
    return Math.pow(recursivePerlin(pos, 3, 0.5), 2.0) - Math.pow(fbm(pos, 3, 0.05), 2.0);
}

export function isLand(pos: vec2) {
    return getTerrainHeight(pos) > 0.0125;
}

function normalClamp(t: number) {
    return t < 0 ? 0 : (t > 1 ? 1 : t);
}

function populationHeightFalloff(height: number) : number {
    return(
        height > 0.025 && height < 0.085 ? cubicFalloff((height - 0.025) / 0.06) :
        height > 0.085 && height < 0.200 ? 1.0 :
        height > 0.200 && height < 0.260 ? cubicFalloff(-(height - 0.200) / 0.06 + 1.0) :
        0.0
    );
}

export function getPopulationDensity(pos: vec2) : number {
    if (Math.abs(pos[0]) > 20 || Math.abs(pos[1]) > 10) {
        return -1.0;
    }
    let height = getTerrainHeight(pos);
    if (height < 0.02) {
        return -1.0;
    }
    return normalClamp(Math.pow(perlin(pos, 0.3), 3.0) * 2.5) * populationHeightFalloff(height);
}