/**
 * BackgroundRemover V2
 * Sistema robusto de remoção de fundo com API remove.bg e fallback local
 */
class BackgroundRemover {
  constructor() {
    this.apiKey = '3bQAaRLQX3ubtdnCmYeHh18Q'; // remove.bg API key
    this.apiUrl = 'https://api.remove.bg/v1.0/removebg';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  }

  /**
   * Remove fundo da imagem usando API remove.bg com fallback local
   * @param {File} imageFile - Arquivo de imagem
   * @param {Function} onProgress - Callback de progresso
   * @returns {Promise<Blob>} - Imagem com fundo removido
   */
  async removeBackground(imageFile, onProgress = null) {
    try {
      // Validar arquivo
      this.validateFile(imageFile);
      
      if (onProgress) onProgress(10, 'Validando arquivo...');

      // Tentar API remove.bg primeiro
      try {
        if (onProgress) onProgress(20, 'Conectando com API remove.bg...');
        return await this.removeWithAPI(imageFile, onProgress);
      } catch (apiError) {
        console.warn('API remove.bg falhou, usando fallback local:', apiError);
        
        // Fallback local
        if (onProgress) onProgress(60, 'Usando algoritmo local...');
        return await this.removeWithLocalAlgorithm(imageFile, onProgress);
      }

    } catch (error) {
      console.error('Erro na remoção de fundo:', error);
      throw new Error(`Falha na remoção de fundo: ${error.message}`);
    }
  }

  /**
   * Validar arquivo de entrada
   * @param {File} file - Arquivo para validar
   */
  validateFile(file) {
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    if (!this.supportedFormats.includes(file.type)) {
      throw new Error('Formato não suportado. Use JPG, PNG ou WebP');
    }

    if (file.size > this.maxFileSize) {
      throw new Error('Arquivo muito grande. Máximo 10MB');
    }

    if (file.size < 1024) {
      throw new Error('Arquivo muito pequeno');
    }
  }

  /**
   * Remove fundo usando API remove.bg
   * @param {File} imageFile - Arquivo de imagem
   * @param {Function} onProgress - Callback de progresso
   * @returns {Promise<Blob>} - Imagem processada
   */
  async removeWithAPI(imageFile, onProgress = null) {
    // Preparar FormData
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('size', 'preview'); // Para economizar créditos da API
    formData.append('format', 'png');

    if (onProgress) onProgress(30, 'Enviando para remove.bg...');

    // Fazer requisição
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 402) {
        throw new Error('Limite de créditos da API excedido');
      } else if (response.status === 400) {
        throw new Error('Imagem inválida ou corrompida');
      } else if (response.status === 403) {
        throw new Error('API key inválida');
      }
      
