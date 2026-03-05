console.log("Sistema de Acompanhamento de DDS - Inicializado");

// ===== CONFIGURAÇÃO =====
const CONFIG = {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtSwRD12PKDKzJ0TCcx7Rz8Hvd_OnRQCH1zdBLkD3IZTEh2_cq5zYE5Id54rc3gAhV1xRYtW2ITMQL/pub?output=csv",
    intervaloAtualizacao: 5 * 60 * 1000 // 5 minutos
};

// ===== ELEMENTOS DOM =====
const listaEquipes        = document.getElementById('listaEquipes');
const totalProgramados    = document.getElementById('totalProgramados');
const totalExecutados     = document.getElementById('totalExecutados');
const percentualConclusao = document.getElementById('percentualConclusao');
const inputDataInicial    = document.getElementById('dataInicial');
const inputDataFinal      = document.getElementById('dataFinal');
const btnAplicarFiltro    = document.getElementById('btnAplicarFiltro');
const btnLimparFiltro     = document.getElementById('btnLimparFiltro');

// ===== ESTADO GLOBAL =====
let todosDados   = [];
let filtroInicial = null;
let filtroFinal   = null;

// ===== UTILITÁRIOS DE DATA =====

/** Retorna a data atual no formato dd/mm/yyyy */
function getDataAtual() {
    const hoje = new Date();
    return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
}

/**
 * Converte string de data para objeto Date.
 * Aceita: dd/mm/yyyy  ou  yyyy-mm-dd
 */
function parseDateBR(str) {
    if (!str) return null;
    const s = str.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        return new Date(+y, +m - 1, +d);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-');
        return new Date(+y, +m - 1, +d);
    }
    return null;
}

/**
 * Converte string de input date (yyyy-mm-dd) para dd/mm/yyyy
 */
function inputToDateBR(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

// ===== PARSE CSV =====

/** Divide uma linha CSV respeitando campos entre aspas */
function splitCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur.trim());
    return result;
}

/** Faz o parse completo do texto CSV e retorna array de objetos */
function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return [];

    const headers = splitCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = splitCSVLine(lines[i]);
        if (values.every(v => v === '')) continue;
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = (values[idx] || '').replace(/^"|"$/g, '').trim();
        });
        data.push(row);
    }
    return data;
}

// ===== CARREGAR DADOS =====

async function carregarDados() {
    listaEquipes.innerHTML = '<p class="loading">Carregando dados...</p>';
    try {
        const resp = await fetch(CONFIG.csvUrl);
        if (!resp.ok) throw new Error('Falha ao buscar dados da planilha');

        const text = await resp.text();
        todosDados = parseCSV(text);
        window.todosDados = todosDados; // expõe para o módulo de relatório

        filtrarEExibir();
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
        listaEquipes.innerHTML = `<p class="error">Erro ao carregar dados: ${err.message}</p>`;
    }
}

// ===== FILTRAR E EXIBIR =====

