// =============================
// ENVIO DE DADOS E INICIALIZAÇÃO
// uniformes-envio.js
// =============================

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

    // ── Enviar para o Google Sheets (fonte de verdade principal) ─────────────
    // fetch com no-cors nunca rejeita — qualquer exceção aqui é falha de rede real.
    let sheetsOk = false;
    try {
        await fetch(webAppUrl, {
            method:  'POST',
            mode:    'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(registros)
        });
        sheetsOk = true; // sem exceção = enviado (resposta opaca é esperada com no-cors)
    } catch (errSheets) {
        console.warn('Falha ao enviar para Sheets:', errSheets);
    }

    // ── Se Sheets falhou: salvar na fila offline e parar ─────────────────────
    // NÃO tenta Firebase antes de confirmar que Sheets falhou,
    // para evitar qualquer cenário de envio parcial → duplo registro.
    if (!sheetsOk) {
        esconderLoading();
        try {
            await oq_salvarNaFila(registros);
            await oq_atualizarBadge();
            oq_mostrarToast('Sem conexão — salvo localmente', 'offline');
            resetarSistema();
        } catch (dbError) {
            console.error('Falha ao salvar offline:', dbError);
            alert('❌ Sem conexão e não foi possível salvar localmente. Tente novamente.');
        }
        return;
    }

    // ── Sheets confirmado: disparar Firebase de forma independente ────────────
    // Falha no Firebase não afeta o fluxo — já foi salvo no Sheets.
    try {
        await fb_enviarRegistros(registros);
    } catch (errFb) {
        console.warn('Firebase falhou (ignorado — Sheets já salvou):', errFb);
    }

    esconderLoading();
    await verificarPendencias();
    resetarSistema();
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