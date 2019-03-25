#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;
uniform vec2 u_Dimensions;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
//in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
//in vec2 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.
in vec4 vs_Endpoints;
in float vs_Thickness;

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Dummy;

void main() {
    fs_Col = vec4(0, 0, 0, 1);
    vec2 end1 = vec2(vs_Endpoints.x, vs_Endpoints.y);
    vec2 end2 = vec2(vs_Endpoints.z, vs_Endpoints.w);

    float aspectRatio = u_Dimensions.x / u_Dimensions.y;
    vec2 direction = normalize(end2 - end1);
    float angle = atan(direction.y, direction.x);
    float length = distance(end1, end2);
    mat2 rotation = mat2(
        vec2(cos(angle), sin(angle)),
        vec2(-sin(angle), cos(angle))
    );

    
    vec2 pos = vs_Pos.xy;
    //pos += direction * length * 0.5;
    pos = vec2(pos.x * length, pos.y * vs_Thickness);
    pos = rotation * pos;
    pos += (end1 + end2) / 2.0;
    pos = vec2(pos.x / 10.0 / aspectRatio, pos.y / 10.0);
    
    
    
    //pos += (end1 + end2) / 2.0;

    //vec2 pos = (end1 + end2) / 2.0;

    fs_Pos = vec4(pos.x, pos.y, 0.9995, 1.0);
    fs_Dummy = vs_Pos + vs_Endpoints;
    gl_Position = vec4(pos.x, pos.y, 0.9995, 1.0);
}
