#version 300 es
precision highp float;

uniform int u_Mode;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Dummy;

out vec4 out_Col;

void main() {
    vec3 color = vec3(0.2);
    out_Col = vec4(color, 1.0);
}
