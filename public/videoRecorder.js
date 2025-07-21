/**
 * VideoRecorder V2
 * Sistema de gravação MP4 em formato 1080x1920 (Stories/Reels)
 * Com simulação de mouse orgânica e efeitos completos
 */
class VideoRecorder {
  constructor() {
    // Configurações de vídeo
    this.videoWidth = 1080;
    this.videoHeight = 1920;
    this.fps = 60;
    this.duration = 6; // segundos
    this.totalFrames = this.fps * this.duration;
    
    // Estado da gravação
    this.isRecording = false;
    this.recordedFrames = [];
    this.currentFrame = 0;
    
    // Canvas para renderização
    this.canvas = null;
    this.ctx = null;
    
    // MediaRecorder para MP4
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Grava vídeo do UserCard com movimento orgânico do mouse
   * @param {UserCardComponent} userCard - Instância do card do usuário
   * @param {Function} onProgress - Callback de progresso (opcional)
   * @returns {Promise<Blob>} - Promise que resolve com o blob do vídeo
   */
  async recordVideo(profileCard, onProgress = null) {
    let cardElement = null;
    let wasTemporarilyInserted = false;
    let captureWindow = null;
    
    try {
      console.log('🎬 Iniciando gravação de vídeo...');
      
      // Pausar TODAS as animações True Focus durante a captura
      if (window.pauseAllTrueFocus) {
        console.log('⏸️ Pausando animações True Focus...');
        window.pauseAllTrueFocus();
      }

      // Pausar qualquer animação do Three.js que possa interferir
      if (window.pauseThreeJSAnimations) {
        console.log('⏸️ Pausando animações Three.js...');
        window.pauseThreeJSAnimations();
      }

      // Aguardar as animações pararem completamente
      console.log('⏱️ Aguardando animações pararem...');
      await this.delay(1000);

      // Criar elemento do ProfileCard
      cardElement = profileCard.createElement();
      
      if (!cardElement) {
        throw new Error('Falha ao criar ProfileCard element');
      }

      console.log('📋 Card element obtido:', {
        tag: cardElement.tagName,
        classes: cardElement.className,
        inDOM: document.contains(cardElement),
        hasContent: cardElement.children.length > 0
      });

      // SOLUÇÃO DEFINITIVA: Se não está no DOM, inserir temporariamente
      if (!document.contains(cardElement)) {
        console.log('🔧 Card não está no DOM, inserindo temporariamente...');
        
        // Inserir no body de forma visível para captura
        cardElement.style.cssText = `
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        `;
        
        document.body.appendChild(cardElement);
        wasTemporarilyInserted = true;
        
        // Aguardar inserção
        await this.delay(200);
        
        console.log('✅ Card inserido no DOM:', document.contains(cardElement));
      }

      // Verificar se ainda tem problemas - FALLBACK para card existente
      const rect = cardElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.log('🔄 Card inserido ainda tem dimensões 0x0, usando fallback...');
        
        // Encontrar um card existente funcionando
        const workingCards = document.querySelectorAll('.pc-card-wrapper');
        let fallbackCard = null;
        
        for (const card of workingCards) {
          const cardRect = card.getBoundingClientRect();
          if (cardRect.width > 0 && cardRect.height > 0) {
            fallbackCard = card;
            console.log('🎯 Card fallback encontrado:', {
              classes: card.className,
              dimensions: `${cardRect.width}x${cardRect.height}`
            });
            break;
          }
        }
        
        if (fallbackCard) {
          // Remover card problemático se foi inserido temporariamente
          if (wasTemporarilyInserted && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
            wasTemporarilyInserted = false;
          }
          
          cardElement = fallbackCard;
          console.log('✅ Usando card fallback funcionando');
        } else {
          throw new Error('Nenhum card funcionando encontrado no DOM');
        }
      }

      console.log('🔧 Preparando card para captura...');
      // Preparar card para captura apenas se é o card original
      if (userCard.prepareForCapture && cardElement === (userCard.cardElement || userCard.element)) {
        await userCard.prepareForCapture();
      }
      
      // Aguardar renderização completa
      console.log('⏱️ Aguardando renderização completa...');
      await this.delay(500);

      // Criar nova aba para captura limpa
      console.log('🪟 Criando nova aba para captura...');
      
      // Definir dimensões do vídeo
      this.videoWidth = 400;
      this.videoHeight = 600;
      
      // Abrir nova janela/aba
      captureWindow = window.open('', '_blank', `width=${this.videoWidth + 100}, height=${this.videoHeight + 100}, menubar=no, toolbar=no, scrollbars=no`);
      
      if (!captureWindow) {
        throw new Error('Não foi possível abrir nova aba. Verifique se pop-ups estão bloqueados.');
      }

      // Configurar documento da nova aba
      captureWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Captura Card Festa 800</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
                         body { 
               background: #000; 
               display: flex; 
               align-items: center; 
               justify-content: center; 
               min-height: 100vh;
               font-family: Arial, sans-serif;
               overflow: hidden;
               margin: 0;
               padding: 0;
             }
             #capture-area {
               width: ${this.videoWidth}px;
               height: ${this.videoHeight}px;
               display: flex;
               align-items: center;
               justify-content: center;
               border: 2px solid #ff0080;
               background: rgba(255, 255, 255, 0.05);
               position: fixed;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%);
               overflow: visible;
             }
            #debug-label {
              position: absolute;
              top: -30px;
              left: 50%;
              transform: translateX(-50%);
              background: #ff0080;
              color: white;
              padding: 4px 8px;
              font-size: 12px;
              border-radius: 4px;
            }
                         .pc-card-wrapper {
               border: 2px solid #00ff00 !important;
             }
             #card-container {
               display: flex;
               align-items: center;
               justify-content: center;
               width: 100%;
               height: 100%;
             }
          </style>
        </head>
        <body>
          <div id="capture-area">
            <div id="debug-label">ÁREA DE CAPTURA</div>
            <div id="card-container"></div>
          </div>
        </body>
        </html>
      `);
      captureWindow.document.close();

      // Aguardar documento carregar
      await new Promise(resolve => {
        if (captureWindow.document.readyState === 'complete') {
          resolve();
        } else {
          captureWindow.addEventListener('load', resolve);
        }
      });

             // Copiar TODOS os estilos CSS para a nova aba
       console.log('🎨 Copiando TODOS os estilos CSS para nova aba...');
       
       // Copiar TODAS as <style> tags
       const originalStyles = document.head.getElementsByTagName('style');
       for (let i = 0; i < originalStyles.length; i++) {
         const style = originalStyles[i];
         const newStyle = captureWindow.document.createElement('style');
         newStyle.textContent = style.textContent;
         captureWindow.document.head.appendChild(newStyle);
         console.log(`📋 Copiado estilo ${i + 1}/${originalStyles.length}`);
       }
       
       // Copiar TODOS os <link> CSS externos
       const originalLinks = document.head.getElementsByTagName('link');
       for (let i = 0; i < originalLinks.length; i++) {
         const link = originalLinks[i];
         if (link.rel === 'stylesheet') {
           const newLink = captureWindow.document.createElement('link');
           newLink.rel = 'stylesheet';
           newLink.href = link.href;
           captureWindow.document.head.appendChild(newLink);
           console.log(`🔗 Copiado link CSS: ${link.href}`);
         }
       }

       // Aguardar carregamento dos estilos CSS
       await this.delay(1000);

       // Clonar o card para a nova aba com validação PROFUNDA
       console.log('🔄 Iniciando clonagem PROFUNDA do card...');
       console.log('📋 Card original:', {
         tagName: cardElement.tagName,
         className: cardElement.className,
         filhos: cardElement.children.length,
         dimensoes: `${cardElement.offsetWidth}x${cardElement.offsetHeight}`,
         innerHTML: cardElement.innerHTML.substring(0, 100) + '...'
       });
       
       // Clonagem PROFUNDA com todos os atributos e conteúdo
       const cardClone = cardElement.cloneNode(true);
       
       // Preservar TODOS os estilos computados do card original
       const originalComputedStyle = window.getComputedStyle(cardElement);
       console.log('🎨 Copiando estilos computados...');
       
       // Aplicar estilos computados importantes
       const importantStyles = [
         'width', 'height', 'background', 'backgroundImage', 'backgroundSize', 
         'backgroundPosition', 'color', 'fontSize', 'fontFamily', 'fontWeight',
         'textAlign', 'padding', 'margin', 'borderRadius', 'boxShadow'
       ];
       
       importantStyles.forEach(prop => {
         const value = originalComputedStyle.getPropertyValue(prop);
         if (value && value !== 'auto' && value !== 'initial') {
           cardClone.style.setProperty(prop, value, 'important');
         }
       });
       
       console.log('✅ Card clonado com estilos preservados');
       
       // Verificar container de destino
       const cardContainer = captureWindow.document.getElementById('card-container');
       if (!cardContainer) {
         throw new Error('Container card-container não encontrado na nova aba');
       }
       
       console.log('📦 Container encontrado:', {
         id: cardContainer.id,
         dimensoes: `${cardContainer.offsetWidth}x${cardContainer.offsetHeight}`
       });
       
       // Aplicar estilos de posicionamento SEM sobrescrever conteúdo
       cardClone.style.position = 'relative';
       cardClone.style.display = 'block';
       cardClone.style.opacity = '1';
       cardClone.style.visibility = 'visible';
       cardClone.style.margin = '0 auto';
       cardClone.style.border = '3px solid #00ff00';
       // NÃO sobrescrever background para preservar imagens!

       // Inserir clone na nova aba ANTES de calcular dimensões
       console.log('📍 Inserindo card no container...');
       cardContainer.appendChild(cardClone);

       // Aguardar imagens carregarem na nova aba
       console.log('🖼️ Aguardando imagens carregarem...');
       const images = cardClone.querySelectorAll('img');
       const imagePromises = Array.from(images).map(img => {
         return new Promise((resolve) => {
           if (img.complete) {
             resolve();
           } else {
             img.onload = resolve;
             img.onerror = resolve; // Continuar mesmo se imagem falhar
             // Timeout para não travar se imagem não carregar
             setTimeout(resolve, 3000);
           }
         });
       });
       
       console.log(`📸 Aguardando ${images.length} imagens carregarem...`);
       await Promise.all(imagePromises);
       
       // Se imagens não carregaram, tentar forçar com src original
       images.forEach((img, index) => {
         if (!img.complete || img.naturalWidth === 0) {
           console.log(`⚠️ Imagem ${index} não carregou, forçando src original...`);
           const originalImg = cardElement.querySelectorAll('img')[index];
           if (originalImg && originalImg.src) {
             img.src = originalImg.src;
             img.style.display = 'block';
             img.style.opacity = '1';
           }
         }
       });
       
       // Forçar reflow para obter dimensões reais
       captureWindow.document.body.offsetHeight;
       await this.delay(1000); // Mais tempo para renderização completa
       
       // Agora calcular dimensões e aplicar escala
       const clonedRect = cardClone.getBoundingClientRect();
       const maxWidth = this.videoWidth * 0.85;
       const maxHeight = this.videoHeight * 0.85;
       
       // Calcular escala se necessário
       const scaleX = maxWidth / clonedRect.width;
       const scaleY = maxHeight / clonedRect.height;
       const scale = Math.min(scaleX, scaleY, 1);
       
       console.log('📏 Aplicando escala:', {
         clonedSize: `${clonedRect.width}x${clonedRect.height}`,
         maxSize: `${maxWidth}x${maxHeight}`,
         escala: scale.toFixed(2)
       });
       
       // Aplicar escala se necessário
       if (scale < 1) {
         cardClone.style.transform = `scale(${scale})`;
         cardClone.style.transformOrigin = 'center center';
       }

                    // Verificar se o conteúdo está visível
       console.log('🔍 Verificando conteúdo do card clonado...');
       const cardImages = cardClone.querySelectorAll('img');
       const cardTexts = cardClone.querySelectorAll('*');
       
       console.log('📋 Análise do conteúdo:', {
         totalImagens: cardImages.length,
         imagensCarregadas: Array.from(cardImages).filter(img => img.complete).length,
         totalElementos: cardTexts.length,
         hasBackgroundImage: cardClone.style.backgroundImage !== 'none' && cardClone.style.backgroundImage !== '',
         innerHTML: cardClone.innerHTML.length > 0 ? 'TEM CONTEÚDO' : 'VAZIO'
       });

       console.log('✅ Card inserido na nova aba');
       await this.delay(2000); // Aguardar renderização final

       // Verificação completa da nova aba
       const captureArea = captureWindow.document.getElementById('capture-area');
       const clonedCard = captureArea.querySelector('.pc-card-wrapper');
       
       console.log('🔍 Verificação completa da nova aba:', {
         janela: captureWindow && !captureWindow.closed ? 'ATIVA' : 'FECHADA',
         captureArea: captureArea ? 'ENCONTRADA' : 'AUSENTE',
         cardContainer: cardContainer ? 'ENCONTRADO' : 'AUSENTE',
         containerFilhos: cardContainer ? cardContainer.children.length : 0,
         cardClonado: clonedCard ? 'ENCONTRADO' : 'AUSENTE'
       });
       
       if (clonedCard) {
         const clonedRect = clonedCard.getBoundingClientRect();
         const areaRect = captureArea.getBoundingClientRect();
         
         console.log('📏 Detalhes do posicionamento:', {
           dimensoesArea: `${areaRect.width}x${areaRect.height}`,
           dimensoesCard: `${clonedRect.width}x${clonedRect.height}`,
           posicaoCard: `x:${Math.round(clonedRect.x)}, y:${Math.round(clonedRect.y)}`,
           posicaoArea: `x:${Math.round(areaRect.x)}, y:${Math.round(areaRect.y)}`,
           cardVisivel: clonedRect.width > 0 && clonedRect.height > 0 ? 'SIM' : 'NÃO',
           cardDentroArea: (clonedRect.x >= areaRect.x && 
                           clonedRect.y >= areaRect.y && 
                           clonedRect.right <= areaRect.right && 
                           clonedRect.bottom <= areaRect.bottom) ? 'SIM' : 'NÃO'
         });
       } else {
         console.log('❌ Card não encontrado! Verificando conteúdo do container...');
         if (cardContainer) {
           console.log('📋 Conteúdo do container:', {
             innerHTML: cardContainer.innerHTML.substring(0, 200) + '...',
             children: Array.from(cardContainer.children).map(child => ({
               tag: child.tagName,
               classes: child.className,
               id: child.id
             }))
           });
         }
       }

      console.log('🎥 Configurações do vídeo:', {
        width: this.videoWidth,
        height: this.videoHeight,
        duration: this.duration
      });

      // Capturar frames do vídeo usando a nova aba
      console.log('📹 Iniciando captura de frames...');
      const frames = await this.captureFramesDirectly(userCard, onProgress, captureWindow);

      // Gerar vídeo MP4
      console.log('🔄 Gerando vídeo MP4...');
      const videoBlob = await this.createMP4FromFrames(onProgress);

      console.log('✅ Vídeo gerado com sucesso:', {
        size: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
        type: videoBlob.type
      });

      // Limpar estilos temporários
      if (userCard && userCard.cleanupCaptureStyles) {
        console.log('🧹 Limpando estilos temporários...');
        userCard.cleanupCaptureStyles();
      }

      // Fechar aba de captura
      if (captureWindow && !captureWindow.closed) {
        console.log('🧹 Fechando aba de captura...');
        captureWindow.close();
      }
      
      // Remover card do DOM se foi inserido temporariamente
      if (wasTemporarilyInserted && cardElement.parentNode) {
        console.log('🗑️ Removendo card temporário do DOM...');
        cardElement.parentNode.removeChild(cardElement);
      }

      // Retomar animações True Focus
      if (window.resumeAllTrueFocus) {
        console.log('▶️ Retomando animações True Focus...');
        window.resumeAllTrueFocus();
      }

      // Retomar animações do Three.js
      if (window.resumeThreeJSAnimations) {
        console.log('▶️ Retomando animações Three.js...');
        window.resumeThreeJSAnimations();
      }

      return videoBlob;

    } catch (error) {
      console.error('❌ Erro na gravação do vídeo:', error);
      
      // Limpar estilos temporários mesmo em caso de erro
      if (userCard && userCard.cleanupCaptureStyles) {
        console.log('🧹 Limpando estilos após erro...');
        userCard.cleanupCaptureStyles();
      }
      
      // Fechar aba de captura em caso de erro
      if (captureWindow && !captureWindow.closed) {
        console.log('🧹 Fechando aba de captura após erro...');
        captureWindow.close();
      }
      
      // Remover card do DOM se foi inserido temporariamente
      if (wasTemporarilyInserted && cardElement && cardElement.parentNode) {
        console.log('🗑️ Removendo card temporário após erro...');
        cardElement.parentNode.removeChild(cardElement);
      }
      
      // Garantir que TODAS as animações True Focus sejam retomadas mesmo em caso de erro
      if (window.resumeAllTrueFocus) {
        console.log('🔄 Retomando animações após erro...');
        window.resumeAllTrueFocus();
      }

      // Retomar animações do Three.js
      if (window.resumeThreeJSAnimations) {
        window.resumeThreeJSAnimations();
      }

      throw error;
    }
  }

  /**
   * Método simplificado para capturar frames diretamente
   * @param {UserCardComponent} userCard - Card component
   * @param {Function} onProgress - Callback de progresso
   * @param {Window} captureWindow - Janela de captura
   * @returns {Promise<Blob>} Blob do vídeo
   */
  async captureFramesDirectly(userCard, onProgress = null, captureWindow = null) {
    try {
      console.log('🎯 Iniciando captura direta de frames...');
      
      if (!captureWindow || captureWindow.closed) {
        throw new Error('Janela de captura não está disponível');
      }
      
      // Usar o elemento de captura da nova aba
      const targetElement = captureWindow.document.getElementById('capture-area');
      
      if (!targetElement) {
        throw new Error('Área de captura não encontrada na nova aba');
      }
      
      const cardDimensions = {
        width: this.videoWidth,
        height: this.videoHeight
      };
      
      console.log('📐 Configuração de captura:', {
        elemento: 'Nova aba - capture-area',
        dimensões: cardDimensions,
        janela: 'Nova aba'
      });

      // Criar arrays para armazenar frames
      this.recordedFrames = [];
             const totalFrames = 10; // Teste super rápido para debug

      if (onProgress) {
        onProgress(10, 'Iniciando captura...');
      }

      // Capturar frames com movimento simples
      for (let frame = 0; frame < totalFrames; frame++) {
        try {
          const progress = frame / totalFrames;
          
          // Movimento simples do mouse (circular)
          const angle = progress * Math.PI * 2 * 2; // 2 voltas completas
          const radius = Math.min(cardDimensions.width, cardDimensions.height) * 0.2;
          const centerX = cardDimensions.width / 2;
          const centerY = cardDimensions.height / 2;
          
          const mouseX = centerX + Math.cos(angle) * radius;
          const mouseY = centerY + Math.sin(angle) * radius;
          
          // Simular movimento do mouse na nova aba
          if (userCard.simulateMouseMove) {
            // Tentar simular na janela original se método existir
            userCard.simulateMouseMove(mouseX, mouseY);
          } else {
            // Simular movimento simples na nova aba através de evento
            const cardInNewWindow = targetElement.querySelector('.pc-card-wrapper');
            if (cardInNewWindow) {
              const mouseEvent = new captureWindow.MouseEvent('mousemove', {
                clientX: mouseX,
                clientY: mouseY,
                bubbles: true
              });
              cardInNewWindow.dispatchEvent(mouseEvent);
            }
          }
          
          // Aguardar um pouco para CSS processar
          await this.delay(16); // ~60fps
          
          // Capturar frame usando html2canvas - DIRETO DA NOVA ABA
          console.log(`📸 Capturando frame ${frame + 1}/${totalFrames}...`);
          
          // Verificar se a janela ainda está aberta
          if (captureWindow.closed) {
            throw new Error('Janela de captura foi fechada durante a captura');
          }
          
          console.log(`🎯 Capturando da nova aba:`, {
            elemento: targetElement.id,
            dimensões: `${cardDimensions.width}x${cardDimensions.height}`,
            documento: captureWindow.document.title
          });
          
          // Usar html2canvas na nova janela
          const html2canvasLib = captureWindow.html2canvas || window.html2canvas;
          
          if (!html2canvasLib) {
            // Injetar html2canvas na nova janela se necessário
            const script = captureWindow.document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            captureWindow.document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
            });
          }
          
          const frameCanvas = await (captureWindow.html2canvas || html2canvas)(targetElement, {
            backgroundColor: '#000000',
            scale: 1,
            logging: false,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: true,
            imageTimeout: 5000, // Mais tempo para imagens
            removeContainer: false,
            width: cardDimensions.width,
            height: cardDimensions.height,
            onclone: (clonedDoc) => {
              console.log('🔄 html2canvas clone criado na nova aba');
              
              // Remover elementos de debug
              const debugElements = clonedDoc.querySelectorAll('#debug-label');
              debugElements.forEach(el => el.remove());
              
              // Forçar visibilidade de todos os elementos
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach(el => {
                if (el.style) {
                  el.style.opacity = '1';
                  el.style.visibility = 'visible';
                }
              });
              
              // Verificar imagens no clone
              const cloneImages = clonedDoc.querySelectorAll('img');
              console.log(`🖼️ Encontradas ${cloneImages.length} imagens no clone html2canvas`);
            }
          });
          
          if (frameCanvas && frameCanvas.width > 0 && frameCanvas.height > 0) {
            // Converter canvas para blob
            const frameBlob = await this.canvasToBlob(frameCanvas);
            this.recordedFrames.push(frameBlob);
            
            console.log(`✅ Frame ${frame + 1} capturado:`, {
              canvas: `${frameCanvas.width}x${frameCanvas.height}`,
              esperado: `${cardDimensions.width}x${cardDimensions.height}`,
              elemento: targetElement.id,
              temCard: targetElement.querySelector('.pc-card-wrapper') ? 'SIM' : 'NÃO',
              novaAba: !captureWindow.closed ? 'ATIVA' : 'FECHADA'
            });
          } else {
            console.warn(`⚠️ Frame ${frame + 1} inválido (${frameCanvas?.width || 0}x${frameCanvas?.height || 0}), pulando...`);
          }
          
          // Atualizar progresso
          if (onProgress && frame % 10 === 0) {
            const captureProgress = 10 + (progress * 70); // 10% - 80%
            onProgress(captureProgress, `Capturando frame ${frame + 1}/${totalFrames}`);
          }
          
        } catch (frameError) {
          console.warn(`⚠️ Erro ao capturar frame ${frame + 1}:`, frameError);
          // Continuar mesmo com erro no frame
        }
      }

      console.log(`📹 Captura concluída: ${this.recordedFrames.length} frames válidos`);

      if (this.recordedFrames.length === 0) {
        throw new Error('Nenhum frame foi capturado com sucesso');
      }

      // Criar vídeo a partir dos frames
      if (onProgress) {
        onProgress(80, 'Criando vídeo...');
      }

      const videoBlob = await this.createMP4FromFrames(onProgress);

      if (onProgress) {
        onProgress(100, 'Vídeo criado com sucesso!');
      }

      return videoBlob;

    } catch (error) {
      console.error('❌ Erro na captura direta:', error);
      
      // Limpar estilos temporários mesmo em caso de erro
      if (userCard && userCard.cleanupCaptureStyles) {
        console.log('🧹 Limpando estilos após erro na captura...');
        userCard.cleanupCaptureStyles();
      }
      
      throw error;
    }
  }

  /**
   * Configura canvas para renderização do vídeo
   */
  setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.videoWidth;
    this.canvas.height = this.videoHeight;
    this.ctx = this.canvas.getContext('2d');
    
    // Configurar qualidade
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Aguarda card estar pronto para captura
   * @param {UserCardComponent} userCard - Card component
   */
  async waitForCardReady(userCard) {
    // Aguardar imagens carregarem
    await userCard.preloadImages();
    
    // Forçar renderização
    userCard.forceRepaint();
    
    // Aguardar frames para estabilizar
    await this.delay(200);
    
    // Verificar se card está visível
    const cardElement = userCard.getCardElement();
    const rect = cardElement.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
      throw new Error('Card não está visível para captura');
    }
  }

  /**
   * Captura frames com movimento orgânico do mouse
   * @param {UserCardComponent} userCard - Card component
   * @param {Function} onProgress - Callback de progresso
   */
  async captureFramesWithMovement(userCard, onProgress = null) {
    const cardDimensions = userCard.getCardDimensions();
    const cardElement = userCard.getCardElement();
    
    console.log('Iniciando captura com dimensões:', cardDimensions);

    for (let frame = 0; frame < this.totalFrames; frame++) {
      const progress = frame / this.totalFrames;
      const time = progress * Math.PI * 4; // 4 ciclos completos
      
      // Calcular posição do mouse com movimento orgânico
      const mousePos = this.calculateOrganicMouseMovement(
        time, 
        cardDimensions.width, 
        cardDimensions.height
      );
      
      // Simular movimento do mouse
      userCard.simulateMouseMove(mousePos.x, mousePos.y);
      
      // Aguardar CSS animations processarem
      await this.delay(1000 / this.fps / 2); // Metade do frame time
      
      // Capturar frame
      await this.captureFrame(userCard);
      
      // Atualizar progresso
      if (onProgress && frame % 10 === 0) {
        const captureProgress = 10 + (progress * 70); // 10% - 80%
        onProgress(captureProgress, `Capturando frame ${frame + 1}/${this.totalFrames}`);
      }
      
      this.currentFrame = frame + 1;
    }
    
    console.log(`Captura concluída: ${this.recordedFrames.length} frames`);
  }

  /**
   * Calcula movimento orgânico do mouse cobrindo toda área do card
   * @param {number} time - Tempo normalizado
   * @param {number} width - Largura do card
   * @param {number} height - Altura do card
   * @returns {Object} Posição {x, y}
   */
  calculateOrganicMouseMovement(time, width, height) {
    // Padrão em forma de "8" (lemniscata) com variações
    const scale = 0.35; // Reduzir para ficar dentro do card
    const offsetX = width * 0.5;
    const offsetY = height * 0.5;
    
    // Componentes principais do movimento
    const baseX = Math.sin(time) * scale * width;
    const baseY = Math.sin(time * 2) * scale * height;
    
    // Adicionar variações para tornar mais orgânico
    const variation1X = Math.sin(time * 3.7) * scale * 0.3 * width;
    const variation1Y = Math.cos(time * 2.3) * scale * 0.3 * height;
    
    const variation2X = Math.cos(time * 1.9) * scale * 0.2 * width;
    const variation2Y = Math.sin(time * 4.1) * scale * 0.2 * height;
    
    // Combinar movimentos
    const x = offsetX + baseX + variation1X + variation2X;
    const y = offsetY + baseY + variation1Y + variation2Y;
    
    // Garantir que está dentro dos limites
    const margin = 20; // Margem das bordas
    return {
      x: Math.max(margin, Math.min(width - margin, x)),
      y: Math.max(margin, Math.min(height - margin, y))
    };
  }

  /**
   * Captura um frame do card
   * @param {UserCardComponent} userCard - Instância do card
   */
  async captureFrame(userCard) {
    try {
      // Verificar se o card está visível
      const cardElement = userCard.getCardElement();
      if (!cardElement || cardElement.offsetWidth === 0 || cardElement.offsetHeight === 0) {
        console.warn('Card não está visível, pulando frame');
        return;
      }

      // Limpar canvas com fundo escuro
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.videoWidth, this.videoHeight);
      
      // Aguardar um pouco para garantir que CSS updates foram aplicados
      await this.delay(10);
      
      // Capturar card com html2canvas - configurações otimizadas
      const cardCanvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2, // Maior qualidade
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 345,
        height: 480,
        foreignObjectRendering: true,
        imageTimeout: 2000,
        removeContainer: false, // Não remover para manter elementos visíveis
        ignoreElements: (element) => {
          // Ignorar elementos que podem causar problemas
          return element.tagName === 'IFRAME' || 
                 element.hasAttribute('data-html2canvas-ignore');
        }
      });
      
      // Verificar se o canvas foi capturado corretamente
      if (cardCanvas.width === 0 || cardCanvas.height === 0) {
        console.warn('Canvas capturado tem dimensões inválidas');
        return;
      }
      
      // Calcular posição centralizada no canvas de vídeo
      const cardAspectRatio = 345 / 480;
      const videoAspectRatio = this.videoWidth / this.videoHeight;
      
      let renderWidth, renderHeight, offsetX, offsetY;
      
      if (cardAspectRatio > videoAspectRatio) {
        // Card é mais largo, ajustar por largura
        renderWidth = this.videoWidth * 0.8; // 80% da largura
        renderHeight = renderWidth / cardAspectRatio;
      } else {
        // Card é mais alto, ajustar por altura
        renderHeight = this.videoHeight * 0.6; // 60% da altura
        renderWidth = renderHeight * cardAspectRatio;
      }
      
      offsetX = (this.videoWidth - renderWidth) / 2;
      offsetY = (this.videoHeight - renderHeight) / 2;
      
      // Aplicar filtro de suavização para melhor qualidade
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      
      // Desenhar card no canvas de vídeo
      this.ctx.drawImage(
        cardCanvas,
        offsetX,
        offsetY,
        renderWidth,
        renderHeight
      );
      
      // Adicionar efeitos visuais
      this.addVideoEffects(this.currentFrame / this.totalFrames);
      
      this.currentFrame++;
      
    } catch (error) {
      console.error('Erro ao capturar frame:', error);
      // Continuar mesmo com erro para não interromper a gravação
    }
  }

  /**
   * Adiciona efeitos visuais ao frame
   * @param {number} progress - Progresso da animação (0-1)
   */
  addVideoEffects(progress) {
    // Adicionar vinheta sutil
    const vignetteGradient = this.ctx.createRadialGradient(
      this.videoWidth / 2, this.videoHeight / 2, 0,
      this.videoWidth / 2, this.videoHeight / 2, Math.max(this.videoWidth, this.videoHeight) / 2
    );
    vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    
    this.ctx.fillStyle = vignetteGradient;
    this.ctx.fillRect(0, 0, this.videoWidth, this.videoHeight);
    
    // Adicionar brilho pulsante
    const glowIntensity = 0.05 + 0.03 * Math.sin(progress * Math.PI * 8);
    this.ctx.fillStyle = `rgba(192, 130, 41, ${glowIntensity})`;
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.fillRect(0, 0, this.videoWidth, this.videoHeight);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Converte canvas para blob
   * @param {HTMLCanvasElement} canvas - Canvas a converter
   * @returns {Promise<Blob>} Blob da imagem
   */
  canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }

  /**
   * Cria MP4 a partir dos frames capturados
   * @param {Function} onProgress - Callback de progresso
   * @returns {Promise<Blob>} Blob do vídeo MP4
   */
  async createMP4FromFrames(onProgress = null) {
    if (this.recordedFrames.length === 0) {
      throw new Error('Nenhum frame foi capturado');
    }

    try {
      // Criar novo canvas para renderização de vídeo
      const videoCanvas = document.createElement('canvas');
      videoCanvas.width = this.videoWidth;
      videoCanvas.height = this.videoHeight;
      const videoCtx = videoCanvas.getContext('2d');
      
      // Configurar stream do canvas
      const stream = videoCanvas.captureStream(this.fps);
      
      // Configurar MediaRecorder para MP4
      const options = {
        mimeType: 'video/webm; codecs=vp9', // WebM VP9 para melhor qualidade
        videoBitsPerSecond: 8000000 // 8 Mbps para alta qualidade
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.recordedChunks = [];
      
      // Configurar eventos do MediaRecorder
      return new Promise((resolve, reject) => {
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstop = () => {
          try {
            const videoBlob = new Blob(this.recordedChunks, { 
              type: 'video/webm' 
            });
            
            console.log('MP4 criado:', {
              frames: this.recordedFrames.length,
              duration: this.duration,
              size: videoBlob.size,
              type: videoBlob.type
            });
            
            resolve(videoBlob);
          } catch (error) {
            reject(error);
          }
        };
        
        this.mediaRecorder.onerror = (error) => {
          reject(error);
        };
        
        // Iniciar gravação
        this.mediaRecorder.start(100); // Chunk a cada 100ms
        
        // Renderizar frames sequencialmente
        this.renderFramesToVideo(videoCtx, onProgress)
          .then(() => {
            // Finalizar gravação
            setTimeout(() => {
              if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
              }
            }, 200);
          })
          .catch(reject);
      });
      
    } catch (error) {
      console.error('Erro ao criar MP4:', error);
      throw error;
    }
  }

  /**
   * Renderiza frames no canvas de vídeo
   * @param {CanvasRenderingContext2D} videoCtx - Contexto do canvas de vídeo
   * @param {Function} onProgress - Callback de progresso
   */
  async renderFramesToVideo(videoCtx, onProgress = null) {
    const frameTime = 1000 / this.fps;
    
    for (let i = 0; i < this.recordedFrames.length; i++) {
      const frameBlob = this.recordedFrames[i];
      
      // Carregar frame como imagem
      const img = await this.blobToImage(frameBlob);
      
      // Limpar canvas
      videoCtx.clearRect(0, 0, this.videoWidth, this.videoHeight);
      
      // Desenhar frame
      videoCtx.drawImage(img, 0, 0, this.videoWidth, this.videoHeight);
      
      // Atualizar progresso
      if (onProgress && i % 10 === 0) {
        const renderProgress = 80 + ((i / this.recordedFrames.length) * 20);
        onProgress(renderProgress, `Renderizando vídeo... ${i}/${this.recordedFrames.length}`);
      }
      
      // Aguardar tempo do frame
      await this.delay(frameTime);
    }
  }

  /**
   * Converte blob para imagem
   * @param {Blob} blob - Blob da imagem
   * @returns {Promise<HTMLImageElement>} Elemento de imagem
   */
  blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Aguarda tempo especificado
   * @param {number} ms - Milissegundos para aguardar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Faz download do vídeo
   * @param {Blob} videoBlob - Blob do vídeo
   * @param {string} filename - Nome do arquivo
   */
  downloadVideo(videoBlob, filename = 'meu-card-festa800.webm') {
    try {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup com delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Erro no download:', error);
      return false;
    }
  }

  /**
   * Limpa recursos utilizados
   */
  cleanup() {
    // Limpar MediaRecorder
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    
    // Limpar canvas
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
    
    // Limpar frames
    this.recordedFrames.forEach(blob => {
      if (blob instanceof Blob) {
        URL.revokeObjectURL(URL.createObjectURL(blob));
      }
    });
    this.recordedFrames = [];
    
    this.recordedChunks = [];
    this.currentFrame = 0;
  }

  /**
   * Obtém estatísticas da gravação
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      isRecording: this.isRecording,
      framesRecorded: this.recordedFrames.length,
      totalFrames: this.totalFrames,
      progress: this.recordedFrames.length / this.totalFrames,
      resolution: `${this.videoWidth}x${this.videoHeight}`,
      fps: this.fps,
      duration: this.duration
    };
  }
}

// Exportar classe
window.VideoRecorder = VideoRecorder; 