// Seleciona os botões pelo ID
const btnRouparia = document.getElementById('btn-rouparia');
const btnGestao = document.getElementById('btn-gestao');
const loginError = document.getElementById('login-error');

// Botões "Em breve"
const btnEncarregadas = document.querySelector('button:nth-of-type(2)');
const btnAlmoxarifado = document.querySelector('button:nth-of-type(3)');

// Redirecionamento para Rouparia
btnRouparia.addEventListener('click', () => {
  loginError.textContent = ""; // limpa mensagem
  window.location.href = "rouparia/rouparia.html";
});

// Botão Gestão com senha simples
btnGestao.addEventListener('click', () => {
  const senha = prompt("Digite a senha para acessar a Gestão:");
  if (senha === "1") { // aqui você define a senha desejada
    loginError.textContent = "";
    window.location.href = "adm/consulta.html";
  } else if (senha === null) {
    // usuário cancelou o prompt, não faz nada
    loginError.textContent = "";
  } else {
    loginError.textContent = "Senha incorreta! Acesso negado.";
  }
});

// Função para exibir mensagem engraçada/profissional nos botões "Em breve"
function mostrarMensagemBreve() {
  loginError.textContent = "O planejador ainda não conseguiu chegar até aqui, em breve estará disponível 😉";
}

// Eventos para botões "Em breve"
btnEncarregadas.addEventListener('click', mostrarMensagemBreve);
btnAlmoxarifado.addEventListener('click', mostrarMensagemBreve);
