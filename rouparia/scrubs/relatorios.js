// =============================
// CONFIGURAÇÕES
// =============================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRUjsGsLK_m-wD1NLtaQ-BR9qHjwJW47TQYwR23tuQ7RCUKu--yRim0-ExuxYY-Lia4oerHYjKRN2_Z/pub?output=csv";

let dadosCompletos = [];
let dadosFiltrados = [];

// =============================
// 1) INICIALIZAÇÃO
// =============================
document.addEventListener('DOMContentLoaded', () => {
    inicializarDatas();
    configurarEventListeners();
    carregarDados();
});

function inicializarDatas() {
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];

    document.getElementById('dataInicio').value = dataHoje;
    document.getElementById('dataFim').value = dataHoje;
}

function configurarEventListeners() {
    // Filtros
    document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltro);
    document.getElementById('btnHoje').addEventListener('click', () => {
        inicializarDatas();
        aplicarFiltro();
    });

    // Ações
    document.getElementById('btnGerarImagem').addEventListener('click', gerarImagemResumo);
    document.getElementById('btnGerarExcel').addEventListener('click', gerarExcel);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            mudarAba(e.target.dataset.tab);
        });
    });
}

// =============================
// 2) CARREGAR DADOS
// =============================
async function carregarDados() {
    mostrarLoading('Carregando dados...');

    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        dadosCompletos = processarCSV(csvText);
        aplicarFiltro();

        esconderLoading();
        mostrarToast('Dados carregados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        esconderLoading();
        mostrarToast('Erro ao carregar dados. Tente novamente.', 'error');
    }
}

function processarCSV(csvText) {
    const linhas = csvText.split('\n').map(l => l.trim()).filter(l => l);
    const dados = [];

    // Pular cabeçalho
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];

        // Parse CSV considerando campos com vírgula
        const campos = parseCSVLine(linha);

        if (campos.length >= 6) {
            dados.push({
                data: campos[0],
                horario: campos[1],
                funcionario: campos[2],
                tipo: campos[3].toLowerCase(),
                tamanho: campos[4],
                assinatura: campos[5]
            });
        }
    }

    return dados;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// =============================
// 3) FILTRAR DADOS
// =============================
function aplicarFiltro() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (!dataInicio || !dataFim) {
        mostrarToast('Selecione as datas de início e fim', 'error');
        return;
    }

    dadosFiltrados = dadosCompletos.filter(item => {
        const dataItem = converterDataParaISO(item.data);
        return dataItem >= dataInicio && dataItem <= dataFim;
    });

    atualizarTodasAsSecoes();
}

function converterDataParaISO(dataBR) {
    // Converte "04/02/2025" para "2025-02-04"
    const partes = dataBR.split('/');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return dataBR;
}

// =============================
// 4) ATUALIZAR TODAS AS SEÇÕES
// =============================
function atualizarTodasAsSecoes() {
    atualizarVisaoGeral();
    atualizarPorTamanho();
    atualizarPendencias();
}

// =============================
// 5) VISÃO GERAL
// =============================
function atualizarVisaoGeral() {
    const entregas = dadosFiltrados.filter(d => d.tipo === 'entrega');
    const devolucoes = dadosFiltrados.filter(d => d.tipo === 'devolucao');
    const pendencias = calcularPendencias();

    // Atualizar cards de estatísticas
    document.getElementById('totalEntregas').textContent = entregas.length;
    document.getElementById('totalDevolucoes').textContent = devolucoes.length;
    document.getElementById('totalPendentes').textContent = pendencias.length;

    // Atualizar movimentações recentes
    renderizarMovimentacoesRecentes();
}

function renderizarMovimentacoesRecentes() {
    const container = document.getElementById('movimentacoesRecentes');

    if (dadosFiltrados.length === 0) {
        container.innerHTML = '<p class="placeholder">Nenhuma movimentação no período selecionado</p>';
        return;
    }

    // Mostrar últimas 10 movimentações
    const recentes = [...dadosFiltrados].reverse().slice(0, 10);

    container.innerHTML = recentes.map(item => `
        <div class="movimentacao-item ${item.tipo}">
            <div class="item-header">
                <span class="item-nome">${item.funcionario}</span>
                <span class="item-badge badge-${item.tipo}">
                    ${item.tipo === 'entrega' ? '📦 Entrega' : '✅ Devolução'}
                </span>
            </div>
            <div class="item-detalhes">
                <span>📅 ${item.data}</span>
                <span>🕐 ${item.horario}</span>
                ${item.tamanho ? `<span>📏 ${item.tamanho}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// =============================
// 6) POR TAMANHO
// =============================
function atualizarPorTamanho() {
    const tamanhos = ['P', 'M', 'G', 'GG', 'EXG'];

    // Entregas por tamanho
    const entregasPorTam = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'entrega'));
    renderizarTamanhos('entregasPorTamanho', entregasPorTam, tamanhos, false);

    // Devoluções por tamanho
    const devolucoesPorTam = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'devolucao'));
    renderizarTamanhos('devolucoesPorTamanho', devolucoesPorTam, tamanhos, false);

    // Saldo por tamanho
    const saldo = {};
    tamanhos.forEach(tam => {
        saldo[tam] = (entregasPorTam[tam] || 0) - (devolucoesPorTam[tam] || 0);
    });
    renderizarTamanhos('saldoPorTamanho', saldo, tamanhos, true);
}

