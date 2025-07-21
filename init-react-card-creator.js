// Inicializar React Card Creator
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco para garantir que o React foi carregado
  setTimeout(() => {
    const container = document.getElementById('react-card-creator');
    if (container && window.React && window.ReactDOM) {
      // O React app será carregado automaticamente pelo script gerado
      console.log('✅ React Card Creator carregado com sucesso!');
    } else {
      console.error('❌ Erro ao carregar React Card Creator');
    }
  }, 100);
});