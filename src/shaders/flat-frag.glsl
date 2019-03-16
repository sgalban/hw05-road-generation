#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

const vec2 SEED2 = vec2(0.31415, 0.6456);

float random1(vec2 p , vec2 seed) {
    return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 random2(vec2 p , vec2 seed) {
    return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 85734.3545);
}

float cubicFalloff(float t) {
    return t * t * (3.0 - 2.0 * t);
}

float perlin (vec2 noisePos, float frequency) {
    vec2 pos = noisePos * frequency;
    vec2 cellPos = vec2(floor(pos.x), floor(pos.y));

    vec2 corner0 = cellPos + vec2(0.0, 0.0);
    vec2 corner1 = cellPos + vec2(1.0, 0.0);
    vec2 corner2 = cellPos + vec2(0.0, 1.0);
    vec2 corner3 = cellPos + vec2(1.0, 1.0);

    vec2 posVec0 = pos - corner0;
    vec2 posVec1 = pos - corner1;
    vec2 posVec2 = pos - corner2;
    vec2 posVec3 = pos - corner3; 

    vec2 gradient0 = normalize(random2(corner0, SEED2) * 2.0 - vec2(1.0));
    vec2 gradient1 = normalize(random2(corner1, SEED2) * 2.0 - vec2(1.0));
    vec2 gradient2 = normalize(random2(corner2, SEED2) * 2.0 - vec2(1.0));
    vec2 gradient3 = normalize(random2(corner3, SEED2) * 2.0 - vec2(1.0));
    float val0 = dot(posVec0, gradient0);
    float val1 = dot(posVec1, gradient1);
    float val2 = dot(posVec2, gradient2);
    float val3 = dot(posVec3, gradient3);

    float tx = cubicFalloff(fract(pos.x));
    float ty = cubicFalloff(fract(pos.y));
    float lerpedCol = mix(mix(val0, val1, tx), mix(val2, val3, tx), ty);

    return (lerpedCol + 1.0) / 2.0;
}

float recursivePerlin(vec2 noisePos, int octaves, float frequency) {
    const float PERSISTENCE = 0.5;
    const float FREQUENCY_FACTOR = 2.0;

    float total = 0.0;
    float curAmplitude = 1.0;
    float curFrequency = frequency;
    for (int curOctave = 0; curOctave < octaves; curOctave++) {
        curAmplitude *= PERSISTENCE;
        total += perlin(noisePos, curFrequency) * curAmplitude;
        curFrequency *= FREQUENCY_FACTOR;
    }
    return total;
}

float brownianNoise(vec2 noisePos, vec2 seed) {
    vec2 boxPos = vec2(floor(noisePos.x), floor(noisePos.y));

    // Get the noise at the corners of the cells
    float corner0 = random1(boxPos + vec2(0.0, 0.0), seed);
    float corner1 = random1(boxPos + vec2(1.0, 0.0), seed);
    float corner2 = random1(boxPos + vec2(0.0, 1.0), seed);
    float corner3 = random1(boxPos + vec2(1.0, 1.0), seed);

    // Get cubic interpolation factors
    float tx = smoothstep(0.0, 1.0, fract(noisePos.x));
    float ty = smoothstep(0.0, 1.0, fract(noisePos.y));

    // Perform bicubic interpolation
    return mix(mix(corner0, corner1, tx), mix(corner2, corner3, tx), ty);
}

float fbm(vec2 noisePos, int numOctaves, float startFrequency) {
    float totalNoise = 0.0;
    float normalizer = 0.0;
    const float PERSISTENCE = 0.5;

    float frequency = startFrequency;
    float amplitude = PERSISTENCE;

    for (int i = 0; i < numOctaves; i++) {
        normalizer += amplitude;
        totalNoise += brownianNoise(noisePos * frequency, SEED2) * amplitude;
        frequency *= 2.0;
        amplitude *= PERSISTENCE;
    }
    return totalNoise / normalizer;
}

float worley(vec2 noisePos, float frequency) {
    vec2 point = noisePos * frequency;
    vec2 cell = floor(point);

    // Check the neighboring cells for the closest cell point
    float closestDistance = 2.0;
    for (int i = 0; i < 9; i++) {
        vec2 curCell = cell + vec2(i % 3 - 1, floor(float(i / 3) - 1.0));
        vec2 cellPoint = vec2(curCell) + random2(vec2(curCell), SEED2);
        closestDistance = min(closestDistance, distance(cellPoint, point));
    }
    return clamp(0.0, 1.0, closestDistance);
}

vec3 getWaterColor(vec2 pos, float height) {
    float time = float(u_Time) * 0.0005;

    vec2 perturbenceOffset = vec2(5.4 + time, 1.3 + time);
    vec2 perturbence = vec2(fbm(pos, 2, 20.0), fbm(pos + perturbenceOffset, 2, 20.0));

    vec2 worleyOffset = vec2(time * 0.2);
    float worley = worley(pos + worleyOffset - perturbence * 0.05, 15.0);
    float noise = worley;
    float coastOffset = sin(time * 10.0) * 0.02 + 0.05;
    if (height > -coastOffset) {
        float coast = clamp((height + coastOffset) / 0.1, 0.0, 1.0);
        noise = mix(noise, 1.0, coast);
    }
    /*vec2 perturbenceOffset = vec2(5.4 + time, 1.3 + time);
    vec2 worleyOffset = vec2(time);

    vec2 perturbence = vec2(fbm(pos, 2, 6.0), fbm(pos + perturbenceOffset, 2, 6.0));
    float noise = worley(pos - worleyOffset - perturbence, 3.0);
    noise = noise * noise;*/
    return mix(vec3(0.3, 0.3, 1.0), vec3(0.6, 0.6, 0.9), cubicFalloff(noise));
}

vec3 getHeightColor(float height) {
    vec3 WATER = getWaterColor(fs_Pos, height);

    if (height < 0.0) {
        return WATER;
    }
    else if (height > 0.0 && height < 0.025) {
        return mix(WATER, vec3(0.9, 0.9, 0.5), cubicFalloff(height / 0.025));
    }
    else if (height > 0.025 && height < 0.05) {
        return mix(vec3(0.9, 0.9, 0.5), vec3(0, 0.5, 0), cubicFalloff((height - 0.025) / 0.025));
    }
    else if (height > 0.05) {
        //float t = clamp(cubicFalloff((height - 0.05) / 0.95) * 10.0, 0.0, 1.0)
        return mix(vec3(0, 0.5, 0), vec3(0.7), clamp(cubicFalloff((height - 0.05) / 0.95) * 6.0, 0.0, 1.0));
    }
}

void main() {
    float height = pow(recursivePerlin(fs_Pos, 3, 5.0), 2.0);
    height -= pow(fbm(fs_Pos, 3, 0.5), 2.0);
    vec3 color = getHeightColor(height);
    out_Col = vec4(color, 1.0);
}
