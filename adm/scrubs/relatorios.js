// =============================
// CONFIGURAÇÕES
// =============================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRUjsGsLK_m-wD1NLtaQ-BR9qHjwJW47TQYwR23tuQ7RCUKu--yRim0-ExuxYY-Lia4oerHYjKRN2_Z/pub?output=csv";

// Colunas da planilha (0-indexed):
// 0: Data | 1: Horário | 2: Funcionário | 3: Tipo | 4: Origem | 5: Enfermeiro | 6: Jaleco | 7: Calça | 8: Assinatura

let dadosCompletos = [];
let dadosFiltrados = [];

// Aba de origem ativa: 'todos' | 'autorizado' | 'ci'
let origemAtiva = 'todos';

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
    // Horários ficam vazios por padrão (sem filtro de hora)
    document.getElementById('horaInicio').value = '';
    document.getElementById('horaFim').value = '';
    atualizarEstadoBtnLimparHora();
}

function configurarEventListeners() {
    document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltro);
    document.getElementById('btnHoje').addEventListener('click', () => {
        inicializarDatas();
        aplicarFiltro();
    });

    // Realça os inputs de hora quando preenchidos
    ['horaInicio', 'horaFim'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            atualizarEstadoBtnLimparHora();
        });
    });

    // Limpa os campos de hora e reaplica o filtro
    document.getElementById('btnLimparHora').addEventListener('click', () => {
        document.getElementById('horaInicio').value = '';
        document.getElementById('horaFim').value = '';
        atualizarEstadoBtnLimparHora();
        aplicarFiltro();
        mostrarToast('Filtro de horário removido', 'success');
    });

    document.getElementById('btnGerarTexto').addEventListener('click', () => gerarRelatorioTexto(getDadosPorOrigem(), calcularPendencias, origemAtiva));
    document.getElementById('btnGerarExcel').addEventListener('click', () => gerarExcel(getDadosPorOrigem(), calcularPendencias, contarPorTamanho, origemAtiva));

    // Tabs de conteúdo
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => mudarAba(e.target.dataset.tab));
    });

    // Tabs de origem
    document.querySelectorAll('.origem-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            origemAtiva = e.target.dataset.origem;
            document.querySelectorAll('.origem-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            atualizarTodasAsSecoes();
        });
    });
}

// Retorna os dados filtrados pela origem ativa
function getDadosPorOrigem() {
    if (origemAtiva === 'todos') return dadosFiltrados;
    if (origemAtiva === 'ci') return dadosFiltrados.filter(d => normalizar(d.origem) === 'ci');
    return dadosFiltrados.filter(d => normalizar(d.origem) !== 'ci');
}

