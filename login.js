// Seleciona os botões
const btnRecebimento = document.getElementById('recebimento');
const btnTroca = document.querySelector('button:nth-of-type(2)');
const btnEfetivo = document.querySelector('button:nth-of-type(3)');
const loginError = document.getElementById('login-error');

// Redirecionamento ao clicar em "Recebimento de enxoval"
btnRecebimento.addEventListener('click', () => {
  loginError.textContent = ""; // limpa qualquer mensagem anterior
  window.location.href = "recebimento.html"; // redireciona
});

// Função para exibir mensagem engraçada/profissional nos botões "Em breve"
function mostrarMensagemBreve() {
  loginError.textContent = "O planejador ainda não conseguiu chegar até aqui, em breve estará disponível 😉";
}

// Adiciona evento de clique aos botões "Em breve"
btnTroca.addEventListener('click', mostrarMensagemBreve);
btnEfetivo.addEventListener('click', mostrarMensagemBreve);
