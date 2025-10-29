console.log("Carregando planilha com filtros...");

// Elementos
const secaoDados = document.getElementById("dados");
const dataInput = document.getElementById("dataRecebimento");
const selectResp = document.getElementById("responsavel");
const secaoEstatisticas = document.getElementById("estatisticas");

// LINK DO CSV
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&output=csv";

let todosOsDados = [];

// Colunas visíveis (índices 1, 2, 3, 4 = posições 2, 3, 4, 5 do CSV)
const colunasVisiveis = [1, 2, 3, 4];

// Parse CSV
function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length < headers.length) continue;
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx]);
        data.push(row);
    }
    return data;
}

// Converte data de dd/mm/yyyy para yyyy-mm-dd (formato do input date)
function converterData(dataStr) {
    if (!dataStr || dataStr.length < 10) return "";
    const partes = dataStr.split('/');
    if (partes.length !== 3) return "";
    const [dia, mes, ano] = partes;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

// Calcula e exibe estatísticas
function exibirEstatisticas(dados) {
    if (!secaoEstatisticas || dados.length === 0) {
        if (secaoEstatisticas) secaoEstatisticas.style.display = 'none';
        return;
    }

    const total = dados.length;
    const feitas = dados.filter(row => {
        const situacao = (row["SituaÃ§Ã£o"] || row["Situação"] || "").trim().toLowerCase();
        return situacao === "feito";
    }).length;
    const pendentes = total - feitas;
    const porcentagem = total > 0 ? ((feitas / total) * 100).toFixed(1) : 0;

    secaoEstatisticas.style.display = 'block';
    secaoEstatisticas.innerHTML = `
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Programadas:</div>
                <div class="stat-value">${total}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Realizadas:</div>
                <div class="stat-value sucesso">${feitas}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Pendentes:</div>
                <div class="stat-value pendente">${pendentes}</div>
            </div>
            <div class="stat-box destaque">
                <div class="stat-label">Conclusão:</div>
                <div class="stat-value">${porcentagem}%</div>
                <div class="barra-progresso">
                    <div class="barra-progresso-fill" style="width: ${porcentagem}%"></div>
                </div>
            </div>
        </div>
    `;
}

// Filtra e exibe
function filtrarEExibir() {
    const dataSelecionada = dataInput.value; // yyyy-mm-dd
    const responsavelSelecionado = selectResp.value;

    const dataFiltro = dataSelecionada ? new Date(dataSelecionada) : null;

    // FILTRO 1: Para cálculos (data <= selecionada) - MANTIDO ORIGINAL
    const filtradosParaCalculo = todosOsDados.filter((row) => {
        const dataPlanilha = row["DATA"] || "";
        const respPlanilha = row["Encarregada"] || "";

        const dataConvertida = converterData(dataPlanilha);
        const dataObj = dataConvertida ? new Date(dataConvertida) : null;

        // Apenas datas ANTERIORES à selecionada
        const matchData = !dataFiltro || (dataObj && dataObj < dataFiltro);
        const matchResp = !responsavelSelecionado || respPlanilha === responsavelSelecionado;

        return matchData && matchResp;
    });

    // Exibe estatísticas com os dados do filtro de cálculo
    exibirEstatisticas(filtradosParaCalculo);

    // FILTRO 2: Para exibição da tabela (data EXATA selecionada)
    const filtradosParaTabela = todosOsDados.filter((row) => {
        const dataPlanilha = row["DATA"] || "";
        const respPlanilha = row["Encarregada"] || "";

        const dataConvertida = converterData(dataPlanilha);

        // Se não há data selecionada, mostra todos (ou apenas filtro de responsável)
        const matchData = !dataSelecionada || dataConvertida === dataSelecionada;
        const matchResp = !responsavelSelecionado || respPlanilha === responsavelSelecionado;

        return matchData && matchResp;
    });

    // Exibe tabela com os dados do filtro de exibição
    if (filtradosParaTabela.length === 0) {
        secaoDados.innerHTML = `<h2>Consulta</h2><p>Nenhum item encontrado para os filtros selecionados.</p>`;
        return;
    }

    const todasColunas = Object.keys(filtradosParaTabela[0]);
    const colunasExibir = colunasVisiveis.map(idx => todasColunas[idx]).filter(Boolean);

    let html = `<table><thead><tr>`;
    colunasExibir.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    filtradosParaTabela.forEach(row => {
        html += `<tr>`;
        colunasExibir.forEach(coluna => {
            html += `<td>${row[coluna] || ''}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    secaoDados.innerHTML = html;
}

// Carrega dados da planilha
async function carregar() {
    try {
        secaoDados.innerHTML = "<h2>Consulta</h2><p>Carregando dados da planilha...</p>";

        const res = await fetch(urlCSV);
        if (!res.ok) throw new Error("Erro HTTP: " + res.status);

        const text = await res.text();
        todosOsDados = parseCSV(text);

        if (todosOsDados.length === 0) {
            secaoDados.innerHTML = "<h2>Consulta</h2><p>Nenhum dado na planilha.</p>";
            return;
        }

        // Preenche o select com encarregadas únicas
        const responsaveis = [...new Set(todosOsDados.map(r => r["Encarregada"]).filter(Boolean))];
        while (selectResp.options.length > 1) selectResp.remove(1);
        responsaveis.forEach(nome => selectResp.add(new Option(nome, nome)));

        // Exibe todos os dados inicialmente
        filtrarEExibir();

    } catch (err) {
        console.error("Erro:", err);
        secaoDados.innerHTML = `<h2>Consulta</h2><p style="color:red">Erro ao carregar: ${err.message}</p>`;
    }
}

// Eventos de filtro
dataInput.addEventListener("change", filtrarEExibir);
selectResp.addEventListener("change", filtrarEExibir);

// Inicia
document.addEventListener("DOMContentLoaded", carregar);