// Seleciona os botões
const btnRecebimento = document.getElementById('recebimento');
const btnEncarregadas = document.getElementById('encarregadas');
const btnGestao = document.getElementById('gestao');
const loginError = document.getElementById('login-error');

// Botões "Em breve"

const btnAlmoxarifado = document.querySelector('button:nth-of-type(3)');

// Redirecionamento ao clicar em "Rouparia"
btnRecebimento.addEventListener('click', () => {
  loginError.textContent = ""; // limpa mensagem
  window.location.href = "rouparia/rouparia.html"; // redireciona
});

// Redirecionamento ao clicar em "Encarregadas"
btnEncarregadas.addEventListener('click', () => {
  loginError.textContent = ""; // limpa mensagem
  window.location.href = "encarregadas/encarregadas.html"; // redireciona
});

// Redirecionamento ao clicar em "Gestão" com verificação de senha
btnGestao.addEventListener('click', () => {
  loginError.textContent = ""; // limpa mensagem

  const senha = prompt("Digite a senha para acessar Gestão:");

  if(senha === "1") { // aqui você define a senha desejada
    window.location.href = "adm/consulta.html";
  } else if (senha !== null) { // se não cancelar
    loginError.textContent = "Senha incorreta! Acesso negado.";
  }
});

// Função para exibir mensagem engraçada/profissional nos botões "Em breve"
function mostrarMensagemBreve() {
  loginError.textContent = "O planejador ainda não conseguiu chegar até aqui, em breve estará disponível 😉";
}

// Eventos para botões "Em breve"
btnAlmoxarifado.addEventListener('click', mostrarMensagemBreve);
