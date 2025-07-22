// Usando GSAP via CDN (global gsap)

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "255, 215, 0"; // Gold color to match theme
const MOBILE_BREAKPOINT = 768;

const cardData = [
  {
    color: "rgba(0, 0, 0, 0.6)",
    title: "Gin",
    description: "Premium gin brands",
    label: "Spirits",
    backgroundImage: "public/gin.jpg",
    bottleImage: "public/gin.png"
  },
  {
    color: "rgba(0, 0, 0, 0.6)",
    title: "Vodka",
    description: "Vodka importada premium",
    label: "Importada",
    backgroundImage: "public/vodka.jpg",
    bottleImage: "public/vodka.png"
  },
  {
    color: "rgba(0, 0, 0, 0.6)",
    title: "Whisky",
    description: "Selection of fine whiskies",
    label: "Premium",
    backgroundImage: "public/whisky.jpg",
    bottleImage: "public/whisky.png"
  },
  {
    color: "rgba(0, 0, 0, 0.6)",
    title: "Espumante",
    description: "Champagne and sparkling wines",
    label: "Celebração",
    backgroundImage: "public/espumante.jpg",
    bottleImage: "public/espumante.png"
  },
  {
    color: "rgba(0, 0, 0, 0.6)",
    title: "Energéticos",
    description: "Red Bull and energy drinks",
    label: "Energia",
    backgroundImage: "public/energeticos.jpg",
    bottleImage: "public/energeticos.png"
  },
  {
    color: "rgba(0, 0, 0, 0.6)",
    title: "Cerveja",
    description: "Cervejas artesanais e importadas",
    label: "Cerveja",
    backgroundImage: "public/cerveja.jpg",
    bottleImage: "public/cerveja.png"
  },
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

class ParticleCard {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      particleCount: options.particleCount || DEFAULT_PARTICLE_COUNT,
      glowColor: options.glowColor || DEFAULT_GLOW_COLOR,
      enableTilt: options.enableTilt || true,
      clickEffect: options.clickEffect || false,
      enableMagnetism: options.enableMagnetism || false,
      disableAnimations: options.disableAnimations || false,
    };
    
    this.particlesRef = [];
    this.timeoutsRef = [];
    this.isHovered = false;
    this.memoizedParticles = [];
    this.particlesInitialized = false;
    this.magnetismAnimation = null;
    
    this.init();
  }

  init() {
    if (this.options.disableAnimations) return;
    
    this.element.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
    this.element.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    this.element.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.element.addEventListener("click", this.handleClick.bind(this));
  }

  initializeParticles() {
    if (this.particlesInitialized || !this.element) return;

    const { width, height } = this.element.getBoundingClientRect();
    this.memoizedParticles = Array.from({ length: this.options.particleCount }, () =>
      createParticleElement(
        Math.random() * width,
        Math.random() * height,
        this.options.glowColor
      )
    );
    this.particlesInitialized = true;
  }

  clearAllParticles() {
    this.timeoutsRef.forEach(clearTimeout);
    this.timeoutsRef = [];
    this.magnetismAnimation?.kill();

    this.particlesRef.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    this.particlesRef = [];
  }

  animateParticles() {
    if (!this.element || !this.isHovered) return;

    if (!this.particlesInitialized) {
      this.initializeParticles();
    }

    this.memoizedParticles.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!this.isHovered || !this.element) return;

        const clone = particle.cloneNode(true);
        this.element.appendChild(clone);
        this.particlesRef.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 100);

      this.timeoutsRef.push(timeoutId);
    });
  }

  handleMouseEnter() {
    this.isHovered = true;
    this.animateParticles();

    if (this.options.enableTilt) {
      gsap.to(this.element, {
        rotateX: 5,
        rotateY: 5,
        duration: 0.3,
        ease: "power2.out",
        transformPerspective: 1000,
      });
    }
  }

  handleMouseLeave() {
    this.isHovered = false;
    this.clearAllParticles();

    if (this.options.enableTilt) {
      gsap.to(this.element, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (this.options.enableMagnetism) {
      gsap.to(this.element, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }

  handleMouseMove(e) {
    if (!this.options.enableTilt && !this.options.enableMagnetism) return;

    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (this.options.enableTilt) {
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(this.element, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: "power2.out",
        transformPerspective: 1000,
      });
    }

    if (this.options.enableMagnetism) {
      const magnetX = (x - centerX) * 0.05;
      const magnetY = (y - centerY) * 0.05;

      this.magnetismAnimation = gsap.to(this.element, {
        x: magnetX,
        y: magnetY,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }

  handleClick(e) {
    if (!this.options.clickEffect) return;

    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    const ripple = document.createElement("div");
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(${this.options.glowColor}, 0.4) 0%, rgba(${this.options.glowColor}, 0.2) 30%, transparent 70%);
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 1000;
    `;

    this.element.appendChild(ripple);

    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 1 },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => ripple.remove(),
      }
    );
  }

  destroy() {
    this.isHovered = false;
    this.clearAllParticles();
    this.element.removeEventListener("mouseenter", this.handleMouseEnter);
    this.element.removeEventListener("mouseleave", this.handleMouseLeave);
    this.element.removeEventListener("mousemove", this.handleMouseMove);
    this.element.removeEventListener("click", this.handleClick);
  }
}

class GlobalSpotlight {
  constructor(gridElement, options = {}) {
    this.gridElement = gridElement;
    this.options = {
      disableAnimations: options.disableAnimations || false,
      enabled: options.enabled !== false,
      spotlightRadius: options.spotlightRadius || DEFAULT_SPOTLIGHT_RADIUS,
      glowColor: options.glowColor || DEFAULT_GLOW_COLOR,
    };
    
    this.spotlightRef = null;
    this.isInsideSection = false;
    
    this.init();
  }

  init() {
    if (this.options.disableAnimations || !this.gridElement || !this.options.enabled) return;

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${this.options.glowColor}, 0.15) 0%,
        rgba(${this.options.glowColor}, 0.08) 15%,
        rgba(${this.options.glowColor}, 0.04) 25%,
        rgba(${this.options.glowColor}, 0.02) 40%,
        rgba(${this.options.glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    this.spotlightRef = spotlight;

    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
  }

  handleMouseMove(e) {
    if (!this.spotlightRef || !this.gridElement) return;

    const section = this.gridElement.closest(".bento-section");
    const rect = section?.getBoundingClientRect();
    const mouseInside =
      rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    this.isInsideSection = mouseInside || false;
    const cards = this.gridElement.querySelectorAll(".card");

    if (!mouseInside) {
      gsap.to(this.spotlightRef, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
      cards.forEach((card) => {
        card.style.setProperty("--glow-intensity", "0");
      });
      return;
    }

    const { proximity, fadeDistance } = calculateSpotlightValues(this.options.spotlightRadius);
    let minDistance = Infinity;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      const distance =
        Math.hypot(e.clientX - centerX, e.clientY - centerY) -
        Math.max(cardRect.width, cardRect.height) / 2;
      const effectiveDistance = Math.max(0, distance);

      minDistance = Math.min(minDistance, effectiveDistance);

      let glowIntensity = 0;
      if (effectiveDistance <= proximity) {
        glowIntensity = 1;
      } else if (effectiveDistance <= fadeDistance) {
        glowIntensity =
          (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
      }

      updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, this.options.spotlightRadius);
    });

    gsap.to(this.spotlightRef, {
      left: e.clientX,
      top: e.clientY,
      duration: 0.1,
      ease: "power2.out",
    });

    const targetOpacity =
      minDistance <= proximity
        ? 0.8
        : minDistance <= fadeDistance
        ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
        : 0;

    gsap.to(this.spotlightRef, {
      opacity: targetOpacity,
      duration: targetOpacity > 0 ? 0.2 : 0.5,
      ease: "power2.out",
    });
  }

  handleMouseLeave() {
    this.isInsideSection = false;
    this.gridElement?.querySelectorAll(".card").forEach((card) => {
      card.style.setProperty("--glow-intensity", "0");
    });
    if (this.spotlightRef) {
      gsap.to(this.spotlightRef, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }

  destroy() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseleave", this.handleMouseLeave);
    this.spotlightRef?.parentNode?.removeChild(this.spotlightRef);
  }
}

class MagicBento {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      textAutoHide: options.textAutoHide !== false,
      enableStars: options.enableStars !== false,
      enableSpotlight: options.enableSpotlight !== false,
      enableBorderGlow: options.enableBorderGlow !== false,
      disableAnimations: options.disableAnimations || false,
      spotlightRadius: options.spotlightRadius || DEFAULT_SPOTLIGHT_RADIUS,
      particleCount: options.particleCount || DEFAULT_PARTICLE_COUNT,
      enableTilt: options.enableTilt || false,
      glowColor: options.glowColor || DEFAULT_GLOW_COLOR,
      clickEffect: options.clickEffect !== false,
      enableMagnetism: options.enableMagnetism !== false,
    };
    
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.shouldDisableAnimations = this.options.disableAnimations || this.isMobile;
    this.gridElement = null;
    this.spotlight = null;
    this.particleCards = [];
    
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    // Create grid container
    this.gridElement = document.createElement("div");
    this.gridElement.className = "card-grid bento-section";
    
    // Create cards
    cardData.forEach((card, index) => {
      const cardElement = document.createElement("div");
      const baseClassName = `card ${this.options.textAutoHide ? "card--text-autohide" : ""} ${this.options.enableBorderGlow ? "card--border-glow" : ""}`;
      cardElement.className = baseClassName;
      cardElement.style.backgroundColor = card.color;
      cardElement.style.setProperty("--glow-color", this.options.glowColor);
      
      cardElement.innerHTML = `
        <div class="card__background" style="background-image: url('${card.backgroundImage}')"></div>
        <img src="${card.bottleImage}" alt="${card.title}" class="card__bottle" />
        <div class="card__category">${card.title}</div>
      `;
      
      this.gridElement.appendChild(cardElement);
      
      // Add particle effect if enabled
      if (this.options.enableStars) {
        const particleCard = new ParticleCard(cardElement, {
          disableAnimations: this.shouldDisableAnimations,
          particleCount: this.options.particleCount,
          glowColor: this.options.glowColor,
          enableTilt: this.options.enableTilt,
          clickEffect: this.options.clickEffect,
          enableMagnetism: this.options.enableMagnetism,
        });
        this.particleCards.push(particleCard);
      } else {
        // Apply tilt and magnetism effects even without particles
        this.setupCardEffects(cardElement);
      }
    });
    
    this.container.appendChild(this.gridElement);
    
    // Initialize spotlight
    if (this.options.enableSpotlight) {
      this.spotlight = new GlobalSpotlight(this.gridElement, {
        disableAnimations: this.shouldDisableAnimations,
        enabled: this.options.enableSpotlight,
        spotlightRadius: this.options.spotlightRadius,
        glowColor: this.options.glowColor,
      });
    }
  }

  setupCardEffects(cardElement) {
    if (this.shouldDisableAnimations) return;

    const handleMouseMove = (e) => {
      if (!this.options.enableTilt && !this.options.enableMagnetism) return;

      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (this.options.enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(cardElement, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }

      if (this.options.enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        gsap.to(cardElement, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseLeave = () => {
      if (this.options.enableTilt) {
        gsap.to(cardElement, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      if (this.options.enableMagnetism) {
        gsap.to(cardElement, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleClick = (e) => {
      if (!this.options.clickEffect) return;

      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${this.options.glowColor}, 0.4) 0%, rgba(${this.options.glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      cardElement.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        }
      );
    };

    cardElement.addEventListener("mousemove", handleMouseMove);
    cardElement.addEventListener("mouseleave", handleMouseLeave);
    cardElement.addEventListener("click", handleClick);
  }

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    
    if (wasMobile !== this.isMobile) {
      this.shouldDisableAnimations = this.options.disableAnimations || this.isMobile;
    }
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    this.particleCards.forEach(card => card.destroy());
    this.spotlight?.destroy();
    this.container.removeChild(this.gridElement);
  }
}

export default MagicBento;

// Tornar disponível globalmente
window.MagicBento = MagicBento;