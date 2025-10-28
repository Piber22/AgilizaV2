// === CONFIGURAÇÃO DA SENHA ===
const SENHA_CORRETA = "1"; // Altere aqui se quiser

// === ELEMENTOS DO DOM ===
const btnCronograma = document.getElementById("btn-cronograma");
const errorMsg = document.getElementById("login-error");

// === FUNÇÃO PRINCIPAL ===
function protegerAcessoCronograma() {
  btnCronograma.addEventListener("click", function(e) {
    e.preventDefault(); // Impede clique padrão

    const senha = prompt("Digite a senha para acessar o Cronograma:");

    // Usuário cancelou
    if (senha === null) {
      mostrarErro("Acesso cancelado.");
      return;
    }

    // Senha correta
    if (senha === SENHA_CORRETA) {
      window.location.href = 'cronograma/cronograma.html';
    } else {
      mostrarErro("Senha incorreta. Tente novamente.");
    }
  });
}

// === FUNÇÃO AUXILIAR PARA MENSAGEM DE ERRO ===
function mostrarErro(mensagem) {
  errorMsg.textContent = mensagem;
  errorMsg.style.color = "#e74c3c";
  errorMsg.style.opacity = "1";

  // Remove a mensagem após 3 segundos
  setTimeout(() => {
    errorMsg.style.opacity = "0";
    setTimeout(() => errorMsg.textContent = "", 300); // Remove texto após fade
  }, 3000);
}

// === INICIA QUANDO A PÁGINA CARREGA ===
document.addEventListener("DOMContentLoaded", protegerAcessoCronograma);