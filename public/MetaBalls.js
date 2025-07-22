// MetaBalls usando Three.js

function parseHexColor(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return [r, g, b];
}

// Shaders GLSL compatíveis com Three.js
const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
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
varying vec2 vUv;

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
    
    if (enableTransparency) {
        gl_FragColor = vec4(cFinal, f);
    } else {
        gl_FragColor = vec4(cFinal, 1.0);
    }
}
`;

class MetaBalls {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      color: options.color || "#cebf9f",
      cursorBallColor: options.cursorBallColor || "#e6d5b7", 
      cursorBallSize: options.cursorBallSize || 4,
      ballCount: Math.min(options.ballCount || 12, 50),
      animationSize: options.animationSize || 25,
      enableMouseInteraction: options.enableMouseInteraction !== false,
      enableTransparency: options.enableTransparency !== false,
      hoverSmoothness: options.hoverSmoothness || 0.02,
      clumpFactor: options.clumpFactor || 0.8,
      speed: options.speed || 0.2,
    };

    this.init();
  }

  init() {
    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: false 
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    this.container.appendChild(this.renderer.domElement);

    // Parse colors
    const [cr, cg, cb] = parseHexColor(this.options.color);
    const [ccr, ccg, ccb] = parseHexColor(this.options.cursorBallColor);

    // Create shader uniforms
    this.uniforms = {
      iResolution: { value: new THREE.Vector3() },
      iTime: { value: 0 },
      iMouse: { value: new THREE.Vector3() },
      iColor: { value: new THREE.Vector3(cr, cg, cb) },
      iCursorColor: { value: new THREE.Vector3(ccr, ccg, ccb) },
      iAnimationSize: { value: this.options.animationSize },
      iBallCount: { value: this.options.ballCount },
      iCursorBallSize: { value: this.options.cursorBallSize },
      iMetaBalls: { value: [] },
      iClumpFactor: { value: this.options.clumpFactor },
      enableTransparency: { value: this.options.enableTransparency }
    };

    // Initialize metaballs array
    for (let i = 0; i < 50; i++) {
      this.uniforms.iMetaBalls.value.push(new THREE.Vector3());
    }

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: this.options.enableTransparency,
      blending: THREE.NormalBlending
    });

    // Create plane geometry
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // Initialize ball parameters
    this.ballParams = [];
    for (let i = 0; i < this.options.ballCount; i++) {
      const p = hash31(i);
      this.ballParams.push({
        st: p[0] * Math.PI * 2,
        dtFactor: 0.3 + p[1] * 0.7,
        baseScale: 0.8 + p[2] * 0.4,
        radius: 3.2 + p[0] * 2.8,
        toggle: p[1] > 0.5 ? 1 : -1
      });
    }

    // Mouse state
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerInside = false;
    this.mouseBallPos = { x: 0, y: 0 };

    // Bind event handlers
    this.handleResize = this.resize.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerEnter = this.onPointerEnter.bind(this);
    this.handlePointerLeave = this.onPointerLeave.bind(this);

    this.setupEventListeners();
    this.resize();
    this.startAnimation();
  }

  setupEventListeners() {
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
    this.uniforms.iResolution.value.set(width, height, 0);
  }

  onPointerMove(e) {
    if (!this.options.enableMouseInteraction) return;
    const rect = this.container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    this.pointerX = px;
    this.pointerY = rect.height - py; // Flip Y coordinate
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
    this.uniforms.iTime.value = elapsed;

    // Update metaballs positions
    const effectiveBallCount = Math.min(this.options.ballCount, 50);
    for (let i = 0; i < effectiveBallCount; i++) {
      const p = this.ballParams[i];
      const dt = elapsed * this.options.speed * p.dtFactor;
      const th = p.st + dt;
      const x = Math.cos(th);
      const y = Math.sin(th + dt * p.toggle);
      const posX = x * p.baseScale * this.options.clumpFactor;
      const posY = y * p.baseScale * this.options.clumpFactor;
      this.uniforms.iMetaBalls.value[i].set(posX, posY, p.radius);
    }

    // Update mouse ball
    let targetX, targetY;
    if (this.pointerInside) {
      targetX = this.pointerX;
      targetY = this.pointerY;
    } else {
      const rect = this.container.getBoundingClientRect();
      const cx = rect.width * 0.5;
      const cy = rect.height * 0.5;
      const rx = rect.width * 0.15;
      const ry = rect.height * 0.15;
      targetX = cx + Math.cos(elapsed * this.options.speed) * rx;
      targetY = cy + Math.sin(elapsed * this.options.speed) * ry;
    }
    
    this.mouseBallPos.x += (targetX - this.mouseBallPos.x) * this.options.hoverSmoothness;
    this.mouseBallPos.y += (targetY - this.mouseBallPos.y) * this.options.hoverSmoothness;
    this.uniforms.iMouse.value.set(this.mouseBallPos.x, this.mouseBallPos.y, 0);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener("resize", this.handleResize);
    this.container.removeEventListener("pointermove", this.handlePointerMove);
    this.container.removeEventListener("pointerenter", this.handlePointerEnter);
    this.container.removeEventListener("pointerleave", this.handlePointerLeave);
    
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

// Hash functions para randomização consistente
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

export default MetaBalls;

// Tornar disponível globalmente
window.MetaBalls = MetaBalls;