function filtrarEExibir() {
    if (!todosDados.length) return;

    // Detecta nomes de colunas de forma tolerante (case-insensitive, acento-insensitive)
    const keys = Object.keys(todosDados[0]);

    function findKey(candidates) {
        for (const c of candidates) {
            const found = keys.find(k => k.toLowerCase().includes(c.toLowerCase()));
            if (found) return found;
        }
        return null;
    }

    const colDataInicial = findKey(['data inicial', 'inicio', 'início', 'data_inicial']);
    const colDataFinal   = findKey(['data final', 'fim', 'data_final', 'término', 'termino']);
    const colEquipe      = findKey(['equipe', 'team', 'grupo']);
    const colProgramado  = findKey(['programado', 'programados', 'program']);
    const colExecutado   = findKey(['executado', 'executados', 'execut', 'realizado']);

    // Filtra linhas cujo período intersecta o intervalo selecionado
    const dadosFiltrados = todosDados.filter(row => {
        const dtIni = parseDateBR(colDataInicial ? row[colDataInicial] : '');
        const dtFim = parseDateBR(colDataFinal   ? row[colDataFinal]   : '');

        if (filtroInicial && dtFim) {
            const fi = parseDateBR(filtroInicial);
            if (dtFim < fi) return false;
        }
        if (filtroFinal && dtIni) {
            const ff = parseDateBR(filtroFinal);
            if (dtIni > ff) return false;
        }
        return true;
    });

    // Agrupa por equipe
    const equipesMap = {};
    let totalProg = 0;
    let totalExec = 0;

    dadosFiltrados.forEach(row => {
        const equipe     = colEquipe    ? row[colEquipe]                         : 'Sem Equipe';
        const programado = colProgramado ? (parseInt(row[colProgramado]) || 0)   : 0;
        const executado  = colExecutado  ? (parseInt(row[colExecutado])  || 0)   : 0;

        if (!equipesMap[equipe]) {
            equipesMap[equipe] = { nome: equipe, programado: 0, executado: 0, periodos: [] };
        }

        equipesMap[equipe].programado += programado;
        equipesMap[equipe].executado  += executado;

        const di = colDataInicial ? row[colDataInicial] : '';
        const df = colDataFinal   ? row[colDataFinal]   : '';
        if (di || df) equipesMap[equipe].periodos.push({ di, df });

        totalProg += programado;
        totalExec += executado;
    });

    const equipes = Object.values(equipesMap).sort((a, b) => a.nome.localeCompare(b.nome));

    // Atualiza cards de estatísticas
    const pct = totalProg > 0 ? ((totalExec / totalProg) * 100).toFixed(1) : 0;
    totalProgramados.textContent    = totalProg;
    totalExecutados.textContent     = totalExec;
    percentualConclusao.textContent = `${pct}%`;
    percentualConclusao.style.color = parseFloat(pct) >= 85 ? '#4CAF50' : '#E94B22';

    renderizarEquipes(equipes);

    // Expõe estado para o módulo de relatório
    window.equipesParaRelatorio = equipes;
    window.totalProgRelatorio   = totalProg;
    window.totalExecRelatorio   = totalExec;
    window.filtroInicialAtual   = filtroInicial;
    window.filtroFinalAtual     = filtroFinal;
    window.getDataAtual         = getDataAtual;
}

// ===== RENDERIZAR EQUIPES =====

function renderizarEquipes(equipes) {
    if (!equipes.length) {
        listaEquipes.innerHTML = '<p class="empty">Nenhum dado encontrado para o período selecionado.</p>';
        return;
    }

    let html = '';

    equipes.forEach(eq => {
        const pct       = eq.programado > 0 ? (eq.executado / eq.programado) * 100 : 0;
        const completa  = pct >= 100;
        const classeItem = completa ? 'completa' : '';
        const classeBar  = completa ? 'completo'  : 'parcial';
        const classePct  = completa ? 'completo'  : 'parcial';

        // Monta o intervalo de datas do período exibido
        let periodoTexto = '';
        const todas_di = eq.periodos.map(p => parseDateBR(p.di)).filter(Boolean);
        const todas_df = eq.periodos.map(p => parseDateBR(p.df)).filter(Boolean);
        if (todas_di.length && todas_df.length) {
            const fmt    = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const minDi  = new Date(Math.min(...todas_di));
            const maxDf  = new Date(Math.max(...todas_df));
            periodoTexto = `${fmt(minDi)} – ${fmt(maxDf)}`;
        }

        html += `
        <div class="equipe-item ${classeItem}">
            <div class="equipe-header">
                <div>
                    <div class="equipe-nome">${eq.nome}</div>
                    ${periodoTexto ? `<div class="equipe-periodo">${periodoTexto}</div>` : ''}
                </div>
                <div class="equipe-percentual ${classePct}">${pct.toFixed(1)}%</div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill ${classeBar}" style="width: ${Math.min(pct, 100)}%"></div>
            </div>
            <div class="equipe-stats">
                <span class="${completa ? 'ok' : ''}">Executado: ${eq.executado}</span>
                <span>Programado: ${eq.programado}</span>
            </div>
        </div>`;
    });

    listaEquipes.innerHTML = html;
}

// ===== EVENT LISTENERS - FILTROS =====

btnAplicarFiltro.addEventListener('click', () => {
    const di = inputDataInicial.value;
    const df = inputDataFinal.value;

    if (!di && !df) {
        alert('Selecione pelo menos uma data para filtrar.');
        return;
    }
    if (di && df && new Date(di) > new Date(df)) {
        alert('A data inicial não pode ser posterior à data final.');
        return;
    }

    filtroInicial = di ? inputToDateBR(di) : null;
    filtroFinal   = df ? inputToDateBR(df) : null;
    filtrarEExibir();
});

btnLimparFiltro.addEventListener('click', () => {
    inputDataInicial.value = '';
    inputDataFinal.value   = '';
    filtroInicial = null;
    filtroFinal   = null;
    filtrarEExibir();
});

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    setInterval(carregarDados, CONFIG.intervaloAtualizacao);
});