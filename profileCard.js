const DEFAULT_BEHIND_GRADIENT = "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(39,100%,50%,var(--card-opacity)) 4%,hsla(42,80%,60%,calc(var(--card-opacity)*0.75)) 10%,hsla(45,60%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(48,30%,40%,0) 100%),radial-gradient(35% 52% at 55% 20%,#c0822980 0%,#cebf9f00 100%),radial-gradient(100% 100% at 50% 50%,#c08229ff 1%,#1a1a1a00 76%),conic-gradient(from 124deg at 50% 50%,#c08229ff 0%,#cebf9fff 40%,#cebf9fff 60%,#c08229ff 100%)";

const DEFAULT_INNER_GRADIENT = "linear-gradient(145deg,#1a1a1a 0%,#2d2d2d 100%)";

const ANIMATION_CONFIG = {
  SMOOTH_DURATION: 600,
  INITIAL_DURATION: 1500,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
};

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const round = (value, precision = 3) => parseFloat(value.toFixed(precision));
const adjust = (value, fromMin, fromMax, toMin, toMax) => round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));
const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

class ProfileCard {
  constructor(options = {}) {
    this.options = {
      avatarUrl: "",
      miniAvatarUrl: "",
      name: "Artist Name",
      title: "Electronic Artist",
      handle: "artist",
      status: "Live",
      contactText: "Listen",
      showUserInfo: true,
      enableTilt: true,
      behindGradient: DEFAULT_BEHIND_GRADIENT,
      innerGradient: DEFAULT_INNER_GRADIENT,
      showBehindGradient: true,
      onContactClick: null,
      ...options
    };

    this.rafId = null;
    this.element = null;
    this.cardElement = null;
    this.wrapElement = null;
  }

  updateCardTransform(offsetX, offsetY, card, wrap) {
    const width = card.clientWidth;
    const height = card.clientHeight;

    const percentX = clamp((100 / width) * offsetX);
    const percentY = clamp((100 / height) * offsetY);

    const centerX = percentX - 50;
    const centerY = percentY - 50;

    const properties = {
      "--pointer-x": `${percentX}%`,
      "--pointer-y": `${percentY}%`,
      "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
      "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
      "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
      "--pointer-from-top": `${percentY / 100}`,
      "--pointer-from-left": `${percentX / 100}`,
      "--rotate-x": `${round(-(centerX / 3))}deg`,
      "--rotate-y": `${round(centerY / 2.5)}deg`,
    };

    Object.entries(properties).forEach(([property, value]) => {
      wrap.style.setProperty(property, value);
    });
  }

  createSmoothAnimation(duration, startX, startY, card, wrap) {
    const startTime = performance.now();
    const targetX = wrap.clientWidth / 2;
    const targetY = wrap.clientHeight / 2;

    const animationLoop = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = clamp(elapsed / duration);
      const easedProgress = easeInOutCubic(progress);

      const currentX = adjust(easedProgress, 0, 1, startX, targetX);
      const currentY = adjust(easedProgress, 0, 1, startY, targetY);

      this.updateCardTransform(currentX, currentY, card, wrap);

      if (progress < 1) {
        this.rafId = requestAnimationFrame(animationLoop);
      }
    };

