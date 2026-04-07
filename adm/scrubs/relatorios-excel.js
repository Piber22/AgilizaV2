// ============================================================
// GERADOR DE RELATÓRIO EXCEL — relatorios-excel.js
//
// Estrutura da planilha:
//   Data | Horário | Funcionário | Tipo | Origem | Enfermeiro | Jaleco | Calça | Assinatura
//
// Abas geradas:
//   1. Movimentações — listagem completa do período filtrado
//   2. Resumo Jaleco  — entregas/devoluções/saldo por tamanho de jaleco
//   3. Resumo Calça   — entregas/devoluções/saldo por tamanho de calça
//   4. Pendências     — quem está com uniforme ainda não devolvido
// ============================================================

const CONFIGURACOES_EXCEL = {
    nomeArquivo: 'relatorio_uniformes',
    tamanhos: ['P', 'M', 'G', 'GG', 'EG', 'EXG'],

    abas: {
        movimentacoes: true,
        resumoJaleco:  true,
        resumoCalca:   true,
        pendencias:    true
    },

    colunasMovimentacoes: ['Data', 'Horário', 'Funcionário', 'Tipo', 'Origem', 'Enfermeiro', 'Jaleco', 'Calça'],
    colunasPendencias:    ['Funcionário', 'Origem', 'Enfermeiro', 'Jaleco', 'Calça', 'Data Entrega', 'Horário', 'Dias Pendente'],

    largurasColunas: {
        movimentacoes: [12, 10, 30, 12, 14, 25, 10, 10],
        resumo:        [10, 12, 14, 12],
        pendencias:    [30, 14, 25, 10, 10, 14, 10, 14]
    }
};

// ============================================================
// FUNÇÃO PRINCIPAL
// origemAtiva: 'todos' | 'autorizado' | 'ci'
// ============================================================
function gerarExcel(dadosFiltrados, calcularPendencias, contarPorTamanho, origemAtiva) {
    mostrarLoading('Gerando Excel...');

    try {
        const wb = XLSX.utils.book_new();
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim    = document.getElementById('dataFim').value;
        const tamanhos   = CONFIGURACOES_EXCEL.tamanhos;

        const origemLabel = origemAtiva === 'ci' ? ' (CI)' : origemAtiva === 'autorizado' ? ' (Autorizado)' : '';

        // — ABA: MOVIMENTAÇÕES —
        if (CONFIGURACOES_EXCEL.abas.movimentacoes) {
            const linhas = dadosFiltrados.map(item => {
                const mapa = {
                    'Data':        item.data,
                    'Horário':     item.horario,
                    'Funcionário': item.funcionario,
                    'Tipo':        item.tipo === 'entrega' ? 'ENTREGA' : 'DEVOLUÇÃO',
                    'Origem':      item.origem,
                    'Enfermeiro':  item.enfermeiro || '',
                    'Jaleco':      item.jaleco || '',
                    'Calça':       item.calca  || ''
                };
                const linha = {};
                CONFIGURACOES_EXCEL.colunasMovimentacoes.forEach(col => { linha[col] = mapa[col] ?? ''; });
                return linha;
            });

            const ws = XLSX.utils.json_to_sheet(linhas);
            aplicarLarguras(ws, CONFIGURACOES_EXCEL.largurasColunas.movimentacoes);
            XLSX.utils.book_append_sheet(wb, ws, 'Movimentações' + origemLabel);
        }

        // — ABA: RESUMO JALECO —
        if (CONFIGURACOES_EXCEL.abas.resumoJaleco) {
            const ws = gerarAbaResumo(dadosFiltrados, contarPorTamanho, 'jaleco', tamanhos);
            XLSX.utils.book_append_sheet(wb, ws, 'Resumo Jaleco' + origemLabel);
        }

        // — ABA: RESUMO CALÇA —
        if (CONFIGURACOES_EXCEL.abas.resumoCalca) {
            const ws = gerarAbaResumo(dadosFiltrados, contarPorTamanho, 'calca', tamanhos);
            XLSX.utils.book_append_sheet(wb, ws, 'Resumo Calça' + origemLabel);
        }

        // — ABA: PENDÊNCIAS —
        if (CONFIGURACOES_EXCEL.abas.pendencias) {
            const pendencias = calcularPendencias();

            const linhas = pendencias.map(item => {
                const mapa = {
                    'Funcionário':   item.funcionario,
                    'Origem':        item.origem || '',
                    'Enfermeiro':    item.enfermeiro || '',
                    'Jaleco':        item.jaleco || '',
                    'Calça':         item.calca  || '',
                    'Data Entrega':  item.data,
                    'Horário':       item.horario,
                    'Dias Pendente': item.diasPendente
                };
                const linha = {};
                CONFIGURACOES_EXCEL.colunasPendencias.forEach(col => { linha[col] = mapa[col] ?? ''; });
                return linha;
            });

            const ws = XLSX.utils.json_to_sheet(linhas);
            aplicarLarguras(ws, CONFIGURACOES_EXCEL.largurasColunas.pendencias);
            XLSX.utils.book_append_sheet(wb, ws, 'Pendências' + origemLabel);
        }

        const sufixoOrigem = origemAtiva !== 'todos' ? `_${origemAtiva}` : '';
        const nomeArquivo  = `${CONFIGURACOES_EXCEL.nomeArquivo}${sufixoOrigem}_${dataInicio}_${dataFim}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);

        esconderLoading();
        mostrarToast('Excel gerado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        esconderLoading();
        mostrarToast('Erro ao gerar Excel', 'error');
    }
}

// Gera aba de resumo por tamanho para jaleco ou calça
function gerarAbaResumo(dadosFiltrados, contarPorTamanho, campo, tamanhos) {
    const entregas   = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'entrega'),   campo);
    const devolucoes = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'devolucao'), campo);

    // Coleta todos os tamanhos que apareceram, mesmo fora da lista base
    const todosTamanhos = [...new Set([...tamanhos, ...Object.keys(entregas), ...Object.keys(devolucoes)])];

    const resumo = todosTamanhos.map(tam => ({
        'Tamanho':    tam,
        'Entregas':   entregas[tam]   || 0,
        'Devoluções': devolucoes[tam] || 0,
        // Saldo negativo = pendência (mais saídas que retornos)
        'Saldo':      (devolucoes[tam] || 0) - (entregas[tam] || 0)
    }));

    resumo.push({
        'Tamanho':    'TOTAL',
        'Entregas':   resumo.reduce((s, r) => s + r['Entregas'],   0),
        'Devoluções': resumo.reduce((s, r) => s + r['Devoluções'], 0),
        'Saldo':      resumo.reduce((s, r) => s + r['Saldo'],      0)
    });

    const ws = XLSX.utils.json_to_sheet(resumo);
    aplicarLarguras(ws, CONFIGURACOES_EXCEL.largurasColunas.resumo);
    return ws;
}

function aplicarLarguras(ws, larguras) {
    if (!larguras || larguras.length === 0) return;
    ws['!cols'] = larguras.map(w => ({ wch: w }));
}