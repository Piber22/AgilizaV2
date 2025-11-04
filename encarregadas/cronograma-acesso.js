// === CONFIGURAÇÃO DA SENHA ===
const SENHA_CORRETA = "1"; // Mesma senha para Cronograma e Ferramentas

// === ELEMENTOS DO DOM ===
const btnCronograma = document.getElementById("btn-cronograma");
const btnFerramentas = document.getElementById("btn-ferramentas");
const errorMsg = document.getElementById("login-error");

// === FUNÇÃO REUTILIZÁVEL PARA PROTEGER BOTÃO ===
function protegerBotao(botao, urlDestino) {
  botao.addEventListener("click", function(e) {
    e.preventDefault(); // Impede comportamento padrão

    const senha = prompt("Digite a senha para acessar esta área:");

    // Cancelou
    if (senha === null) {
      mostrarErro("Acesso cancelado.");
      return;
    }

    // Senha correta
    if (senha === SENHA_CORRETA) {
      window.location.href = urlDestino;
    } else {
      mostrarErro("Senha incorreta. Tente novamente.");
    }
  });
}

// === FUNÇÃO PARA MOSTRAR ERRO COM FADE ===
function mostrarErro(mensagem) {
  errorMsg.textContent = mensagem;
  errorMsg.style.color = "#e74c3c";
  errorMsg.style.opacity = "1";

  // Fade out após 3 segundos
  setTimeout(() => {
    errorMsg.style.opacity = "0";
    setTimeout(() => {
      errorMsg.textContent = "";
    }, 300);
  }, 3000);
}

// === INICIA QUANDO A PÁGINA CARREGA ===
document.addEventListener("DOMContentLoaded", () => {
  protegerBotao(btnCronograma, 'cronograma/cronograma.html');
  protegerBotao(btnFerramentas, 'ferramentas/ferramentas.html');
});