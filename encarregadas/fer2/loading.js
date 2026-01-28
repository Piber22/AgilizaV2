// ================================================================
// LOADING.JS — MÓDULO COMPARTILHADO PARA TELA DE LOADING
// ================================================================

const LoadingManager = {
  loadingElement: null,
  activeButton: null,

  /**
   * Cria e exibe a tela de loading
   * @param {HTMLElement} button - Botão que foi clicado
   * @param {string} mensagem - Mensagem a exibir (opcional)
   */
  show: function(button, mensagem = "Enviando...") {
    // Desabilita o botão imediatamente
    if (button) {
      this.activeButton = button;
      button.disabled = true;
      button.style.opacity = "0.6";
      button.style.cursor = "not-allowed";
    }

    // Cria o overlay de loading se não existir
    if (!this.loadingElement) {
      this.loadingElement = document.createElement("div");
      this.loadingElement.id = "loading-overlay";
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">${mensagem}</p>
        </div>
      `;
      document.body.appendChild(this.loadingElement);
    } else {
      // Atualiza a mensagem se já existir
      const textElement = this.loadingElement.querySelector(".loading-text");
      if (textElement) textElement.textContent = mensagem;
    }

    // Exibe o loading
    this.loadingElement.style.display = "flex";
  },

  /**
   * Oculta a tela de loading e mostra mensagem de sucesso
   * @param {string} mensagemSucesso - Mensagem de sucesso (opcional)
   * @param {function} callback - Função a executar após fechar (opcional)
   */
  hideWithSuccess: function(mensagemSucesso = "Salvo com sucesso!", callback) {
    if (this.loadingElement) {
      // Substitui spinner por ícone de sucesso
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="success-icon">✓</div>
          <p class="loading-text">${mensagemSucesso}</p>
        </div>
      `;

      // Remove após 1.5 segundos
      setTimeout(() => {
        this.hide();
        if (callback) callback();
      }, 1500);
    }
  },

  /**
   * Oculta a tela de loading e mostra mensagem de erro
   * @param {string} mensagemErro - Mensagem de erro
   */
  hideWithError: function(mensagemErro = "Erro ao enviar. Tente novamente.") {
    if (this.loadingElement) {
      // Substitui spinner por ícone de erro
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="error-icon">✕</div>
          <p class="loading-text" style="color: #ff6b6b;">${mensagemErro}</p>
        </div>
      `;

      // Reabilita o botão
      if (this.activeButton) {
        this.activeButton.disabled = false;
        this.activeButton.style.opacity = "1";
        this.activeButton.style.cursor = "pointer";
      }

      // Remove após 2 segundos
      setTimeout(() => {
        this.hide();
      }, 2000);
    }
  },

  /**
   * Oculta a tela de loading imediatamente
   */
  hide: function() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }

    // Reabilita o botão (caso não tenha sido feito antes)
    if (this.activeButton) {
      this.activeButton.disabled = false;
      this.activeButton.style.opacity = "1";
      this.activeButton.style.cursor = "pointer";
      this.activeButton = null;
    }
  }
};

// Injeta os estilos CSS automaticamente
(function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(32, 31, 32, 0.95);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }

    .loading-content {
      text-align: center;
      animation: slideUp 0.4s ease;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #5b5b5b;
      border-top-color: #E94B22;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .loading-text {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .success-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #4CAF50;
      color: white;
      font-size: 40px;
      line-height: 60px;
      margin: 0 auto 20px;
      animation: scaleIn 0.4s ease;
    }

    .error-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #ff6b6b;
      color: white;
      font-size: 40px;
      line-height: 60px;
      margin: 0 auto 20px;
      animation: shakeError 0.5s ease;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes shakeError {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;
  document.head.appendChild(style);
})();