function normalizar(str) {
    if (!str) return '';
    return str.trim().toLowerCase();
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

        if (campos.length >= 8) {
            dados.push({
                data:        campos[0],
                horario:     campos[1],
                funcionario: campos[2],
                tipo:        campos[3].trim().toLowerCase(),   // entrega / devolucao
                origem:      campos[4].trim(),                  // ex: "CI", "Autorizado", etc.
                enfermeiro:  campos[5].trim(),                  // só preenchido em CI
                jaleco:      campos[6].trim(),                  // tamanho do jaleco
                calca:       campos[7].trim(),                  // tamanho da calça
                assinatura:  campos[8] ? campos[8].trim() : ''
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
    const dataFim    = document.getElementById('dataFim').value;
    const horaInicio = document.getElementById('horaInicio').value; // "HH:MM" ou ""
    const horaFim    = document.getElementById('horaFim').value;    // "HH:MM" ou ""

    if (!dataInicio || !dataFim) {
        mostrarToast('Selecione as datas de início e fim', 'error');
        return;
    }

    // Valida combinação de horário só quando um dos dois está preenchido
    if ((horaInicio && !horaFim) || (!horaInicio && horaFim)) {
        mostrarToast('Preencha os dois horários ou deixe ambos em branco', 'error');
        return;
    }

    const usarHora = !!(horaInicio && horaFim);

    dadosFiltrados = dadosCompletos.filter(item => {
        const dataItem = converterDataParaISO(item.data);

        // Filtro de data
        if (dataItem < dataInicio || dataItem > dataFim) return false;

        // Sem filtro de hora: passa direto
        if (!usarHora) return true;

        // Com filtro de hora: só aplica nos dias exatos de início e fim
        const horarioItem = normalizarHorario(item.horario);

        // Dia de início: horário >= horaInicio
        if (dataItem === dataInicio && dataItem === dataFim) {
            return horarioItem >= horaInicio && horarioItem <= horaFim;
        }
        if (dataItem === dataInicio) {
            return horarioItem >= horaInicio;
        }
        if (dataItem === dataFim) {
            return horarioItem <= horaFim;
        }

        // Dias intermediários: passa qualquer horário
        return true;
    });

    atualizarTodasAsSecoes();
}

// Normaliza horário para comparação: "09:30:00" → "09:30", "9:5" → "09:05"
function normalizarHorario(horario) {
    if (!horario) return '00:00';
    const partes = horario.split(':');
    const hh = partes[0] ? partes[0].padStart(2, '0') : '00';
    const mm = partes[1] ? partes[1].padStart(2, '0') : '00';
    return `${hh}:${mm}`;
}

// Atualiza visual dos inputs de hora e visibilidade do botão limpar
function atualizarEstadoBtnLimparHora() {
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFim    = document.getElementById('horaFim').value;
    const ativo = !!(horaInicio || horaFim);

    document.getElementById('horaInicio').classList.toggle('ativo', !!horaInicio);
    document.getElementById('horaFim').classList.toggle('ativo', !!horaFim);
    document.getElementById('btnLimparHora').classList.toggle('oculto', !ativo);
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
    const dados = getDadosPorOrigem();
    atualizarVisaoGeral(dados);
    atualizarPorTamanho(dados);
    atualizarPendencias();
}

// =============================
// 5) VISÃO GERAL
// =============================
function atualizarVisaoGeral(dados) {
    const entregas    = dados.filter(d => d.tipo === 'entrega');
    const devolucoes  = dados.filter(d => d.tipo === 'devolucao');
    const pendencias  = calcularPendencias();

    document.getElementById('totalEntregas').textContent   = entregas.length;
    document.getElementById('totalDevolucoes').textContent = devolucoes.length;
    document.getElementById('totalPendentes').textContent  = pendencias.length;

    renderizarMovimentacoesRecentes(dados);
}

function renderizarMovimentacoesRecentes(dados) {
    const container = document.getElementById('movimentacoesRecentes');

    if (dados.length === 0) {
        container.innerHTML = '<p class="placeholder">Nenhuma movimentação no período selecionado</p>';
        return;
    }

    const recentes = [...dados].reverse().slice(0, 10);

    container.innerHTML = recentes.map(item => {
        const ehCI = normalizar(item.origem) === 'ci';
        const origemBadge = ehCI
            ? `<span class="item-badge badge-ci">📄 CI${item.enfermeiro ? ' — ' + item.enfermeiro : ''}</span>`
            : `<span class="item-badge badge-autorizado">✔️ Autorizado</span>`;

        return `
        <div class="movimentacao-item ${item.tipo}">
            <div class="item-header">
                <span class="item-nome">${item.funcionario}</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${origemBadge}
                    <span class="item-badge badge-${item.tipo}">
                        ${item.tipo === 'entrega' ? '📦 Entrega' : '✅ Devolução'}
                    </span>
                </div>
            </div>
            <div class="item-detalhes">
                <span>📅 ${item.data}</span>
                <span>🕐 ${item.horario}</span>
                ${item.jaleco ? `<span>🥼 Jaleco ${item.jaleco}</span>` : ''}
                ${item.calca  ? `<span>👖 Calça ${item.calca}</span>`  : ''}
            </div>
        </div>`;
    }).join('');
}

// =============================
// 6) POR TAMANHO
// =============================
function atualizarPorTamanho(dados) {
    const tamanhos = ['P', 'M', 'G', 'GG', 'EG', 'EXG'];

    // --- JALECOS ---
    const entregasJaleco   = contarPorTamanho(dados.filter(d => d.tipo === 'entrega'),  'jaleco');
    const devolucoesJaleco = contarPorTamanho(dados.filter(d => d.tipo === 'devolucao'), 'jaleco');
    renderizarTamanhos('entregasJaleco',   entregasJaleco,   tamanhos, false, 'jaleco');
    renderizarTamanhos('devolucoesJaleco', devolucoesJaleco, tamanhos, false, 'jaleco');

    const saldoJaleco = {};
    tamanhos.forEach(tam => {
        saldoJaleco[tam] = (entregasJaleco[tam] || 0) - (devolucoesJaleco[tam] || 0);
    });
    renderizarTamanhos('saldoJaleco', saldoJaleco, tamanhos, true, 'jaleco');

    // --- CALÇAS ---
    const entregasCalca   = contarPorTamanho(dados.filter(d => d.tipo === 'entrega'),   'calca');
    const devolucoesCalca = contarPorTamanho(dados.filter(d => d.tipo === 'devolucao'), 'calca');
    renderizarTamanhos('entregasCalca',   entregasCalca,   tamanhos, false, 'calca');
    renderizarTamanhos('devolucoesCalca', devolucoesCalca, tamanhos, false, 'calca');

    const saldoCalca = {};
    tamanhos.forEach(tam => {
        saldoCalca[tam] = (entregasCalca[tam] || 0) - (devolucoesCalca[tam] || 0);
    });
    renderizarTamanhos('saldoCalca', saldoCalca, tamanhos, true, 'calca');
}

// campo: 'jaleco' ou 'calca'
function contarPorTamanho(dados, campo) {
    const contagem = {};
    dados.forEach(item => {
        const tam = item[campo];
        if (tam) {
            contagem[tam] = (contagem[tam] || 0) + 1;
        }
    });
    return contagem;
}

function renderizarTamanhos(containerId, dados, tamanhos, mostrarSaldo) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Filtra apenas tamanhos que existem nos dados ou que estão na lista base
    const tamanhosComDados = tamanhos.filter(t => dados[t] !== undefined && dados[t] !== 0);
    // Se nenhum, mostra mensagem
    if (tamanhosComDados.length === 0 && !mostrarSaldo) {
        container.innerHTML = '<p class="placeholder" style="padding:10px">Sem dados no período</p>';
        return;
    }

    let total = 0;
    const todosOsTamanhos = [...new Set([...tamanhos, ...Object.keys(dados)])];

    const html = todosOsTamanhos.map(tam => {
        const valor = dados[tam] || 0;
        if (valor === 0 && !tamanhos.includes(tam)) return '';
        total += valor;

        return `
            <div class="tamanho-card ${mostrarSaldo && valor < 0 ? 'negativo' : mostrarSaldo && valor === 0 ? 'zero' : ''}">
                <div class="tamanho-label">${tam}</div>
                <div class="tamanho-valor">${valor}</div>
            </div>`;
    }).join('');

    const totalReal = mostrarSaldo ? total : Object.values(dados).reduce((a, b) => a + b, 0);

    const totalHtml = `
        <div class="tamanho-card total-card">
            <div class="tamanho-label" style="color:white;">TOTAL</div>
            <div class="tamanho-valor" style="color:white;">${totalReal}</div>
        </div>`;

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

// Pendências calculadas sobre as ENTREGAS do período filtrado (data + hora),
// verificando devoluções no histórico completo (para não perder devoluções fora do período)
function calcularPendencias() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim    = document.getElementById('dataFim').value;
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFim    = document.getElementById('horaFim').value;
    const usarHora   = !!(horaInicio && horaFim);

    const filtrarOrigem = (arr) => {
        if (origemAtiva === 'ci')         return arr.filter(d => normalizar(d.origem) === 'ci');
        if (origemAtiva === 'autorizado') return arr.filter(d => normalizar(d.origem) !== 'ci');
        return arr;
    };

    // Apenas as ENTREGAS dentro do período e horário selecionados
    const entregasDoPeriodo = filtrarOrigem(
        dadosCompletos.filter(d => {
            if (d.tipo !== 'entrega') return false;
            const dataItem = converterDataParaISO(d.data);
            if (dataItem < dataInicio || dataItem > dataFim) return false;
            if (!usarHora) return true;
            const horarioItem = normalizarHorario(d.horario);
            if (dataItem === dataInicio && dataItem === dataFim) return horarioItem >= horaInicio && horarioItem <= horaFim;
            if (dataItem === dataInicio) return horarioItem >= horaInicio;
            if (dataItem === dataFim)    return horarioItem <= horaFim;
            return true;
        })
    );

    // Todas as DEVOLUÇÕES do histórico completo (para verificar se já foi devolvido)
    const todasDevolucoes = filtrarOrigem(
        dadosCompletos.filter(d => d.tipo === 'devolucao')
    );

    const devolucoesMap = {};
    todasDevolucoes.forEach(item => {
        if (!devolucoesMap[item.funcionario]) devolucoesMap[item.funcionario] = [];
        devolucoesMap[item.funcionario].push(item);
    });

    const entregasMap = {};
    entregasDoPeriodo.forEach(item => {
        if (!entregasMap[item.funcionario]) entregasMap[item.funcionario] = [];
        entregasMap[item.funcionario].push(item);
    });

    const pendencias = [];

    Object.keys(entregasMap).forEach(funcionario => {
        const entregas   = entregasMap[funcionario];
        const devolucoes = devolucoesMap[funcionario] || [];
        const saldo = entregas.length - devolucoes.length;

        if (saldo > 0) {
            entregas.slice(devolucoes.length).forEach(entrega => {
                pendencias.push({
                    funcionario,
                    jaleco:       entrega.jaleco,
                    calca:        entrega.calca,
                    origem:       entrega.origem,
                    enfermeiro:   entrega.enfermeiro,
                    data:         entrega.data,
                    horario:      entrega.horario,
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

    container.innerHTML = pendencias.map(item => {
        const ehCI = normalizar(item.origem) === 'ci';
        return `
        <div class="pendencia-item">
            <div class="item-header">
                <span class="item-nome">${item.funcionario}</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${ehCI ? `<span class="item-badge badge-ci">📄 CI</span>` : `<span class="item-badge badge-autorizado">✔️ Autorizado</span>`}
                    <span class="item-badge badge-pendente">⏳ ${item.diasPendente} dia${item.diasPendente !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="item-detalhes">
                <span>📅 Entrega: ${item.data}</span>
                <span>🕐 ${item.horario}</span>
                ${item.jaleco ? `<span>🥼 Jaleco ${item.jaleco}</span>` : ''}
                ${item.calca  ? `<span>👖 Calça ${item.calca}</span>`  : ''}
                ${ehCI && item.enfermeiro ? `<span>👩‍⚕️ ${item.enfermeiro}</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

function renderizarAnalisePendencias(pendencias) {
    const container = document.getElementById('analisePendencias');
    const totalPendencias = pendencias.length;

    const totalCI = pendencias.filter(p => normalizar(p.origem) === 'ci').length;
    const totalAutorizado = pendencias.filter(p => normalizar(p.origem) !== 'ci').length;

    // Tamanho de jaleco mais pendente
    const contJaleco = {};
    pendencias.forEach(p => { if (p.jaleco) contJaleco[p.jaleco] = (contJaleco[p.jaleco] || 0) + 1; });
    const maisJaleco = Object.keys(contJaleco).reduce((a, b) => contJaleco[a] > contJaleco[b] ? a : b, Object.keys(contJaleco)[0]);

    // Tamanho de calça mais pendente
    const contCalca = {};
    pendencias.forEach(p => { if (p.calca) contCalca[p.calca] = (contCalca[p.calca] || 0) + 1; });
    const maisCalca = Object.keys(contCalca).reduce((a, b) => contCalca[a] > contCalca[b] ? a : b, Object.keys(contCalca)[0]);

    const mediaDias = totalPendencias > 0
        ? Math.round(pendencias.reduce((sum, p) => sum + p.diasPendente, 0) / totalPendencias)
        : 0;

    container.innerHTML = `
        <div class="analise-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <div class="analise-label">Total de Pendências</div>
            <div class="analise-valor">${totalPendencias}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #2196F3 0%, #0d47a1 100%);">
            <div class="analise-label">Com CI</div>
            <div class="analise-valor">${totalCI}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #4CAF50 0%, #1b5e20 100%);">
            <div class="analise-label">Autorizados</div>
            <div class="analise-valor">${totalAutorizado}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
            <div class="analise-label">Jaleco mais pendente</div>
            <div class="analise-valor">${maisJaleco || '-'}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="analise-label">Calça mais pendente</div>
            <div class="analise-valor">${maisCalca || '-'}</div>
        </div>
        <div class="analise-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            <div class="analise-label">Média de Dias</div>
            <div class="analise-valor" style="color:#333;">${mediaDias}</div>
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