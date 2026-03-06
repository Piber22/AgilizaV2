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
    document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltro);
    document.getElementById('btnHoje').addEventListener('click', () => {
        inicializarDatas();
        aplicarFiltro();
    });

    document.getElementById('btnGerarTexto').addEventListener('click', () => gerarRelatorioTexto(dadosFiltrados, calcularPendencias));
    document.getElementById('btnGerarExcel').addEventListener('click', () => gerarExcel(dadosFiltrados, calcularPendencias, contarPorTamanho));

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => mudarAba(e.target.dataset.tab));
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

    for (let i = 1; i < linhas.length; i++) {
        const campos = parseCSVLine(linhas[i]);

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

    document.getElementById('totalEntregas').textContent = entregas.length;
    document.getElementById('totalDevolucoes').textContent = devolucoes.length;
    document.getElementById('totalPendentes').textContent = pendencias.length;

    renderizarMovimentacoesRecentes();
}

function renderizarMovimentacoesRecentes() {
    const container = document.getElementById('movimentacoesRecentes');

    if (dadosFiltrados.length === 0) {
        container.innerHTML = '<p class="placeholder">Nenhuma movimentação no período selecionado</p>';
        return;
    }

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
    const tamanhos = ['P', 'M', 'G', 'GG', 'EG'];

    const entregasPorTam = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'entrega'));
    renderizarTamanhos('entregasPorTamanho', entregasPorTam, tamanhos, false);

    const devolucoesPorTam = contarPorTamanho(dadosFiltrados.filter(d => d.tipo === 'devolucao'));
    renderizarTamanhos('devolucoesPorTamanho', devolucoesPorTam, tamanhos, false);

    const saldo = {};
    tamanhos.forEach(tam => {
        // Pendência = entregas - devoluções.
        // Positivo: mais saídas que retornos (uniforme ainda fora).
        // Negativo: mais devoluções que entregas no período (situação atípica, mas exibida para não esconder inconsistências).
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
        total += valor;

        return `
            <div class="tamanho-card ${mostrarSaldo && valor < 0 ? 'negativo' : ''}">
                <div class="tamanho-label">${tam}</div>
                <div class="tamanho-valor">${valor}</div>
            </div>
        `;
    }).join('');

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

    dadosCompletos.forEach(item => {
        if (!entregasPorFuncionario[item.funcionario]) {
            entregasPorFuncionario[item.funcionario] = { entregas: [], devolucoes: [] };
        }
        if (item.tipo === 'entrega') {
            entregasPorFuncionario[item.funcionario].entregas.push(item);
        } else if (item.tipo === 'devolucao') {
            entregasPorFuncionario[item.funcionario].devolucoes.push(item);
        }
    });

    Object.keys(entregasPorFuncionario).forEach(funcionario => {
        const registro = entregasPorFuncionario[funcionario];
        const saldo = registro.entregas.length - registro.devolucoes.length;

        if (saldo > 0) {
            registro.entregas.slice(registro.devolucoes.length).forEach(entrega => {
                pendencias.push({
                    funcionario,
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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
// 8) NAVEGAÇÃO ENTRE ABAS
// =============================
function mudarAba(abaId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${abaId}"]`).classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(abaId).classList.add('active');
}

// =============================
// 9) FUNÇÕES AUXILIARES
// =============================
function formatarData(dataISO) {
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

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
    setTimeout(() => toast.classList.remove('show'), 3000);
}