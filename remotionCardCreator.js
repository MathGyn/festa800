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
    this.renderProgress = { current: 0, total: 300 }; // Corrigido para 300 frames
    
    this.initializeElements();
    this.setupEventListeners();
    // Adicionar MutationObserver para detectar alterações inesperadas no progresso
    setTimeout(() => {
      if (this.progressStepsEl) {
        const observer = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
              console.log('🔍 MutationObserver: childList alterado!', mutation);
            }
            if (mutation.type === 'attributes') {
              console.log('🔍 MutationObserver: attributes alterado!', mutation);
            }
            if (mutation.type === 'characterData') {
              console.log('🔍 MutationObserver: characterData alterado!', mutation);
            }
          }
        });
        observer.observe(this.progressStepsEl, { childList: true, subtree: true, attributes: true, characterData: true });
        console.log('👁️ MutationObserver (agressivo) ativado em progressStepsEl');
      }
    }, 1000);
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
    
    // Debug element initialization
    console.log('🔧 Element initialization:');
    console.log('- uploadArea:', this.uploadArea ? '✅' : '❌');
    console.log('- fileInput:', this.fileInput ? '✅' : '❌');
    console.log('- nameInput:', this.nameInput ? '✅' : '❌');
    console.log('- generateBtn:', this.generateBtn ? '✅' : '❌');
    console.log('- progressSection:', this.progressSection ? '✅' : '❌');
    console.log('- progressStepsEl:', this.progressStepsEl ? '✅' : '❌');
    console.log('- resultSection:', this.resultSection ? '✅' : '❌');
    console.log('- videoPreview:', this.videoPreview ? '✅' : '❌');
    console.log('- downloadBtn:', this.downloadBtn ? '✅' : '❌');
    console.log('- newCardBtn:', this.newCardBtn ? '✅' : '❌');
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
    
    // Debug: Add test button to simulate video result
    if (window.location.href.includes('debug')) {
      const testBtn = document.createElement('button');
      testBtn.textContent = 'Test Show Result';
      testBtn.style.position = 'fixed';
      testBtn.style.top = '10px';
      testBtn.style.right = '10px';
      testBtn.style.zIndex = '99999';
      testBtn.style.background = '#ff0000';
      testBtn.style.color = 'white';
      testBtn.style.padding = '10px';
      testBtn.style.border = 'none';
      testBtn.style.borderRadius = '5px';
      testBtn.addEventListener('click', () => {
        console.log('🧪 Testing showResult with fake URL...');
        this.showResult('data:video/mp4;base64,');
      });
      document.body.appendChild(testBtn);
    }
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
      console.log('📡 Sending request to Remotion server...');
      const response = await fetch('http://localhost:3001/api/render-video', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Get video blob
      console.log('📦 Getting video blob from response...');
      const videoBlob = await response.blob();
      console.log('📦 Video blob size:', videoBlob.size, 'bytes');
      console.log('📦 Video blob type:', videoBlob.type);
      
      if (videoBlob.size === 0) {
        throw new Error('Received empty video file from server');
      }
      
      // Verificar se o blob é válido
      if (!videoBlob.type.includes('video/') && !videoBlob.type.includes('application/octet-stream')) {
        console.warn('⚠️ Blob type não é vídeo:', videoBlob.type);
        // Tentar mesmo assim, pode ser que o servidor não definiu o Content-Type
      }
      
      const videoUrl = URL.createObjectURL(videoBlob);
      console.log('🔗 Created video URL:', videoUrl);
      
      // Verificar se URL foi criada com sucesso
      if (!videoUrl || videoUrl === 'blob:') {
        throw new Error('Falha ao criar URL do blob de vídeo');
      }
      
      console.log('✅ Pronto para mostrar resultado...');
      
      // Show result
      this.showResult(videoUrl);
      
    } catch (error) {
      console.error('❌ Error generating video:', error);
      console.error('❌ Error stack:', error.stack);
      
      // More detailed error handling
      let errorMessage = 'Erro ao gerar o vídeo. Tente novamente.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com o servidor. Verifique se o servidor Remotion está rodando na porta 3001.';
        console.error('🔌 Connection error - check if Remotion server is running on port 3001');
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Erro de CORS. Verifique as configurações do servidor.';
        console.error('🌐 CORS error detected');
      } else if (error.message.includes('empty video file')) {
        errorMessage = 'O servidor retornou um arquivo de vídeo vazio. Tente novamente.';
        console.error('📄 Empty video file received from server');
      }
      
      alert(errorMessage);
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

    // Adicionar contador fixo de frames se não existir
    if (!document.getElementById('frame-progress-indicator')) {
      const frameIndicator = document.createElement('div');
      frameIndicator.id = 'frame-progress-indicator';
      frameIndicator.style.fontSize = '1.2em';
      frameIndicator.style.fontWeight = 'bold';
      frameIndicator.style.margin = '16px 0';
      frameIndicator.style.background = '#fffbe6';
      frameIndicator.style.color = '#222';
      frameIndicator.style.zIndex = '9999';
      frameIndicator.style.display = 'block';
      frameIndicator.style.position = 'relative';
      frameIndicator.style.border = '2px solid #fbbf24';
      frameIndicator.style.borderRadius = '8px';
      frameIndicator.style.padding = '8px 16px';
      this.progressSection.insertBefore(frameIndicator, this.progressStepsEl);
      console.log('🟡 frame-progress-indicator criado:', frameIndicator, 'Pai:', this.progressSection);
    }
    // Logar HTML do container pai
    console.log('🟡 HTML do progressSection após inserir indicador:', this.progressSection.innerHTML);

    // Animate progress steps
    this.animateProgress();
  }

  // Remover updateFrameCounter completamente
  // Atualizar contador fixo de frames
  updateFrameProgressIndicator(renderedFrames, totalFrames) {
    const indicator = document.getElementById('frame-progress-indicator');
    console.log('🟡 updateFrameProgressIndicator chamado. Elemento:', indicator, 'Texto:', `${renderedFrames}/${totalFrames} frames`);
    if (indicator) {
      indicator.textContent = `${renderedFrames}/${totalFrames} frames`;
    } else {
      console.warn('❗ frame-progress-indicator NÃO encontrado no DOM ao tentar atualizar!');
    }
  }

  animateProgress() {
    // Limpar explicitamente o container
    this.progressStepsEl.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'progress-header';
    header.innerHTML = '<p>Aguarde. Seu card de viagem no tempo está sendo processado.</p>';
    this.progressStepsEl.appendChild(header);

    // Container dos steps
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'progress-cards-container';

    this.progressSteps.forEach((step, index) => {
      const isActive = index === this.currentStep;
      const isCompleted = step.completed;
      const stepDiv = document.createElement('div');
      stepDiv.className = `progress-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`;
      stepDiv.setAttribute('data-step', index);

      // Icon
      let iconHTML = '';
      if (isCompleted) {
        iconHTML = '<div class="step-icon completed"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
      } else if (isActive) {
        iconHTML = '<div class="step-icon loading"><div class="spinner"></div></div>';
      } else {
        iconHTML = '<div class="step-icon pending"></div>';
      }
      const iconDiv = document.createElement('div');
      iconDiv.innerHTML = iconHTML;
      stepDiv.appendChild(iconDiv.firstChild);

      // Texto do step (sem contador de frames)
      const stepTextDiv = document.createElement('div');
      stepTextDiv.className = 'step-text';
      stepTextDiv.textContent = step.text;
      stepDiv.appendChild(stepTextDiv);
      stepsContainer.appendChild(stepDiv);
    });

    this.progressStepsEl.appendChild(stepsContainer);

    // NÃO completar automaticamente o último step (Gravando vídeo)
    if (this.currentStep < this.progressSteps.length - 1) {
      setTimeout(() => {
        console.log(`⏰ setTimeout disparado para step ${this.currentStep} (text: ${this.progressSteps[this.currentStep].text})`);
        this.progressSteps[this.currentStep].completed = true;
        console.log(`✅ progressSteps[${this.currentStep}].completed = true`);
        this.currentStep++;
        this.animateProgress();
      }, 2000);
    }
    // O último step só será marcado como completed em markFinalStepCompleted()
  }

  showResult(videoUrl) {
    console.log('🎬 showResult called with videoUrl:', videoUrl);
    console.log('📺 Video preview element:', this.videoPreview);
    console.log('📁 Result section element:', this.resultSection);
    
    // Verificações iniciais
    if (!this.videoPreview) {
      console.error('❌ Elemento videoPreview não encontrado!');
      return;
    }
    
    if (!this.resultSection) {
      console.error('❌ Elemento resultSection não encontrado!');
      return;
    }
    
    if (!videoUrl) {
      console.error('❌ videoUrl é inválida:', videoUrl);
      return;
    }
    
    // Mark final step (Gravando vídeo) as completed
    this.markFinalStepCompleted();
    
    // Mostrar resultado imediatamente (sem delay)
    console.log('🔄 Hiding progress, showing result...');
    
    // Garantir que elementos estão disponíveis
    if (this.progressSection) {
      this.progressSection.style.display = 'none';
    }
    
    this.resultSection.style.display = 'block';
    this.resultSection.style.visibility = 'visible';
    
    // Set video source
    console.log('🎥 Setting video source to:', videoUrl);
    this.videoPreview.src = videoUrl;
    
    // Configurar download
    if (this.downloadBtn) {
      this.downloadBtn.href = videoUrl;
      this.downloadBtn.download = `time-traveler-${this.nameInput.value.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      console.log('📥 Download configurado:', this.downloadBtn.download);
    }
    
    // Add video load event listeners for debugging
    this.videoPreview.addEventListener('loadstart', () => {
      console.log('📹 Video loadstart event fired');
    });
    
    this.videoPreview.addEventListener('loadeddata', () => {
      console.log('✅ Video loadeddata event fired - video is ready');
      // Remover bordas de debug quando vídeo carregar
      this.resultSection.style.border = '';
      this.videoPreview.style.border = '';
    });
    
    this.videoPreview.addEventListener('error', (e) => {
      console.error('❌ Video error event fired:', e);
      console.error('Video error details:', this.videoPreview.error);
      
      // Mostrar erro na UI
      const errorMsg = document.createElement('div');
      errorMsg.innerHTML = `
        <div style="color: red; padding: 20px; text-align: center; font-weight: bold;">
          ❌ Erro ao carregar o vídeo<br>
          <small>Verifique o console para mais detalhes</small>
        </div>
      `;
      this.resultSection.appendChild(errorMsg);
    });
    
    this.videoPreview.addEventListener('canplay', () => {
      console.log('▶️ Video canplay event fired - ready to play');
    });
    
    // Debug visual imediato
    this.resultSection.style.border = '3px solid red';
    this.videoPreview.style.border = '3px solid blue';
    
    // Log final state
    setTimeout(() => {
      console.log('🎯 Result section display:', window.getComputedStyle(this.resultSection).display);
      console.log('🎯 Video preview display:', window.getComputedStyle(this.videoPreview).display);
      console.log('🔍 Final element states:');
      console.log('- Result section visible:', this.resultSection.offsetWidth > 0 && this.resultSection.offsetHeight > 0);
      console.log('- Video preview visible:', this.videoPreview.offsetWidth > 0 && this.videoPreview.offsetHeight > 0);
      console.log('- Result section rect:', this.resultSection.getBoundingClientRect());
      console.log('- Video preview rect:', this.videoPreview.getBoundingClientRect());
    }, 100);
  }

  startFrameProgressSimulation() {
    // Simular progresso realístico de renderização de frames
    this.renderProgress.current = 0;
    
    // Calcular timing baseado em duração real (3s de vídeo)
    const videoDurationMs = 3000; // 3 segundos
    const updateIntervalMs = 100; // Atualizar a cada 100ms
    const totalUpdates = Math.floor(videoDurationMs / updateIntervalMs);
    const framesPerUpdate = Math.ceil(this.renderProgress.total / totalUpdates);
    
    console.log(`🎬 Iniciando simulação de ${this.renderProgress.total} frames em ${videoDurationMs}ms`);
    
    this.frameProgressInterval = setInterval(() => {
      // Incremento baseado em tempo real ao invés de aleatório
      const increment = Math.min(
        framesPerUpdate + Math.floor(Math.random() * 2), // Pequena variação natural
        this.renderProgress.total - this.renderProgress.current
      );
      
      this.renderProgress.current = Math.min(
        this.renderProgress.current + increment,
        this.renderProgress.total // Pode completar até 100%
      );
      
      console.log(`📸 Progresso de frames: ${this.renderProgress.current}/${this.renderProgress.total}`);
      
      // Update the progress display
      this.animateProgress();
      
      // Parar quando completar ou após tempo máximo
      if (this.renderProgress.current >= this.renderProgress.total) {
        clearInterval(this.frameProgressInterval);
        console.log('✅ Simulação de frames completada');
      }
    }, updateIntervalMs);
    
    // Timeout de segurança para evitar travamento
    setTimeout(() => {
      if (this.frameProgressInterval) {
        console.log('⚠️ Timeout de segurança - forçando conclusão');
        clearInterval(this.frameProgressInterval);
        this.renderProgress.current = this.renderProgress.total;
        this.animateProgress();
      }
    }, videoDurationMs + 2000); // 2s de margem
  }

  markFinalStepCompleted() {
    console.log('🏁 markFinalStepCompleted chamado!');
    // Stop frame simulation if still running
    if (this.frameProgressInterval) {
      clearInterval(this.frameProgressInterval);
      this.frameProgressInterval = null;
    }
    
    // Set to complete frame count
    this.renderProgress.current = this.renderProgress.total;
    console.log('✅ Etapa final marcada como completa - frames finalizados');
    
    // Mark the final step (Gravando vídeo) as completed
    this.progressSteps[this.progressSteps.length - 1].completed = true;
    console.log(`✅ progressSteps[${this.progressSteps.length - 1}].completed = true (markFinalStepCompleted)`);
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