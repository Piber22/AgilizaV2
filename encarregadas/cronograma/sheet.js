console.log("Carregando planilha com filtros...");

// Elementos
const secaoDados = document.getElementById("dados");
const dataInput = document.getElementById("dataRecebimento");
const selectResp = document.getElementById("responsavel");

// LINK DO CSV (mantenha o mesmo que funcionou)
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&output=csv";

let todosOsDados = []; // Armazena todos os dados da planilha

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

// Filtra e exibe
function filtrarEExibir() {
    const dataSelecionada = dataInput.value;
    const responsavelSelecionado = selectResp.value;

    // Filtra os dados
    const filtrados = todosOsDados.filter(row => {
        const dataPlanilha = row["Data"] || row["Data Recebimento"] || "";
        const respPlanilha = row["Responsável"] || row["Responsavel"] || "";

        const matchData = !dataSelecionada || dataPlanilha === dataSelecionada;
        const matchResp = !responsavelSelecionado || respPlanilha === responsavelSelecionado;

        return matchData && matchResp;
    });

    // Exibe resultado
    if (filtrados.length === 0) {
        secaoDados.innerHTML = `<h2>Consulta</h2><p>Nenhum item encontrado para os filtros.</p>`;
        return;
    }

    let html = `<h2>Consulta</h2><table><thead><tr>`;
    Object.keys(filtrados[0]).forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    filtrados.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(v => html += `<td>${v}</td>`);
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `<style>
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #e0e0e0; font-weight: 600; }
        tr:nth-child(even) { background: #e0e0e0; }
        tr:hover { background: #f1f1f1; }
    </style>`;

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

        console.log("Todos os dados carregados:", todosOsDados);

        // Preenche o select com responsáveis únicos
        const responsaveis = [...new Set(todosOsDados.map(r => r["Responsável"] || r["Responsavel"]).filter(Boolean))];
        responsaveis.forEach(nome => {
            if (!selectResp.querySelector(`option[value="${nome}"]`)) {
                const opt = new Option(nome, nome);
                selectResp.add(opt);
            }
        });

        // Exibe todos os dados inicialmente
        filtrarEExibir();

    } catch (err) {
        console.error("Erro:", err);
        secaoDados.innerHTML = `<h2>Consulta</h2><p style="color:red">Erro: ${err.message}</p>`;
    }
}

// Eventos de filtro (atualiza ao mudar data ou responsável)
dataInput.addEventListener("change", filtrarEExibir);
selectResp.addEventListener("change", filtrarEExibir);

// Inicia
document.addEventListener("DOMContentLoaded", carregar);