console.log("Efetivo.js carregado! (adaptado para Recebimento)");

// Elementos do DOM
const selectResponsavel = document.getElementById("responsavel");
const dataRecebimento = document.getElementById("dataRecebimento");
const secaoDados = document.getElementById("dados");
const gerarBtn = document.getElementById("gerarBtn");
const copiarBtn = document.getElementById("copiarBtn");
const resultado = document.getElementById("resultado");

// URL da planilha CSV publicada (SUBSTITUA COM O PUBLINK)
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&single=true&output=csv";

// Armazena os dados da planilha
let dadosPlanilha = [];

// Função para parsear CSV (robusta, lida com aspas e vírgulas)
function parseCSV(text) {
    const lines = [];
    const rows = text.split(/\r?\n/);
    for (let row of rows) {
        if (!row.trim()) continue;
        const cols = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                cols.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        cols.push(current.trim());
        lines.push(cols);
    }
    return lines;
}

// Carrega dados da planilha
async function carregarDados() {
    try {
        console.log("Carregando dados da planilha...");
        secaoDados.innerHTML = "<h2>Consulta</h2><p>Carregando dados...</p>";

        const response = await fetch(urlCSV);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.text();
        const linhas = parseCSV(data);

        // Extrai cabeçalhos
        const headers = linhas[0];
        dadosPlanilha = [];

        for (let i = 1; i < linhas.length; i++) {
            const row = {};
            headers.forEach((h, idx) => {
                row[h.trim()] = linhas[i][idx]?.trim() || '';
            });
            if (Object.values(row).some(v => v)) {
                dadosPlanilha.push(row);
            }
        }

        console.log("Dados carregados:", dadosPlanilha);
        preencherResponsaveis();
        filtrarEExibir();

    } catch (err) {
        console.error("Erro:", err);
        secaoDados.innerHTML = "<h2>Consulta</h2><p style='color:red'>Erro ao carregar planilha.</p>";
    }
}

// Preenche o select com responsáveis únicos
function preencherResponsaveis() {
    const responsaveis = [...new Set(dadosPlanilha.map(r => r.Responsável || r.Responsavel).filter(Boolean))];
    responsaveis.forEach(nome => {
        if (![...selectResponsavel.options].some(opt => opt.value === nome)) {
            const opt = document.createElement("option");
            opt.value = nome;
            opt.textContent = nome;
            selectResponsavel.appendChild(opt);
        }
    });
}

// Filtra e exibe tabela
function filtrarEExibir() {
    const data = dataRecebimento.value;
    const resp = selectResponsavel.value;

    const filtrados = dadosPlanilha.filter(row => {
        const dataRow = row.Data || row['Data Recebimento'];
        const respRow = row.Responsável || row.Responsavel;
        return (!data || dataRow === data) && (!resp || respRow === resp);
    });

    if (filtrados.length === 0) {
        secaoDados.innerHTML = "<h2>Consulta</h2><p>Nenhum item encontrado.</p>";
        return;
    }

    let tabela = `<h2>Consulta</h2><table><thead><tr>`;
    const cols = Object.keys(filtrados[0]);
    cols.forEach(c => tabela += `<th>${c}</th>`);
    tabela += `</tr></thead><tbody>`;

    filtrados.forEach(row => {
        tabela += `<tr>`;
        cols.forEach(c => tabela += `<td>${row[c] || ''}</td>`);
        tabela += `</tr>`;
    });
    tabela += `</tbody></table>`;

    // Estilo básico
    tabela += `<style>
        #dados table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        #dados th, #dados td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        #dados th { background: #f0f0f0; }
    </style>`;

    secaoDados.innerHTML = tabela;
}

// Gera mensagem
gerarBtn.addEventListener("click", () => {
    const data = dataRecebimento.value;
    const resp = selectResponsavel.value;

    if (!data || !resp) {
        alert("Selecione data e responsável!");
        return;
    }

    const filtrados = dadosPlanilha.filter(row => {
        const dataRow = row.Data || row['Data Recebimento'];
        const respRow = row.Responsável || row.Responsavel;
        return dataRow === data && respRow === resp;
    });

    if (filtrados.length === 0) {
        resultado.value = "Nenhum item programado para esta data.";
        return;
    }

    let msg = `RECEBIMENTO DE ENXOVAL\n`;
    msg += `Data: ${data.split("-").reverse().join("/")}\n`;
    msg += `Responsável: ${resp}\n\n`;
    msg += `ITENS:\n`;

    let total = 0;
    filtrados.forEach(row => {
        const item = row.Item || row.Descrição || 'Item';
        const qtd = parseInt(row.Quantidade || row.Qtd || 0);
        total += qtd;
        msg += `• ${item}: ${qtd} un.\n`;
    });

    msg += `\nTOTAL: ${total} itens\n`;
    msg += `Aguardando confirmação.`;

    resultado.value = msg;
});

// Copiar
copiarBtn.addEventListener("click", () => {
    if (!resultado.value) {
        alert("Nada para copiar!");
        return;
    }
    navigator.clipboard.writeText(resultado.value).then(() => {
        alert("Mensagem copiada!");
    });
});

// Eventos de filtro
dataRecebimento.addEventListener("change", filtrarEExibir);
selectResponsavel.addEventListener("change", filtrarEExibir);

// Inicia
document.addEventListener("DOMContentLoaded", carregarDados);