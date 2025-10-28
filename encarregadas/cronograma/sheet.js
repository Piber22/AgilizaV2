console.log("Carregando planilha com filtros...");

// Elementos
const secaoDados = document.getElementById("dados");
const dataInput = document.getElementById("dataRecebimento");
const selectResp = document.getElementById("responsavel");

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

// Filtra e exibe
function filtrarEExibir() {
    const dataSelecionada = dataInput.value; // Formato: yyyy-mm-dd
    const responsavelSelecionado = selectResp.value;

    console.log("Filtros aplicados:", { data: dataSelecionada, responsavel: responsavelSelecionado });

    // Filtra os dados
    const filtrados = todosOsDados.filter(row => {
        const dataPlanilha = row["DATA"] || "";
        const dataConvertida = converterData(dataPlanilha);
        const respPlanilha = row["Encarregada"] || "";

        const matchData = !dataSelecionada || dataConvertida === dataSelecionada;
        const matchResp = !responsavelSelecionado || respPlanilha === responsavelSelecionado;

        return matchData && matchResp;
    });

    console.log(`Filtrados: ${filtrados.length} de ${todosOsDados.length} itens`);

    // Exibe resultado
    if (filtrados.length === 0) {
        secaoDados.innerHTML = `<h2>Consulta</h2><p>Nenhum item encontrado para os filtros selecionados.</p>`;
        return;
    }

    // Pega todas as colunas e filtra apenas as visíveis
    const todasColunas = Object.keys(filtrados[0]);
    const colunasExibir = colunasVisiveis.map(idx => todasColunas[idx]).filter(Boolean);

    let html = `<h2>Consulta</h2><table><thead><tr>`;
    colunasExibir.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    filtrados.forEach(row => {
        html += `<tr>`;
        colunasExibir.forEach(coluna => {
            html += `<td>${row[coluna] || ''}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;

    secaoDados.innerHTML = html;
    console.log(`Tabela atualizada: ${filtrados.length} itens exibidos`);
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

        console.log("Todos os dados carregados:", todosOsDados.length, "itens");
        console.log("Exemplo de linha:", todosOsDados[0]);

        // Preenche o select com encarregadas únicas
        const responsaveis = [...new Set(todosOsDados.map(r => r["Encarregada"]).filter(Boolean))];

        // Limpa options antigas (exceto a primeira)
        while (selectResp.options.length > 1) {
            selectResp.remove(1);
        }

        // Adiciona as encarregadas do CSV
        responsaveis.forEach(nome => {
            const opt = new Option(nome, nome);
            selectResp.add(opt);
        });

        console.log("Encarregadas carregadas:", responsaveis);

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