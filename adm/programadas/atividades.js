console.log("Sistema de Gerenciamento de Atividades - Inicializado");

// Configurações
const CONFIG = {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&output=csv",
    // Para edição via API (configurar posteriormente)
    apiKey: localStorage.getItem('sheetsApiKey') || '',
    spreadsheetId: localStorage.getItem('spreadsheetId') || '',
    range: 'Sheet1!A2:G' // Ajuste conforme sua planilha
};

// Elementos DOM
const listaAtividades = document.getElementById('listaAtividades');
const totalProgramadas = document.getElementById('totalProgramadas');
const totalRealizadas = document.getElementById('totalRealizadas');
const percentualConclusao = document.getElementById('percentualConclusao');
const btnConfig = document.getElementById('btnConfig');
const modal = document.getElementById('modalConfig');
const closeModal = document.querySelector('.close');
const salvarConfig = document.getElementById('salvarConfig');

// Dados globais
let todosOsDados = [];
let atividadesHoje = [];

// Função para obter data atual no formato dd/mm/yyyy
function getDataAtual() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para converter data dd/mm/yyyy para objeto Date
function converterParaDate(dataStr) {
    if (!dataStr || dataStr.length < 10) return null;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes;
    return new Date(ano, mes - 1, dia);
}

// Função para comparar datas
function dataEhAnteriorOuIgual(data1Str, data2Str) {
    const date1 = converterParaDate(data1Str);
    const date2 = converterParaDate(data2Str);
    if (!date1 || !date2) return false;
    return date1 <= date2;
}

// Parse CSV manual
function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length < headers.length) continue;

        const row = { rowIndex: i + 1 }; // Guardamos o índice da linha (começa em 2 porque linha 1 é header)
        headers.forEach((h, idx) => {
            row[h] = values[idx];
        });
        data.push(row);
    }
    return data;
}

// Carregar dados do CSV
async function carregarDados() {
    try {
        listaAtividades.innerHTML = '<p class="loading">Carregando atividades...</p>';

        const response = await fetch(CONFIG.csvUrl);
        if (!response.ok) throw new Error("Erro ao carregar dados");

        const text = await response.text();
        todosOsDados = parseCSV(text);

        if (todosOsDados.length === 0) {
            listaAtividades.innerHTML = '<p class="empty">Nenhuma atividade encontrada.</p>';
            return;
        }

        filtrarEExibir();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        listaAtividades.innerHTML = `<p class="error">Erro ao carregar atividades: ${error.message}</p>`;
    }
}

// Filtrar atividades até a data atual e exibir
function filtrarEExibir() {
    const dataHoje = getDataAtual();

    // Filtrar atividades até hoje
    atividadesHoje = todosOsDados.filter(row => {
        const dataAtividade = row.DATA || '';
        return dataEhAnteriorOuIgual(dataAtividade, dataHoje);
    });

    // Calcular estatísticas
    const programadas = atividadesHoje.length;
    const realizadas = atividadesHoje.filter(row => {
        const situacao = (row['Situação'] || row['SituaÃ§Ã£o'] || '').trim().toLowerCase();
        return situacao === 'feito';
    }).length;
    const percentual = programadas > 0 ? ((realizadas / programadas) * 100).toFixed(1) : 0;

    // Atualizar estatísticas
    totalProgramadas.textContent = programadas;
    totalRealizadas.textContent = realizadas;
    percentualConclusao.textContent = `${percentual}%`;

    // Renderizar lista
    renderizarAtividades();
}

