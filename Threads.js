// Threads effect usando Three.js (adaptado do ReactBits)

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;
varying vec2 vUv;

#define PI 3.1415926538

const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float pixelSize = pixel(1.0, iResolution.xy);
    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixelSize * blur),
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixelSize * blur),
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void main() {
    vec2 uv = vUv;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    gl_FragColor = vec4(uColor * colorVal, colorVal);
}
`;

class Threads {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      color: options.color || [0.753, 0.749, 0.624], // #cebf9f convertido para RGB 0-1
      amplitude: options.amplitude || 1,
      distance: options.distance || 0,
      enableMouseInteraction: options.enableMouseInteraction !== false,
      ...options
    };

    this.currentMouse = [0.5, 0.5];
    this.targetMouse = [0.5, 0.5];
    this.animationFrameId = null;

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
    this.renderer.setClearColor(0x000000, 0);
    
    this.container.appendChild(this.renderer.domElement);

    // Create shader uniforms
    this.uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Vector3(...this.options.color) },
      uAmplitude: { value: this.options.amplitude },
      uDistance: { value: this.options.distance },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.NormalBlending
    });

    // Create plane geometry
    this.geometry = new THREE.PlaneGeometry(2, 2);
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // Bind event handlers
    this.handleResize = this.resize.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleMouseLeave = this.onMouseLeave.bind(this);

    this.setupEventListeners();
    this.resize();
    this.startAnimation();
  }

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize);
    
    if (this.options.enableMouseInteraction) {
      this.container.addEventListener("mousemove", this.handleMouseMove);
      this.container.addEventListener("mouseleave", this.handleMouseLeave);
    }
  }

  resize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.renderer.setSize(width, height);
    this.uniforms.iResolution.value.set(width, height, width / height);
  }

  onMouseMove(e) {
    if (!this.options.enableMouseInteraction) return;
    const rect = this.container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    this.targetMouse = [x, y];
  }

  onMouseLeave() {
    if (!this.options.enableMouseInteraction) return;
    this.targetMouse = [0.5, 0.5];
  }

  startAnimation() {
    this.startTime = performance.now();
    this.animate();
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    const elapsed = performance.now() - this.startTime;
    this.uniforms.iTime.value = elapsed * 0.001;

    // Smooth mouse interpolation
    if (this.options.enableMouseInteraction) {
      const smoothing = 0.05;
      this.currentMouse[0] += smoothing * (this.targetMouse[0] - this.currentMouse[0]);
      this.currentMouse[1] += smoothing * (this.targetMouse[1] - this.currentMouse[1]);
      this.uniforms.uMouse.value.set(this.currentMouse[0], this.currentMouse[1]);
    } else {
      this.uniforms.uMouse.value.set(0.5, 0.5);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateOptions(newOptions) {
    Object.assign(this.options, newOptions);
    
    if (newOptions.color) {
      this.uniforms.uColor.value.set(...newOptions.color);
    }
    if (newOptions.amplitude !== undefined) {
      this.uniforms.uAmplitude.value = newOptions.amplitude;
    }
    if (newOptions.distance !== undefined) {
      this.uniforms.uDistance.value = newOptions.distance;
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener("resize", this.handleResize);
    
    if (this.options.enableMouseInteraction) {
      this.container.removeEventListener("mousemove", this.handleMouseMove);
      this.container.removeEventListener("mouseleave", this.handleMouseLeave);
    }
    
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export default Threads;

// Tornar disponível globalmente
window.Threads = Threads;