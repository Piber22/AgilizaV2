// =============================
// ENVIO DE DADOS E INICIALIZAÇÃO
// uniformes-envio.js
// =============================

// ── Verificar conectividade real ──────────────────────────────────────────────
// fetch com no-cors NUNCA lança exceção — a resposta opaca é sempre "sucesso"
// mesmo sem internet. O HEAD com cors no webAppUrl é bloqueado pelo CORS do
// Google Apps Script. A solução é pingar um recurso externo pequeno que aceita
// no-cors — se lançar exceção, é NetworkError real (sem internet).
async function ev_verificarConectividade() {
    if (!navigator.onLine) return false;

    try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 5000);

        await fetch('https://www.google.com/favicon.ico', {
            method: 'GET',
            mode:   'no-cors',
            cache:  'no-store',
            signal: controller.signal
        });

        clearTimeout(timeout);
        return true; // respondeu = há internet
    } catch (e) {
        return false; // AbortError (timeout) ou NetworkError = sem internet
    }
}

// ── Enviar para o Google Sheets (no-cors, fire-and-forget) ───────────────────
async function ev_enviarParaSheets(registros) {
    await fetch(webAppUrl, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(registros)
    });
    // Com no-cors a resposta é sempre opaca — se não lançou, consideramos enviado
}

// ── Enviar Dados ─────────────────────────────────────────────────────────────
async function enviarDados() {
    mostrarLoading();

    const agora   = new Date();
    const data    = agora.toLocaleDateString('pt-BR');
    const horario = agora.toLocaleTimeString('pt-BR');

    const registros = funcionariosSelecionados.map((nome, index) => {
        let jaleco = '';
        let calca  = '';

        if (tipoOperacao === 'entrega') {
            const t = tamanhosEscolhidos[nome] || {};
            jaleco  = t.jaleco || '';
            calca   = t.calca  || '';
        } else if (abaAtiva === 'ci') {
            // Devolução CI: tamanhos informados manualmente no modal de tamanho
            const t = tamanhosEscolhidos[nome] || {};
            jaleco  = t.jaleco || '';
            calca   = t.calca  || '';
        } else {
            const t = tamanhosHistorico[nome];
            if (t && typeof t === 'object') {
                jaleco = t.jaleco || '';
                calca  = t.calca  || '';
            } else if (typeof t === 'string') {
                jaleco = t;
                calca  = t;
            }
        }

        return {
            data,
            horario,
            funcionario: nome,
            tipo:        tipoOperacao,
            origem:      abaAtiva,
            enfermeiro:  abaAtiva === 'ci' ? dadosCI.enfermeiro : '',
            jaleco,
            calca,
            assinatura:  assinaturasColetadas[index]
        };
    });

    // ── 1) Verificar conectividade REAL antes de tentar enviar ───────────────
    // fetch com no-cors nunca lança exceção, mesmo sem internet.
    // Por isso testamos a conexão separadamente antes de disparar o envio.
    const temConexao = await ev_verificarConectividade();

    if (!temConexao) {
        // ── 2a) Sem conexão → salvar na fila offline imediatamente ──────────
        esconderLoading();
        try {
            await oq_salvarNaFila(registros);
            await oq_atualizarBadge();
            oq_mostrarToast('📶 Sem sinal — registro salvo. Será enviado automaticamente.', 'offline');
            resetarSistema();
        } catch (dbError) {
            console.error('Falha ao salvar offline:', dbError);
            alert('❌ Sem conexão e não foi possível salvar localmente. Tente novamente.');
        }
        return;
    }

    // ── 2b) Com conexão → enviar normalmente ────────────────────────────────
    try {
        await ev_enviarParaSheets(registros);

        esconderLoading();
        await verificarPendencias();
        resetarSistema();

    } catch (error) {
        // Erro inesperado durante o envio (ex: Firebase lançou) → fila offline
        esconderLoading();
        console.warn('Erro durante envio, salvando offline.', error);

        try {
            await oq_salvarNaFila(registros);
            await oq_atualizarBadge();
            oq_mostrarToast('⚠️ Erro no envio — registro salvo localmente.', 'offline');
            resetarSistema();
        } catch (dbError) {
            console.error('Falha ao salvar offline:', dbError);
            alert('❌ Falha no envio e não foi possível salvar localmente. Tente novamente.');
        }
    }
}

// ── Inicialização ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (typeof oq_inicializar === 'function') oq_inicializar(webAppUrl);

    carregarFuncionarios();
    inicializarAbas();
    inicializarAbaCI();

    document.getElementById('buscaInput').addEventListener('input', (e) => {
        renderizarFuncionarios(e.target.value);
    });

    document.getElementById('limparSelecaoBtn').addEventListener('click', () => {
        funcionariosSelecionados = [];
        atualizarInterfaceSelecao();
    });

    document.getElementById('entregaMultiplaBtn').addEventListener('click', () => {
        if (funcionariosSelecionados.length > 0)
            verificarPendenciaAntesDaEntrega(funcionariosSelecionados);
    });

    document.getElementById('devolucaoMultiplaBtn').addEventListener('click', () => {
        if (funcionariosSelecionados.length > 0)
            iniciarOperacao(funcionariosSelecionados, 'devolucao');
    });

    // Modal de tamanho
    document.getElementById('cancelarTamanhoBtn').addEventListener('click', () => {
        fecharModalTamanho();
        resetarSistema();
    });

    document.getElementById('avancarAssinaturaBtn').addEventListener('click', () => {
        fecharModalTamanho();
        abrirModalAssinatura();
    });

    // Modal de assinatura
    document.getElementById('limparAssinaturaBtn').addEventListener('click', limparAssinatura);

    document.getElementById('cancelarAssinaturaBtn').addEventListener('click', () => {
        fecharModalAssinatura();
        resetarSistema();
    });

    document.getElementById('confirmarAssinaturaBtn').addEventListener('click', confirmarAssinatura);
});