// Renderizar atividades na tela
function renderizarAtividades() {
    if (atividadesHoje.length === 0) {
        listaAtividades.innerHTML = '<p class="empty">Nenhuma atividade programada até hoje.</p>';
        return;
    }

    let html = '';

    atividadesHoje.forEach((atividade, index) => {
        const situacao = (atividade['Situação'] || atividade['SituaÃ§Ã£o'] || '').trim().toLowerCase();
        const estaConcluida = situacao === 'feito';
        const classConcluida = estaConcluida ? 'concluida' : '';

        html += `
            <div class="atividade-item ${classConcluida}" data-index="${index}">
                <div class="atividade-info">
                    <div class="atividade-data">${atividade.DATA || ''}</div>
                    <div class="atividade-terminal">${atividade.TERMINAL || ''}</div>
                    <div class="atividade-encarregada">${atividade.Encarregada || ''}</div>
                </div>
                <div class="toggle-container">
                    <label class="toggle-switch">
                        <input type="checkbox"
                               ${estaConcluida ? 'checked' : ''}
                               onchange="marcarAtividade(${index}, this.checked)"
                               data-row="${atividade.rowIndex}">
                        <span class="slider"></span>
                    </label>
                    <div class="toggle-label">${estaConcluida ? 'Feito' : 'Pendente'}</div>
                </div>
            </div>
        `;
    });

    listaAtividades.innerHTML = html;
}

// Marcar atividade como feita/pendente
async function marcarAtividade(index, checked) {
    const atividade = atividadesHoje[index];
    const checkbox = event.target;
    const item = checkbox.closest('.atividade-item');
    const label = item.querySelector('.toggle-label');

    // Desabilitar enquanto processa
    checkbox.disabled = true;

    try {
        // Se tem API configurada, tenta atualizar via API
        if (CONFIG.apiKey && CONFIG.spreadsheetId) {
            await atualizarViaAPI(atividade.rowIndex, checked);
        } else {
            // Simula atualização local (sem persistência)
            console.warn("API não configurada. Atualizando apenas localmente.");
            await new Promise(resolve => setTimeout(resolve, 300)); // Simula delay
        }

        // Atualizar localmente
        const colunaSituacao = atividade['Situação'] !== undefined ? 'Situação' : 'SituaÃ§Ã£o';
        atividade[colunaSituacao] = checked ? 'Feito' : '';

        if (checked) {
            atividade['Execução'] = getDataAtual();
        } else {
            atividade['Execução'] = '';
        }

        // Atualizar interface
        if (checked) {
            item.classList.add('concluida');
            label.textContent = 'Feito';
        } else {
            item.classList.remove('concluida');
            label.textContent = 'Pendente';
        }

        // Recalcular estatísticas
        filtrarEExibir();

    } catch (error) {
        console.error("Erro ao atualizar atividade:", error);
        alert("Erro ao atualizar atividade. Verifique a configuração da API.");
        // Reverter checkbox
        checkbox.checked = !checked;
    } finally {
        checkbox.disabled = false;
    }
}

// Atualizar via Google Sheets API
async function atualizarViaAPI(rowIndex, checked) {
    if (!CONFIG.apiKey || !CONFIG.spreadsheetId) {
        throw new Error("API Key ou Spreadsheet ID não configurados");
    }

    const valores = checked ? 'Feito' : '';
    const dataExecucao = checked ? getDataAtual() : '';

    // Coluna E = Situação (índice 4), Coluna F = Execução (índice 5)
    const range = `Sheet1!E${rowIndex}:F${rowIndex}`;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${CONFIG.apiKey}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: [[valores, dataExecucao]]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao atualizar planilha');
    }

    console.log("Atividade atualizada com sucesso via API");
}

// Modal de configuração
btnConfig.addEventListener('click', () => {
    document.getElementById('apiKey').value = CONFIG.apiKey;
    document.getElementById('spreadsheetId').value = CONFIG.spreadsheetId;
    modal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

salvarConfig.addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const spreadsheetId = document.getElementById('spreadsheetId').value.trim();

    if (apiKey && spreadsheetId) {
        CONFIG.apiKey = apiKey;
        CONFIG.spreadsheetId = spreadsheetId;

        localStorage.setItem('sheetsApiKey', apiKey);
        localStorage.setItem('spreadsheetId', spreadsheetId);

        alert('Configuração salva com sucesso!');
        modal.style.display = 'none';
    } else {
        alert('Por favor, preencha todos os campos.');
    }
});

// Tornar funções globais para uso no HTML
window.marcarAtividade = marcarAtividade;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    // Atualizar dados a cada 5 minutos
    setInterval(carregarDados, 5 * 60 * 1000);
});