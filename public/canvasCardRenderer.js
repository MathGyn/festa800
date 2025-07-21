/**
 * Canvas Card Renderer - Festa 800
 * Renderiza cards idênticos aos ProfileCards usando Canvas 2D nativo
 * Garante resultado consistente e de alta qualidade
 */

class CanvasCardRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.fonts = {
      loaded: false,
      primary: 'Orbitron',
      secondary: 'Exo 2'
    };
    
    this.cardConfig = {
      width: 425, // Aumentado para 85% da largura Stories
      height: 590, // Proporcionalmente maior
      borderRadius: 20,
      padding: 25
    };
    
    this.colors = {
      background: {
        start: '#1a1a1a',
        middle: '#2d2d2d', 
        end: '#1a1a1a'
      },
      gold: {
        primary: '#c08229',
        secondary: '#cebf9f',
        glow: 'rgba(192, 130, 41, 0.6)'
      },
      text: {
        primary: '#ffffff',
        secondary: '#cebf9f'
      }
    };
  }
  
  async initialize() {
    console.log('🎨 Inicializando Canvas Card Renderer...');
    
    // Carregar fontes
    await this.loadFonts();
    
    console.log('✅ Canvas Card Renderer inicializado');
  }
  
  async loadFonts() {
    console.log('📝 Carregando fontes...');
    
    try {
      // Verificar se as fontes já estão carregadas
      if (document.fonts) {
        await document.fonts.ready;
        this.fonts.loaded = true;
        console.log('✅ Fontes carregadas');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar fontes:', error);
      this.fonts.loaded = false;
    }
  }
  
  createCanvas(width = 1080, height = 1920) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    
    // Configurações de qualidade
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.textBaseline = 'middle';
    
    return this.canvas;
  }
  
  drawBackground() {
    console.log('🌈 Desenhando fundo...');
    
    // Fundo gradiente Stories
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, this.colors.background.start);
    gradient.addColorStop(0.5, this.colors.background.middle);
    gradient.addColorStop(1, this.colors.background.end);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawCardBackground(x, y, progress = 0.5) {
    const { width, height, borderRadius } = this.cardConfig;
    
    console.log('🎨 Desenhando fundo complexo do card...');
    
    // Calcular posição do mouse simulado
    const time = progress * Math.PI * 2;
    const mouseX = x + width * (0.5 + 0.35 * Math.sin(time * 1.2));
    const mouseY = y + height * (0.5 + 0.35 * Math.cos(time * 0.8));
    
    // Salvar contexto
    this.ctx.save();
    
    // FUNDO BASE COMPLEXO (igual ProfileCard)
    this.createRoundedRect(x, y, width, height, borderRadius);
    this.ctx.clip();
    
    // 1. Gradiente base interno
    const innerGradient = this.ctx.createLinearGradient(x, y, x, y + height);
    innerGradient.addColorStop(0, '#1a1a1a');
    innerGradient.addColorStop(1, '#2d2d2d');
    this.ctx.fillStyle = innerGradient;
    this.ctx.fill();
    
    // 2. Gradiente behind (atrás) - PRINCIPAL DO PROFILECARD
    const behindGradient = this.ctx.createRadialGradient(
      mouseX, mouseY, width * 0.04,
      mouseX, mouseY, width * 0.8
    );
    const cardOpacity = 0.6 + 0.4 * Math.sin(progress * Math.PI * 3);
    behindGradient.addColorStop(0, `hsla(39, 100%, 50%, ${cardOpacity})`);
    behindGradient.addColorStop(0.1, `hsla(42, 80%, 60%, ${cardOpacity * 0.75})`);
    behindGradient.addColorStop(0.5, `hsla(45, 60%, 70%, ${cardOpacity * 0.5})`);
    behindGradient.addColorStop(1, 'hsla(48, 30%, 40%, 0)');
    this.ctx.fillStyle = behindGradient;
    this.ctx.fill();
    
    // 3. Gradiente radial dourado (canto superior)
    const topGradient = this.ctx.createRadialGradient(
      x + width * 0.55, y + height * 0.2, 0,
      x + width * 0.55, y + height * 0.2, width * 0.35
    );
    topGradient.addColorStop(0, '#c0822980');
    topGradient.addColorStop(1, '#cebf9f00');
    this.ctx.fillStyle = topGradient;
    this.ctx.fill();
    
    // 4. Gradiente central dourado intenso
    const centerGradient = this.ctx.createRadialGradient(
      x + width * 0.5, y + height * 0.5, 0,
      x + width * 0.5, y + height * 0.5, width * 0.5
    );
    centerGradient.addColorStop(0.01, '#c08229ff');
    centerGradient.addColorStop(0.76, '#1a1a1a00');
    this.ctx.fillStyle = centerGradient;
    this.ctx.fill();
    
    // 5. Gradiente cônico (efeito metálico)
    // Simular conic-gradient com múltiplos gradientes radiais
    const conicSteps = 8;
    for (let i = 0; i < conicSteps; i++) {
      const angle = (i / conicSteps) * Math.PI * 2;
      const conicX = x + width * 0.5 + Math.cos(angle) * width * 0.3;
      const conicY = y + height * 0.5 + Math.sin(angle) * width * 0.3;
      
      const conicGradient = this.ctx.createRadialGradient(
        conicX, conicY, 0,
        conicX, conicY, width * 0.2
      );
      
      const intensity = (Math.sin(angle + progress * Math.PI * 2) + 1) * 0.1;
      conicGradient.addColorStop(0, `rgba(192, 130, 41, ${intensity})`);
      conicGradient.addColorStop(0.6, `rgba(206, 191, 159, ${intensity * 0.5})`);
      conicGradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = conicGradient;
      this.ctx.fill();
    }
    
    this.ctx.restore();
    
    // BORDAS E GLOW EXTERNOS
    this.ctx.save();
    
    // Borda principal dourada
    this.createRoundedRect(x, y, width, height, borderRadius);
    this.ctx.strokeStyle = this.colors.gold.primary;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // Glow externo animado
    const glowIntensity = 0.8 + 0.4 * Math.sin(progress * Math.PI * 4);
    this.ctx.shadowColor = `rgba(192, 130, 41, ${glowIntensity})`;
    this.ctx.shadowBlur = 25;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.stroke();
    
    // Segundo glow mais sutil
    this.ctx.shadowColor = `rgba(206, 191, 159, ${glowIntensity * 0.6})`;
    this.ctx.shadowBlur = 40;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  createRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  async drawUserImage(imageBlob, x, y, size = 140) {
    console.log('📷 Desenhando imagem do usuário...');
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.ctx.save();
        
        // Criar círculo para a imagem
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Desenhar imagem
        this.ctx.drawImage(img, x, y, size, size);
        
        this.ctx.restore();
        
        // Borda dourada da imagem
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.colors.gold.primary;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        resolve();
      };
      
      img.onerror = () => {
        console.error('❌ Erro ao carregar imagem');
        resolve(); // Continuar mesmo com erro
      };
      
      img.src = URL.createObjectURL(imageBlob);
    });
  }
  
  drawText(text, x, y, options = {}) {
    const {
      font = '24px Orbitron',
      color = this.colors.text.primary,
      align = 'center',
      maxWidth = null,
      glow = false,
      alpha = 1
    } = options;
    
    this.ctx.save();
    
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.globalAlpha = alpha;
    
    // Glow effect avançado
    if (glow) {
      // Glow mais intenso
      this.ctx.shadowColor = this.colors.gold.glow;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      this.ctx.fillText(text, x, y, maxWidth);
      
      // Segundo glow mais sutil
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(text, x, y, maxWidth);
      
      // Limpar sombra
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
    }
    
    // Texto principal
    this.ctx.fillText(text, x, y, maxWidth);
    
    this.ctx.restore();
  }
  
  drawDecorations(x, y, progress = 0.5) {
    console.log('✨ Desenhando decorações complexas...');
    
    const { width, height } = this.cardConfig;
    const time = progress * Math.PI * 2;
    
    // EFEITO GRAIN (textura)
    this.drawGrainEffect(x, y, width, height, progress);
    
    // PARTÍCULAS DOURADAS AVANÇADAS
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time;
      const radiusBase = 60 + 30 * Math.sin(time * 1.5 + i);
      const particleX = x + width / 2 + Math.cos(angle) * radiusBase;
      const particleY = y + height / 2 + Math.sin(angle) * radiusBase;
      
      this.ctx.save();
      const alpha = 0.2 + 0.5 * Math.sin(time * 3 + i);
      this.ctx.globalAlpha = alpha;
      
      // Partícula com glow
      this.ctx.shadowColor = this.colors.gold.primary;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(particleX, particleY, 2 + Math.sin(time * 4 + i), 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.gold.primary;
      this.ctx.fill();
      
      this.ctx.restore();
    }
    
    // CANTOS DECORATIVOS ELABORADOS
    this.drawCornerDecorations(x, y, width, height, progress);
    
    // EFEITO DE BRILHO MÓVEL
    this.drawMovingShine(x, y, width, height, progress);
    
    // BORDA INTERNA SUTIL
    this.ctx.save();
    this.createRoundedRect(x + 4, y + 4, width - 8, height - 8, this.cardConfig.borderRadius - 2);
    this.ctx.strokeStyle = `rgba(206, 191, 159, ${0.1 + 0.1 * Math.sin(time * 2)})`;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }
  
  drawGrainEffect(x, y, width, height, progress) {
    // Simular efeito grain com pontos pequenos
    this.ctx.save();
    this.ctx.globalAlpha = 0.03;
    
    for (let i = 0; i < 200; i++) {
      const grainX = x + Math.random() * width;
      const grainY = y + Math.random() * height;
      
      this.ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      this.ctx.fillRect(grainX, grainY, 1, 1);
    }
    
    this.ctx.restore();
  }
  
  drawCornerDecorations(x, y, width, height, progress) {
    const time = progress * Math.PI * 2;
    const intensity = 0.6 + 0.4 * Math.sin(time * 2);
    
    this.ctx.strokeStyle = `rgba(192, 130, 41, ${intensity})`;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    
    // Canto superior esquerdo - cruz decorativa
    this.ctx.beginPath();
    this.ctx.moveTo(x + 20, y + 30);
    this.ctx.lineTo(x + 45, y + 30);
    this.ctx.moveTo(x + 32.5, y + 17.5);
    this.ctx.lineTo(x + 32.5, y + 42.5);
    this.ctx.stroke();
    
    // Canto superior direito - linhas angulares
    this.ctx.beginPath();
    this.ctx.moveTo(x + width - 45, y + 20);
    this.ctx.lineTo(x + width - 20, y + 20);
    this.ctx.lineTo(x + width - 20, y + 45);
    this.ctx.stroke();
    
    // Canto inferior esquerdo - círculo decorativo
    this.ctx.beginPath();
    this.ctx.arc(x + 32, y + height - 32, 15, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Canto inferior direito - cruz decorativa
    this.ctx.beginPath();
    this.ctx.moveTo(x + width - 45, y + height - 30);
    this.ctx.lineTo(x + width - 20, y + height - 30);
    this.ctx.moveTo(x + width - 32.5, y + height - 42.5);
    this.ctx.lineTo(x + width - 32.5, y + height - 17.5);
    this.ctx.stroke();
  }
  
  drawMovingShine(x, y, width, height, progress) {
    // Efeito de brilho que se move pelo card
    const shineX = x + (width * progress);
    
    const shineGradient = this.ctx.createLinearGradient(
      shineX - 30, y,
      shineX + 30, y
    );
    shineGradient.addColorStop(0, 'transparent');
    shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    shineGradient.addColorStop(1, 'transparent');
    
    this.ctx.save();
    this.createRoundedRect(x, y, width, height, this.cardConfig.borderRadius);
    this.ctx.clip();
    
    this.ctx.fillStyle = shineGradient;
    this.ctx.fillRect(shineX - 30, y, 60, height);
    
    this.ctx.restore();
  }
  
  async renderCard(imageBlob, userName, progress = 0.5) {
    console.log('🎨 Renderizando card completo...', { userName, progress });
    
    // Aplicar movimento de magnetismo e tilt
    const { cardX, cardY, tiltX, tiltY } = this.calculateCardMovement(progress);
    
    // Salvar estado do contexto para aplicação de transformações
    this.ctx.save();
    
    // 1. Fundo do canvas
    this.drawBackground();
    
    // 2. Aplicar transformações de movimento (tilt/magnetismo)
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate(tiltX * 0.02); // Rotação sutil no eixo X
    this.ctx.scale(1 + tiltY * 0.01, 1 + tiltX * 0.01); // Escala sutil
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    
    // 3. Fundo do card com efeitos complexos
    this.drawCardBackground(cardX, cardY, progress);
    
    // 4. Imagem do usuário
    const imageSize = 140;
    const imageX = cardX + (this.cardConfig.width - imageSize) / 2;
    const imageY = cardY + 70;
    
    await this.drawUserImage(imageBlob, imageX, imageY, imageSize);
    
    // 5. Nome do usuário (maior e mais proeminente)
    const nameY = imageY + imageSize + 50;
    this.drawText(userName, cardX + this.cardConfig.width / 2, nameY, {
      font: 'bold 32px Orbitron',
      color: this.colors.text.primary,
      glow: true
    });
    
    // 6. Subtitle (Festa 800)
    const subtitleY = nameY + 45;
    this.drawText('FESTA 800', cardX + this.cardConfig.width / 2, subtitleY, {
      font: 'bold 20px Exo 2',
      color: this.colors.text.secondary
    });
    
    // 7. Status com estilo especial
    const statusY = subtitleY + 35;
    this.drawStatusBadge(cardX + this.cardConfig.width / 2, statusY, 'TIME TRAVELER', progress);
    
    // 8. Informações de contato/data
    const contactY = statusY + 50;
    this.drawText('27.09.2025', cardX + this.cardConfig.width / 2, contactY, {
      font: '14px Orbitron',
      color: this.colors.gold.secondary
    });
    
    // 9. Handle/username
    const handleY = contactY + 25;
    this.drawText(`@${userName.toLowerCase().replace(/\s+/g, '')}`, cardX + this.cardConfig.width / 2, handleY, {
      font: '12px Exo 2',
      color: this.colors.text.secondary,
      alpha: 0.7
    });
    
    // 10. Decorações animadas complexas
    this.drawDecorations(cardX, cardY, progress);
    
    // 11. Botão de contato (visual)
    this.drawContactButton(cardX, cardY, progress);
    
    this.ctx.restore();
    
    console.log('✅ Card renderizado com movimento');
    return this.canvas;
  }
  
  calculateCardMovement(progress) {
    // Simular movimento magnetismo e tilt como nos ProfileCards
    const time = progress * Math.PI * 2;
    
    // Movimento base do card (magnetismo)
    const magnetismX = 15 * Math.sin(time * 1.2);
    const magnetismY = 10 * Math.cos(time * 0.8);
    
    // Posição base centralizada
    const baseX = (this.canvas.width - this.cardConfig.width) / 2;
    const baseY = (this.canvas.height - this.cardConfig.height) / 2;
    
    // Aplicar movimento
    const cardX = baseX + magnetismX;
    const cardY = baseY + magnetismY;
    
    // Tilt (inclinação)
    const tiltX = 8 * Math.sin(time * 1.5);
    const tiltY = 6 * Math.cos(time * 1.1);
    
    return { cardX, cardY, tiltX, tiltY };
  }
  
  drawStatusBadge(centerX, centerY, text, progress) {
    const badgeWidth = 160;
    const badgeHeight = 28;
    const badgeX = centerX - badgeWidth / 2;
    const badgeY = centerY - badgeHeight / 2;
    
    // Fundo do badge com gradiente
    const badgeGradient = this.ctx.createLinearGradient(
      badgeX, badgeY,
      badgeX + badgeWidth, badgeY + badgeHeight
    );
    badgeGradient.addColorStop(0, 'rgba(192, 130, 41, 0.3)');
    badgeGradient.addColorStop(1, 'rgba(206, 191, 159, 0.2)');
    
    this.ctx.save();
    
    // Desenhar fundo do badge
    this.ctx.fillStyle = badgeGradient;
    this.ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    // Borda do badge
    this.ctx.strokeStyle = this.colors.gold.primary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    // Texto do badge
    this.drawText(text, centerX, centerY, {
      font: 'bold 12px Orbitron',
      color: this.colors.gold.primary,
      glow: true
    });
    
    this.ctx.restore();
  }
  
  drawContactButton(cardX, cardY, progress) {
    const { width, height } = this.cardConfig;
    const buttonY = cardY + height - 50;
    const buttonX = cardX + width / 2;
    
    // Botão visual de contato
    const buttonWidth = 100;
    const buttonHeight = 30;
    
    this.ctx.save();
    
    // Fundo do botão
    const buttonGradient = this.ctx.createLinearGradient(
      buttonX - buttonWidth / 2, buttonY - buttonHeight / 2,
      buttonX + buttonWidth / 2, buttonY + buttonHeight / 2
    );
    buttonGradient.addColorStop(0, this.colors.gold.primary);
    buttonGradient.addColorStop(1, this.colors.gold.secondary);
    
    this.ctx.fillStyle = buttonGradient;
    this.ctx.fillRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
    
    // Texto do botão
    this.drawText('Download', buttonX, buttonY, {
      font: 'bold 11px Orbitron',
      color: '#000000'
    });
    
    this.ctx.restore();
  }
  
  async generateVideo(imageBlob, userName, options = {}) {
    const {
      fps = 30,
      duration = 3,
      width = 1080,
      height = 1920
    } = options;
    
    console.log('🎬 Gerando vídeo...', { fps, duration, width, height });
    
    // Criar canvas
    this.createCanvas(width, height);
    
    const totalFrames = fps * duration;
    const frames = [];
    
    // Gerar frames
    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / totalFrames;
      
      console.log(`📸 Renderizando frame ${frame + 1}/${totalFrames}`);
      
      // Renderizar card com animação
      await this.renderCard(imageBlob, userName, progress);
      
      // Converter para blob
      const frameBlob = await new Promise(resolve => {
        this.canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      frames.push(frameBlob);
    }
    
    console.log('🎞️ Criando vídeo a partir dos frames...');
    
    // Criar vídeo usando MediaRecorder
    const videoBlob = await this.createVideoFromFrames(frames, fps);
    
    console.log('✅ Vídeo gerado com sucesso');
    return videoBlob;
  }
  
  async createVideoFromFrames(frames, fps) {
    return new Promise((resolve, reject) => {
      // Criar canvas temporário para renderização
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Configurar MediaRecorder
      const stream = tempCanvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps para alta qualidade
      });
      
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('🎥 Vídeo criado:', { size: blob.size, type: blob.type });
        resolve(blob);
      };
      
      recorder.onerror = (e) => {
        console.error('❌ Erro no MediaRecorder:', e);
        reject(e);
      };
      
      // Iniciar gravação
      recorder.start();
      
      // Renderizar frames sequencialmente
      let currentFrame = 0;
      
      const renderFrame = () => {
        if (currentFrame >= frames.length) {
          // Finalizar gravação
          setTimeout(() => recorder.stop(), 100);
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          // Limpar canvas
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Desenhar frame
          tempCtx.drawImage(img, 0, 0);
          
          // Próximo frame
          currentFrame++;
          setTimeout(renderFrame, 1000 / fps);
        };
        
        img.src = URL.createObjectURL(frames[currentFrame]);
      };
      
      // Iniciar renderização
      setTimeout(renderFrame, 100);
    });
  }
  
  cleanup() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}

// Tornar disponível globalmente
window.CanvasCardRenderer = CanvasCardRenderer;