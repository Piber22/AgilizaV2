console.log("Sistema de Gerenciamento de Atividades - Inicializado");

// Configurações
const CONFIG = {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&output=csv",
    // ⬇️ COLE SUA URL DO WEB APP AQUI (entre as aspas)
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzqhtngtubpKKGS0_18gPaM3GWjRfyR65TkLwh4RzC3Ge-aQD9tNL1KN2kNV_XnIPd6/exec'
    // Exemplo: 'https://script.google.com/macros/s/AKfycbz.../exec'
};

// Elementos DOM
const listaAtividades = document.getElementById('listaAtividades');
const totalProgramadas = document.getElementById('totalProgramadas');
const totalRealizadas = document.getElementById('totalRealizadas');
const percentualConclusao = document.getElementById('percentualConclusao');
const btnOcultarConcluidas = document.getElementById('btnOcultarConcluidas');
const btnOrdenarData = document.getElementById('btnOrdenarData');
const inputDataInicial = document.getElementById('dataInicial');
const inputDataFinal = document.getElementById('dataFinal');
const btnAplicarFiltro = document.getElementById('btnAplicarFiltro');
const btnLimparFiltro = document.getElementById('btnLimparFiltro');

// Dados globais
let todosOsDados = [];
let atividadesHoje = [];
let ocultarConcluidas = false;
let ordenacaoCrescente = true; // true = mais antigo primeiro, false = mais recente primeiro
let dataInicialFiltro = null;
let dataFinalFiltro = null;

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

