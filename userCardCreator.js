class UserCardCreator {
  constructor() {
    this.isProcessing = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  async removeBackground(imageFile) {
    try {
      this.isProcessing = true;
      
      // Detectar se estamos em localhost (CORS issues)
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' || 
                         window.location.hostname === '';
      
      if (!isLocalhost) {
        // Usar API do Replicate apenas em produção
        try {
          return await this.removeBackgroundWithReplicate(imageFile);
        } catch (replicateError) {
          console.warn('Replicate API falhou, usando MediaPipe:', replicateError);
        }
      }
      
      // Usar MediaPipe como método principal (funciona em localhost)
      if (typeof SelfieSegmentation !== 'undefined') {
        console.log('Usando MediaPipe para remoção de fundo...');
        return await this.removeBackgroundWithMediaPipe(imageFile);
      }
      
      // Último fallback: algoritmo simples
      console.log('Usando algoritmo simples para remoção de fundo...');
      return await this.removeBackgroundSimple(imageFile);
      
    } catch (error) {
      console.error('Erro na remoção de fundo:', error);
      // Fallback final: retornar imagem original
      return imageFile;
    } finally {
      this.isProcessing = false;
    }
  }
  
  async removeBackgroundWithReplicate(imageFile) {
    // Primeiro, fazer upload da imagem para um serviço temporário
    const imageUrl = await this.uploadImageTemporary(imageFile);
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Token r8_2mez1Qmgk6NxREpVad6XIeXK9WKY7lH1fDvoN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1',
        input: {
          image: imageUrl,
          format: 'png',
          threshold: 0,
          background_type: 'rgba'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Replicate: ${response.status}`);
    }
    
    const prediction = await response.json();
    
    // Aguardar o resultado
    const result = await this.pollReplicateResult(prediction.id);
    
    // Baixar a imagem processada
    const processedResponse = await fetch(result.output);
    const processedBlob = await processedResponse.blob();
    
    return processedBlob;
  }
  
  async uploadImageTemporary(imageFile) {
    // Usar um serviço de upload temporário como imgur ou similar
    // Por simplicidade, vamos usar uma URL temporária local
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      // Tentar upload para um serviço temporário
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          'Authorization': 'Client-ID 546c25a59c58ad7' // ID público do Imgur
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data.link;
      }
    } catch (error) {
      console.error('Erro no upload temporário:', error);
    }
    
    // Fallback: usar URL.createObjectURL (só funciona localmente)
    return URL.createObjectURL(imageFile);
  }
  
  async pollReplicateResult(predictionId) {
    const maxAttempts = 60; // 60 tentativas = 5 minutos
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': 'Token r8_2mez1Qmgk6NxREpVad6XIeXK9WKY7lH1fDvoN'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao consultar status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'succeeded') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(`Processamento falhou: ${result.error}`);
      }
      
      // Aguardar 5 segundos antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error('Timeout: processamento demorou muito');
  }
  
  async removeBackgroundWithMediaPipe(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Desenhar imagem original
          ctx.drawImage(img, 0, 0);
          
          // Criar instância do SelfieSegmentation
          const selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
          });
          
          selfieSegmentation.setOptions({
            modelSelection: 1, // 0 ou 1, sendo 1 mais preciso
            selfieMode: false,
          });
          
          selfieSegmentation.onResults((results) => {
            if (results.segmentationMask) {
              // Criar nova imagem sem fundo
              const outputCanvas = document.createElement('canvas');
              const outputCtx = outputCanvas.getContext('2d');
              outputCanvas.width = img.width;
              outputCanvas.height = img.height;
              
              // Desenhar imagem original
              outputCtx.drawImage(img, 0, 0);
              
              // Aplicar máscara de segmentação
              const imageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
              const data = imageData.data;
              
              // Obter dados da máscara
              const maskCanvas = document.createElement('canvas');
              const maskCtx = maskCanvas.getContext('2d');
              maskCanvas.width = img.width;
              maskCanvas.height = img.height;
              maskCtx.drawImage(results.segmentationMask, 0, 0);
              
              const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
              
              // Aplicar transparência baseada na máscara
              for (let i = 0; i < data.length; i += 4) {
                const maskIndex = i;
                const maskValue = maskData[maskIndex]; // Valor da máscara (0-255)
                
                // Se a máscara indica fundo (valor baixo), tornar transparente
                if (maskValue < 128) {
                  data[i + 3] = 0; // Alpha = 0 (transparente)
                } else {
                  // Suavizar bordas
                  data[i + 3] = Math.min(255, maskValue + 50);
                }
              }
              
              outputCtx.putImageData(imageData, 0, 0);
              
              // Converter para blob
              outputCanvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/png');
            } else {
              reject(new Error('Falha na segmentação'));
            }
          });
          
          // Processar imagem
          await selfieSegmentation.send({image: img});
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  async removeBackgroundSimple(imageFile) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Desenhar a imagem
        ctx.drawImage(img, 0, 0);
        
        // Obter dados da imagem
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Aplicar algoritmo de remoção de fundo baseado em cor
        this.processBackgroundRemoval(data, canvas.width, canvas.height);
        
        // Aplicar dados modificados
        ctx.putImageData(imageData, 0, 0);
        
        // Converter para blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  processBackgroundRemoval(data, width, height) {
    // Detectar cor do fundo (cantos da imagem)
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 }
    ];
    
    let avgR = 0, avgG = 0, avgB = 0;
    corners.forEach(corner => {
      const index = (corner.y * width + corner.x) * 4;
      avgR += data[index];
      avgG += data[index + 1];
      avgB += data[index + 2];
    });
    
    avgR /= corners.length;
    avgG /= corners.length;
    avgB /= corners.length;
    
    // Remover pixels similares ao fundo
    const tolerance = 50;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calcular diferença de cor
      const diff = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      // Se a cor é similar ao fundo, tornar transparente
      if (diff < tolerance) {
        data[i + 3] = 0; // Alpha = 0 (transparente)
      }
    }
    
    // Aplicar suavização nas bordas
    this.smoothEdges(data, width, height);
  }
  
  smoothEdges(data, width, height) {
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4;
        
        if (tempData[index + 3] > 0) { // Se não é transparente
          // Verificar pixels vizinhos
          let transparentNeighbors = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
              if (tempData[neighborIndex + 3] === 0) {
                transparentNeighbors++;
              }
            }
          }
          
          // Se tem vizinhos transparentes, reduzir alpha
          if (transparentNeighbors > 0) {
            data[index + 3] = Math.max(0, tempData[index + 3] - (transparentNeighbors * 20));
          }
        }
      }
    }
  }

  async createUserCard(imageBlob, userName) {
    return new Promise((resolve, reject) => {
      try {
        // Criar URL temporária para a imagem
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Usar o mesmo componente ProfileCard dos artistas
        const userCard = new ProfileCard({
          avatarUrl: imageUrl,
          miniAvatarUrl: imageUrl,
          name: userName,
          title: "Festa 800",
          handle: userName.toLowerCase().replace(/\s+/g, ''),
          status: "Participante",
          contactText: "Download",
          showUserInfo: true,
          enableTilt: true,
          showBehindGradient: true,
          onContactClick: null
        });
        
        // Criar o elemento do card
        const cardElement = userCard.createElement();
        
        // Adicionar ao DOM temporariamente (posicionado para captura)
        cardElement.style.position = 'fixed';
        cardElement.style.top = '50px';
        cardElement.style.left = '50px';
        cardElement.style.width = '345px'; // Tamanho do card original
        cardElement.style.height = '480px';
        cardElement.style.zIndex = '9999';
        cardElement.style.pointerEvents = 'auto'; // Permitir hover
        cardElement.style.opacity = '1';
        cardElement.style.visibility = 'visible';
        cardElement.style.backgroundColor = 'transparent';
        
        // Garantir que não há overflow oculto
        cardElement.style.overflow = 'visible';
        
        document.body.appendChild(cardElement);
        
        // Verificar se o card foi adicionado corretamente
        console.log('Card adicionado ao DOM:', {
          inDocument: document.body.contains(cardElement),
          dimensions: {
            width: cardElement.offsetWidth,
            height: cardElement.offsetHeight,
            rect: cardElement.getBoundingClientRect()
          }
        });
        
        // Aguardar um pouco para o card renderizar completamente
        setTimeout(() => {
          // Adicionar classe para garantir que o card está ativo
          cardElement.classList.add('ready-for-capture');
          
          // Forçar redraw
          cardElement.style.transform = 'translateZ(0)';
          
          resolve({
            cardElement: cardElement,
            userCard: userCard,
            imageUrl: imageUrl
          });
        }, 1000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async recordCardVideo(cardData, duration = 6000) {
    return new Promise((resolve, reject) => {
      try {
        const { cardElement, userCard } = cardData;
        
        // Pausar todas as outras animações da página durante a captura
        if (window.pauseAllTrueFocus) {
          window.pauseAllTrueFocus();
        }
        if (window.pauseThreeJSAnimations) {
          window.pauseThreeJSAnimations();
        }
        
        // Usar uma abordagem diferente: gravar diretamente do elemento
        this.recordedChunks = [];
        let frameCount = 0;
        const fps = 15; // Reduzir FPS para menos frames
        const totalFrames = 30; // Reduzir para 30 frames para melhor captura
        
        // Certificar que o card está visível e posicionado corretamente para captura centralizada
        cardElement.style.position = 'fixed';
        cardElement.style.top = '50%';
        cardElement.style.left = '50%';
        cardElement.style.transform = 'translate(-50%, -50%) scale(1)';
        cardElement.style.zIndex = '10000';
        cardElement.style.pointerEvents = 'auto';
        cardElement.style.opacity = '1';
        cardElement.style.visibility = 'visible';
        cardElement.style.backgroundColor = 'transparent';
        
        // Garantir que o container não está oculto
        const container = cardElement.closest('.user-card-creator');
        if (container) {
          container.style.zIndex = '9999';
        }
        
        // Encontrar o elemento do card real (não o wrapper)
        const actualCard = cardElement.querySelector('.pc-card');
        if (!actualCard) {
          reject(new Error('Card element not found'));
          return;
        }
        
        // Aguardar mais tempo para garantir que o card está completamente renderizado
        setTimeout(async () => {
          try {
            // Adicionar indicador visual temporário
            const indicator = document.createElement('div');
            indicator.style.position = 'fixed';
            indicator.style.top = '10px';
            indicator.style.right = '10px';
            indicator.style.background = '#c08229';
            indicator.style.color = 'white';
            indicator.style.padding = '10px';
            indicator.style.borderRadius = '5px';
            indicator.style.zIndex = '10001';
            indicator.style.fontSize = '12px';
            indicator.textContent = 'Gravando MP4...';
            document.body.appendChild(indicator);
            
            // Adicionar borda vermelha temporária para debug
            cardElement.style.border = '3px solid red';
            actualCard.style.border = '2px solid blue';
            
            console.log('Card element:', cardElement);
            console.log('Actual card:', actualCard);
            console.log('Card dimensions:', {
              width: cardElement.offsetWidth,
              height: cardElement.offsetHeight,
              rect: cardElement.getBoundingClientRect()
            });
            
            // Iniciar hover no card real - múltiplos eventos para garantir ativação completa
            const cardRect = actualCard.getBoundingClientRect();
            const events = ['mouseenter', 'pointerenter', 'mouseover'];
            events.forEach(eventType => {
              const hoverEvent = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                clientX: cardRect.left + cardRect.width / 2,
                clientY: cardRect.top + cardRect.height / 2
              });
              actualCard.dispatchEvent(hoverEvent);
              cardElement.dispatchEvent(hoverEvent);
            });
            
            // Esperar um pouco para o hover ativar
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Função para capturar frames
            const captureFrame = async () => {
              const progress = frameCount / totalFrames;
              
              if (frameCount >= totalFrames) {
                // Remover indicador
                document.body.removeChild(indicator);
                
                // Retomar animações da página
                if (window.resumeAllTrueFocus) {
                  window.resumeAllTrueFocus();
                }
                if (window.resumeThreeJSAnimations) {
                  window.resumeThreeJSAnimations();
                }
                
                // Finalizar gravação
                this.createVideoFromFrames().then(resolve).catch(reject);
                return;
              }
              
              // Atualizar indicador
              indicator.textContent = `Gravando MP4... ${Math.round(progress * 100)}%`;
              
              // Simular movimento do mouse cobrindo toda a área do card
              const time = frameCount * 0.08;
              const cardRect = actualCard.getBoundingClientRect();
              
              // Movimento mais amplo cobrindo toda a área
              const baseX = 0.5 + 0.4 * Math.sin(time * 1.2);
              const baseY = 0.5 + 0.4 * Math.cos(time * 0.9);
              
              // Garantir que o mouse passe por toda a área
              const mouseX = cardRect.left + cardRect.width * Math.max(0.1, Math.min(0.9, baseX));
              const mouseY = cardRect.top + cardRect.height * Math.max(0.1, Math.min(0.9, baseY));
              
              // Disparar múltiplos eventos de mouse para garantir todos os efeitos
              const moveEvents = ['mousemove', 'pointermove'];
              moveEvents.forEach(eventType => {
                const moveEvent = new MouseEvent(eventType, {
                  clientX: mouseX,
                  clientY: mouseY,
                  bubbles: true,
                  cancelable: true
                });
                actualCard.dispatchEvent(moveEvent);
                cardElement.dispatchEvent(moveEvent);
              });
              
              // Aguardar tempo para processamento dos eventos
              await new Promise(resolve => setTimeout(resolve, 50));
              
              // Capturar frame usando html2canvas
              try {
                // Verificar se o elemento está visível
                const elementRect = cardElement.getBoundingClientRect();
                console.log(`Frame ${frameCount}: Card position:`, elementRect);
                
                // Aguardar tempo mínimo para renderização
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Forçar renderização de todos os efeitos CSS antes da captura
                cardElement.style.display = 'block';
                cardElement.style.transform = 'translate(-50%, -50%) scale(1) translateZ(0)';
                
                // Garantir que o card está usando TODOS os efeitos dos artistas
                const actualCard = cardElement.querySelector('.pc-card');
                if (actualCard) {
                  actualCard.classList.add('hover');
                  actualCard.style.setProperty('--pointer-x', `${50 + 30 * Math.sin(frameCount * 0.1)}%`);
                  actualCard.style.setProperty('--pointer-y', `${50 + 30 * Math.cos(frameCount * 0.08)}%`);
                  actualCard.style.setProperty('--card-opacity', '1');
                  actualCard.style.setProperty('--background-x', `${50 + 20 * Math.sin(frameCount * 0.05)}%`);
                  actualCard.style.setProperty('--background-y', `${50 + 20 * Math.cos(frameCount * 0.07)}%`);
                }
                
                // Aguardar renderização completa
                await new Promise(resolve => {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                  });
                });
                
                // Capturar canvas em formato 1080x1920 (Stories) com card centralizado
                const canvas = await html2canvas(document.body, {
                  backgroundColor: '#1a1a1a',
                  scale: 1,
                  logging: false,
                  useCORS: true,
                  allowTaint: true,
                  width: 1080,
                  height: 1920,
                  windowWidth: 1080,
                  windowHeight: 1920,
                  foreignObjectRendering: true,
                  removeContainer: false
                });
                
                // Criar canvas final com dimensões Stories
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = 1080;
                finalCanvas.height = 1920;
                const ctx = finalCanvas.getContext('2d');
                
                // Fundo gradiente como nos cards dos artistas
                const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
                gradient.addColorStop(0, '#1a1a1a');
                gradient.addColorStop(0.5, '#2d2d2d');
                gradient.addColorStop(1, '#1a1a1a');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1080, 1920);
                
                // Posicionar card no centro do canvas Stories
                const cardWidth = 345;
                const cardHeight = 480;
                const centerX = (1080 - cardWidth) / 2;
                const centerY = (1920 - cardHeight) / 2;
                
                // Extrair área do card do canvas capturado
                const cardRect = cardElement.getBoundingClientRect();
                const scaleX = canvas.width / window.innerWidth;
                const scaleY = canvas.height / window.innerHeight;
                
                const sourceX = (cardRect.left + cardRect.width / 2 - cardWidth / 2) * scaleX;
                const sourceY = (cardRect.top + cardRect.height / 2 - cardHeight / 2) * scaleY;
                
                // Desenhar card centralizado no canvas Stories
                ctx.drawImage(
                  canvas,
                  Math.max(0, sourceX), Math.max(0, sourceY), cardWidth * scaleX, cardHeight * scaleY,
                  centerX, centerY, cardWidth, cardHeight
                );
                
                // Canvas final já configurado acima
                
                // Converter para blob e armazenar
                finalCanvas.toBlob((blob) => {
                  this.recordedChunks.push(blob);
                  frameCount++;
                  
                  // Log de progresso
                  if (frameCount % 10 === 0) {
                    console.log(`Frame ${frameCount}/${totalFrames} capturado`);
                  }
                  
                  // Testar primeiro frame
                  if (frameCount === 1) {
                    console.log('Primeiro frame capturado, tamanho:', blob.size);
                    
                    // Verificar se o canvas não está preto
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 100;
                    tempCanvas.height = 100;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(finalCanvas, 0, 0, 100, 100);
                    
                    const imageData = tempCtx.getImageData(0, 0, 100, 100);
                    const data = imageData.data;
                    let totalBrightness = 0;
                    
                    for (let i = 0; i < data.length; i += 4) {
                      totalBrightness += data[i] + data[i + 1] + data[i + 2];
                    }
                    
                    const avgBrightness = totalBrightness / (data.length / 4 * 3);
                    console.log('Brilho médio do primeiro frame:', avgBrightness);
                    
                    if (avgBrightness < 10) {
                      console.warn('AVISO: Primeiro frame muito escuro, pode estar com problemas de captura');
                    }
                    
                    // Criar preview do primeiro frame para debug
                    const testImg = document.createElement('img');
                    testImg.src = URL.createObjectURL(blob);
                    testImg.style.position = 'fixed';
                    testImg.style.top = '400px';
                    testImg.style.left = '10px';
                    testImg.style.width = '100px';
                    testImg.style.height = '140px';
                    testImg.style.zIndex = '10002';
                    testImg.style.border = avgBrightness < 10 ? '2px solid red' : '2px solid green';
                    testImg.title = `Primeiro frame - Brilho: ${avgBrightness.toFixed(1)}`;
                    document.body.appendChild(testImg);
                    
                    // Remover após 10 segundos
                    setTimeout(() => {
                      if (document.body.contains(testImg)) {
                        document.body.removeChild(testImg);
                        URL.revokeObjectURL(testImg.src);
                      }
                    }, 10000);
                  }
                  
                  // Próximo frame
                  setTimeout(captureFrame, 1000 / fps);
                }, 'image/png');
                
              } catch (error) {
                console.error('Erro ao capturar frame:', error);
                frameCount++;
                setTimeout(captureFrame, 1000 / fps);
              }
            };
            
            // Iniciar captura
            captureFrame();
            
          } catch (error) {
            reject(error);
          }
        }, 1000);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  async createVideoFromFrames() {
    return new Promise((resolve, reject) => {
      if (this.recordedChunks.length === 0) {
        reject(new Error('Nenhum frame capturado'));
        return;
      }
      
      try {
        console.log(`Criando MP4 com ${this.recordedChunks.length} frames`);
        
        // Criar vídeo MP4 usando canvas + MediaRecorder em formato Stories
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        
        // Configurar MediaRecorder
        const stream = canvas.captureStream(15); // 15 FPS
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm; codecs=vp8' // Compatível com mais browsers
        });
        
        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log('MP4 renderizado com sucesso!');
          console.log('Blob do MP4:', { type: blob.type, size: blob.size });
          resolve(blob);
        };
        
        // Iniciar gravação
        recorder.start();
        
        // Renderizar frames sequencialmente
        let currentFrame = 0;
        const renderFrame = () => {
          if (currentFrame >= this.recordedChunks.length) {
            // Finalizar gravação
            setTimeout(() => {
              recorder.stop();
            }, 100);
            return;
          }
          
          const img = new Image();
          img.onload = () => {
            // Limpar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Desenhar frame atual mantendo proporções Stories
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Próximo frame
            currentFrame++;
            console.log(`Renderizando frame ${currentFrame}/${this.recordedChunks.length}`);
            
            // Continuar após delay
            setTimeout(renderFrame, 1000 / 15); // 15 FPS
          };
          
          img.src = URL.createObjectURL(this.recordedChunks[currentFrame]);
        };
        
        // Iniciar renderização
        renderFrame();
        
      } catch (error) {
        console.error('Erro ao criar MP4:', error);
        // Fallback: retornar a primeira imagem como PNG
        resolve(this.recordedChunks[0]);
      }
    });
  }
  
  async animateCard(cardElement, canvas, ctx, duration) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const cardRect = cardElement.getBoundingClientRect();
      
      // Calcular escala para 1080x1920
      const targetScale = Math.min(canvas.width / cardRect.width, canvas.height / cardRect.height) * 0.8;
      const offsetX = (canvas.width - cardRect.width * targetScale) / 2;
      const offsetY = (canvas.height - cardRect.height * targetScale) / 2;
      
      // Iniciar com hover
      cardElement.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
      
      let frameCount = 0;
      const totalFrames = Math.floor(duration / 16.67); // 60 FPS
      
      const animate = async () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
          // Finalizar com hover leave
          cardElement.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
          resolve();
          return;
        }
        
        // Limpar canvas com gradiente de fundo
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#2d2d2d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Criar movimento mais orgânico e suave
        const time = frameCount * 0.05;
        const amplitude = 0.25;
        
        // Movimento circular suave com variações
        const baseX = 0.5 + amplitude * Math.sin(time * 1.2);
        const baseY = 0.5 + amplitude * Math.cos(time * 0.8);
        
        // Adicionar variações secundárias
        const detailX = 0.1 * Math.sin(time * 3.5);
        const detailY = 0.1 * Math.cos(time * 2.8);
        
        const mouseX = cardRect.width * (baseX + detailX);
        const mouseY = cardRect.height * (baseY + detailY);
        
        // Criar evento de mouse mais realista
        const mouseEvent = new MouseEvent('pointermove', {
          clientX: cardRect.left + mouseX,
          clientY: cardRect.top + mouseY,
          bubbles: true,
          cancelable: true
        });
        
        cardElement.dispatchEvent(mouseEvent);
        
        // Aguardar renderização das animações CSS
        await new Promise(resolve => setTimeout(resolve, 16));
        
        // Capturar e desenhar o card
        await this.captureElementToCanvas(cardElement, ctx, offsetX, offsetY, targetScale);
        
        // Adicionar efeitos visuais extras
        this.addVideoEffects(ctx, progress, canvas.width, canvas.height);
        
        frameCount++;
        requestAnimationFrame(animate);
      };
      
      // Aguardar inicialização
      setTimeout(() => animate(), 100);
    });
  }
  
  addVideoEffects(ctx, progress, width, height) {
    // Adicionar vinheta sutil
    const vignetteGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Adicionar brilho sutil que varia com o tempo
    const glowIntensity = 0.1 + 0.05 * Math.sin(progress * Math.PI * 6);
    ctx.fillStyle = `rgba(192, 130, 41, ${glowIntensity})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  async captureElementToCanvas(element, ctx, offsetX, offsetY, scale) {
    try {
      // Otimizar configurações do html2canvas
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // Aumentar scale para melhor qualidade
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        imageTimeout: 0,
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
        // Otimizações de performance
        onclone: (clonedDoc) => {
          // Aplicar estilos otimizados no clone
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              text-rendering: optimizeLegibility !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      // Aplicar com melhor qualidade
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    } catch (error) {
      console.error('Erro ao capturar elemento:', error);
      // Fallback: desenhar retângulo com gradiente
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      const gradient = ctx.createLinearGradient(0, 0, element.offsetWidth, element.offsetHeight);
      gradient.addColorStop(0, '#c08229');
      gradient.addColorStop(1, '#cebf9f');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, element.offsetWidth, element.offsetHeight);
      ctx.restore();
    }
  }
  
  async convertToMP4(webmBlob) {
    // Para conversão real de WebM para MP4, seria necessário usar FFmpeg.js
    // Por enquanto, retornamos o WebM que é compatível com a maioria dos navegadores
    return webmBlob;
  }

  downloadVideo(blob, fileName = 'meu-card-festa800.webm') {
    console.log('Tentando fazer download:', { blob, fileName, blobType: blob.type, blobSize: blob.size });
    
    if (!blob || blob.size === 0) {
      console.error('Blob inválido ou vazio');
      return;
    }
    
    // Método 1: Download direto (mais compatível)
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      console.log('Clicando no link de download...');
      a.click();
      
      // Cleanup com delay
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Erro no método 1:', error);
    }
    
    // Método 2: Fallback com FileReader
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        console.log('Usando fallback FileReader...');
        a.click();
        
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 1000);
      };
      reader.readAsDataURL(blob);
      
      return true;
    } catch (error) {
      console.error('Erro no método 2:', error);
    }
    
    // Método 3: Último fallback - mostrar URL para usuário
    try {
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        console.log('Fallback: URL criada para download manual:', url);
        alert(`Download bloqueado pelo navegador. Clique com o botão direito e "Salvar como": ${url}`);
      }
      
      return true;
    } catch (error) {
      console.error('Erro no método 3:', error);
      return false;
    }
  }

  cleanup(cardData) {
    if (cardData) {
      const { cardElement, userCard, imageUrl } = cardData;
      
      // Remover do DOM
      if (cardElement && cardElement.parentNode) {
        cardElement.parentNode.removeChild(cardElement);
      }
      
      // Limpar card
      if (userCard) {
        userCard.destroy();
      }
      
      // Revogar URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  async processUserCard(imageFile, userName, generateVideo = true) {
    let cardData = null;
    
    try {
      // Remover fundo
      const processedImage = await this.removeBackground(imageFile);
      
      // Criar card usando o componente ProfileCard
      cardData = await this.createUserCard(processedImage, userName);
      
      let result = { cardData };
      
      // Gerar vídeo se solicitado
      if (generateVideo) {
        const videoBlob = await this.recordCardVideo(cardData);
        result.video = videoBlob;
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao processar card:', error);
      if (cardData) {
        this.cleanup(cardData);
      }
      throw error;
    }
  }
}

// Tornar disponível globalmente
window.UserCardCreator = UserCardCreator;