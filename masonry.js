// GSAP é carregado via CDN globalmente

class MasonryGallery {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      items: [],
      gap: 10,
      columns: {
        default: 1,
        600: 2,
        900: 3, 
        1200: 4,
        1500: 5
      },
      animation: {
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.02,
        from: "bottom"
      },
      hover: {
        enabled: true,
        scale: 0.95
      },
      ...options
    };

    this.currentColumns = 1;
    this.containerWidth = 0;
    this.isReady = false;
    this.items = [];
    this.resizeObserver = null;

    this.init();
  }

  init() {
    this.setupContainer();
    this.calculateColumns();
    this.setupResizeObserver();
    this.preloadImages().then(() => {
      this.isReady = true;
      this.render();
    });
  }

  setupContainer() {
    this.container.className = 'masonry-list';
    this.container.innerHTML = '';
  }

  calculateColumns() {
    const width = this.container.offsetWidth;
    this.containerWidth = width;
    
    const breakpoints = Object.keys(this.options.columns)
      .map(key => parseInt(key))
      .filter(key => !isNaN(key))
      .sort((a, b) => b - a);

    this.currentColumns = this.options.columns.default;
    
    for (const breakpoint of breakpoints) {
      if (width >= breakpoint) {
        this.currentColumns = this.options.columns[breakpoint];
        break;
      }
    }
  }

  setupResizeObserver() {
    let timeoutId;
    
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const oldColumns = this.currentColumns;
        this.calculateColumns();
        
        if (oldColumns !== this.currentColumns && this.isReady) {
          this.render();
        }
      }, 100);
    });
    
    this.resizeObserver.observe(this.container);
  }

  async preloadImages() {
    // Skip preloading, let browser handle lazy loading
    return Promise.resolve();
  }

  calculateLayout() {
    const gap = this.options.gap;
    const containerWidth = this.containerWidth;
    const columns = this.currentColumns;
    
    const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;
    const columnHeights = new Array(columns).fill(0);
    
    const layout = this.options.items.map((item, index) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      
      const x = shortestColumn * (itemWidth + gap);
      const y = columnHeights[shortestColumn];
      
      // Calculate height based on aspect ratio
      const aspectRatio = item.height / 600; // Assuming 600px base width
      const height = itemWidth * aspectRatio;
      
      columnHeights[shortestColumn] += height + gap;
      
      return {
        ...item,
        x,
        y,
        width: itemWidth,
        height,
        index
      };
    });
    
    // Set container height
    const maxHeight = Math.max(...columnHeights);
    this.container.style.height = `${maxHeight}px`;
    
    return layout;
  }

  createItem(itemData) {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    item.setAttribute('data-id', itemData.id);
    
    const image = document.createElement('img');
    image.className = 'masonry-item-image';
    image.src = itemData.img;
    image.loading = 'lazy';
    image.alt = `Gallery image ${itemData.id}`;
    
    item.appendChild(image);
    
    // Position and size
    item.style.left = `${itemData.x}px`;
    item.style.top = `${itemData.y}px`;
    item.style.width = `${itemData.width}px`;
    item.style.height = `${itemData.height}px`;
    
    // Click handler
    item.addEventListener('click', () => {
      if (itemData.url && itemData.url !== '#') {
        window.open(itemData.url, '_blank');
      }
    });
    
    // Hover handlers para garantir que o scale funcione
    item.addEventListener('mouseenter', () => {
      gsap.to(item, {
        scale: 0.95,
        duration: 0.5,
        ease: "power2.out"
      });
    });
    
    item.addEventListener('mouseleave', () => {
      gsap.to(item, {
        scale: 1,
        duration: 0.5,
        ease: "power2.out"
      });
    });
    
    return item;
  }

  animateItems() {
    const items = this.container.querySelectorAll('.masonry-item');
    
    // Set initial state - mais baixo para efeito mais dramático
    gsap.set(items, {
      opacity: 0,
      y: 100,
      filter: 'blur(10px)',
      scale: 0.8
    });
    
    // Usar Intersection Observer para animar quando chegar na seção
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animar cada item imediatamente
          items.forEach((item, index) => {
            gsap.to(item, {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              scale: 1,
              duration: this.options.animation.duration,
              ease: this.options.animation.ease,
              delay: index * this.options.animation.stagger
            });
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    observer.observe(this.container);
  }

  render() {
    if (!this.isReady) return;
    
    const layout = this.calculateLayout();
    this.container.innerHTML = '';
    
    layout.forEach(itemData => {
      const item = this.createItem(itemData);
      this.container.appendChild(item);
    });
    
    this.animateItems();
  }

  updateItems(newItems) {
    this.options.items = newItems;
    this.isReady = false;
    
    this.preloadImages().then(() => {
      this.isReady = true;
      this.render();
    });
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.container.innerHTML = '';
  }
}

window.MasonryGallery = MasonryGallery;