      throw new Error(`Erro da API: ${response.status} - ${errorData.title || 'Erro desconhecido'}`);
    }

    if (onProgress) onProgress(80, 'Processando resultado...');

    // Obter blob resultado
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Resposta vazia da API');
    }

    if (onProgress) onProgress(100, 'Fundo removido com sucesso!');

    return blob;
  }

  /**
   * Remove fundo usando algoritmo local melhorado
   * @param {File} imageFile - Arquivo de imagem
   * @param {Function} onProgress - Callback de progresso
   * @returns {Promise<Blob>} - Imagem processada
   */
  async removeWithLocalAlgorithm(imageFile, onProgress = null) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          if (onProgress) onProgress(70, 'Analisando imagem...');

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionar para otimizar performance
          const maxSize = 800;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          if (onProgress) onProgress(80, 'Removendo fundo...');

          // Processar remoção de fundo
          await this.processLocalRemoval(ctx, canvas.width, canvas.height);

          if (onProgress) onProgress(95, 'Finalizando...');

          // Converter para blob
          canvas.toBlob((blob) => {
            if (blob) {
              if (onProgress) onProgress(100, 'Processamento local concluído!');
              resolve(blob);
            } else {
              reject(new Error('Falha ao gerar imagem final'));
            }
          }, 'image/png');

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Processa remoção local de fundo com algoritmo melhorado
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura da imagem
   * @param {number} height - Altura da imagem
   */
  async processLocalRemoval(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Detectar cor do fundo usando cantos e bordas
    const backgroundColor = this.detectBackgroundColor(data, width, height);
    
    // 2. Criar máscara inicial baseada em similaridade de cor
    const mask = this.createColorMask(data, backgroundColor, width, height);
    
    // 3. Refinar máscara com edge detection
    this.refineWithEdgeDetection(mask, data, width, height);
    
    // 4. Aplicar suavização nas bordas
    this.smoothEdges(mask, width, height);
    
    // 5. Aplicar máscara aos dados da imagem
    this.applyMask(data, mask, width, height);

    // Aplicar dados processados
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Detecta cor predominante do fundo
   * @param {Uint8ClampedArray} data - Dados da imagem
   * @param {number} width - Largura
   * @param {number} height - Altura
   * @returns {Object} Cor do fundo {r, g, b}
   */
  detectBackgroundColor(data, width, height) {
    const samples = [];
    const sampleSize = 5; // Tamanho da área para amostragem

    // Amostrar cantos e bordas
    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    // Borda inferior
    for (let y = height - sampleSize; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    // Bordas laterais
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const idx = (y * width + x) * 4;
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      
      for (let x = width - sampleSize; x < width; x++) {
        const idx = (y * width + x) * 4;
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    // Calcular cor média
    const avgColor = samples.reduce((acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b
    }), { r: 0, g: 0, b: 0 });

    const sampleCount = samples.length;
    return {
      r: Math.round(avgColor.r / sampleCount),
      g: Math.round(avgColor.g / sampleCount),
      b: Math.round(avgColor.b / sampleCount)
    };
  }

  /**
   * Cria máscara baseada em similaridade de cor
   * @param {Uint8ClampedArray} data - Dados da imagem
   * @param {Object} bgColor - Cor do fundo
   * @param {number} width - Largura
   * @param {number} height - Altura
   * @returns {Uint8Array} Máscara (0 = fundo, 255 = primeiro plano)
   */
  createColorMask(data, bgColor, width, height) {
    const mask = new Uint8Array(width * height);
    const tolerance = 40; // Tolerância de cor

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Calcular distância euclidiana
      const distance = Math.sqrt(
        Math.pow(r - bgColor.r, 2) +
        Math.pow(g - bgColor.g, 2) +
        Math.pow(b - bgColor.b, 2)
      );

      // 0 = fundo (remover), 255 = objeto (manter)
      mask[i] = distance > tolerance ? 255 : 0;
    }

    return mask;
  }

  /**
   * Refina máscara usando detecção de bordas
   * @param {Uint8Array} mask - Máscara atual
   * @param {Uint8ClampedArray} data - Dados da imagem
   * @param {number} width - Largura
   * @param {number} height - Altura
   */
  refineWithEdgeDetection(mask, data, width, height) {
    const edges = this.detectEdges(data, width, height);
    
    // Usar bordas para refinar máscara
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        if (edges[idx] > 50) { // Borda detectada
          // Verificar vizinhança para decidir se é borda do objeto
          let foregroundNeighbors = 0;
          let backgroundNeighbors = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = (y + dy) * width + (x + dx);
              if (mask[nIdx] === 255) foregroundNeighbors++;
              else backgroundNeighbors++;
            }
          }
          
          // Se maioria dos vizinhos é primeiro plano, manter
          if (foregroundNeighbors > backgroundNeighbors) {
            mask[idx] = 255;
          }
        }
      }
    }
  }

  /**
   * Detecta bordas na imagem
   * @param {Uint8ClampedArray} data - Dados da imagem
   * @param {number} width - Largura
   * @param {number} height - Altura
   * @returns {Uint8Array} Mapa de bordas
   */
  detectEdges(data, width, height) {
    const edges = new Uint8Array(width * height);
    
    // Kernel Sobel para detecção de bordas
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }
    
    return edges;
  }

  /**
   * Suaviza bordas da máscara
   * @param {Uint8Array} mask - Máscara
   * @param {number} width - Largura
   * @param {number} height - Altura
   */
  smoothEdges(mask, width, height) {
    const smoothed = new Uint8Array(mask);
    const radius = 2;
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = y * width + x;
        
        if (mask[idx] > 0 && mask[idx] < 255) {
          let sum = 0;
          let count = 0;
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nIdx = (y + dy) * width + (x + dx);
              sum += mask[nIdx];
              count++;
            }
          }
          
          smoothed[idx] = Math.round(sum / count);
        }
      }
    }
    
    mask.set(smoothed);
  }

  /**
   * Aplica máscara aos dados da imagem
   * @param {Uint8ClampedArray} data - Dados da imagem
   * @param {Uint8Array} mask - Máscara
   * @param {number} width - Largura
   * @param {number} height - Altura
   */
  applyMask(data, mask, width, height) {
    for (let i = 0; i < width * height; i++) {
      const alpha = mask[i];
      const dataIdx = i * 4;
      
      // Aplicar transparência baseada na máscara
      data[dataIdx + 3] = alpha; // Canal alpha
      
      // Suavizar bordas com feathering
      if (alpha > 0 && alpha < 255) {
        const factor = alpha / 255;
        data[dataIdx] = Math.round(data[dataIdx] * factor);
        data[dataIdx + 1] = Math.round(data[dataIdx + 1] * factor);
        data[dataIdx + 2] = Math.round(data[dataIdx + 2] * factor);
      }
    }
  }

  /**
   * Otimiza imagem para melhor qualidade
   * @param {Blob} imageBlob - Imagem processada
   * @returns {Promise<Blob>} Imagem otimizada
   */
  async optimizeImage(imageBlob) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Manter resolução original para qualidade
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Desenhar com suavização
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(resolve, 'image/png');
      };
      
      img.src = URL.createObjectURL(imageBlob);
    });
  }
}

// Exportar classe
window.BackgroundRemover = BackgroundRemover; 