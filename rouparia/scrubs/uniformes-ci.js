// =============================
// ABA CI — FORMULÁRIO E FLUXO
// uniformes-ci.js
// =============================

// ── Inicialização da aba CI ───────────────────────────────────────────────────
function inicializarAbaCI() {
    const inputNome       = document.getElementById('ciNomeColaborador');
    const inputEnfermeiro = document.getElementById('ciNomeEnfermeiro');
    const btnEntregar     = document.getElementById('ciEntregarBtn');
    const btnDevolucao    = document.getElementById('ciDevolucaoBtn');

    function validarFormularioCI() {
        const nomeOk       = inputNome.value.trim().length >= 3;
        const enfermeiroOk = inputEnfermeiro.value.trim().length >= 3;
        btnEntregar.disabled  = !(nomeOk && enfermeiroOk);
        btnDevolucao.disabled = !nomeOk;
    }

    // Autocomplete: sugere nomes já registrados no histórico

    inputNome.addEventListener('input', validarFormularioCI);
    inputEnfermeiro.addEventListener('input', validarFormularioCI);

    btnEntregar.addEventListener('click', () => {
        const nomeColaborador = inputNome.value.trim();
        const nomeEnfermeiro  = inputEnfermeiro.value.trim();

        if (!nomeColaborador || !nomeEnfermeiro) return;

        dadosCI.colaborador = nomeColaborador;
        dadosCI.enfermeiro  = nomeEnfermeiro;

        iniciarOperacao([nomeColaborador], 'entrega');
    });

    btnDevolucao.addEventListener('click', () => {
        const nomeColaborador = inputNome.value.trim();
        if (!nomeColaborador) return;

        dadosCI.colaborador = nomeColaborador;
        dadosCI.enfermeiro  = '';

        iniciarOperacaoCIDevolucao([nomeColaborador]);
    });
}

// ── Devolução CI: abre modal de tamanho diretamente (colaborador informa) ────
function iniciarOperacaoCIDevolucao(nomes) {
    tipoOperacao             = 'devolucao';
    funcionariosSelecionados = [...nomes];
    tamanhosEscolhidos       = {};
    tamanhosHistorico        = {};
    assinaturasColetadas     = [];
    indiceAssinaturaAtual    = 0;

    abrirModalTamanho();
}

// ── Limpar formulário CI após envio ──────────────────────────────────────────
function limparFormularioCI() {
    const inputNome       = document.getElementById('ciNomeColaborador');
    const inputEnfermeiro = document.getElementById('ciNomeEnfermeiro');
    const btnEntregar     = document.getElementById('ciEntregarBtn');
    const btnDevolucao    = document.getElementById('ciDevolucaoBtn');

    if (inputNome)       inputNome.value       = '';
    if (inputEnfermeiro) inputEnfermeiro.value = '';
    if (btnEntregar)     btnEntregar.disabled  = true;
    if (btnDevolucao)    btnDevolucao.disabled = true;

    dadosCI.colaborador = '';
    dadosCI.enfermeiro  = '';
}