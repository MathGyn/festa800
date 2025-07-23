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
    this.renderProgress = { current: 0, total: 300 }; // Frame progress (real server rendering)
    
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
      // 🔥 GERAR SESSION ID PARA PROGRESSO REAL
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      console.log(`🎯 SESSION ID GERADO: ${sessionId}`);
      
      // 🔥 CONECTAR AO PROGRESSO REAL DO SERVIDOR
      this.connectToRealProgress(sessionId);
      
      // Prepare form data
      const formData = new FormData();
      formData.append('userImage', this.selectedFile);
      formData.append('userName', this.nameInput.value.trim());
      formData.append('sessionId', sessionId); // 🔥 ENVIAR SESSION ID

      // Send request to Remotion server
      console.log('📡 Enviando requisição para servidor Remotion...');
      
      const response = await fetch('http://localhost:3001/api/render-video', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Resposta recebida, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Get video blob
      console.log('📦 Obtendo blob do vídeo...');
      const videoBlob = await response.blob();
      console.log('📦 Blob recebido:', {
        size: `${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`,
        type: videoBlob.type
      });
      
      if (videoBlob.size === 0) {
        throw new Error('Vídeo recebido está vazio');
      }
      
      const videoUrl = URL.createObjectURL(videoBlob);
      console.log('🔗 URL do vídeo criada:', videoUrl);
      
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
    // Cria o contador externo se não existir
    setTimeout(() => {
      const stepsContainer = this.progressSection.querySelector('.progress-cards-container');
      if (stepsContainer) {
        let frameCounterDiv = document.getElementById('external-frame-counter');
        if (!frameCounterDiv) {
          frameCounterDiv = document.createElement('div');
          frameCounterDiv.id = 'external-frame-counter';
          frameCounterDiv.style.background = '#fffbe6';
          frameCounterDiv.style.color = '#222';
          frameCounterDiv.style.fontSize = '1.2em';
          frameCounterDiv.style.fontWeight = 'bold';
          frameCounterDiv.style.margin = '16px auto 0 auto';
          frameCounterDiv.style.border = '2px solid #fbbf24';
          frameCounterDiv.style.borderRadius = '8px';
          frameCounterDiv.style.padding = '8px 16px';
          frameCounterDiv.style.textAlign = 'center';
          frameCounterDiv.style.maxWidth = '320px';
          frameCounterDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          stepsContainer.parentNode.insertBefore(frameCounterDiv, stepsContainer.nextSibling);
        }
        frameCounterDiv.textContent = `Frames: ${this.renderProgress.current}/${this.renderProgress.total}`;
        frameCounterDiv.style.display = 'block';
      }
    }, 0);
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
          const iconHTML = isCompleted 
            ? '<div class="step-icon completed"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
            : isActive 
              ? '<div class="step-icon loading"><div class="spinner"></div></div>'
              : '<div class="step-icon pending"></div>';
          // Não mostra mais contador de frames nos steps
          return `
            <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-step="${index}">
              ${iconHTML}
              <div class="step-text">${step.text}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    // Controle especial: NÃO completar automaticamente o último step (Gravando vídeo)
    if (this.currentStep < this.progressSteps.length - 1) {
      setTimeout(() => {
        this.progressSteps[this.currentStep].completed = true;
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
    // Remove o contador externo
    const frameCounterDiv = document.getElementById('external-frame-counter');
    if (frameCounterDiv) {
      frameCounterDiv.remove();
    }
    
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
      console.log('💾 Download configurado:', this.downloadBtn.download);
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

  // 🔥 CONECTAR AO PROGRESSO REAL DO SERVIDOR
  connectToRealProgress(sessionId) {
    console.log(`🔥 CONECTANDO AO PROGRESSO REAL: ${sessionId}`);
    const progressUrl = `http://localhost:3001/api/render-progress/${sessionId}`;
    try {
      this.eventSource = new EventSource(progressUrl);
      this.eventSource.onopen = () => {
        console.log('✅ CONEXÃO DE PROGRESSO REAL ESTABELECIDA');
      };
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`🔥 PROGRESSO REAL RECEBIDO:`, data);
          if (data.type === 'connected') {
            console.log('📡 Conectado ao servidor de progresso');
          } else if (data.type === 'progress' || data.type === 'frame') {
            this.renderProgress.current = data.renderedFrames;
            this.renderProgress.total = data.totalFrames;
            // Só avança para o último step quando frames começarem a ser renderizados
            if (data.renderedFrames > 0 && this.currentStep < this.progressSteps.length - 1) {
              for (let i = 0; i < this.progressSteps.length - 1; i++) {
                this.progressSteps[i].completed = true;
              }
              this.currentStep = this.progressSteps.length - 1;
            }
            // Nunca marcar o último step como completed aqui!
            if (this.progressSection) {
              this.progressSection.style.display = 'block';
            }
            this.animateProgress();
            // Atualiza o contador externo
            setTimeout(() => {
              const frameCounterDiv = document.getElementById('external-frame-counter');
              if (frameCounterDiv) {
                frameCounterDiv.textContent = `Frames: ${this.renderProgress.current}/${this.renderProgress.total}`;
                frameCounterDiv.style.display = 'block';
              }
            }, 0);
          }
        } catch (error) {
          console.error('❌ Erro ao processar progresso:', error);
        }
      };
      this.eventSource.onerror = (error) => {
        console.error('❌ Erro na conexão de progresso:', error);
        this.eventSource.close();
      };
    } catch (error) {
      console.error('❌ Falha ao conectar progresso real:', error);
      this.startFallbackSimulation();
    }
  }
  
  // Fallback apenas se conexão real falhar
  startFallbackSimulation() {
    console.log('⚠️ Usando fallback de simulação');
    this.renderProgress.current = 0;
    
    this.frameProgressInterval = setInterval(() => {
      this.renderProgress.current = Math.min(
        this.renderProgress.current + Math.floor(Math.random() * 3) + 1,
        this.renderProgress.total
      );
      
      this.animateProgress();
      
      // Não tenta atualizar contador de frames nos steps
      if (this.renderProgress.current >= this.renderProgress.total) {
        clearInterval(this.frameProgressInterval);
        this.frameProgressInterval = null;
      }
    }, 200);
  }
  
  // Remover completamente a função updateFrameProgressIndicator

  // REMOVER FUNÇÃO ANTIGA
  startFrameProgressSimulation() {
    // 🔥 AGORA USA PROGRESSO REAL - esta função não é mais chamada
    console.log('⚠️ startFrameProgressSimulation() foi substituída por connectToRealProgress()');
  }

  markFinalStepCompleted() {
    console.log('✅ VÍDEO FINALIZADO - FECHANDO CONEXÃO DE PROGRESSO');
    // Marcar o último step como completed
    this.progressSteps[this.progressSteps.length - 1].completed = true;
    this.animateProgress();
    // Fechar conexão de progresso real
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    // Stop fallback simulation if running
    if (this.frameProgressInterval) {
      clearInterval(this.frameProgressInterval);
      this.frameProgressInterval = null;
    }
    
    // Set to complete frame count
    this.renderProgress.current = this.renderProgress.total;
    console.log('✅ Etapa final marcada como completa - frames finalizados');
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

// === INÍCIO: Contador externo de frames baseado nos logs do console ===
// Remover interceptação de console.log para contador externo
// === FIM: Contador externo de frames ===

// Initialize when DOM is ready - DISABLED to prevent conflicts with CardCreatorInterface
// document.addEventListener('DOMContentLoaded', () => {
//   window.remotionCreator = new RemotionCardCreator();
// });