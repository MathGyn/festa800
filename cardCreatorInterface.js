/**
 * CardCreatorInterface V2
 * Interface principal que coordena todo o fluxo de criação de cards
 */
class CardCreatorInterface {
  constructor() {
    // Componentes principais
    this.backgroundRemover = new BackgroundRemover();
    this.videoRecorder = new VideoRecorder();
    this.canvasGenerator = null; // Será inicializado depois
    
    // Estado da aplicação
    this.selectedFile = null;
    this.processedImage = null;
    this.userCard = null;
    this.generatedVideo = null;
    this.isGenerating = false;
    
    // Elementos DOM
    this.elements = {};
    
    // Estado do progresso
    this.currentStep = 0;
    this.steps = [
      'Processando foto',
      'Removendo fundo', 
      'Criando card',
      'Gravando MP4'
    ];
    
    this.initializeElements();
    this.setupEventListeners();
  }

  /**
   * Inicializa referências dos elementos DOM
   */
  initializeElements() {
    // Upload section
    this.elements.uploadArea = document.getElementById('remotion-upload-area');
    this.elements.photoInput = document.getElementById('remotion-file-input');
    
    // Form section
    this.elements.userNameInput = document.getElementById('remotion-name-input');
    this.elements.charCounter = this.elements.userNameInput?.nextElementSibling;
    this.elements.removeBgCheck = document.getElementById('removeBgCheck');
    this.elements.generateBtn = document.getElementById('remotion-generate-btn');
    
    // Progress section (NEW SIMPLIFIED)
    this.elements.progressSection = document.getElementById('card-creation-progress');
    this.elements.frameCounter = document.getElementById('frame-counter');
    
    // Result section
    this.elements.resultSection = document.getElementById('remotion-result-section');
    this.elements.previewVideo = document.getElementById('remotion-video-preview');
    this.elements.downloadBtn = document.getElementById('remotion-download-btn');
    this.elements.createNewBtn = document.getElementById('remotion-new-card-btn');

    // Verificar se elementos críticos existem
    if (!this.elements.uploadArea || !this.elements.generateBtn) {
      console.error('Elementos DOM críticos não encontrados');
      return false;
    }

    return true;
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Upload events
    if (this.elements.uploadArea) {
      this.elements.uploadArea.addEventListener('click', () => {
        this.elements.photoInput?.click();
      });
      
      this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
      this.elements.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
      this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    }

    if (this.elements.photoInput) {
      this.elements.photoInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    // Form events
    if (this.elements.userNameInput) {
      this.elements.userNameInput.addEventListener('input', this.handleNameInput.bind(this));
      this.elements.userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this.elements.generateBtn.disabled) {
          this.generateCard();
        }
      });
    }

    if (this.elements.generateBtn) {
      this.elements.generateBtn.addEventListener('click', this.generateCard.bind(this));
    }

    // Result events
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.addEventListener('click', this.downloadVideo.bind(this));
    }

    if (this.elements.createNewBtn) {
      this.elements.createNewBtn.addEventListener('click', this.resetInterface.bind(this));
    }
  }

  /**
   * Manipula evento de drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    this.elements.uploadArea.classList.add('dragover');
  }

  /**
   * Manipula evento de drag leave
   */
  handleDragLeave(e) {
    e.preventDefault();
    this.elements.uploadArea.classList.remove('dragover');
  }

  /**
   * Manipula evento de drop
   */
  handleDrop(e) {
    e.preventDefault();
    this.elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * Manipula seleção de arquivo
   */
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Manipula entrada de texto do nome
   */
  handleNameInput(e) {
    const value = e.target.value;
    const maxLength = parseInt(e.target.getAttribute('maxlength')) || 25;
    
    // Atualizar contador de caracteres
    if (this.elements.charCounter) {
      this.elements.charCounter.textContent = `${value.length}/${maxLength}`;
    }
    
    // Validar formulário
    this.validateForm();
  }

  /**
   * Processa arquivo de imagem
   */
  async processFile(file) {
    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        this.showNotification('Por favor, selecione uma imagem válida', 'error');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.showNotification('Imagem muito grande. Máximo 10MB', 'error');
        return;
      }

      this.selectedFile = file;
      this.showImagePreview(file);
      this.validateForm();

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      this.showNotification('Erro ao processar arquivo', 'error');
    }
  }

  /**
   * Mostra preview da imagem selecionada
   */
  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.elements.uploadArea.innerHTML = `
        <div class="upload-image-preview">
          <img src="${e.target.result}" alt="Preview" class="preview-image">
          <h3>Foto selecionada</h3>
          <p>Clique para trocar a imagem</p>
          <button type="button" class="remove-image-btn" onclick="cardCreatorInterface.removeImage()">
            Remover
          </button>
        </div>
      `;
      this.elements.uploadArea.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove imagem selecionada
   */
  removeImage() {
    this.selectedFile = null;
    this.processedImage = null;
    
    this.elements.uploadArea.innerHTML = `
      <div class="upload-content">
        <div class="upload-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.2929 5.29289C14.6834 4.90237 15.3166 4.90237 15.7071 5.29289L20.7071 10.2929C21.0976 10.6834 21.0976 11.3166 20.7071 11.7071C20.3166 12.0976 19.6834 12.0976 19.2929 11.7071L16 8.41421V15C16 15.5523 15.5523 16 15 16C14.4477 16 14 15.5523 14 15V8.41421L10.7071 11.7071C10.3166 12.0976 9.68342 12.0976 9.29289 11.7071C8.90237 11.3166 8.90237 10.6834 9.29289 10.2929L14.2929 5.29289Z" fill="currentColor"/>
            <path d="M3 15C3.55228 15 4 15.4477 4 16V17C4 17.5523 4.44772 18 5 18H19C19.5523 18 20 17.5523 20 17V16C20 15.4477 20.4477 15 21 15C21.5523 15 22 15.4477 22 16V17C22 18.6569 20.6569 20 19 20H5C3.34315 20 2 18.6569 2 17V16C2 15.4477 2.44772 15 3 15Z" fill="currentColor"/>
          </svg>
        </div>
        <h3>Envie sua foto</h3>
        <p>Arraste e solte ou <span class="upload-link">clique para selecionar</span></p>
        <small>JPG, PNG • Até 10MB • Recomendado: foto do rosto/busto</small>
      </div>
    `;
    
    this.elements.uploadArea.classList.remove('has-image');
    this.elements.photoInput.value = '';
    this.validateForm();
  }

  /**
   * Valida formulário
   */
  validateForm() {
    const hasFile = this.selectedFile !== null;
    const hasName = this.elements.userNameInput?.value.trim().length > 0;
    
    if (this.elements.generateBtn) {
      this.elements.generateBtn.disabled = !(hasFile && hasName);
    }
  }

  /**
   * Gera card e vídeo MP4
   */
  async generateCard() {
    if (!this.selectedFile || !this.elements.userNameInput?.value.trim()) {
      this.showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Prevenir múltiplas gerações simultâneas
    if (this.isGenerating) {
      console.log('⚠️ Geração já em andamento, ignorando nova tentativa');
      return;
    }

    this.isGenerating = true;

    try {
      const userName = this.elements.userNameInput.value.trim();
      const shouldRemoveBg = this.elements.removeBgCheck?.checked !== false;

      // Mostrar seção de progresso e interceptar logs
      this.showProgressSection();
      this.updateFrameCounter(0, 300);
      this.setupRenderingLogInterceptor();
      
      // Processar foto e remover fundo
      if (shouldRemoveBg) {
        this.processedImage = await this.backgroundRemover.removeBackground(
          this.selectedFile,
          (progress, message) => {
            console.log(`Background removal progress: ${progress}`);
          }
        );
      } else {
        this.processedImage = this.selectedFile;
      }

      // Criar ProfileCard
      const imageUrl = URL.createObjectURL(this.processedImage);
      this.userCard = new ProfileCard({
        avatarUrl: imageUrl,
        miniAvatarUrl: imageUrl,
        name: userName,
        title: "Time Traveler",
        handle: userName.toLowerCase().replace(/\s+/g, ''),
        status: "Festa 800",
        contactText: "Download",
        showUserInfo: true,
        enableTilt: true,
        showBehindGradient: true,
        onContactClick: null
      });

      // Mostrar preview do card criado
      this.showCardPreview();
      
      this.showNotification('Card criado com sucesso! 🎉', 'success');

    } catch (error) {
      console.error('Erro ao gerar card:', error);
      this.showNotification(`Erro: ${error.message}`, 'error');
      this.hideProgressSection();
      this.restoreConsoleLog();
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Mostra preview do card criado
   */
  showCardPreview() {
    console.log('🎬 Iniciando showCardPreview...', { userCard: this.userCard });
    
    if (!this.userCard) {
      console.error('Card não foi criado');
      return;
    }

    try {
      // Limpar qualquer preview anterior
      const existingContainer = document.getElementById('cardPreviewContainer');
      if (existingContainer) {
        existingContainer.remove();
        console.log('🧹 Preview anterior removido');
      }
      // Criar elemento do card
      console.log('📱 Criando elemento do ProfileCard...');
      const cardElement = this.userCard.createElement();
      console.log('✅ Card element criado:', cardElement);
      
      // Mostrar seção de resultado
      console.log('📺 Mostrando seção de resultado...');
      if (this.elements.resultSection) {
        this.elements.resultSection.hidden = false;
        console.log('✅ Seção de resultado mostrada');
      }
      
      // Ocultar seção de progresso
      this.hideProgressSection();
      
      // Criar container de preview em formato Stories
      console.log('📦 Criando preview container...');
      const previewContainer = this.createPreviewContainer();
      console.log('✅ Preview container criado:', previewContainer);
      
      // Inserir card no preview
      console.log('🎯 Inserindo card no preview...');
      previewContainer.appendChild(cardElement);
      console.log('✅ Card inserido no preview');
      
      // Adicionar ao DOM
      console.log('🌐 Adicionando ao DOM...', { 
        previewVideo: this.elements.previewVideo,
        parent: this.elements.previewVideo?.parentNode,
        resultSection: this.elements.resultSection
      });
      
      if (this.elements.previewVideo && this.elements.previewVideo.parentNode) {
        this.elements.previewVideo.parentNode.replaceChild(previewContainer, this.elements.previewVideo);
        console.log('✅ Preview container adicionado ao DOM via replaceChild');
      } else if (this.elements.resultSection) {
        // Fallback: limpar result section e adicionar preview container
        const existingVideo = this.elements.resultSection.querySelector('#remotion-video-preview');
        if (existingVideo) {
          existingVideo.remove();
        }
        // Adicionar preview container como primeiro filho
        this.elements.resultSection.insertBefore(previewContainer, this.elements.resultSection.firstChild);
        console.log('✅ Preview container adicionado ao DOM via fallback');
      } else {
        console.error('❌ Nem previewVideo nem resultSection encontrados');
      }
      
      // Configurar botão de download para gerar vídeo
      if (this.elements.downloadBtn) {
        this.elements.downloadBtn.textContent = 'Gerar Vídeo MP4';
        this.elements.downloadBtn.onclick = () => this.generateVideoFromPreview(previewContainer, cardElement);
        console.log('✅ Botão configurado');
      }
      
      // Scroll para resultado
      setTimeout(() => {
        if (this.elements.resultSection) {
          this.elements.resultSection.scrollIntoView({ behavior: 'smooth' });
          console.log('✅ Scroll realizado');
        }
      }, 100);
      
      console.log('🎉 Preview mostrado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao mostrar preview:', error);
      this.showNotification(`Erro ao mostrar preview: ${error.message}`, 'error');
    }
  }
  
  createPreviewContainer() {
    const container = document.createElement('div');
    container.id = 'cardPreviewContainer';
    container.style.cssText = `
      width: 100%;
      max-width: 400px;
      height: 600px;
      margin: 0 auto;
      background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      border: 2px solid #c08229;
    `;
    
    return container;
  }
  
  async generateVideoFromPreview(previewContainer, cardElement) {
    try {
      // Desabilitar botão e mostrar estado inicial
      this.elements.downloadBtn.disabled = true;
      this.elements.downloadBtn.textContent = '🎬 Preparando...';
      
      console.log('🎬 Iniciando geração de vídeo do preview...');
      
      // Gerar vídeo a partir do preview (mantém contagem de frames)
      this.generatedVideo = await this.generateVideoFromCard(cardElement);
      
      // Aguardar um pouco para user ver o status "Gravando vídeo"
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mostrar vídeo gerado (substitui preview pelo vídeo final)
      this.showGeneratedVideo();
      
      // Restaurar console.log original
      this.restoreConsoleLog();
      
      // Atualizar botão apenas após vídeo ser mostrado
      this.elements.downloadBtn.textContent = '⬇️ Baixar MP4';
      this.elements.downloadBtn.onclick = () => this.downloadVideo();
      this.elements.downloadBtn.disabled = false;
      
      this.showNotification('Vídeo gerado com sucesso! 🎉', 'success');
      
    } catch (error) {
      console.error('Erro ao gerar vídeo:', error);
      this.showNotification(`Erro ao gerar vídeo: ${error.message}`, 'error');
      
      // Restaurar botão
      this.elements.downloadBtn.textContent = 'Gerar Vídeo MP4';
      this.elements.downloadBtn.disabled = false;
    }
  }
  
  async generateVideoFromCard(cardElement) {
    console.log('🎨 Gerando vídeo Canvas2D do card...');
    
    // Configurações do vídeo
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    const fps = 30;
    const duration = 10; // 10 segundos para 300 frames
    const totalFrames = 300; // Fixo em 300 frames
    
    // Configurar MediaRecorder
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs=vp9',
      videoBitsPerSecond: 8000000
    });
    
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        // Manter contagem até preview ser mostrado
        this.elements.downloadBtn.textContent = '🎬 Finalizando...';
        
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('✅ Vídeo renderizado com sucesso:', {
          size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
          frames: totalFrames,
          duration: `${duration}s`
        });
        resolve(blob);
      };
      
      recorder.onerror = reject;
      
      // Iniciar gravação
      recorder.start();
      
      let currentFrame = 0;
      
      const renderFrame = async () => {
        if (currentFrame >= totalFrames) {
          // Só para gravação quando atingir 300 frames
          this.elements.downloadBtn.textContent = '📹 Gravando vídeo...';
          setTimeout(() => recorder.stop(), 100);
          return;
        }
        
        const progress = currentFrame / totalFrames;
        
        // Log padronizado que será capturado pelo interceptor
        this.elements.downloadBtn.textContent = currentFrame + 1 === totalFrames ? 
          '📹 Gravando vídeo...' : `🎬 Renderizando...`;
        console.log(`📸 Renderizando frame ${currentFrame + 1}/${totalFrames} (${Math.round(progress * 100)}%)`);
        
        // Simular movimento do mouse no card
        const time = progress * Math.PI * 2;
        const mouseX = 50 + 30 * Math.sin(time * 1.2);
        const mouseY = 50 + 30 * Math.cos(time * 0.8);
        
        // Disparar eventos de mouse no card
        const rect = cardElement.getBoundingClientRect();
        const event = new MouseEvent('mousemove', {
          clientX: rect.left + (rect.width * mouseX / 100),
          clientY: rect.top + (rect.height * mouseY / 100),
          bubbles: true
        });
        cardElement.dispatchEvent(event);
        
        // Aguardar renderização
        await new Promise(resolve => setTimeout(resolve, 16));
        
        // Capturar frame usando html2canvas
        try {
          const frameCanvas = await html2canvas(cardElement.closest('#cardPreviewContainer'), {
            backgroundColor: '#1a1a1a',
            scale: 2,
            width: 1080,
            height: 1920,
            logging: false,
            useCORS: true
          });
          
          // Desenhar no canvas principal
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
          
          currentFrame++;
          
          // Aguardar próximo frame
          setTimeout(renderFrame, 1000 / fps);
          
        } catch (error) {
          console.error(`Erro ao capturar frame ${currentFrame + 1}/${totalFrames}:`, error);
          currentFrame++;
          setTimeout(renderFrame, 1000 / fps);
        }
      };
      
      // Iniciar renderização
      setTimeout(renderFrame, 100);
    });
  }
  
  showGeneratedVideo() {
    if (!this.generatedVideo) {
      console.error('Nenhum vídeo gerado para mostrar');
      return;
    }
    
    console.log('🎥 Mostrando vídeo gerado:', {
      size: `${(this.generatedVideo.size / 1024 / 1024).toFixed(2)}MB`,
      type: this.generatedVideo.type
    });
    
    // Criar elemento de vídeo
    const videoElement = document.createElement('video');
    const videoURL = URL.createObjectURL(this.generatedVideo);
    videoElement.src = videoURL;
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.controls = true;
    videoElement.style.cssText = `
      width: 100%;
      max-width: 400px;
      height: auto;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    `;
    
    // Eventos do vídeo para debug
    videoElement.onloadstart = () => console.log('🎥 Vídeo: Iniciando carregamento');
    videoElement.oncanplay = () => console.log('🎥 Vídeo: Pronto para reproduzir');
    videoElement.onerror = (e) => console.error('🎥 Erro no vídeo:', e);
    
    // Substituir preview pelo vídeo
    const previewContainer = document.getElementById('cardPreviewContainer');
    if (previewContainer && previewContainer.parentNode) {
      previewContainer.parentNode.replaceChild(videoElement, previewContainer);
      console.log('✅ Vídeo exibido no lugar do preview');
    } else {
      console.error('❌ Container de preview não encontrado');
    }
  }
  
  downloadVideo() {
    if (!this.generatedVideo) {
      console.error('❌ Tentativa de download sem vídeo gerado');
      this.showNotification('Nenhum vídeo foi gerado ainda.', 'error');
      return;
    }

    console.log('⬇️ Iniciando download do vídeo:', {
      size: `${(this.generatedVideo.size / 1024 / 1024).toFixed(2)}MB`,
      type: this.generatedVideo.type
    });

    // Nome do arquivo
    const userName = this.elements.userNameInput?.value.trim() || 'usuario';
    const fileName = `card-${userName.toLowerCase().replace(/\s+/g, '-')}-festa800.webm`;
    
    try {
      // Criar link de download
      const url = URL.createObjectURL(this.generatedVideo);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      // Verificar se o blob URL foi criado com sucesso
      if (!url || url === 'blob:') {
        throw new Error('Falha ao criar URL do blob');
      }
      
      document.body.appendChild(a);
      
      // Tentar forçar o download
      try {
        a.click();
        console.log('✅ Clique no link de download executado');
      } catch (clickError) {
        console.warn('Erro no clique automático, tentando método alternativo:', clickError);
        
        // Método alternativo: usar dispatchEvent
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: false
        });
        a.dispatchEvent(clickEvent);
      }
      
      document.body.removeChild(a);
      
      // Limpar URL após delay maior para garantir download
      setTimeout(() => {
        URL.revokeObjectURL(url);
        console.log('🧹 URL do blob limpa');
      }, 5000);
      
      this.showNotification(`Download iniciado: ${fileName} 🎉`, 'success');
      
    } catch (error) {
      console.error('❌ Erro no download:', error);
      this.showNotification(`Erro ao fazer download: ${error.message}`, 'error');
      
      // Fallback: tentar abrir em nova aba
      try {
        const url = URL.createObjectURL(this.generatedVideo);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          this.showNotification('Vídeo aberto em nova aba. Clique com botão direito para salvar.', 'info');
        } else {
          throw new Error('Popup bloqueado');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
      }
    }
  }

  /**
   * Mostra seção de progresso simplificada
   */
  showProgressSection() {
    if (this.elements.progressSection) {
      this.elements.progressSection.style.display = 'block';
      this.elements.resultSection.style.display = 'none';
    }

    // Scroll para seção de progresso
    this.elements.progressSection?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
  }

  /**
   * Esconde seção de progresso
   */
  hideProgressSection() {
    if (this.elements.progressSection) {
      this.elements.progressSection.style.display = 'none';
    }
  }

  /**
   * Atualiza contador de frames com animação
   */
  updateFrameCounter(current, total) {
    if (this.elements.frameCounter) {
      // Adicionar classe de animação
      this.elements.frameCounter.classList.add('updating');
      
      // Atualizar texto
      this.elements.frameCounter.textContent = `${current}/${total}`;
      
      // Remover classe após animação
      setTimeout(() => {
        this.elements.frameCounter.classList.remove('updating');
      }, 300);
      
      console.log(`📊 Frame counter updated: ${current}/${total}`);
    }
  }

  /**
   * Intercepta logs de renderização para atualizar contador de frames
   */
  setupRenderingLogInterceptor() {
    // Salvar referência original do console.log
    this.originalConsoleLog = console.log;
    
    // Interceptar console.log para capturar frames de renderização
    console.log = (...args) => {
      // Chamar console.log original
      this.originalConsoleLog.apply(console, args);
      
      // Verificar se é um log de renderização de frame
      const logString = args.join(' ');
      
      // Padrões de log de renderização que queremos capturar
      const framePatterns = [
        /📸 Renderizando frame (\d+)\/(\d+)/,
        /Frame (\d+)\/(\d+)/,
        /Renderizando (\d+)\/(\d+)/,
        /🎬 Frames (\d+)\/(\d+)/
      ];
      
      framePatterns.forEach(pattern => {
        const match = logString.match(pattern);
        if (match) {
          const current = parseInt(match[1]);
          const total = parseInt(match[2]);
          this.updateFrameCounter(current, total);
        }
      });
    };
  }

  /**
   * Restaura console.log original
   */
  restoreConsoleLog() {
    if (this.originalConsoleLog) {
      console.log = this.originalConsoleLog;
      this.originalConsoleLog = null;
    }
  }

  /**
   * Mostra resultado final
   */
  showResult() {
    if (!this.generatedVideo) return;

    // Esconder progresso e mostrar resultado
    this.hideProgressSection();
    this.elements.resultSection.hidden = false;

    // Configurar vídeo preview
    if (this.elements.previewVideo) {
      const videoUrl = URL.createObjectURL(this.generatedVideo);
      this.elements.previewVideo.src = videoUrl;
      this.elements.previewVideo.load();
    }

    // Scroll para resultado
    this.elements.resultSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
  }


  /**
   * Reseta interface para criar novo card
   */
  resetInterface() {
    // Restaurar console.log se necessário
    this.restoreConsoleLog();
    
    // Limpar dados
    this.selectedFile = null;
    this.processedImage = null;
    this.generatedVideo = null;
    
    // Destruir card anterior
    if (this.userCard) {
      this.userCard.destroy();
      this.userCard = null;
    }

    // Limpar recursos do vídeo
    if (this.elements.previewVideo?.src) {
      URL.revokeObjectURL(this.elements.previewVideo.src);
      this.elements.previewVideo.src = '';
    }

    // Resetar interface
    this.removeImage();
    if (this.elements.userNameInput) {
      this.elements.userNameInput.value = '';
    }
    if (this.elements.charCounter) {
      this.elements.charCounter.textContent = '0/25';
    }

    // Esconder seções
    this.hideProgressSection();
    this.elements.resultSection.hidden = true;

    // Resetar contador de frames
    this.updateFrameCounter(0, 300);

    this.validateForm();

    // Scroll para o topo
    this.elements.uploadArea?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });

    this.showNotification('Interface resetada', 'info');
  }

  /**
   * Mostra notificação
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icon}</span>
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#5352ed'};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 5000);
  }

  /**
   * Aguarda tempo especificado
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroi interface e limpa recursos
   */
  destroy() {
    // Restaurar console.log original
    this.restoreConsoleLog();
    
    // Limpar card
    if (this.userCard) {
      this.userCard.destroy();
    }

    // Limpar URLs
    if (this.processedImage) {
      URL.revokeObjectURL(URL.createObjectURL(this.processedImage));
    }
    if (this.generatedVideo) {
      URL.revokeObjectURL(URL.createObjectURL(this.generatedVideo));
    }
    if (this.elements.previewVideo?.src) {
      URL.revokeObjectURL(this.elements.previewVideo.src);
    }

    // Limpar video recorder
    if (this.videoRecorder) {
      this.videoRecorder.cleanup();
    }
  }
}

// Adicionar estilos para notificações
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .notification-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  
  .notification-text {
    flex: 1;
    line-height: 1.4;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s ease;
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;
document.head.appendChild(notificationStyles);

// Inicializar quando DOM estiver pronto
let cardCreatorInterface;

document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco para garantir que todas as classes estão carregadas
  setTimeout(() => {
    try {
      cardCreatorInterface = new CardCreatorInterface();
      console.log('Card Creator V2 inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar Card Creator:', error);
    }
  }, 100);
});

// Expor globalmente para debug e uso em onclick
window.cardCreatorInterface = cardCreatorInterface; 