// Função para converter data dd/mm/yyyy para formato yyyy-mm-dd (input type="date")
function converterParaInputDate(dataStr) {
    if (!dataStr || dataStr.length < 10) return '';
    const partes = dataStr.split('/');
    if (partes.length !== 3) return '';
    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`;
}

// Função para converter data yyyy-mm-dd para dd/mm/yyyy
function converterDeInputDate(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return '';
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
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

        // Atualizar variável global para uso em outros scripts
        window.todosOsDados = todosOsDados;

        filtrarEExibir();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        listaAtividades.innerHTML = `<p class="error">Erro ao carregar atividades: ${error.message}</p>`;
    }
}

// Filtrar atividades até a data atual e exibir
function filtrarEExibir() {
    const dataHoje = getDataAtual();

    // Determinar qual data final usar (filtro ou hoje)
    let dataLimite = dataHoje;
    if (dataFinalFiltro) {
        dataLimite = dataFinalFiltro;
    }

    // Filtrar atividades até a data limite
    let atividadesFiltradas = todosOsDados.filter(row => {
        const dataAtividade = row.DATA || '';

        // Verificar se está até a data limite
        if (!dataEhAnteriorOuIgual(dataAtividade, dataLimite)) {
            return false;
        }

        // Verificar se está após ou igual à data inicial (se definida)
        if (dataInicialFiltro) {
            if (!dataEhAnteriorOuIgual(dataInicialFiltro, dataAtividade)) {
                return false;
            }
        }

        return true;
    });

    // Ordenar por data
    atividadesFiltradas.sort((a, b) => {
        const dataA = converterParaDate(a.DATA || '');
        const dataB = converterParaDate(b.DATA || '');

        if (!dataA || !dataB) return 0;

        if (ordenacaoCrescente) {
            return dataA - dataB; // Mais antigo primeiro
        } else {
            return dataB - dataA; // Mais recente primeiro
        }
    });

    // Filtrar concluídas se necessário
    if (ocultarConcluidas) {
        atividadesFiltradas = atividadesFiltradas.filter(row => {
            const situacao = (row['Situação'] || row['Situação'] || '').trim().toLowerCase();
            return situacao !== 'feito';
        });
    }

    atividadesHoje = atividadesFiltradas;

    // Calcular estatísticas (sempre considerar o período filtrado)
    const todasNoFiltro = todosOsDados.filter(row => {
        const dataAtividade = row.DATA || '';

        // Verificar se está até a data limite
        if (!dataEhAnteriorOuIgual(dataAtividade, dataLimite)) {
            return false;
        }

        // Verificar se está após ou igual à data inicial (se definida)
        if (dataInicialFiltro) {
            if (!dataEhAnteriorOuIgual(dataInicialFiltro, dataAtividade)) {
                return false;
            }
        }

        return true;
    });

    const programadas = todasNoFiltro.length;
    const realizadas = todasNoFiltro.filter(row => {
        const situacao = (row['Situação'] || row['Situação'] || '').trim().toLowerCase();
        return situacao === 'feito';
    }).length;
    const percentual = programadas > 0 ? ((realizadas / programadas) * 100).toFixed(1) : 0;

    // Atualizar estatísticas
    totalProgramadas.textContent = programadas;
    totalRealizadas.textContent = realizadas;
    percentualConclusao.textContent = `${percentual}%`;

    // Atualizar texto do botão
    if (btnOcultarConcluidas) {
        btnOcultarConcluidas.textContent = ocultarConcluidas ? '👁️ Mostrar Concluídas' : '🚫 Ocultar Concluídas';
    }

    if (btnOrdenarData) {
        btnOrdenarData.textContent = ordenacaoCrescente ? '📅 ↓ Mais Recente Primeiro' : '📅 ↑ Mais Antigo Primeiro';
    }

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
        // Se tem Web App configurada, tenta atualizar
        if (CONFIG.webAppUrl && CONFIG.webAppUrl !== 'COLE_SUA_URL_DO_WEB_APP_AQUI') {
            await atualizarViaWebApp(atividade.rowIndex, checked);
        } else {
            // Simula atualização local (sem persistência)
            console.warn("⚠️ Web App não configurada!");
            console.warn("📝 Edite o arquivo atividades.js e cole sua URL do Web App na linha:");
            console.warn("   webAppUrl: 'COLE_SUA_URL_AQUI'");
            alert("⚠️ Configure a URL do Web App no arquivo atividades.js para salvar as alterações!\n\nVeja o console (F12) para mais informações.");
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

        // Mensagens de erro mais específicas
        let mensagem = "Erro ao atualizar atividade.";

        if (error.message.includes("não configurad")) {
            mensagem = "Configure o Web App no botão ⚙️ antes de marcar atividades.";
        } else if (error.message.includes("Failed to fetch")) {
            mensagem = "Erro de conexão. Verifique:\n1. URL do Web App está correta\n2. Web App está publicado como 'Qualquer pessoa'\n3. Sua conexão com a internet";
        } else {
            mensagem = `Erro: ${error.message}`;
        }

        alert(mensagem);
        // Reverter checkbox
        checkbox.checked = !checked;
    } finally {
        checkbox.disabled = false;
    }
}

// Atualizar via Google Apps Script Web App
async function atualizarViaWebApp(rowIndex, checked) {
    if (!CONFIG.webAppUrl) {
        throw new Error("Web App URL não configurada");
    }

    const situacao = checked ? 'Feito' : '';
    const dataExecucao = checked ? getDataAtual() : '';

    console.log('Atualizando via Web App...', {
        url: CONFIG.webAppUrl,
        row: rowIndex,
        situacao: situacao,
        execucao: dataExecucao
    });

    const response = await fetch(CONFIG.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
            row: rowIndex,
            situacao: situacao,
            execucao: dataExecucao
        })
    });

    console.log("✅ Requisição enviada ao Web App");

    // Aguardar um pouco para dar tempo da planilha atualizar
    await new Promise(resolve => setTimeout(resolve, 1000));
}

// Event listeners dos botões de filtro
if (btnOcultarConcluidas) {
    btnOcultarConcluidas.addEventListener('click', () => {
        ocultarConcluidas = !ocultarConcluidas;
        filtrarEExibir();
    });
}

if (btnOrdenarData) {
    btnOrdenarData.addEventListener('click', () => {
        ordenacaoCrescente = !ordenacaoCrescente;
        filtrarEExibir();
    });
}

// Event listeners para filtro de datas
if (btnAplicarFiltro) {
    btnAplicarFiltro.addEventListener('click', () => {
        const dataInicial = inputDataInicial.value;
        const dataFinal = inputDataFinal.value;

        if (!dataInicial && !dataFinal) {
            alert('Por favor, selecione pelo menos uma data (inicial ou final).');
            return;
        }

        // Validar se data inicial é anterior ou igual à data final
        if (dataInicial && dataFinal) {
            const dtInicial = new Date(dataInicial);
            const dtFinal = new Date(dataFinal);

            if (dtInicial > dtFinal) {
                alert('A data inicial não pode ser posterior à data final.');
                return;
            }
        }

        // Converter para formato dd/mm/yyyy
        dataInicialFiltro = dataInicial ? converterDeInputDate(dataInicial) : null;
        dataFinalFiltro = dataFinal ? converterDeInputDate(dataFinal) : null;

        filtrarEExibir();
    });
}

if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener('click', () => {
        inputDataInicial.value = '';
        inputDataFinal.value = '';
        dataInicialFiltro = null;
        dataFinalFiltro = null;
        filtrarEExibir();
    });
}

// Tornar funções globais para uso no HTML e outros scripts
window.marcarAtividade = marcarAtividade;
window.getDataAtual = getDataAtual;
window.dataEhAnteriorOuIgual = dataEhAnteriorOuIgual;
window.todosOsDados = todosOsDados;

// Usar getters para garantir que sempre pegamos os valores atualizados
Object.defineProperty(window, 'dataInicialFiltro', {
    get: function() { return dataInicialFiltro; }
});
Object.defineProperty(window, 'dataFinalFiltro', {
    get: function() { return dataFinalFiltro; }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    // Atualizar dados a cada 5 minutos
    setInterval(carregarDados, 5 * 60 * 1000);
});