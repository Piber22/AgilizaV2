const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2quHj-6GWqnv9GZbuZEb_arSfgZJ7s9bfn5I1UJjVrNmkvAXkgqvAOBScC-tOcH7nsvroN5pXncAa/pub?gid=0&single=true&output=csv";
const META_CHECKLIST = 12;

let rawData = [];
let isDataLoaded = false;

// Elementos DOM
const monthSelector = document.getElementById('monthSelector');
const btnRefresh = document.getElementById('btnRefresh');
const totalChecklistsSpan = document.getElementById('totalChecklistsValue');
const progressFill = document.getElementById('progressChecklist');
const metaStatusSpan = document.getElementById('metaStatusText');
const avgNotaSpan = document.getElementById('avgNotaValue');
const avgClassificationSpan = document.getElementById('avgClassification');
const slaQtdScoreSpan = document.getElementById('slaQtdScore');
const slaNotaScoreSpan = document.getElementById('slaNotaScore');
const slaQtdDesc = document.getElementById('slaQtdDesc');
const slaNotaDesc = document.getElementById('slaNotaDesc');
const checklistsTableDiv = document.getElementById('checklistsTable');
const slaQtdBar = document.getElementById('slaQtdBar');
const slaNotaBar = document.getElementById('slaNotaBar');

// Função para converter data dd/mm/aaaa
function parseBrazilianDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    let clean = dateStr.trim();
    let parts = clean.split(/[\/\-]/);
    if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 0 && month <= 11 && day >= 1 && day <= 31)
            return new Date(year, month, day);
    }
    let d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
    return null;
}

function extractNotaValue(value) {
    if (value === undefined || value === null) return 0;
    let str = String(value).trim().replace(',', '.');
    let percentMatch = str.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) return parseFloat(percentMatch[1]);
    let numeric = parseFloat(str);
    if (!isNaN(numeric)) {
        if (numeric <= 1 && numeric >= 0 && str.includes('.')) return numeric * 100;
        return numeric;
    }
    return 0;
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (!lines.length) return { headers: [], records: [] };
    const parseRow = (line) => {
        let result = [], inQuotes = false, current = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') inQuotes = !inQuotes;
            else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
            else current += ch;
        }
        result.push(current);
        return result.map(cell => cell.replace(/^"|"$/g, '').trim());
    };
    const headers = parseRow(lines[0]);
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]);
        if (values.length === 1 && values[0] === "") continue;
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] !== undefined ? values[idx] : ""; });
        records.push(row);
    }
    return { headers, records };
}

async function fetchCSV() {
    try {
        let response;
        try { response = await fetch(CSV_URL, { mode: 'cors' }); }
        catch(e) { response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(CSV_URL)}`); }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (!text.trim()) throw new Error("Planilha vazia");
        const { headers, records } = parseCSV(text);
        if (!records.length) throw new Error("Nenhum registro");
        const dataKey = headers.find(h => h === "Data") || headers.find(h => h.toLowerCase() === "data");
        const notaKey = headers.find(h => h === "Nota Final") || headers.find(h => h.toLowerCase().includes("nota"));
        if (!dataKey) throw new Error(`Coluna 'Data' não encontrada. Cabeçalhos: ${headers.join(", ")}`);
        if (!notaKey) throw new Error(`Coluna 'Nota Final' não encontrada.`);
        console.log(`Colunas: Data="${dataKey}", Nota="${notaKey}"`);
        const parsed = [];
        for (const row of records) {
            const dateRaw = row[dataKey] || "";
            const notaRaw = row[notaKey] || "";
            const dataObj = parseBrazilianDate(dateRaw);
            if (!dataObj) continue;
            let notaVal = extractNotaValue(notaRaw);
            notaVal = Math.min(100, Math.max(0, notaVal));
            parsed.push({ dataObj, nota: notaVal });
        }
        console.log(`Registros válidos: ${parsed.length} de ${records.length}`);
        if (!parsed.length) throw new Error("Nenhuma data válida. Verifique o formato dd/mm/aaaa na coluna 'Data'.");
        return parsed;
    } catch(err) { throw err; }
}

async function loadData() {
    showLoading(true);
    try {
        rawData = await fetchCSV();
        isDataLoaded = true;
        applyMonthFilter();
    } catch(err) {
        console.error(err);
        checklistsTableDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${err.message}</div>`;
        isDataLoaded = false;
    } finally { showLoading(false); }
}

function filterByYearMonth(yearMonth) {
    if (!rawData.length) return [];
    const [year, month] = yearMonth.split('-').map(Number);
    return rawData.filter(record => {
        const d = record.dataObj;
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });
}

function calculateSLAQuantidade(qtd) {
    if (qtd >= 12) return 1.0;
    if (qtd === 11 || qtd === 10) return 0.75;
    if (qtd === 9) return 0.5;
    return 0.0;
}

