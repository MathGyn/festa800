/**
 * UserCardComponent V2
 * Gera cards de usuários idênticos aos dos artistas
 * Reutiliza ProfileCard com configurações personalizadas
 */
class UserCardComponent {
  constructor() {
    this.cardInstance = null;
    this.cardElement = null;
    this.isDestroyed = false;
  }

  /**
   * Cria card de usuário com mesmo visual dos artistas
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.name - Nome do usuário
   * @param {string} userData.imageUrl - URL da imagem processada
   * @param {Object} options - Opções adicionais
   * @returns {HTMLElement} Elemento DOM do card
   */
  createCard(userData, options = {}) {
    if (!userData || !userData.name || !userData.imageUrl) {
      throw new Error('userData deve conter name e imageUrl');
    }

    // Configurações idênticas aos cards dos artistas
    const cardConfig = {
      avatarUrl: userData.imageUrl,
      miniAvatarUrl: userData.imageUrl,
      name: userData.name,
      title: "Festa 800",
      handle: this.generateHandle(userData.name),
      status: "Time Traveler",
      contactText: "Download",
      showUserInfo: true,
      enableTilt: true,
      showBehindGradient: true,
      behindGradient: this.getArtistGradient(),
      innerGradient: this.getInnerGradient(),
      onContactClick: null,
      ...options
    };

    // Criar instância do ProfileCard (mesmo componente dos artistas)
    this.cardInstance = new ProfileCard(cardConfig);
    
    // Gerar elemento DOM wrapper
    const wrapper = this.cardInstance.createElement();
    
    // O cardElement deve ser o wrapper para compatibilidade com captura
    this.cardElement = wrapper;
    
    // Verificar se o card interno foi criado corretamente
    const innerCard = wrapper.querySelector('.pc-card');
    if (!innerCard) {
      console.error('❌ Card interno (.pc-card) não foi criado corretamente');
      throw new Error('Card interno não encontrado após criação');
    }
    
    console.log('✅ Card criado com sucesso:', {
      wrapper: wrapper.className,
      innerCard: innerCard.className,
      hasContent: wrapper.children.length > 0
    });
    
    // Aplicar classes específicas para usuário no wrapper
    this.cardElement.classList.add('user-card');
    this.cardElement.setAttribute('data-user-name', userData.name);

    // Configurar para captura de vídeo
    this.setupForVideoCapture();

    return this.cardElement;
  }

