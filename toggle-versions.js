// Script para alternar entre versão vanilla e React
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleReactBtn');
  const reactContainer = document.getElementById('react-card-creator');
  const vanillaContainer = document.querySelector('.container');
  
  let isReactActive = false;
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (!isReactActive) {
        // Ativar React e ocultar vanilla
        console.log('🚀 Ativando versão React...');
        
        if (reactContainer) {
          reactContainer.style.display = 'block';
        }
        
        if (vanillaContainer) {
          vanillaContainer.style.display = 'none';
        }
        
        // Inicializar React se ainda não foi
        if (window.initCardCreator) {
          window.initCardCreator();
        }
        
        toggleBtn.textContent = '⬅️ Voltar para Versão Original';
        isReactActive = true;
        
      } else {
        // Voltar para vanilla
        console.log('🔄 Voltando para versão original...');
        
        if (reactContainer) {
          reactContainer.style.display = 'none';
        }
        
        if (vanillaContainer) {
          vanillaContainer.style.display = 'block';
        }
        
        toggleBtn.textContent = '🚀 Testar Nova Versão React';
        isReactActive = false;
      }
    });
  }
});