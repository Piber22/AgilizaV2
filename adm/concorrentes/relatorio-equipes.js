console.log("Sistema de Relatório de Equipes - Inicializado");

// Configurações
const CONFIG = {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfrFTqbJjSKKUiXfX1rDMd7gAC2BSeDbj5FSrl7vLqBFfiwCKrAXv2u7LgnhVOzxd8HWF0VhaYxnYJ/pub?output=csv",
    metaPercentual: 85, // Meta de 85%
    // Mapeamento de colunas
    colunas: {
        data: 'Data',
        concorrentes: 'Concorrentes',
        equipe: 'Liderança',
        turno: 'Turno',
        meta: 'Meta'
    }
};

// Elementos DOM
const listaEquipes = document.getElementById('listaEquipes');
const totalRegistros = document.getElementById('totalRegistros');
const totalEquipes = document.getElementById('totalEquipes');
const mediaGeral = document.getElementById('mediaGeral');
const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnLimpar = document.getElementById('btnLimpar');

// Dados globais
let todosOsDados = [];
let dadosFiltrados = [];

// Função para converter data dd/mm/yyyy para objeto Date
function converterParaDate(dataStr) {
    if (!dataStr || dataStr.length < 10) return null;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes;
    return new Date(ano, mes - 1, dia);
}

// Função para converter Date para yyyy-mm-dd (formato input date)
function dateParaInputValue(date) {
    if (!date) return '';
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para converter input date (yyyy-mm-dd) para Date
function inputValueParaDate(inputValue) {
    if (!inputValue) return null;
    return new Date(inputValue + 'T00:00:00');
}

// Função para verificar se data está no intervalo
function dataEstaNoIntervalo(dataStr, dataInicioObj, dataFimObj) {
    const data = converterParaDate(dataStr);
    if (!data) return false;

    if (dataInicioObj && data < dataInicioObj) return false;
    if (dataFimObj && data > dataFimObj) return false;

    return true;
}

// Parse CSV manual - versão melhorada
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];

    // Processar cabeçalho
    const headerLine = lines[0];
    const headers = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];

        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            headers.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    headers.push(currentField.trim());

    console.log("Cabeçalhos encontrados:", headers);

    // Processar dados
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        currentField = '';
        insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField.trim());

        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });
            data.push(row);
        }
    }

    return data;
}

