import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;
  //bufTranslate: WebGLBuffer;
  bufCol: WebGLBuffer;
  bufUV: WebGLBuffer;
  //bufAngle: WebGLBuffer;
  //bufLength: WebGLBuffer;
  bufEnd: WebGLBuffer;
  bufThic: WebGLBuffer;

  idxGenerated: boolean = false;
  posGenerated: boolean = false;
  norGenerated: boolean = false;
  colGenerated: boolean = false;
  //translateGenerated: boolean = false;
  uvGenerated: boolean = false;
  //angleGenerated: boolean = false;
  //lengthGenerated: boolean = false;
  endGenerated: boolean = false;
  thicGenerated: boolean = false;

  numInstances: number = 0; // How many instances of this Drawable the shader program should draw

  abstract create() : void;

  destroy() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufPos);
    gl.deleteBuffer(this.bufNor);
    gl.deleteBuffer(this.bufCol);
    //gl.deleteBuffer(this.bufTranslate);
    gl.deleteBuffer(this.bufUV);
    //gl.deleteBuffer(this.bufAngle);
    //gl.deleteBuffer(this.bufLength);
    gl.deleteBuffer(this.bufEnd);
    gl.deleteBuffer(this.bufThic);
  }

  generateIdx() {
    this.idxGenerated = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posGenerated = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norGenerated = true;
    this.bufNor = gl.createBuffer();
  }

  generateCol() {
    this.colGenerated = true;
    this.bufCol = gl.createBuffer();
  }

  /*generateTranslate() {
    this.translateGenerated = true;
    this.bufTranslate = gl.createBuffer();
  }

  generateAngle() {
    this.angleGenerated = true;
    this.bufAngle = gl.createBuffer();
  }

  generateLength() {
    this.lengthGenerated = true;
    this.bufLength = gl.createBuffer();
  }*/
  generateEndpoints() {
    this.endGenerated = true;
    this.bufEnd = gl.createBuffer();
  }

  generateThickness() {
    this.thicGenerated = true;
    this.bufThic = gl.createBuffer();
  }

  generateUV() {
    this.uvGenerated = true;
    this.bufUV = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxGenerated) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxGenerated;
  }

  bindPos(): boolean {
    if (this.posGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posGenerated;
  }

  bindNor(): boolean {
    if (this.norGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norGenerated;
  }

  bindCol(): boolean {
    if (this.colGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    }
    return this.colGenerated;
  }

  /*bindTranslate(): boolean {
    if (this.translateGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    }
    return this.translateGenerated;
  }

  bindAngle(): boolean {
    if (this.angleGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufAngle);
    }
    return this.angleGenerated;
  }

  bindLength(): boolean {
    if (this.lengthGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLength);
    }
    return this.lengthGenerated;
  }*/
  bindEndpoints(): boolean {
    if (this.endGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufEnd);
    }
    return this.endGenerated;
  }

  bindThickness(): boolean {
    if (this.thicGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufThic);
    }
    return this.thicGenerated;
  }

  bindUV(): boolean {
    if (this.uvGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    }
    return this.uvGenerated;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }

  setNumInstances(num: number) {
    this.numInstances = num;
  }
};

export default Drawable;