function calculateSLANota(mediaNota) {
    if (mediaNota >= 85) return 1.0;
    if (mediaNota >= 80) return 0.75;
    if (mediaNota >= 75) return 0.5;
    return 0.0;
}

function applyMonthFilter() {
    if (!isDataLoaded || !rawData.length) return;
    let selectedMonth = monthSelector.value;
    if (!selectedMonth) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const defaultMonth = `${year}-${month}`;
        monthSelector.value = defaultMonth;
        selectedMonth = defaultMonth;
    }
    const filtered = filterByYearMonth(selectedMonth);
    const qtd = filtered.length;
    const somaNotas = filtered.reduce((acc, r) => acc + r.nota, 0);
    const mediaNota = qtd ? somaNotas / qtd : 0;

    // Atualiza card quantidade
    totalChecklistsSpan.innerText = qtd;
    const percentMeta = Math.min(100, (qtd / META_CHECKLIST) * 100);
    progressFill.style.width = `${percentMeta}%`;
    if (qtd >= META_CHECKLIST) {
        progressFill.style.background = "linear-gradient(90deg, #4CAF50, #81C784)";
        metaStatusSpan.innerHTML = `✅ Meta atingida! ${qtd} / ${META_CHECKLIST}`;
    } else {
        progressFill.style.background = "linear-gradient(90deg, #E94B22, #FF7043)";
        metaStatusSpan.innerHTML = `⚠️ ${qtd} de ${META_CHECKLIST} (faltam ${META_CHECKLIST - qtd})`;
    }

    // Nota média
    avgNotaSpan.innerText = mediaNota.toFixed(1) + "%";
    let mediaClass = mediaNota >= 85 ? "🏆 Excelente (≥85%)" : (mediaNota >= 75 ? "📈 Bom (75%-84,9%)" : (mediaNota >= 60 ? "⚠️ Atenção" : "🔻 Crítico"));
    avgClassificationSpan.innerHTML = `📊 ${mediaNota.toFixed(1)}% • ${mediaClass}`;

    // SLA Quantidade
    const slaQtd = calculateSLAQuantidade(qtd);
    slaQtdScoreSpan.innerText = slaQtd.toFixed(2);
    slaQtdBar.style.width = `${slaQtd * 100}%`;
    slaQtdDesc.innerText = qtd >= 12 ? "≥12 checklists → 1.0" : (qtd >= 10 ? `${qtd} → 0.75` : (qtd === 9 ? "9 → 0.5" : `${qtd} → 0.0`));

    // SLA Nota
    const slaNota = calculateSLANota(mediaNota);
    slaNotaScoreSpan.innerText = slaNota.toFixed(2);
    slaNotaBar.style.width = `${slaNota * 100}%`;
    slaNotaDesc.innerText = mediaNota >= 85 ? `Média ${mediaNota.toFixed(1)}% → 1.0` : (mediaNota >= 80 ? `${mediaNota.toFixed(1)}% → 0.75` : (mediaNota >= 75 ? `${mediaNota.toFixed(1)}% → 0.5` : `${mediaNota.toFixed(1)}% → 0.0`));

    renderChecklistTable(filtered, selectedMonth);
}

function renderChecklistTable(records, monthLabel) {
    if (!records.length) {
        checklistsTableDiv.innerHTML = `<div class="empty"><i class="far fa-folder-open"></i> Nenhum checklist em ${monthLabel.replace('-', '/')}</div>`;
        return;
    }
    const sorted = [...records].sort((a,b) => a.dataObj - b.dataObj);
    let html = `<div class="table-wrapper"><table class="mini-table"><thead><tr><th>Data</th><th>Nota Final</th><th>Status SLA Nota</th></tr></thead><tbody>`;
    for (let rec of sorted) {
        const dateFormatted = rec.dataObj.toLocaleDateString('pt-BR');
        const nota = rec.nota;
        let status = nota >= 85 ? "✅ Meta" : (nota >= 75 ? "⚠️ Regular" : "❌ Crítico");
        html += `<tr><td>${dateFormatted}</td><td><span class="nota-badge">${nota.toFixed(1)}%</span></td><td>${status}</td></tr>`;
    }
    html += `</tbody></table></div><div style="margin-top:12px; font-size:12px; color:#aaa;">📌 Total: ${records.length} checklists</div>`;
    checklistsTableDiv.innerHTML = html;
}

function showLoading(isLoading) {
    if (isLoading) checklistsTableDiv.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i> Carregando planilha...</div>`;
}

monthSelector.addEventListener('change', () => { if (isDataLoaded) applyMonthFilter(); });
btnRefresh.addEventListener('click', () => loadData());
loadData();