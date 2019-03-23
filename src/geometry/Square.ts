import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Square extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    colors: Float32Array;
    //offsets: Float32Array; // Data for bufTranslate
    //angles: Float32Array;
    //lengths: Float32Array;
    endpoints: Float32Array;
  
  
    constructor() {
        super(); // Call the constructor of the super class. This is required.
    }
  
    create() {
  
        this.indices = new Uint32Array([0, 1, 2,
                                        0, 2, 3]);
        this.positions = new Float32Array([-0.5, -0.5, 0, 1,
                                           0.5, -0.5, 0, 1,
                                           0.5, 0.5, 0, 1,
                                           -0.5, 0.5, 0, 1]);
    
        this.generateIdx();
        this.generatePos();
        this.generateCol();
        /*this.generateTranslate();
        this.generateAngle();
        this.generateLength();*/
        this.generateEndpoints();
    
        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
  
    }
  
    setInstanceVBOs(endpoints: Float32Array) {
        /*this.offsets = offsets;
        this.angles = angles;
        this.lengths = lengths;*/
        this.endpoints = endpoints;
    
        //gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
        //gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
        /*gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
        gl.bufferData(gl.ARRAY_BUFFER, this.offsets, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufAngle);
        gl.bufferData(gl.ARRAY_BUFFER, this.angles, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLength);
        gl.bufferData(gl.ARRAY_BUFFER, this.lengths, gl.STATIC_DRAW);*/
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufEnd);
        gl.bufferData(gl.ARRAY_BUFFER, this.endpoints, gl.STATIC_DRAW);
    }
};

export default Square;
