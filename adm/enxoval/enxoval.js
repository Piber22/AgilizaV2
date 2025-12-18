/**
 * enxoval.js
 * Lógica principal da página de controle de enxoval
 */

console.log("Carregando página de controle de enxoval...");

// Elementos do DOM
const dataInicialInput = document.getElementById("dataInicial");
const dataFinalInput = document.getElementById("dataFinal");
const btnAplicarFiltro = document.getElementById("aplicarFiltro");
const tabelaMopsDiv = document.getElementById("tabelaMops");
const tabelaPanosDiv = document.getElementById("tabelaPanos");
const modal = document.getElementById("modalImagem");
const imagemModal = document.getElementById("imagemModal");
const legendaImagem = document.getElementById("legendaImagem");
const closeModal = document.querySelector(".close");

// Dados carregados
let todosOsDados = [];

/**
 * Inicialização da página
 */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM carregado, iniciando aplicação...");

    // Carregar dados
    await carregarDados();

    // Configurar eventos
    configurarEventos();

    // Exibir dados iniciais
    exibirDados();
});

/**
 * Carrega dados do Google Sheets
 */
async function carregarDados() {
    try {
        tabelaMopsDiv.innerHTML = "<p>Carregando dados...</p>";
        tabelaPanosDiv.innerHTML = "<p>Carregando dados...</p>";

        todosOsDados = await buscarDadosSheets();

        if (todosOsDados.length === 0) {
            tabelaMopsDiv.innerHTML = "<p>Nenhum dado encontrado na planilha.</p>";
            tabelaPanosDiv.innerHTML = "<p>Nenhum dado encontrado na planilha.</p>";
        }

        console.log("Dados carregados com sucesso");

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        tabelaMopsDiv.innerHTML = `<p style="color:red">Erro ao carregar dados: ${error.message}</p>`;
        tabelaPanosDiv.innerHTML = `<p style="color:red">Erro ao carregar dados: ${error.message}</p>`;
    }
}

/**
 * Configura eventos da página
 */
function configurarEventos() {
    // Evento do botão de filtrar
    btnAplicarFiltro.addEventListener("click", aplicarFiltros);

    // Eventos do modal
    closeModal.addEventListener("click", fecharModal);
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });

    // Tecla ESC fecha o modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
            fecharModal();
        }
    });
}

/**
 * Aplica filtros de data
 */
function aplicarFiltros() {
    exibirDados();
}

/**
 * Exibe os dados nas tabelas
 */
function exibirDados() {
    console.log("=== Exibindo dados ===");
    console.log("Total de registros:", todosOsDados.length);

    if (todosOsDados.length > 0) {
        console.log("Exemplo de registro:", todosOsDados[0]);
        console.log("Colunas disponíveis:", Object.keys(todosOsDados[0]));
    }

    // Obter filtros
    const dataInicial = dataInicialInput.value ? new Date(dataInicialInput.value) : null;
    const dataFinal = dataFinalInput.value ? new Date(dataFinalInput.value) : null;

    console.log("Filtros - Data inicial:", dataInicial, "Data final:", dataFinal);

    // Filtrar dados
    const dadosFiltrados = filtrarPorData(todosOsDados, dataInicial, dataFinal);
    console.log("Registros após filtro:", dadosFiltrados.length);

    // Separar MOPS e PANOS
    const dadosMops = dadosFiltrados.filter(item => item.MOPS && item.MOPS.trim() !== '');
    const dadosPanos = dadosFiltrados.filter(item => item.PANOS && item.PANOS.trim() !== '');

    console.log("Registros MOPS:", dadosMops.length);
    console.log("Registros PANOS:", dadosPanos.length);

    // Renderizar tabelas
    renderizarTabela(dadosMops, tabelaMopsDiv, 'MOPS');
    renderizarTabela(dadosPanos, tabelaPanosDiv, 'PANOS');
}

/**
 * Renderiza uma tabela de dados
 * @param {Array} dados - Array de registros
 * @param {HTMLElement} container - Container onde a tabela será renderizada
 * @param {string} tipo - "MOPS" ou "PANOS"
 */
