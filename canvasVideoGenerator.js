/**
 * Canvas Video Generator - Festa 800
 * Integra o CanvasCardRenderer com a interface existente
 */

class CanvasVideoGenerator {
  constructor() {
    this.renderer = null;
    this.isProcessing = false;
  }
  
  async initialize() {
    console.log('🚀 Inicializando Canvas Video Generator...');
    
    this.renderer = new CanvasCardRenderer();
    await this.renderer.initialize();
    
    console.log('✅ Canvas Video Generator pronto');
  }
  
  async generateVideo(imageBlob, userName, options = {}) {
    if (this.isProcessing) {
      throw new Error('Já está processando um vídeo');
    }
    
    this.isProcessing = true;
    
    try {
      console.log('🎬 Iniciando geração de vídeo Canvas...', { userName });
      
      const defaultOptions = {
        fps: 30,
        duration: 3,
        width: 1080,
        height: 1920
      };
      
      const finalOptions = { ...defaultOptions, ...options };
      
      // Gerar vídeo usando Canvas puro
      const videoBlob = await this.renderer.generateVideo(imageBlob, userName, finalOptions);
      
      console.log('✅ Vídeo Canvas gerado com sucesso:', {
        size: videoBlob.size,
        type: videoBlob.type
      });
      
      return videoBlob;
      
    } catch (error) {
      console.error('❌ Erro ao gerar vídeo Canvas:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
  
  cleanup() {
    if (this.renderer) {
      this.renderer.cleanup();
    }
  }
  
  // Método para testar a renderização de um frame único
  async generateTestFrame(imageBlob, userName) {
    console.log('🧪 Gerando frame de teste...');
    
    this.renderer.createCanvas(1080, 1920);
    await this.renderer.renderCard(imageBlob, userName, 0.5);
    
    return new Promise(resolve => {
      this.renderer.canvas.toBlob(resolve, 'image/png', 1.0);
    });
  }
}

// Tornar disponível globalmente
window.CanvasVideoGenerator = CanvasVideoGenerator;