function contarPorTamanho(dados) {
    const contagem = {};

    dados.forEach(item => {
        if (item.tamanho) {
            contagem[item.tamanho] = (contagem[item.tamanho] || 0) + 1;
        }
    });

    return contagem;
}

function renderizarTamanhos(containerId, dados, tamanhos, mostrarSaldo) {
    const container = document.getElementById(containerId);

    let total = 0;
    const html = tamanhos.map(tam => {
        const valor = dados[tam] || 0;
        total += Math.abs(valor);

        return `
            <div class="tamanho-card ${mostrarSaldo && valor < 0 ? 'negativo' : ''}">
                <div class="tamanho-label">${tam}</div>
                <div class="tamanho-valor">${valor}</div>
            </div>
        `;
    }).join('');

    // Adicionar card de total
    const totalHtml = `
        <div class="tamanho-card" style="grid-column: span 1; background: linear-gradient(135deg, var(--primary) 0%, #e03d08 100%); border-color: var(--primary);">
            <div class="tamanho-label" style="color: white;">TOTAL</div>
            <div class="tamanho-valor" style="color: white;">${mostrarSaldo ? total : Object.values(dados).reduce((a, b) => a + b, 0)}</div>
        </div>
    `;

    container.innerHTML = html + totalHtml;
}

// =============================
// 7) PENDÊNCIAS
// =============================
function atualizarPendencias() {
    const pendencias = calcularPendencias();

    renderizarListaPendencias(pendencias);
    renderizarAnalisePendencias(pendencias);
}

function calcularPendencias() {
    const pendencias = [];
    const entregasPorFuncionario = {};

    // Mapear todas as entregas e devoluções
    dadosCompletos.forEach(item => {
        if (!entregasPorFuncionario[item.funcionario]) {
            entregasPorFuncionario[item.funcionario] = {
                entregas: [],
                devolucoes: []
            };
        }

        if (item.tipo === 'entrega') {
            entregasPorFuncionario[item.funcionario].entregas.push(item);
        } else if (item.tipo === 'devolucao') {
            entregasPorFuncionario[item.funcionario].devolucoes.push(item);
        }
    });

    // Calcular pendências
    Object.keys(entregasPorFuncionario).forEach(funcionario => {
        const registro = entregasPorFuncionario[funcionario];
        const totalEntregas = registro.entregas.length;
        const totalDevolucoes = registro.devolucoes.length;
        const saldo = totalEntregas - totalDevolucoes;

        if (saldo > 0) {
            // Pegar a última entrega sem devolução correspondente
            const entregasSemDevolucao = registro.entregas.slice(totalDevolucoes);

            entregasSemDevolucao.forEach(entrega => {
                pendencias.push({
                    funcionario: funcionario,
                    tamanho: entrega.tamanho,
                    data: entrega.data,
                    horario: entrega.horario,
                    diasPendente: calcularDiasPendentes(entrega.data)
                });
            });
        }
    });

    return pendencias.sort((a, b) => b.diasPendente - a.diasPendente);
}

