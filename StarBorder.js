class StarBorder {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      color: options.color || "#cebf9f",
      speed: options.speed || "5s",
      thickness: options.thickness || 1,
      ...options
    };
    
    this.init();
  }

  init() {
    if (!this.element) return;

    // Add classes and setup structure
    this.element.classList.add('star-border-container');
    this.element.style.padding = `${this.options.thickness}px 0`;
    
    // Store original content
    const originalContent = this.element.innerHTML;
    
    // Create new structure
    this.element.innerHTML = `
      <div class="border-gradient-bottom" style="background: radial-gradient(circle, ${this.options.color}, transparent 10%); animation-duration: ${this.options.speed};"></div>
      <div class="border-gradient-top" style="background: radial-gradient(circle, ${this.options.color}, transparent 10%); animation-duration: ${this.options.speed};"></div>
      <div class="inner-content">${originalContent}</div>
    `;
  }

  updateColor(color) {
    this.options.color = color;
    const bottomGradient = this.element.querySelector('.border-gradient-bottom');
    const topGradient = this.element.querySelector('.border-gradient-top');
    
    if (bottomGradient && topGradient) {
      const gradientStyle = `radial-gradient(circle, ${color}, transparent 10%)`;
      bottomGradient.style.background = gradientStyle;
      topGradient.style.background = gradientStyle;
    }
  }

  updateSpeed(speed) {
    this.options.speed = speed;
    const bottomGradient = this.element.querySelector('.border-gradient-bottom');
    const topGradient = this.element.querySelector('.border-gradient-top');
    
    if (bottomGradient && topGradient) {
      bottomGradient.style.animationDuration = speed;
      topGradient.style.animationDuration = speed;
    }
  }

  destroy() {
    // Remove classes and restore original structure if needed
    this.element.classList.remove('star-border-container');
  }
}

export default StarBorder;

// Tornar disponível globalmente
window.StarBorder = StarBorder;