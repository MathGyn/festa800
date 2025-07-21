class UserCardInterface {
  constructor() {
    this.cardCreator = new UserCardCreator();
    this.selectedImage = null;
    this.generatedCard = null;
    
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.uploadZone = document.getElementById('uploadZone');
    this.imageInput = document.getElementById('imageInput');
    this.userNameInput = document.getElementById('userName');
    this.removeBackgroundCheckbox = document.getElementById('removeBackground');
    this.animatedCardCheckbox = document.getElementById('animatedCard');
    this.generateBtn = document.getElementById('generateCard');
    this.downloadBtn = document.getElementById('downloadCard');
    this.previewArea = document.getElementById('previewArea');
    this.previewCanvas = document.getElementById('previewCanvas');
  }

  setupEventListeners() {
    // Upload zone events
    this.uploadZone.addEventListener('click', () => this.imageInput.click());
    this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
    
    // File input
    this.imageInput.addEventListener('change', this.handleImageSelect.bind(this));
    
    // Name input
    this.userNameInput.addEventListener('input', this.validateForm.bind(this));
    
    // Generate button
    this.generateBtn.addEventListener('click', this.generateCard.bind(this));
    
    // Download button
    this.downloadBtn.addEventListener('click', this.downloadCard.bind(this));
  }

  handleDragOver(e) {
    e.preventDefault();
    this.uploadZone.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.uploadZone.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    this.uploadZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processImageFile(files[0]);
    }
  }

  handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  processImageFile(file) {
    // Validar arquivo
    if (!file.type.startsWith('image/')) {
      this.showError('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.showError('A imagem deve ter no máximo 10MB.');
      return;
    }

    this.selectedImage = file;
    this.showImagePreview(file);
    this.validateForm();
  }

  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadZone.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="image-preview">
        <p class="upload-text">Imagem selecionada</p>
        <button class="remove-image" onclick="userCardInterface.removeImage()">Remover</button>
      `;
      this.uploadZone.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedImage = null;
    this.uploadZone.classList.remove('has-image');
    this.uploadZone.innerHTML = `
      <div class="upload-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#c08229" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 10L12 5L17 10" stroke="#c08229" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 5V15" stroke="#c08229" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="upload-text">Arraste sua foto aqui ou <span class="upload-link">clique para selecionar</span></p>
      <p class="upload-subtitle">PNG, JPG até 10MB</p>
    `;
    this.validateForm();
  }

  validateForm() {
    const hasImage = this.selectedImage !== null;
    const hasName = this.userNameInput.value.trim().length > 0;
    
    this.generateBtn.disabled = !(hasImage && hasName);
  }

  async generateCard() {
    if (!this.selectedImage || !this.userNameInput.value.trim()) {
      this.showError('Por favor, selecione uma imagem e digite seu nome.');
      return;
    }

    const userName = this.userNameInput.value.trim();
    const generateVideo = this.animatedCardCheckbox.checked;

    // Mostrar loader
    this.showLoader(true);

    try {
      this.updateLoaderText('Removendo fundo da imagem...');
      
      // Processar card usando o componente ProfileCard
      const result = await this.cardCreator.processUserCard(
        this.selectedImage, 
        userName, 
        generateVideo
      );
      
      if (generateVideo) {
        this.updateLoaderText('Criando card interativo...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.updateLoaderText('Criando MP4 animado...');
        
        // Verificar se o vídeo foi gerado corretamente
        if (!result.video || result.video.size === 0) {
          throw new Error('Falha ao gerar MP4 animado');
        }
        
        console.log('MP4 gerado:', { type: result.video.type, size: result.video.size });
        this.generatedCard = result.video;
        this.showVideoPreview(result.video);
        this.showSuccess('MP4 animado gerado com sucesso! Card com hover effects reais');
      } else {
        // Capturar imagem estática do card
        this.updateLoaderText('Capturando imagem em alta resolução...');
        const staticImage = await this.captureCardImage(result.cardData);
        this.generatedCard = staticImage;
        this.showCardPreview(staticImage);
        this.showSuccess('Card gerado com sucesso!');
      }
      
      // Limpar recursos
      this.cardCreator.cleanup(result.cardData);
      
    } catch (error) {
      console.error('Erro ao gerar card:', error);
      this.showError('Erro ao gerar o card. Tente novamente.');
    } finally {
      this.showLoader(false);
    }
  }
  
  async captureCardImage(cardData) {
    return new Promise((resolve) => {
      const { cardElement } = cardData;
      
      // Usar html2canvas para capturar o card
      html2canvas(cardElement, {
        backgroundColor: '#000000',
        scale: 3, // Alta resolução
        width: 345,
        height: 480,
        logging: false,
        useCORS: true
      }).then(canvas => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    });
  }

  showCardPreview(cardBlob) {
    const img = new Image();
    img.onload = () => {
      const canvas = this.previewCanvas;
      const ctx = canvas.getContext('2d');
      
      // Configurar canvas para preview
      const aspectRatio = img.width / img.height;
      const maxWidth = 300;
      const maxHeight = maxWidth / aspectRatio;
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
      
      this.previewArea.style.display = 'block';
      this.downloadBtn.style.display = 'block';
      this.downloadBtn.textContent = 'Baixar Imagem';
      
      // Scroll para preview
      this.previewArea.scrollIntoView({ behavior: 'smooth' });
    };
    
    img.src = URL.createObjectURL(cardBlob);
  }
  
  showVideoPreview(videoBlob) {
    // Para MP4s, mostrar como vídeo
    console.log('Exibindo preview do vídeo...', videoBlob);
    
    // Verificar se o previewArea existe
    if (!this.previewArea) {
      console.error('PreviewArea não encontrado');
      return;
    }
    
    // Criar container de preview se não existir
    let previewContainer = this.previewArea.querySelector('.card-preview');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.className = 'card-preview';
      previewContainer.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 15px;
        margin: 20px 0;
      `;
      this.previewArea.appendChild(previewContainer);
    }
    
    previewContainer.innerHTML = '';
    
    // Criar elemento de vídeo para MP4
    const video = document.createElement('video');
    video.style.maxWidth = '100%';
    video.style.maxHeight = '400px';
    video.style.borderRadius = '15px';
    video.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
    video.style.display = 'block';
    video.style.margin = '0 auto';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.controls = true;
    
    video.src = URL.createObjectURL(videoBlob);
    previewContainer.appendChild(video);
    
    // Mostrar área de preview
    this.previewArea.style.display = 'block';
    this.downloadBtn.style.display = 'block';
    this.downloadBtn.textContent = 'Baixar MP4';
    
    console.log('Preview configurado, fazendo scroll...');
    
    // Scroll para preview
    setTimeout(() => {
      this.previewArea.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  downloadCard() {
    console.log('Download button clicked');
    
    if (!this.generatedCard) {
      this.showError('Nenhum card foi gerado ainda.');
      return;
    }

    console.log('Generated card:', this.generatedCard);
    
    // Mostrar feedback visual durante o download
    this.downloadBtn.disabled = true;
    this.downloadBtn.textContent = 'Preparando download...';
    
    const baseName = `card-${this.userNameInput.value.trim().toLowerCase().replace(/\s+/g, '-')}-festa800`;
    const isVideo = this.animatedCardCheckbox.checked;
    const fileName = isVideo ? `${baseName}.webm` : `${baseName}.png`;
    
    console.log('Filename:', fileName);
    
    try {
      const success = this.cardCreator.downloadVideo(this.generatedCard, fileName);
      
      if (success) {
        this.showSuccess('Download iniciado! Verifique sua pasta de Downloads.');
      } else {
        this.showError('Erro ao fazer download. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no download:', error);
      this.showError('Erro ao fazer download. Tente novamente.');
    } finally {
      // Restaurar botão após delay
      setTimeout(() => {
        this.downloadBtn.disabled = false;
        this.downloadBtn.textContent = this.animatedCardCheckbox.checked ? 'Baixar MP4' : 'Baixar Imagem';
      }, 2000);
    }
  }

  showLoader(show) {
    const btnText = this.generateBtn.querySelector('.btn-text');
    const btnLoader = this.generateBtn.querySelector('.btn-loader');
    
    if (show) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'flex';
      this.generateBtn.disabled = true;
    } else {
      btnText.style.display = 'block';
      btnLoader.style.display = 'none';
      this.generateBtn.disabled = false;
    }
  }

  updateLoaderText(text) {
    const loaderText = this.generateBtn.querySelector('.btn-loader');
    if (loaderText) {
      loaderText.childNodes[2].textContent = text;
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
        <span class="notification-text">${message}</span>
      </div>
    `;
    
    // Adicionar estilos
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#4CAF50' : '#2196F3'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 4 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
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
    gap: 10px;
  }
  
  .notification-icon {
    font-size: 16px;
  }
  
  .notification-text {
    font-size: 14px;
    font-weight: 500;
  }
`;
document.head.appendChild(notificationStyles);

// Inicializar quando a página carregar
let userCardInterface;
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco para garantir que UserCardCreator está disponível
  setTimeout(() => {
    if (typeof UserCardCreator !== 'undefined') {
      userCardInterface = new UserCardInterface();
    } else {
      console.error('UserCardCreator não encontrado. Verifique se o script está carregado.');
    }
  }, 100);
});

// Expor globalmente para uso em onclick
window.userCardInterface = userCardInterface;