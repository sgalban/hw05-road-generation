#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_Mode;

in vec2 fs_Pos;
out vec4 out_Col;

const vec2 SEED2 = vec2(0.5415, 0.5056);

float random1(vec2 p , vec2 seed) {
    return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 1.0);
}

vec2 random2(vec2 p , vec2 seed) {
    return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 1.0);
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
    pos = pos / 15.0;
    float time = float(u_Time) * 0.0005;

    vec2 perturbenceOffset = vec2(5.4 + time, 1.3 + time);
    vec2 perturbence = vec2(fbm(pos, 2, 20.0), fbm(pos + perturbenceOffset, 2, 20.0));

    vec2 worleyOffset = vec2(time * 0.2);
    float worley = worley(pos + worleyOffset - perturbence * 0.05, 15.0);
    float noise = worley;
    float coastOffset = (sin(time * 20.0) * 0.5 + 1.0) * 0.03 + 0.04;
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

vec3 getHeightColor(float height, vec2 pos) {
    if ((u_Mode & 1) == 0) {
        return height < 0.0125 ? vec3(0, 0, 1) : vec3(0, 0.7, 0);
    }

    vec3 WATER = getWaterColor(pos, height);
    vec3 SAND = vec3(0.9, 0.9, 0.5);
    vec3 GRASS1 = vec3(0, 0.5, 0);
    vec3 GRASS2 = vec3(0.4, 0.7, 0.1);
    vec3 DIRT = vec3(0.5, 0.7, 0.1);
    vec3 STONE = vec3(0.4, 0.25, 0.1);
    vec3 SNOW = vec3(0.5, 0.5, 0.5);

    if (height < 0.0) {
        return WATER;
    }
    else if (height > 0.0 && height < 0.025) {
        return mix(WATER, SAND, height / 0.025);
    }
    else if (height > 0.025 && height < 0.05) {
        return mix(SAND, GRASS1, cubicFalloff((height - 0.025) / 0.025));
    }
    else if (height > 0.05 && height < 0.15) {
        return mix(GRASS1, GRASS2, cubicFalloff((height - 0.05) / 0.1));;
    }
    else if (height > 0.15 && height < 0.19) {
        return mix(GRASS2, DIRT, cubicFalloff((height - 0.15) / 0.04));
    }
    else if (height > 0.19 && height < 0.23) {
        //float t = clamp(cubicFalloff((height - 0.05) / 0.95) * 10.0, 0.0, 1.0)
        return mix(DIRT, STONE, cubicFalloff((height - 0.19) / 0.04));
    }
    else if (height > 0.23 && height < 0.35) {
        return mix(STONE, SNOW, cubicFalloff((height - 0.23) / 0.12));
    }
    else {
        return SNOW;
    }
}

float populationHeightFalloff(float height) {
    return(
        height > 0.025 && height < 0.085 ? cubicFalloff((height - 0.025) / 0.06) :
        height > 0.085 && height < 0.200 ? 1.0 :
        height > 0.200 && height < 0.260 ? cubicFalloff(-(height - 0.200) / 0.06 + 1.0) :
        0.0
    );
}

vec3 getRawColor(vec2 pos) {

    float height = pow(recursivePerlin(pos, 3, 0.5), 2.0) - pow(fbm(pos, 3, 0.05), 2.0);
    float population = clamp(pow(perlin(pos, 0.3), 3.0) * 2.5, 0.0, 1.0) * populationHeightFalloff(height);

    vec3 heightColor = getHeightColor(height, pos);
    vec3 color = ((u_Mode & 2) > 0) ? mix(heightColor, vec3(1, 0, 0), population) : heightColor;

    return color;
}

vec2 toPixelSpace(vec2 pos) {
    float aspectRatio = u_Dimensions.x / u_Dimensions.y;
    float x = ((pos.x / aspectRatio / 10.0) + 1.0) / 2.0 * u_Dimensions.x;
    float y = ((pos.y / 10.0) + 1.0) / 2.0 * u_Dimensions.y;
    return vec2(x, y);
}

bool onGrid(vec2 pos) {
    vec2 pixelPoint = toPixelSpace(pos);
    float nearestCol1 = toPixelSpace(vec2(floor(pos.x), 0.0)).x;
    float nearestCol2 = toPixelSpace(vec2(ceil(pos.x), 0.0)).x;
    float nearestRow1 = toPixelSpace(vec2(0.0, floor(pos.y))).y;
    float nearestRow2 = toPixelSpace(vec2(0.0, ceil(pos.y))).y;
    return (abs(pixelPoint.x - nearestCol1) <= 1.0) || (abs(pixelPoint.x - nearestCol2) <= 1.0)
        || (abs(pixelPoint.y - nearestRow1) <= 1.0) || (abs(pixelPoint.y - nearestRow2) <= 1.0);
}

void main() {
    float aspectRatio = u_Dimensions.x / u_Dimensions.y;
    vec2 pos = vec2(fs_Pos.x * 10.0 * aspectRatio, fs_Pos.y * 10.0);
    vec3 color = getRawColor(pos);

    bool showGrid = (u_Mode & 4) > 0;
    color = (showGrid && onGrid(pos)) ? vec3(0.5) : color;
    if (showGrid && distance(pos, vec2(0, 0)) < 0.15) {
        color = vec3(1, 0, 1);
    }

    out_Col = vec4(color, 1.0);
}
