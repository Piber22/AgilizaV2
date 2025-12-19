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

    // Processar dados para as tabelas
    const dadosProcessados = processarDados(dadosFiltrados);

    // Renderizar tabelas
    renderizarTabela(dadosProcessados, tabelaMopsDiv, 'MOPS');
    renderizarTabela(dadosProcessados, tabelaPanosDiv, 'PANOS');
}

/**
 * Processa os dados do Sheets para o formato necessário
 * @param {Array} dados - Dados brutos do Sheets
 * @returns {Array} Dados processados agrupados por data
 */
function processarDados(dados) {
    const mapa = new Map();

    dados.forEach(item => {
        const data = item['Data Coleta'];
        if (!data) return;

        if (!mapa.has(data)) {
            mapa.set(data, {
                data: data,
                mopsSujo: 0,
                mopsLimpo: 0,
                panosSujo: 0,
                panosLimpo: 0,
                linkFotoSujo: null,
                linkFotoLimpo: null
            });
        }

        const registro = mapa.get(data);

        // Adicionar quantidades
        registro.mopsSujo += parseInt(item['Mops Sujos']) || 0;
        registro.mopsLimpo += parseInt(item['Mops Limpos']) || 0;
        registro.panosSujo += parseInt(item['Panos Sujos']) || 0;
        registro.panosLimpo += parseInt(item['Panos Limpos']) || 0;

        // Adicionar links de fotos (pega o primeiro link válido)
        if (!registro.linkFotoSujo && item['Link Foto Sujo'] && item['Link Foto Sujo'] !== 'Sem foto') {
            const urlConvertida = converterURLDrive(item['Link Foto Sujo']);
            console.log("URL Foto Sujo convertida:", urlConvertida);
            registro.linkFotoSujo = urlConvertida;
        }
        if (!registro.linkFotoLimpo && item['Link Foto Limpo'] && item['Link Foto Limpo'] !== 'Sem foto') {
            const urlConvertida = converterURLDrive(item['Link Foto Limpo']);
            console.log("URL Foto Limpo convertida:", urlConvertida);
            registro.linkFotoLimpo = urlConvertida;
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
 * Renderiza uma tabela de dados
 * @param {Array} dados - Array de registros processados
 * @param {HTMLElement} container - Container onde a tabela será renderizada
 * @param {string} tipo - "MOPS" ou "PANOS"
 */
function renderizarTabela(dados, container, tipo) {
    if (dados.length === 0) {
        container.innerHTML = "<p>Nenhum registro encontrado para o período selecionado.</p>";
        return;
    }

    const propriedadeSujo = tipo === 'MOPS' ? 'mopsSujo' : 'panosSujo';
    const propriedadeLimpo = tipo === 'MOPS' ? 'mopsLimpo' : 'panosLimpo';

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

    dados.forEach(registro => {
        const qtdSujo = registro[propriedadeSujo];
        const qtdLimpo = registro[propriedadeLimpo];

        html += `
            <tr>
                <td>${registro.data}</td>
                <td>${qtdSujo > 0 ? qtdSujo : '-'}</td>
                <td>${qtdLimpo > 0 ? qtdLimpo : '-'}</td>
                <td>
                    ${registro.linkFotoSujo ? `
                        <button class="btn-imagem" onclick="abrirImagem('${registro.linkFotoSujo}', '${tipo} - ${registro.data} - Sujo')" title="Ver imagem - Sujo">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                        </button>
                    ` : '<span style="color: #777;">-</span>'}
                    ${registro.linkFotoLimpo ? `
                        <button class="btn-imagem" onclick="abrirImagem('${registro.linkFotoLimpo}', '${tipo} - ${registro.data} - Limpo')" title="Ver imagem - Limpo" style="margin-left: 10px;">
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
 * Abre o modal com a imagem
 * @param {string} urlImagem - URL da imagem do Google Drive
 * @param {string} legenda - Legenda da imagem
 */
function abrirImagem(urlImagem, legenda) {
    console.log("Abrindo imagem:", urlImagem);
    console.log("Legenda:", legenda);

    if (!urlImagem) {
        alert('Imagem não disponível');
        return;
    }

    // Mostra modal e loading
    modal.style.display = "block";
    imagemModal.src = '';
    legendaImagem.textContent = 'Carregando imagem...';

    // Carrega a imagem
    imagemModal.src = urlImagem;

    // Trata erro de carregamento da imagem
    imagemModal.onerror = () => {
        console.error("Erro ao carregar imagem:", urlImagem);
        legendaImagem.textContent = `Erro ao carregar imagem`;

        // Tenta URL alternativa
        const fileId = urlImagem.match(/id=([a-zA-Z0-9_-]+)/);
        if (fileId && fileId[1]) {
            console.log("Tentando URL alternativa...");
            const urlAlternativa = `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
            imagemModal.src = urlAlternativa;

            imagemModal.onerror = () => {
                console.error("URL alternativa também falhou");
                legendaImagem.textContent = `Erro: Não foi possível carregar a imagem. Verifique se o arquivo está compartilhado publicamente.`;
                setTimeout(() => {
                    fecharModal();
                }, 3000);
            };
        } else {
            setTimeout(() => {
                fecharModal();
            }, 2000);
        }
    };

    // Quando a imagem carregar com sucesso
    imagemModal.onload = () => {
        console.log("Imagem carregada com sucesso!");
        legendaImagem.textContent = legenda;
    };
}

/**
 * Fecha o modal
 */
function fecharModal() {
    modal.style.display = "none";
    imagemModal.src = "";
    imagemModal.onerror = null;
    imagemModal.onload = null;
}

// Expor funções globalmente para os botões inline
window.abrirImagem = abrirImagem;