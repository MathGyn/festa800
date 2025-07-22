// OGL não está disponível via CDN - comentando
// import { Renderer, Program, Mesh, Triangle, Transform, Vec3, Camera } from "ogl";

function parseHexColor(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function fract(x) {
  return x - Math.floor(x);
}

function hash31(p) {
  let r = [p * 0.1031, p * 0.1030, p * 0.0973].map(fract);
  const r_yzx = [r[1], r[2], r[0]];
  const dotVal = r[0] * (r_yzx[0] + 33.33) +
    r[1] * (r_yzx[1] + 33.33) +
    r[2] * (r_yzx[2] + 33.33);
  for (let i = 0; i < 3; i++) {
    r[i] = fract(r[i] + dotVal);
  }
  return r;
}

function hash33(v) {
  let p = [v[0] * 0.1031, v[1] * 0.1030, v[2] * 0.0973].map(fract);
  const p_yxz = [p[1], p[0], p[2]];
  const dotVal = p[0] * (p_yxz[0] + 33.33) +
    p[1] * (p_yxz[1] + 33.33) +
    p[2] * (p_yxz[2] + 33.33);
  for (let i = 0; i < 3; i++) {
    p[i] = fract(p[i] + dotVal);
  }
  const p_xxy = [p[0], p[0], p[1]];
  const p_yxx = [p[1], p[0], p[0]];
  const p_zyx = [p[2], p[1], p[0]];
  const result = [];
  for (let i = 0; i < 3; i++) {
    result[i] = fract((p_xxy[i] + p_yxx[i]) * p_zyx[i]);
  }
  return result;
}

const vertex = `#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec3 iMouse;
uniform vec3 iColor;
uniform vec3 iCursorColor;
uniform float iAnimationSize;
uniform int iBallCount;
uniform float iCursorBallSize;
uniform vec3 iMetaBalls[50];
uniform float iClumpFactor;
uniform bool enableTransparency;
out vec4 outColor;
const float PI = 3.14159265359;

float getMetaBallValue(vec2 c, float r, vec2 p) {
  vec2 d = p - c;
  float dist2 = dot(d, d);
  return (r * r) / dist2;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float scale = iAnimationSize / iResolution.y;
  vec2 coord = (fc - iResolution.xy * 0.5) * scale;
  vec2 mouseW = (iMouse.xy - iResolution.xy * 0.5) * scale;
  float m1 = 0.0;
  for (int i = 0; i < 50; i++) {
    if (i >= iBallCount) break;
    m1 += getMetaBallValue(iMetaBalls[i].xy, iMetaBalls[i].z, coord);
  }
  float m2 = getMetaBallValue(mouseW, iCursorBallSize, coord);
  float total = m1 + m2;
  float f = smoothstep(-1.0, 1.0, (total - 1.3) / min(1.0, fwidth(total)));
  vec3 cFinal = vec3(0.0);
  if (total > 0.0) {
    float alpha1 = m1 / total;
    float alpha2 = m2 / total;
    cFinal = iColor * alpha1 + iCursorColor * alpha2;
  }
  outColor = vec4(cFinal * f, enableTransparency ? f : 1.0);
}
`;

class MetaBalls {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      color: options.color || "#cebf9f",
      speed: options.speed || 0.3,
      enableMouseInteraction: options.enableMouseInteraction !== false,
      hoverSmoothness: options.hoverSmoothness || 0.05,
      animationSize: options.animationSize || 30,
      ballCount: options.ballCount || 15,
      clumpFactor: options.clumpFactor || 1,
      cursorBallSize: options.cursorBallSize || 2,
      cursorBallColor: options.cursorBallColor || "#cebf9f",
      enableTransparency: options.enableTransparency !== false,
    };
    
    this.init();
  }

  init() {
    if (!this.container) return;

    const dpr = 1;
    this.renderer = new Renderer({ dpr, alpha: true, premultipliedAlpha: false });
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, this.options.enableTransparency ? 0 : 1);
    this.container.appendChild(gl.canvas);

    this.camera = new Camera(gl, {
      left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10,
    });
    this.camera.position.z = 1;

    const geometry = new Triangle(gl);
    const [r1, g1, b1] = parseHexColor(this.options.color);
    const [r2, g2, b2] = parseHexColor(this.options.cursorBallColor);

    this.metaBallsUniform = [];
    for (let i = 0; i < 50; i++) {
      this.metaBallsUniform.push(new Vec3(0, 0, 0));
    }

    this.program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3(0, 0, 0) },
        iMouse: { value: new Vec3(0, 0, 0) },
        iColor: { value: new Vec3(r1, g1, b1) },
        iCursorColor: { value: new Vec3(r2, g2, b2) },
        iAnimationSize: { value: this.options.animationSize },
        iBallCount: { value: this.options.ballCount },
        iCursorBallSize: { value: this.options.cursorBallSize },
        iMetaBalls: { value: this.metaBallsUniform },
        iClumpFactor: { value: this.options.clumpFactor },
        enableTransparency: { value: this.options.enableTransparency },
      },
    });

    this.mesh = new Mesh(gl, { geometry, program: this.program });
    this.scene = new Transform();
    this.mesh.setParent(this.scene);

    this.setupBalls();
    this.setupEventListeners();
    this.resize();
    this.startAnimation();
  }

  setupBalls() {
    const maxBalls = 50;
    const effectiveBallCount = Math.min(this.options.ballCount, maxBalls);
    this.ballParams = [];
    for (let i = 0; i < effectiveBallCount; i++) {
      const idx = i + 1;
      const h1 = hash31(idx);
      const st = h1[0] * (2 * Math.PI);
      const dtFactor = 0.1 * Math.PI + h1[1] * (0.4 * Math.PI - 0.1 * Math.PI);
      const baseScale = 5.0 + h1[1] * (10.0 - 5.0);
      const h2 = hash33(h1);
      const toggle = Math.floor(h2[0] * 2.0);
      const radiusVal = 0.5 + h2[2] * (2.0 - 0.5);
      this.ballParams.push({ st, dtFactor, baseScale, toggle, radius: radiusVal });
    }

    this.mouseBallPos = { x: 0, y: 0 };
    this.pointerInside = false;
    this.pointerX = 0;
    this.pointerY = 0;
  }

  setupEventListeners() {
    this.handleResize = this.resize.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerEnter = this.onPointerEnter.bind(this);
    this.handlePointerLeave = this.onPointerLeave.bind(this);

    window.addEventListener("resize", this.handleResize);
    this.container.addEventListener("pointermove", this.handlePointerMove);
    this.container.addEventListener("pointerenter", this.handlePointerEnter);
    this.container.addEventListener("pointerleave", this.handlePointerLeave);
  }

  resize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.renderer.gl.canvas.style.width = width + "px";
    this.renderer.gl.canvas.style.height = height + "px";
    this.program.uniforms.iResolution.value.set(this.renderer.gl.canvas.width, this.renderer.gl.canvas.height, 0);
  }

  onPointerMove(e) {
    if (!this.options.enableMouseInteraction) return;
    const rect = this.container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    this.pointerX = (px / rect.width) * this.renderer.gl.canvas.width;
    this.pointerY = (1 - py / rect.height) * this.renderer.gl.canvas.height;
  }

  onPointerEnter() {
    if (!this.options.enableMouseInteraction) return;
    this.pointerInside = true;
  }

  onPointerLeave() {
    if (!this.options.enableMouseInteraction) return;
    this.pointerInside = false;
  }

  startAnimation() {
    this.startTime = performance.now();
    this.animate();
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    const elapsed = (performance.now() - this.startTime) * 0.001;
    this.program.uniforms.iTime.value = elapsed;

    const effectiveBallCount = Math.min(this.options.ballCount, 50);
    for (let i = 0; i < effectiveBallCount; i++) {
      const p = this.ballParams[i];
      const dt = elapsed * this.options.speed * p.dtFactor;
      const th = p.st + dt;
      const x = Math.cos(th);
      const y = Math.sin(th + dt * p.toggle);
      const posX = x * p.baseScale * this.options.clumpFactor;
      const posY = y * p.baseScale * this.options.clumpFactor;
      this.metaBallsUniform[i].set(posX, posY, p.radius);
    }

    let targetX, targetY;
    if (this.pointerInside) {
      targetX = this.pointerX;
      targetY = this.pointerY;
    } else {
      const cx = this.renderer.gl.canvas.width * 0.5;
      const cy = this.renderer.gl.canvas.height * 0.5;
      const rx = this.renderer.gl.canvas.width * 0.15;
      const ry = this.renderer.gl.canvas.height * 0.15;
      targetX = cx + Math.cos(elapsed * this.options.speed) * rx;
      targetY = cy + Math.sin(elapsed * this.options.speed) * ry;
    }
    this.mouseBallPos.x += (targetX - this.mouseBallPos.x) * this.options.hoverSmoothness;
    this.mouseBallPos.y += (targetY - this.mouseBallPos.y) * this.options.hoverSmoothness;
    this.program.uniforms.iMouse.value.set(this.mouseBallPos.x, this.mouseBallPos.y, 0);

    this.renderer.render({ scene: this.scene, camera: this.camera });
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener("resize", this.handleResize);
    this.container.removeEventListener("pointermove", this.handlePointerMove);
    this.container.removeEventListener("pointerenter", this.handlePointerEnter);
    this.container.removeEventListener("pointerleave", this.handlePointerLeave);
    
    if (this.container && this.renderer.gl.canvas) {
      this.container.removeChild(this.renderer.gl.canvas);
    }
    
    this.renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

export default MetaBalls;