  /**
   * Gera handle baseado no nome do usuário
   * @param {string} name - Nome do usuário
   * @returns {string} Handle formatado
   */
  generateHandle(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 15); // Limita tamanho
  }

  /**
   * Obtém gradiente idêntico aos cards dos artistas
   * @returns {string} CSS gradient
   */
  getArtistGradient() {
    return "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(39,100%,50%,var(--card-opacity)) 4%,hsla(42,80%,60%,calc(var(--card-opacity)*0.75)) 10%,hsla(45,60%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(48,30%,40%,0) 100%),radial-gradient(35% 52% at 55% 20%,#c0822980 0%,#cebf9f00 100%),radial-gradient(100% 100% at 50% 50%,#c08229ff 1%,#1a1a1a00 76%),conic-gradient(from 124deg at 50% 50%,#c08229ff 0%,#cebf9fff 40%,#cebf9fff 60%,#c08229ff 100%)";
  }

  /**
   * Obtém gradiente interno idêntico aos artistas
   * @returns {string} CSS gradient
   */
  getInnerGradient() {
    return "linear-gradient(145deg,#1a1a1a 0%,#2d2d2d 100%)";
  }

  /**
   * Configura card para captura de vídeo (versão simplificada)
   */
  setupForVideoCaptureSimple() {
    try {
      console.log('🎨 Iniciando setupForVideoCaptureSimple...');
      
      if (!this.cardElement) {
        console.warn('⚠️ Card element não encontrado');
        return;
      }

      console.log('🏷️ Preparando classe card-capture-mode...');
      // Remover classe primeiro se já existe
      this.cardElement.classList.remove('card-capture-mode');
      
      // Forçar reflow
      this.cardElement.offsetHeight;
      
      // Adicionar classe específica de captura
      this.cardElement.classList.add('card-capture-mode');

      console.log('🔄 Forçando renderização...');
      // Forçar renderização completa
      this.cardElement.offsetHeight;
      
      // Verificar se a classe foi aplicada
      if (this.cardElement.classList.contains('card-capture-mode')) {
        console.log('✅ Classe card-capture-mode aplicada com sucesso');
      } else {
        console.warn('⚠️ Falha ao aplicar classe card-capture-mode');
      }
      
      console.log('✅ setupForVideoCaptureSimple concluído!');
      
    } catch (error) {
      console.error('❌ Erro em setupForVideoCaptureSimple:', error);
    }
  }

  /**
   * Configura card para captura de vídeo (versão original - mantida para compatibilidade)
   */
  setupForVideoCapture() {
    if (!this.cardElement) return;

    // Adicionar classe específica de captura
    this.cardElement.classList.add('card-capture-mode');

    // Garantir que imagens estejam carregadas
    this.preloadImages();

    // Forçar renderização completa
    this.cardElement.offsetHeight;
    
    // Re-aplicar gradientes e animações se necessário
    this.refreshCardEffects();
  }

  /**
   * Pré-carrega todas as imagens do card
   * @returns {Promise} Promise que resolve quando imagens estão carregadas
   */
  preloadImages() {
    return new Promise((resolve) => {
      try {
        console.log('🖼️ Iniciando preloadImages...');
        
        if (!this.cardElement) {
          console.log('⚠️ Card element não encontrado, pulando preload');
          resolve();
          return;
        }

        const images = this.cardElement.querySelectorAll('img');
        console.log(`📷 Encontradas ${images.length} imagens para preload`);
        
        if (images.length === 0) {
          console.log('✅ Nenhuma imagem para preload');
          resolve();
          return;
        }

        const loadPromises = Array.from(images).map((img, index) => {
          return new Promise((resolveImg) => {
            if (img.complete) {
              console.log(`✅ Imagem ${index + 1} já carregada`);
              resolveImg();
            } else {
              console.log(`⏳ Aguardando imagem ${index + 1}...`);
              
              const timeout = setTimeout(() => {
                console.log(`⏰ Timeout na imagem ${index + 1}`);
                resolveImg();
              }, 2000); // Timeout de 2 segundos por imagem
              
              img.onload = () => {
                clearTimeout(timeout);
                console.log(`✅ Imagem ${index + 1} carregada`);
                resolveImg();
              };
              
              img.onerror = () => {
                clearTimeout(timeout);
                console.log(`❌ Erro ao carregar imagem ${index + 1}`);
                resolveImg(); // Resolver mesmo com erro
              };
            }
          });
        });

        Promise.all(loadPromises).then(() => {
          console.log('✅ Todas as imagens processadas');
          resolve();
        });
        
      } catch (error) {
        console.error('❌ Erro em preloadImages:', error);
        resolve(); // Resolver mesmo com erro para não travar
      }
    });
  }

  /**
   * Força repaint para garantir renderização completa
   */
  forceRepaint() {
    if (!this.cardElement) return;

    const element = this.cardElement;
    element.style.transform = 'translateZ(0)';
    element.offsetHeight; // Força reflow
    
    // Aguardar próximo frame
    requestAnimationFrame(() => {
      element.style.transform = '';
    });
  }

  /**
   * Simula eventos de mouse para animações
   * @param {number} x - Coordenada X relativa ao card
   * @param {number} y - Coordenada Y relativa ao card
   */
  simulateMouseMove(x, y) {
    if (!this.cardElement || this.isDestroyed) return;

    const card = this.cardElement.querySelector('.pc-card');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    
    // Criar evento de mouse realista
    const mouseEvent = new MouseEvent('pointermove', {
      clientX: rect.left + x,
      clientY: rect.top + y,
      bubbles: true,
      cancelable: true,
      view: window
    });

    card.dispatchEvent(mouseEvent);
  }

  /**
   * Ativa hover no card
   */
  activateHover() {
    if (!this.cardElement || this.isDestroyed) return;

    const card = this.cardElement.querySelector('.pc-card');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Evento de entrada
    const enterEvent = new MouseEvent('pointerenter', {
      clientX: rect.left + centerX,
      clientY: rect.top + centerY,
      bubbles: true,
      cancelable: true,
      view: window
    });

    card.dispatchEvent(enterEvent);
  }

  /**
   * Desativa hover no card
   */
  deactivateHover() {
    if (!this.cardElement || this.isDestroyed) return;

    const card = this.cardElement.querySelector('.pc-card');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Evento de saída
    const leaveEvent = new MouseEvent('pointerleave', {
      clientX: rect.left + centerX,
      clientY: rect.top + centerY,
      bubbles: true,
      cancelable: true,
      view: window
    });

    card.dispatchEvent(leaveEvent);
  }

  /**
   * Obtém dimensões do card para captura
   * @returns {Object} Dimensões {width, height}
   */
  getCardDimensions() {
    if (!this.cardElement) return { width: 345, height: 480 };

    const rect = this.cardElement.getBoundingClientRect();
    return {
      width: rect.width || 345,
      height: rect.height || 480
    };
  }

  /**
   * Obtém elemento interno do card para captura
   * @returns {HTMLElement} Elemento do card
   */
  getCardElement() {
    return this.cardElement?.querySelector('.pc-card') || this.cardElement;
  }

  /**
   * Captura imagem estática do card
   * @param {Object} options - Opções de captura
   * @returns {Promise<Blob>} Imagem do card
   */
  async captureStaticImage(options = {}) {
    if (!this.cardElement) {
      throw new Error('Card não foi criado');
    }

    const defaultOptions = {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: 345,
      height: 480,
      foreignObjectRendering: true,
      imageTimeout: 0,
      removeContainer: true,
      ...options
    };

    // Aguardar imagens carregarem
    await this.preloadImages();

    // Forçar renderização
    this.forceRepaint();

    // Aguardar frame
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Capturar com html2canvas
    const canvas = await html2canvas(this.cardElement, defaultOptions);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }

  /**
   * Prepara card para captura de vídeo
   */
  async prepareForCapture() {
    try {
      console.log('🔧 Iniciando prepareForCapture...');
      
      if (!this.cardElement) {
        throw new Error('Card element não disponível para captura');
      }

      console.log('📍 Movendo card para viewport...');
      // Mover para viewport visível
      this.cardElement.scrollIntoView({ 
        behavior: 'instant', 
        block: 'center',
        inline: 'center' 
      });

      console.log('🎨 Aplicando estilos de captura...');
      // Aplicar estilos de captura (versão simplificada)
      this.setupForVideoCaptureSimple();

      console.log('🔄 Forçando reflow...');
      // Forçar reflow e repaint
      this.cardElement.offsetHeight;
      
      console.log('⏳ Aguardando renderização CSS...');
      // Aguardar renderização CSS
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      console.log('🖼️ Precarregando imagens...');
      // Preload todas as imagens
      await this.preloadImages();

      console.log('⏰ Aguardando estabilidade...');
      // Aguardar um pouco mais para garantir estabilidade
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verificar se está realmente visível
      const rect = this.cardElement.getBoundingClientRect();
      const computedStyle = getComputedStyle(this.cardElement);
      const isVisible = rect.width > 0 && rect.height > 0;

      console.log('📏 Verificação final detalhada:', {
        rect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
        offset: { width: this.cardElement.offsetWidth, height: this.cardElement.offsetHeight },
        hasClass: this.cardElement.classList.contains('card-capture-mode'),
        computedStyles: {
          position: computedStyle.position,
          top: computedStyle.top,
          left: computedStyle.left,
          width: computedStyle.width,
          height: computedStyle.height,
          transform: computedStyle.transform,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          display: computedStyle.display
        }
      });

      if (!isVisible) {
        console.warn('⚠️ Card não está visível após preparação, tentando corrigir...');
        
        // Forçar re-aplicação da classe
        this.cardElement.classList.remove('card-capture-mode');
        this.cardElement.offsetHeight; // force reflow
        this.cardElement.classList.add('card-capture-mode');
        this.cardElement.offsetHeight; // force reflow again
        
        // Verificar novamente
        const newRect = this.cardElement.getBoundingClientRect();
        console.log('🔄 Após correção:', {
          width: newRect.width,
          height: newRect.height,
          visible: newRect.width > 0 && newRect.height > 0
        });
      }

      // Log para debug
      console.log('✅ Card posicionado para captura:', {
        dimensions: this.getCardDimensions(),
        position: rect,
        visible: isVisible,
        computedStyles: {
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          transform: computedStyle.transform
        }
      });

      console.log('🎯 prepareForCapture concluído com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro em prepareForCapture:', error);
      throw error;
    }
  }

  // Método positionForCapture removido - usar prepareForCapture()

  /**
   * Limpa recursos e remove card do DOM
   */
  destroy() {
    if (this.isDestroyed) return;

    try {
      // Remover classe de captura
      if (this.cardElement) {
        this.cardElement.classList.remove('card-capture-mode');
      }

      // Remover event listeners se existirem
      if (this.cardElement && this.mouseHandler) {
        this.cardElement.removeEventListener('mousemove', this.mouseHandler);
        this.cardElement.removeEventListener('mouseleave', this.mouseHandler);
      }

      // Remover do DOM se ainda estiver presente
      if (this.cardElement && this.cardElement.parentNode) {
        this.cardElement.parentNode.removeChild(this.cardElement);
      }

      // Limpar referências
      this.cardElement = null;
      this.userPhoto = null;
      this.userData = null;
      this.mouseHandler = null;

      this.isDestroyed = true;
      
      console.log('✅ UserCard destruído com sucesso');
      
    } catch (error) {
      console.error('Erro ao destruir UserCard:', error);
    }
  }

  /**
   * Verifica se card foi destruído
   * @returns {boolean} True se destruído
   */
  isCardDestroyed() {
    return this.isDestroyed;
  }

  /**
   * Obtém instância do ProfileCard para acesso direto
   * @returns {ProfileCard} Instância do ProfileCard
   */
  getProfileCardInstance() {
    return this.cardInstance;
  }

  /**
   * Aplica tema personalizado (opcional)
   * @param {Object} theme - Configurações de tema
   */
  applyCustomTheme(theme = {}) {
    if (!this.cardElement) return;

    const customProps = {
      '--card-bg': theme.backgroundColor || 'var(--inner-gradient)',
      '--card-border': theme.borderColor || 'rgba(192, 130, 41, 0.3)',
      '--card-glow': theme.glowColor || 'rgba(192, 130, 41, 0.5)',
      '--text-primary': theme.textColor || '#cebf9f',
      '--text-secondary': theme.subtextColor || 'rgba(206, 191, 159, 0.8)',
      ...theme.customProperties
    };

    Object.entries(customProps).forEach(([prop, value]) => {
      this.cardElement.style.setProperty(prop, value);
    });
  }

  /**
   * Re-aplica efeitos visuais do card (versão otimizada)
   */
  refreshCardEffects() {
    try {
      console.log('🎨 Iniciando refreshCardEffects...');
      
      if (!this.cardElement) {
        console.warn('⚠️ Card element não encontrado em refreshCardEffects');
        return;
      }

      // Garantir que pseudo-elementos estejam visíveis (sem timeout problemático)
      const existingStyle = document.getElementById('card-capture-style');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'card-capture-style';
        style.textContent = `
          .profile-card::before,
          .profile-card::after {
            opacity: 1 !important;
            visibility: visible !important;
          }
          .card-capture-mode {
            position: relative !important;
            z-index: 999 !important;
          }
        `;
        document.head.appendChild(style);
        console.log('📝 Estilos de captura aplicados');
      }

      // Forçar um reflow simples sem manipulação excessiva
      this.cardElement.offsetHeight;
      
      console.log('✅ refreshCardEffects concluído!');
      
    } catch (error) {
      console.error('❌ Erro em refreshCardEffects:', error);
    }
  }

  /**
   * Limpa estilos temporários de captura
   */
  cleanupCaptureStyles() {
    try {
      // Remover classe de captura
      if (this.cardElement) {
        this.cardElement.classList.remove('card-capture-mode');
        
        // Limpar estilos inline que podem ter sido aplicados
        this.cardElement.style.position = '';
        this.cardElement.style.top = '';
        this.cardElement.style.left = '';
        this.cardElement.style.width = '';
        this.cardElement.style.height = '';
        this.cardElement.style.transform = '';
        this.cardElement.style.zIndex = '';
        this.cardElement.style.opacity = '';
        this.cardElement.style.visibility = '';
      }
      
      const style = document.getElementById('card-capture-style');
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
      
      console.log('🧹 Estilos de captura removidos');
    } catch (error) {
      console.error('❌ Erro ao limpar estilos:', error);
    }
  }
}

// Exportar classe
window.UserCardComponent = UserCardComponent; 