function renderizarTabela(dados, container, tipo) {
    if (dados.length === 0) {
        container.innerHTML = "<p>Nenhum registro encontrado para o período selecionado.</p>";
        return;
    }

    let html = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Sujo</th>
                        <th>Limpo</th>
                        <th>Rol</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Agrupar por data e situação
    const registrosPorData = agruparPorData(dados, tipo);

    registrosPorData.forEach(registro => {
        html += `
            <tr>
                <td>${registro.data}</td>
                <td>${registro.sujo}</td>
                <td>${registro.limpo}</td>
                <td>
                    ${registro.temSujo ? `
                        <button class="btn-imagem" onclick="abrirImagem('${tipo}', '${registro.data}', 'Sujo')" title="Ver imagem - Sujo">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                        </button>
                    ` : '<span style="color: #777;">-</span>'}
                    ${registro.temLimpo ? `
                        <button class="btn-imagem" onclick="abrirImagem('${tipo}', '${registro.data}', 'Limpo')" title="Ver imagem - Limpo" style="margin-left: 10px;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Agrupa registros por data
 * @param {Array} dados - Array de registros
 * @param {string} tipo - "MOPS" ou "PANOS"
 * @returns {Array} Array de registros agrupados
 */
function agruparPorData(dados, tipo) {
    const mapa = new Map();

    dados.forEach(item => {
        const data = item.DATA;
        // Tenta diferentes variações do nome da coluna SITUAÇÃO
        const situacao = (item['SITUAÇÃO'] || item['SITUACAO'] || item['SITUAÃƒÂ‡ÃƒÂƒO'] || '').toString().trim();
        const quantidade = parseInt(item[tipo]) || 0;

        if (!mapa.has(data)) {
            mapa.set(data, {
                data: data,
                sujo: '-',
                limpo: '-',
                temSujo: false,
                temLimpo: false
            });
        }

        const registro = mapa.get(data);

        const situacaoLower = situacao.toLowerCase();
        if (situacaoLower === 'sujo') {
            registro.sujo = quantidade;
            registro.temSujo = quantidade > 0;
        } else if (situacaoLower === 'limpo') {
            registro.limpo = quantidade;
            registro.temLimpo = quantidade > 0;
        }
    });

    // Ordenar por data (mais recente primeiro)
    return Array.from(mapa.values()).sort((a, b) => {
        const dataA = converterDataParaObj(a.data);
        const dataB = converterDataParaObj(b.data);
        if (!dataA || !dataB) return 0;
        return dataB - dataA;
    });
}

/**
 * Abre o modal com a imagem
 * @param {string} tipo - "MOPS" ou "PANOS"
 * @param {string} data - Data no formato dd/mm/yyyy
 * @param {string} situacao - "Sujo" ou "Limpo"
 */
async function abrirImagem(tipo, data, situacao) {
    // Mostra loading
    imagemModal.src = '';
    legendaImagem.textContent = 'Carregando imagem...';
    modal.style.display = "block";

    try {
        const urlImagem = await obterURLImagem(tipo, data, situacao);

        if (!urlImagem) {
            legendaImagem.textContent = `Imagem não encontrada para ${tipo} - ${data} - ${situacao}`;
            imagemModal.alt = 'Imagem não encontrada';

            // Fecha o modal após 2 segundos
            setTimeout(() => {
                fecharModal();
            }, 2000);

            return;
        }

        imagemModal.src = urlImagem;
        legendaImagem.textContent = `${tipo} - ${data} - ${situacao}`;

        // Trata erro de carregamento da imagem
        imagemModal.onerror = () => {
            legendaImagem.textContent = `Erro ao carregar imagem: ${tipo} - ${data} - ${situacao}`;
            setTimeout(() => {
                fecharModal();
            }, 2000);
        };

    } catch (error) {
        console.error('Erro ao abrir imagem:', error);
        legendaImagem.textContent = `Erro: ${error.message}`;
        setTimeout(() => {
            fecharModal();
        }, 2000);
    }
}

/**
 * Fecha o modal
 */
function fecharModal() {
    modal.style.display = "none";
    imagemModal.src = "";
    imagemModal.onerror = null;
}

// Expor funções globalmente para os botões inline
window.abrirImagem = abrirImagem;