    this.rafId = requestAnimationFrame(animationLoop);
  }

  cancelAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  handlePointerMove = (event) => {
    const card = this.cardElement;
    const wrap = this.wrapElement;

    if (!card || !wrap || !this.options.enableTilt) return;

    const rect = card.getBoundingClientRect();
    this.updateCardTransform(
      event.clientX - rect.left,
      event.clientY - rect.top,
      card,
      wrap
    );
  };

  handlePointerEnter = () => {
    const card = this.cardElement;
    const wrap = this.wrapElement;

    if (!card || !wrap || !this.options.enableTilt) return;

    this.cancelAnimation();
    wrap.classList.add("active");
    card.classList.add("active");
  };

  handlePointerLeave = (event) => {
    const card = this.cardElement;
    const wrap = this.wrapElement;

    if (!card || !wrap || !this.options.enableTilt) return;

    this.createSmoothAnimation(
      ANIMATION_CONFIG.SMOOTH_DURATION,
      event.offsetX,
      event.offsetY,
      card,
      wrap
    );
    wrap.classList.remove("active");
    card.classList.remove("active");
  };

  handleContactClick = () => {
    if (this.options.onContactClick) {
      this.options.onContactClick();
    }
  };

  createElement() {
    const cardStyle = {
      "--icon": "none",
      "--grain": "none",
      "--behind-gradient": this.options.showBehindGradient ? this.options.behindGradient : "none",
      "--inner-gradient": this.options.innerGradient,
    };

    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'pc-card-wrapper';
    Object.entries(cardStyle).forEach(([property, value]) => {
      wrapperDiv.style.setProperty(property, value);
    });

    wrapperDiv.innerHTML = `
      <section class="pc-card">
        <div class="pc-inside">
          <div class="pc-shine"></div>
          <div class="pc-glare"></div>
          <div class="pc-content pc-avatar-content">
            <img
              class="avatar"
              src="${this.options.avatarUrl}"
              alt="${this.options.name} avatar"
              loading="lazy"
            />
            ${this.options.showUserInfo ? `
              <div class="pc-user-info">
                <div class="pc-user-details">
                  <div class="pc-mini-avatar">
                    <img
                      src="${this.options.miniAvatarUrl || this.options.avatarUrl}"
                      alt="${this.options.name} mini avatar"
                      loading="lazy"
                    />
                  </div>
                  <div class="pc-user-text">
                    <div class="pc-handle">@${this.options.handle}</div>
                    <div class="pc-status">${this.options.status}</div>
                  </div>
                </div>
                <button class="pc-contact-btn" type="button">
                  ${this.options.contactText}
                </button>
              </div>
            ` : ''}
          </div>
          <div class="pc-content">
            <div class="pc-details">
              <h3>${this.options.name}</h3>
              <p>${this.options.title}</p>
            </div>
          </div>
        </div>
      </section>
    `;

    this.element = wrapperDiv;
    this.wrapElement = wrapperDiv;
    this.cardElement = wrapperDiv.querySelector('.pc-card');

    this.setupEventListeners();
    this.initializeAnimation();

    return wrapperDiv;
  }

  setupEventListeners() {
    const card = this.cardElement;
    const contactBtn = this.element.querySelector('.pc-contact-btn');

    if (this.options.enableTilt) {
      card.addEventListener("pointerenter", this.handlePointerEnter);
      card.addEventListener("pointermove", this.handlePointerMove);
      card.addEventListener("pointerleave", this.handlePointerLeave);
    }

    if (contactBtn) {
      contactBtn.addEventListener('click', this.handleContactClick);
    }
  }

  initializeAnimation() {
    if (!this.options.enableTilt) return;

    const card = this.cardElement;
    const wrap = this.wrapElement;

    if (!card || !wrap) return;

    const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;

    this.updateCardTransform(initialX, initialY, card, wrap);
    this.createSmoothAnimation(
      ANIMATION_CONFIG.INITIAL_DURATION,
      initialX,
      initialY,
      card,
      wrap
    );
  }

  destroy() {
    this.cancelAnimation();
    
    if (this.cardElement && this.options.enableTilt) {
      this.cardElement.removeEventListener("pointerenter", this.handlePointerEnter);
      this.cardElement.removeEventListener("pointermove", this.handlePointerMove);
      this.cardElement.removeEventListener("pointerleave", this.handlePointerLeave);
    }

    const contactBtn = this.element?.querySelector('.pc-contact-btn');
    if (contactBtn) {
      contactBtn.removeEventListener('click', this.handleContactClick);
    }
  }
}

class ProfileCardGallery {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      artists: [],
      ...options
    };
    this.cards = [];
    this.isReady = false;
    
    this.init();
  }

  init() {
    this.setupContainer();
    this.render();
    this.setupIntersectionObserver();
  }

  setupContainer() {
    this.container.className = 'profile-cards-container';
    this.container.innerHTML = '';
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isReady) {
          this.isReady = true;
          this.animateCards();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(this.container);
  }

  animateCards() {
    const cards = this.container.querySelectorAll('.pc-card-wrapper');
    
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px) scale(0.9)';
      card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      }, index * 100);
    });
  }

  render() {
    this.container.innerHTML = '';
    this.cards = [];

    this.options.artists.forEach(artist => {
      const card = new ProfileCard({
        avatarUrl: artist.image,
        miniAvatarUrl: artist.image,
        name: artist.name,
        title: artist.role,
        handle: artist.handle,
        status: artist.status,
        contactText: artist.contactText || "Listen",
        showUserInfo: true,
        enableTilt: true,
        onContactClick: () => {
          if (artist.url && artist.url !== '#') {
            window.open(artist.url, '_blank');
          }
        }
      });

      const cardElement = card.createElement();
      this.container.appendChild(cardElement);
      this.cards.push(card);
    });
  }

  destroy() {
    this.cards.forEach(card => card.destroy());
    this.cards = [];
  }
}

window.ProfileCard = ProfileCard;
window.ProfileCardGallery = ProfileCardGallery;