// Carregar dados do CSV
async function carregarDados() {
    try {
        listaEquipes.innerHTML = '<p class="loading">Carregando dados...</p>';

        // Tentar com CORS proxy se necessário
        let response;
        try {
            response = await fetch(CONFIG.csvUrl);
        } catch (e) {
            console.log("Tentando com CORS proxy...");
            response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(CONFIG.csvUrl)}`);
        }

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const text = await response.text();

        if (!text || text.trim().length === 0) {
            throw new Error("Dados vazios retornados da planilha");
        }

        console.log("Dados brutos recebidos:", text.substring(0, 200));

        todosOsDados = parseCSV(text);

        if (todosOsDados.length === 0) {
            listaEquipes.innerHTML = '<p class="empty">Nenhum dado encontrado na planilha.</p>';
            return;
        }

        console.log("Dados carregados:", todosOsDados.length, "registros");
        console.log("Exemplo de registro:", todosOsDados[0]);

        // Definir datas padrão (último mês)
        const hoje = new Date();
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);

        dataFim.value = dateParaInputValue(hoje);
        dataInicio.value = dateParaInputValue(umMesAtras);

        // Aplicar filtro inicial
        aplicarFiltro();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        listaEquipes.innerHTML = `
            <p class="error">Erro ao carregar dados: ${error.message}</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Verifique se a planilha está publicada como "Qualquer pessoa com o link pode visualizar"
            </p>
        `;
    }
}

// Aplicar filtro de data
function aplicarFiltro() {
    const dataInicioValue = dataInicio.value;
    const dataFimValue = dataFim.value;

    const dataInicioObj = inputValueParaDate(dataInicioValue);
    const dataFimObj = inputValueParaDate(dataFimValue);

    console.log("Aplicando filtro:", { dataInicioValue, dataFimValue, dataInicioObj, dataFimObj });

    // Validar datas
    if (dataInicioObj && dataFimObj && dataInicioObj > dataFimObj) {
        alert("A data inicial não pode ser maior que a data final!");
        return;
    }

    // Filtrar dados usando a coluna 'Data'
    if (!dataInicioValue && !dataFimValue) {
        dadosFiltrados = [...todosOsDados];
        console.log("Sem filtro de data, mostrando todos os dados");
    } else {
        dadosFiltrados = todosOsDados.filter(row => {
            const data = row[CONFIG.colunas.data] || '';
            const noIntervalo = dataEstaNoIntervalo(data, dataInicioObj, dataFimObj);
            return noIntervalo;
        });
    }

    console.log("Dados filtrados:", dadosFiltrados.length, "de", todosOsDados.length, "registros");

    // Processar e exibir
    processarEExibir();
}

// Limpar filtros
function limparFiltros() {
    dataInicio.value = '';
    dataFim.value = '';
    dadosFiltrados = [...todosOsDados];
    processarEExibir();
}

// Processar dados e calcular estatísticas por equipe
function processarEExibir() {
    if (dadosFiltrados.length === 0) {
        listaEquipes.innerHTML = '<p class="empty">Nenhum dado encontrado para o período selecionado.</p>';
        atualizarEstatisticasGerais(0, 0, 0);
        return;
    }

    console.log("Processando dados filtrados:", dadosFiltrados.length, "registros");

    // Agrupar por equipe (Liderança)
    const equipes = {};

    dadosFiltrados.forEach(row => {
        const nomeEquipe = (row[CONFIG.colunas.equipe] || '').trim();
        const concorrentes = parseFloat(row[CONFIG.colunas.concorrentes]) || 0;
        const meta = parseFloat(row[CONFIG.colunas.meta]) || 0;

        // Pular linhas vazias ou inválidas
        if (!nomeEquipe || nomeEquipe === '') {
            return;
        }

        if (!equipes[nomeEquipe]) {
            equipes[nomeEquipe] = {
                nome: nomeEquipe,
                totalConcorrentes: 0,
                totalMeta: 0,
                registros: 0
            };
        }

        equipes[nomeEquipe].totalConcorrentes += concorrentes;
        equipes[nomeEquipe].totalMeta += meta;
        equipes[nomeEquipe].registros++;
    });

    console.log("Equipes agrupadas:", equipes);

    // Calcular percentuais
    const dadosEquipes = Object.values(equipes).map(equipe => {
        // Percentual = (Total de Concorrentes / Total de Meta) * 100
        const percentual = equipe.totalMeta > 0 ?
            (equipe.totalConcorrentes / equipe.totalMeta) * 100 : 0;

        return {
            ...equipe,
            percentual: percentual,
            atingiuMeta: percentual >= CONFIG.metaPercentual
        };
    });

    // Ordenar por percentual (maior primeiro)
    dadosEquipes.sort((a, b) => b.percentual - a.percentual);

    console.log("Dados processados por equipe:", dadosEquipes);

    // Calcular média geral
    const totalConcorrentesGeral = dadosEquipes.reduce((sum, eq) => sum + eq.totalConcorrentes, 0);
    const totalMetaGeral = dadosEquipes.reduce((sum, eq) => sum + eq.totalMeta, 0);
    const mediaGeralCalc = totalMetaGeral > 0 ?
        (totalConcorrentesGeral / totalMetaGeral) * 100 : 0;

    // Atualizar estatísticas gerais
    atualizarEstatisticasGerais(dadosFiltrados.length, dadosEquipes.length, mediaGeralCalc);

    // Renderizar equipes
    renderizarEquipes(dadosEquipes);
}

// Atualizar estatísticas gerais
function atualizarEstatisticasGerais(registros, numEquipes, media) {
    totalRegistros.textContent = registros;
    totalEquipes.textContent = numEquipes;
    mediaGeral.textContent = `${media.toFixed(1)}%`;

    // Colorir média geral baseado na meta
    if (media >= CONFIG.metaPercentual) {
        mediaGeral.style.color = '#4CAF50';
    } else {
        mediaGeral.style.color = '#E94B22';
    }
}

// Renderizar lista de equipes
function renderizarEquipes(equipes) {
    if (equipes.length === 0) {
        listaEquipes.innerHTML = '<p class="empty">Nenhuma equipe encontrada.</p>';
        return;
    }

    let html = '';

    equipes.forEach(equipe => {
        const classeStatus = equipe.atingiuMeta ? 'acima-meta' : 'abaixo-meta';
        const badgeStatus = equipe.atingiuMeta ?
            '<span class="status-badge acima">✓ Acima da Meta</span>' :
            '<span class="status-badge abaixo">⚠ Abaixo da Meta</span>';

        html += `
            <div class="equipe-card ${classeStatus}">
                <div class="equipe-header">
                    <div>
                        <div class="equipe-nome">${equipe.nome}</div>
                        ${badgeStatus}
                    </div>
                    <div class="equipe-percentual">${equipe.percentual.toFixed(1)}%</div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min(equipe.percentual, 100)}%"></div>
                    <div class="progress-meta-line"></div>
                </div>

                <div class="equipe-detalhes">
                    <div class="detalhe-item">
                        <div class="detalhe-label">Concorrentes</div>
                        <div class="detalhe-valor" style="color: #4CAF50;">${equipe.totalConcorrentes.toFixed(0)}</div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Meta</div>
                        <div class="detalhe-valor" style="color: #E94B22;">${equipe.totalMeta.toFixed(0)}</div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Registros</div>
                        <div class="detalhe-valor">${equipe.registros}</div>
                    </div>
                </div>
            </div>
        `;
    });

    listaEquipes.innerHTML = html;
}

// Event listeners
btnFiltrar.addEventListener('click', aplicarFiltro);
btnLimpar.addEventListener('click', limparFiltros);

// Permitir filtrar ao pressionar Enter nos campos de data
dataInicio.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') aplicarFiltro();
});

dataFim.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') aplicarFiltro();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    // Atualizar dados a cada 5 minutos
    setInterval(carregarDados, 5 * 60 * 1000);
});