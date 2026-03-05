// ============================================================
// GERADOR DE RELATÓRIO EXCEL — relatorios-excel.js
//
// Este arquivo controla exclusivamente a geração do .xlsx.
// Para personalizar o relatório:
//   - Edite CONFIGURACOES_EXCEL para ajustar nome do arquivo,
//     abas ativas, colunas exibidas e formatação de saldo.
//   - Cada aba pode ser habilitada/desabilitada individualmente.
//   - A coluna "Saldo" usa valor NEGATIVO para indicar pendência
//     (ex: 3 entregas e 1 devolução = Saldo -2).
// ============================================================

const CONFIGURACOES_EXCEL = {
    // Nome base do arquivo gerado (datas do filtro serão anexadas)
    nomeArquivo: 'relatorio_uniformes',

    // Tamanhos considerados no resumo
    tamanhos: ['P', 'M', 'G', 'GG', 'EG'],

    // Abas que serão incluídas no Excel
    abas: {
        movimentacoes: true,
        resumoPorTamanho: true,
        pendencias: true
    },

    // Colunas da aba Movimentações
    // Remova ou reordene os itens para ajustar o que aparece
    colunasMovimentacoes: ['Data', 'Horário', 'Funcionário', 'Tipo', 'Tamanho'],

    // Colunas da aba Pendências
    // Remova ou reordene os itens para ajustar o que aparece
    colunasPendencias: ['Funcionário', 'Tamanho', 'Data Entrega', 'Horário', 'Dias Pendente'],

    // Larguras das colunas (em caracteres) para cada aba
    largurasColunas: {
        movimentacoes: [12, 10, 30, 12, 10],
        resumoPorTamanho: [10, 12, 14, 12],
        pendencias: [30, 10, 14, 10, 14]
    }
};

// ============================================================
// FUNÇÃO PRINCIPAL — chamada pelo relatorios.js
// Recebe: dadosFiltrados, calcularPendencias, contarPorTamanho
// ============================================================
function gerarExcel(dadosFiltrados, calcularPendencias, contarPorTamanho) {
    mostrarLoading('Gerando Excel...');

    try {
        const wb = XLSX.utils.book_new();
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;

        // — ABA: MOVIMENTAÇÕES —
        if (CONFIGURACOES_EXCEL.abas.movimentacoes) {
            const linhasMovimentacoes = dadosFiltrados.map(item => {
                const linha = {};
                const mapa = {
                    'Data': item.data,
                    'Horário': item.horario,
                    'Funcionário': item.funcionario,
                    'Tipo': item.tipo === 'entrega' ? 'ENTREGA' : 'DEVOLUÇÃO',
                    'Tamanho': item.tamanho
                };
                CONFIGURACOES_EXCEL.colunasMovimentacoes.forEach(col => {
                    linha[col] = mapa[col] ?? '';
                });
                return linha;
            });

            const ws = XLSX.utils.json_to_sheet(linhasMovimentacoes);
            aplicarLarguras(ws, CONFIGURACOES_EXCEL.largurasColunas.movimentacoes);
            XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
        }

        // — ABA: RESUMO POR TAMANHO —
        if (CONFIGURACOES_EXCEL.abas.resumoPorTamanho) {
            const entregas = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'entrega'));
            const devolucoes = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'devolucao'));

            // Saldo NEGATIVO = pendência (entregas superam devoluções)
            // Ex: 3 entregas, 1 devolução → Saldo = -2
            const resumo = CONFIGURACOES_EXCEL.tamanhos.map(tam => ({
                'Tamanho': tam,
                'Entregas': entregas[tam] || 0,
                'Devoluções': devolucoes[tam] || 0,
                'Saldo': (devolucoes[tam] || 0) - (entregas[tam] || 0)
            }));

            // Linha de totais
            resumo.push({
                'Tamanho': 'TOTAL',
                'Entregas': resumo.reduce((s, r) => s + r['Entregas'], 0),
                'Devoluções': resumo.reduce((s, r) => s + r['Devoluções'], 0),
                'Saldo': resumo.reduce((s, r) => s + r['Saldo'], 0)
            });

            const ws = XLSX.utils.json_to_sheet(resumo);
            aplicarLarguras(ws, CONFIGURACOES_EXCEL.largurasColunas.resumoPorTamanho);
            XLSX.utils.book_append_sheet(wb, ws, 'Resumo por Tamanho');
        }

        // — ABA: PENDÊNCIAS —
        if (CONFIGURACOES_EXCEL.abas.pendencias) {
            const pendencias = calcularPendencias();

            const linhasPendencias = pendencias.map(item => {
                const linha = {};
                const mapa = {
                    'Funcionário': item.funcionario,
                    'Tamanho': item.tamanho,
                    'Data Entrega': item.data,
                    'Horário': item.horario,
                    'Dias Pendente': item.diasPendente
                };
                CONFIGURACOES_EXCEL.colunasPendencias.forEach(col => {
                    linha[col] = mapa[col] ?? '';
                });
                return linha;
            });

            const ws = XLSX.utils.json_to_sheet(linhasPendencias);
            aplicarLarguras(ws, CONFIGURACOES_EXCEL.largurasColunas.pendencias);
            XLSX.utils.book_append_sheet(wb, ws, 'Pendências');
        }

        const nomeArquivo = `${CONFIGURACOES_EXCEL.nomeArquivo}_${dataInicio}_${dataFim}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);

        esconderLoading();
        mostrarToast('Excel gerado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        esconderLoading();
        mostrarToast('Erro ao gerar Excel', 'error');
    }
}

// Aplica larguras de coluna no worksheet
function aplicarLarguras(ws, larguras) {
    if (!larguras || larguras.length === 0) return;
    ws['!cols'] = larguras.map(w => ({ wch: w }));
}