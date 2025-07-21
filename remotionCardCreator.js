class RemotionCardCreator {
  constructor() {
    this.selectedFile = null;
    this.isProcessing = false;
    this.progressSteps = [
      { icon: 'loading', text: 'Processando foto', completed: false },
      { icon: 'loading', text: 'Removendo fundo', completed: false },
      { icon: 'loading', text: 'Criando card', completed: false },
      { icon: 'loading', text: 'Gravando vídeo', completed: false }
    ];
    this.currentStep = 0;
    this.renderProgress = { current: 0, total: 300 }; // Frame progress
    
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.uploadArea = document.getElementById('remotion-upload-area');
    this.fileInput = document.getElementById('remotion-file-input');
    this.nameInput = document.getElementById('remotion-name-input');
    this.generateBtn = document.getElementById('remotion-generate-btn');
    this.progressSection = document.getElementById('remotion-progress-section');
    this.progressStepsEl = document.getElementById('remotion-progress-steps');
    this.resultSection = document.getElementById('remotion-result-section');
    this.videoPreview = document.getElementById('remotion-video-preview');
    this.downloadBtn = document.getElementById('remotion-download-btn');
    this.newCardBtn = document.getElementById('remotion-new-card-btn');
  }

  setupEventListeners() {
    // Upload area events
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    
    // File input change
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    
    // Name input
    this.nameInput.addEventListener('input', this.validateForm.bind(this));
    
    // Generate button
    this.generateBtn.addEventListener('click', this.generateVideo.bind(this));
    
    // Result buttons
    this.newCardBtn.addEventListener('click', this.resetForm.bind(this));
  }

  handleDragOver(e) {
    e.preventDefault();
    this.uploadArea.classList.add('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    this.uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  processFile(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 10MB.');
      return;
    }

    this.selectedFile = file;
    
    // Update UI
    this.uploadArea.innerHTML = `
      <div class="file-selected">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p><strong>${file.name}</strong></p>
        <p class="file-size">${(file.size / 1024 / 1024).toFixed(2)}MB</p>
        <button type="button" onclick="remotionCreator.removeFile()" class="remove-file-btn">Remover</button>
      </div>
    `;
    
    this.validateForm();
  }

  removeFile() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.uploadArea.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 18A5.46 5.46 0 0 1 5 13c0-2.86 2.19-5.31 5-5.83C11.19 4.83 13.86 3 17 3a6 6 0 0 1 6 6c0 1-1 3-3 4h-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 15l3-3 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 12v9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p><strong>Clique ou arraste sua foto aqui</strong></p>
      <p class="upload-hint">JPG, PNG até 10MB</p>
    `;
    this.validateForm();
  }

  validateForm() {
    const isValid = this.selectedFile && this.nameInput.value.trim().length > 0;
    this.generateBtn.disabled = !isValid;
  }

  async generateVideo() {
    if (this.isProcessing || !this.selectedFile || !this.nameInput.value.trim()) {
      return;
    }

    this.isProcessing = true;
    this.currentStep = 0;
    
    // Show progress
    this.showProgress();
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('userImage', this.selectedFile);
      formData.append('userName', this.nameInput.value.trim());

      // Send request to Remotion server
      const response = await fetch('http://localhost:3001/api/render-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get video blob
      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      
      // Show result
      this.showResult(videoUrl);
      
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Erro ao gerar o vídeo. Tente novamente.');
      this.hideProgress();
    } finally {
      this.isProcessing = false;
    }
  }

  showProgress() {
    // Hide form, show progress
    document.querySelector('.remotion-form-content').style.display = 'none';
    this.progressSection.style.display = 'block';
    this.resultSection.style.display = 'none';
    
    // Animate progress steps
    this.animateProgress();
  }

  animateProgress() {
    this.progressStepsEl.innerHTML = `
      <div class="progress-header">
        <p>Aguarde. Seu card de viagem no tempo está sendo processado.</p>
      </div>
      <div class="progress-cards-container">
        ${this.progressSteps.map((step, index) => {
          const isActive = index === this.currentStep;
          const isCompleted = step.completed;
          const isLastStep = index === this.progressSteps.length - 1;
          const showFrameCounter = isLastStep && isActive && !isCompleted;
          
          const iconHTML = isCompleted 
            ? '<div class="step-icon completed"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
            : isActive 
              ? '<div class="step-icon loading"><div class="spinner"></div></div>'
              : '<div class="step-icon pending"></div>';
          
          const stepText = showFrameCounter 
            ? `${step.text}<br><span class="frame-counter">${this.renderProgress.current}/${this.renderProgress.total}</span>`
            : step.text;
          
          return `
            <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-step="${index}">
              ${iconHTML}
              <div class="step-text">${stepText}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Controle especial para não completar automaticamente o último step (Gravando vídeo)
    if (this.currentStep < this.progressSteps.length - 1) {
      setTimeout(() => {
        // Mark current step as completed and move to next
        this.progressSteps[this.currentStep].completed = true;
        this.currentStep++;
        this.animateProgress();
      }, 2000);
    } else {
      // Para o último step (Gravando vídeo), iniciar simulação do progresso de frames
      this.startFrameProgressSimulation();
    }
  }

  showResult(videoUrl) {
    // Mark final step (Gravando vídeo) as completed
    this.markFinalStepCompleted();
    
    // Hide progress after showing completion, show result
    setTimeout(() => {
      this.progressSection.style.display = 'none';
      this.resultSection.style.display = 'block';
      
      // Set video source
      this.videoPreview.src = videoUrl;
      this.downloadBtn.href = videoUrl;
      this.downloadBtn.download = `time-traveler-${this.nameInput.value.toLowerCase().replace(/\s+/g, '-')}.mp4`;
    }, 1500);
  }

  startFrameProgressSimulation() {
    // Simular progresso realístico de renderização de frames
    this.renderProgress.current = 0;
    this.frameProgressInterval = setInterval(() => {
      // Increment frames with some realistic variation
      const increment = Math.floor(Math.random() * 8) + 3; // 3-10 frames per update
      this.renderProgress.current = Math.min(
        this.renderProgress.current + increment, 
        this.renderProgress.total - 1 // Stop at 299, will complete when video is ready
      );
      
      // Update the progress display
      this.animateProgress();
      
      // Stop simulation when we reach near the end (will be completed by showResult)
      if (this.renderProgress.current >= this.renderProgress.total - 1) {
        clearInterval(this.frameProgressInterval);
      }
    }, 200); // Update every 200ms for smooth progress
  }

  markFinalStepCompleted() {
    // Stop frame simulation if still running
    if (this.frameProgressInterval) {
      clearInterval(this.frameProgressInterval);
    }
    
    // Set to complete frame count
    this.renderProgress.current = this.renderProgress.total;
    
    // Mark the final step (Gravando vídeo) as completed
    this.progressSteps[this.progressSteps.length - 1].completed = true;
    this.animateProgress();
  }

  hideProgress() {
    document.querySelector('.remotion-form-content').style.display = 'block';
    this.progressSection.style.display = 'none';
    this.resultSection.style.display = 'none';
  }

  resetForm() {
    // Clean up frame progress interval
    if (this.frameProgressInterval) {
      clearInterval(this.frameProgressInterval);
    }
    
    // Reset progress state
    this.renderProgress.current = 0;
    this.currentStep = 0;
    this.progressSteps.forEach(step => step.completed = false);
    
    this.removeFile();
    this.nameInput.value = '';
    this.hideProgress();
    this.validateForm();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.remotionCreator = new RemotionCardCreator();
});