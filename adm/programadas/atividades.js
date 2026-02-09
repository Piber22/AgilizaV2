console.log("Sistema de Gerenciamento de Atividades - Inicializado");

// Configurações
const CONFIG = {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&output=csv",
    // URL do Google Apps Script Web App
    webAppUrl: localStorage.getItem('https://script.google.com/macros/s/AKfycbyuQYbNUK3lWR6KzyWkeD3OkQTXe_22MU3BWTf3_Ng20AJePYRSBwHttE19rrX87RcNKg/exec') || ''
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
        // Se tem Web App configurada, tenta atualizar
        if (CONFIG.webAppUrl) {
            await atualizarViaWebApp(atividade.rowIndex, checked);
        } else {
            // Simula atualização local (sem persistência)
            console.warn("Web App não configurada. Atualizando apenas localmente.");
            alert("⚠️ Configure o Web App no botão ⚙️ para salvar as alterações!");
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
        row: rowIndex,
        situacao: situacao,
        execucao: dataExecucao
    });

    const response = await fetch(CONFIG.webAppUrl, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar erro CORS
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            row: rowIndex,
            situacao: situacao,
            execucao: dataExecucao
        })
    });

    // No modo no-cors, não podemos ler a resposta
    // Assumimos sucesso se não houver erro de rede
    console.log("Atividade enviada ao Web App");

    // Aguardar um pouco para dar tempo da planilha atualizar
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Modal de configuração
btnConfig.addEventListener('click', () => {
    document.getElementById('webAppUrl').value = CONFIG.webAppUrl;
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
    const webAppUrl = document.getElementById('webAppUrl').value.trim();

    if (!webAppUrl) {
        alert('Por favor, preencha a URL do Web App.');
        return;
    }

    // Validar URL básica
    if (!webAppUrl.includes('script.google.com')) {
        alert('URL inválida. Deve ser uma URL do Google Apps Script.');
        return;
    }

    CONFIG.webAppUrl = webAppUrl;
    localStorage.setItem('webAppUrl', webAppUrl);

    alert('Configuração salva com sucesso!');
    modal.style.display = 'none';
});

// Tornar funções globais para uso no HTML
window.marcarAtividade = marcarAtividade;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    // Atualizar dados a cada 5 minutos
    setInterval(carregarDados, 5 * 60 * 1000);
});