function calcularDiasPendentes(dataBR) {
    const dataISO = converterDataParaISO(dataBR);
    const dataEntrega = new Date(dataISO);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - dataEntrega);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function renderizarListaPendencias(pendencias) {
    const container = document.getElementById('listaPendencias');

    if (pendencias.length === 0) {
        container.innerHTML = '<p class="placeholder">✅ Nenhuma pendência encontrada!</p>';
        return;
    }

    container.innerHTML = pendencias.map(item => `
        <div class="pendencia-item">
            <div class="item-header">
                <span class="item-nome">${item.funcionario}</span>
                <span class="item-badge badge-pendente">⏳ ${item.diasPendente} dia${item.diasPendente !== 1 ? 's' : ''}</span>
            </div>
            <div class="item-detalhes">
                <span>📅 Entrega: ${item.data}</span>
                <span>🕐 ${item.horario}</span>
                ${item.tamanho ? `<span>📏 ${item.tamanho}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderizarAnalisePendencias(pendencias) {
    const container = document.getElementById('analisePendencias');

    // Calcular estatísticas
    const totalPendencias = pendencias.length;
    const tamanhosMaisPendentes = contarPorTamanho(pendencias);
    const maiorTamanho = Object.keys(tamanhosMaisPendentes).reduce((a, b) =>
        tamanhosMaisPendentes[a] > tamanhosMaisPendentes[b] ? a : b,
        Object.keys(tamanhosMaisPendentes)[0]
    );
    const mediaDias = totalPendencias > 0
        ? Math.round(pendencias.reduce((sum, p) => sum + p.diasPendente, 0) / totalPendencias)
        : 0;

    container.innerHTML = `
        <div class="analise-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <div class="analise-label">Total de Pendências</div>
            <div class="analise-valor">${totalPendencias}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
            <div class="analise-label">Tamanho Mais Pendente</div>
            <div class="analise-valor">${maiorTamanho || '-'}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            <div class="analise-label">Média de Dias</div>
            <div class="analise-valor" style="color: #333;">${mediaDias}</div>
        </div>
    `;
}

// =============================
// 8) GERAR IMAGEM RESUMO
// =============================
async function gerarImagemResumo() {
    mostrarLoading('Gerando imagem...');

    try {
        const canvas = document.getElementById('canvasRelatorio');
        const ctx = canvas.getContext('2d');

        // Configurar tamanho do canvas
        canvas.width = 1080;
        canvas.height = 1920;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#201F20');
        gradient.addColorStop(1, '#2a2a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Título
        ctx.fillStyle = '#FF460A';
        ctx.font = 'bold 80px Montserrat';
        ctx.textAlign = 'center';
        ctx.fillText('RELATÓRIO DE UNIFORMES', canvas.width / 2, 120);

        // Data do relatório
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        ctx.fillStyle = '#aaa';
        ctx.font = '40px Montserrat';
        ctx.fillText(`${formatarData(dataInicio)} até ${formatarData(dataFim)}`, canvas.width / 2, 200);

        // Linha divisória
        ctx.strokeStyle = '#5b5b5b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(100, 250);
        ctx.lineTo(canvas.width - 100, 250);
        ctx.stroke();

        let y = 320;

        // Estatísticas principais
        const entregas = dadosFiltrados.filter(d => d.tipo === 'entrega').length;
        const devolucoes = dadosFiltrados.filter(d => d.tipo === 'devolucao').length;
        const pendencias = calcularPendencias().length;

        // Card Entregas
        desenharCard(ctx, 150, y, 350, 200, '#2196F3', '📦', 'ENTREGAS', entregas);

        // Card Devoluções
        desenharCard(ctx, 540, y, 350, 200, '#4CAF50', '✅', 'DEVOLUÇÕES', devolucoes);

        // Card Pendências
        desenharCard(ctx, 150, y + 250, 780, 200, '#FFC107', '⏳', 'PENDENTES', pendencias);

        y += 520;

        // Entregas por tamanho
        ctx.fillStyle = '#FF460A';
        ctx.font = 'bold 50px Montserrat';
        ctx.textAlign = 'left';
        ctx.fillText('ENTREGAS POR TAMANHO', 150, y);

        y += 80;
        const entregasPorTam = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'entrega'));
        const tamanhos = ['P', 'M', 'G', 'GG', 'EXG'];

        tamanhos.forEach((tam, index) => {
            const x = 150 + (index * 170);
            const valor = entregasPorTam[tam] || 0;

            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, 140, 140);

            ctx.fillStyle = '#FF460A';
            ctx.font = 'bold 40px Montserrat';
            ctx.textAlign = 'center';
            ctx.fillText(tam, x + 70, y + 50);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 60px Montserrat';
            ctx.fillText(valor.toString(), x + 70, y + 120);
        });

        y += 200;

        // Devoluções por tamanho
        ctx.fillStyle = '#FF460A';
        ctx.font = 'bold 50px Montserrat';
        ctx.textAlign = 'left';
        ctx.fillText('DEVOLUÇÕES POR TAMANHO', 150, y);

        y += 80;
        const devolucoesPorTam = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'devolucao'));

        tamanhos.forEach((tam, index) => {
            const x = 150 + (index * 170);
            const valor = devolucoesPorTam[tam] || 0;

            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, 140, 140);

            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 40px Montserrat';
            ctx.textAlign = 'center';
            ctx.fillText(tam, x + 70, y + 50);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 60px Montserrat';
            ctx.fillText(valor.toString(), x + 70, y + 120);
        });

        y += 220;

        // Pendências (se houver)
        if (pendencias > 0) {
            const listaPendencias = calcularPendencias().slice(0, 5);

            ctx.fillStyle = '#FF460A';
            ctx.font = 'bold 50px Montserrat';
            ctx.textAlign = 'left';
            ctx.fillText('PRINCIPAIS PENDÊNCIAS', 150, y);

            y += 70;

            listaPendencias.forEach(item => {
                ctx.fillStyle = '#333';
                ctx.fillRect(150, y, 780, 100);

                ctx.fillStyle = '#fff';
                ctx.font = '35px Montserrat';
                ctx.textAlign = 'left';
                ctx.fillText(item.funcionario, 180, y + 45);

                ctx.fillStyle = '#aaa';
                ctx.font = '28px Montserrat';
                ctx.fillText(`${item.tamanho} • ${item.data} • ${item.diasPendente} dias`, 180, y + 80);

                y += 120;
            });
        }

        // Footer
        ctx.fillStyle = '#777';
        ctx.font = '30px Montserrat';
        ctx.textAlign = 'center';
        ctx.fillText('© 2025 Manserv - Equipe HSANA', canvas.width / 2, canvas.height - 50);

        // Download
        const link = document.createElement('a');
        link.download = `relatorio_uniformes_${dataInicio}_${dataFim}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        esconderLoading();
        mostrarToast('Imagem gerada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        esconderLoading();
        mostrarToast('Erro ao gerar imagem', 'error');
    }
}

function desenharCard(ctx, x, y, width, height, cor, emoji, titulo, valor) {
    // Background do card
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);

    // Borda colorida
    ctx.strokeStyle = cor;
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, width, height);

    // Emoji
    ctx.font = '60px Arial';
    ctx.fillText(emoji, x + 30, y + 70);

    // Título
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 30px Montserrat';
    ctx.textAlign = 'left';
    ctx.fillText(titulo, x + 30, y + 120);

    // Valor
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 70px Montserrat';
    ctx.textAlign = 'right';
    ctx.fillText(valor.toString(), x + width - 30, y + height - 30);
}

function formatarData(dataISO) {
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// =============================
// 9) GERAR EXCEL
// =============================
function gerarExcel() {
    mostrarLoading('Gerando Excel...');

    try {
        const wb = XLSX.utils.book_new();

        // Aba 1: Movimentações
        const wsMovimentacoes = XLSX.utils.json_to_sheet(
            dadosFiltrados.map(item => ({
                'Data': item.data,
                'Horário': item.horario,
                'Funcionário': item.funcionario,
                'Tipo': item.tipo.toUpperCase(),
                'Tamanho': item.tamanho
            }))
        );
        XLSX.utils.book_append_sheet(wb, wsMovimentacoes, 'Movimentações');

        // Aba 2: Resumo por Tamanho
        const entregas = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'entrega'));
        const devolucoes = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'devolucao'));
        const tamanhos = ['P', 'M', 'G', 'GG', 'EXG'];

        const resumoTamanho = tamanhos.map(tam => ({
            'Tamanho': tam,
            'Entregas': entregas[tam] || 0,
            'Devoluções': devolucoes[tam] || 0,
            'Saldo': (entregas[tam] || 0) - (devolucoes[tam] || 0)
        }));

        const wsResumo = XLSX.utils.json_to_sheet(resumoTamanho);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo por Tamanho');

        // Aba 3: Pendências
        const pendencias = calcularPendencias();
        const wsPendencias = XLSX.utils.json_to_sheet(
            pendencias.map(item => ({
                'Funcionário': item.funcionario,
                'Tamanho': item.tamanho,
                'Data Entrega': item.data,
                'Horário': item.horario,
                'Dias Pendente': item.diasPendente
            }))
        );
        XLSX.utils.book_append_sheet(wb, wsPendencias, 'Pendências');

        // Download
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        XLSX.writeFile(wb, `relatorio_uniformes_${dataInicio}_${dataFim}.xlsx`);

        esconderLoading();
        mostrarToast('Excel gerado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        esconderLoading();
        mostrarToast('Erro ao gerar Excel', 'error');
    }
}

// =============================
// 10) NAVEGAÇÃO ENTRE ABAS
// =============================
function mudarAba(abaId) {
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${abaId}"]`).classList.add('active');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(abaId).classList.add('active');
}

// =============================
// 11) FUNÇÕES AUXILIARES
// =============================
function mostrarLoading(texto = 'Carregando...') {
    document.getElementById('loadingText').textContent = texto;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function esconderLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${tipo}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}