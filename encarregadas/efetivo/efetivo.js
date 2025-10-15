console.log("✅ Efetivo.js carregado!");

// Elementos do DOM
const selectResponsavel = document.getElementById("responsavel");
const colaboradoresSection = document.getElementById("Colaboradores");
const gerarBtn = document.getElementById("gerarBtn");
const copiarBtn = document.getElementById("copiarBtn");

// URL da planilha CSV publicada no Google Drive
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_yv1A_ct69W6MfQyZgYOmXchjyl_YGRCfcSLraUJYFL5LdaUHwWTbcm7zU6obsgnG2LJFiUZ62lgf/pub?gid=0&single=true&output=csv";

// Objeto para armazenar os colaboradores por equipe
let equipes = {};

// ============================
// Função auxiliar para parse CSV
// ============================
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
            } else current += char;
        }
        cols.push(current.trim());
        lines.push(cols);
    }
    return lines;
}

// ============================
// Carregar nomes da planilha
// ============================
async function carregarNomes() {
    try {
        console.log("🔄 Carregando dados da planilha...");
        const response = await fetch(urlCSV);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.text();
        const linhas = parseCSV(data);
        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i];
            if (linha.length < 2) continue;
            const colaborador = linha[0].trim();
            const equipeOriginal = linha[1].trim();
            if (!colaborador || !equipeOriginal) continue;
            const equipe = equipeOriginal.charAt(0).toUpperCase() + equipeOriginal.slice(1).toLowerCase();
            if (!equipes[equipe]) equipes[equipe] = [];
            equipes[equipe].push(colaborador);
        }
        for (let equipe in equipes) equipes[equipe].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        console.log("✅ Estrutura final de equipes:", equipes);
    } catch (err) {
        console.error("❌ Erro ao carregar dados:", err);
        alert("Erro ao carregar a planilha. Verifique se está publicada corretamente.");
    }
}

// ============================
// Atualizar colaboradores ao selecionar responsável
// ============================
selectResponsavel.addEventListener("change", function() {
    const selecionado = selectResponsavel.value;
    const lista = equipes[selecionado] || [];
    colaboradoresSection.innerHTML = "";

    if (lista.length > 0) {
        const h2 = document.createElement("h2");
        h2.textContent = "Colaboradores da equipe";
        colaboradoresSection.appendChild(h2);

        lista.sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach((nome, index)=>{
            const div = document.createElement("div");
            div.className = "colaborador-item";
            div.style.cssText = "display: flex; align-items: center; gap: 10px; margin: 10px 0; padding: 6px 12px; background: #201f20; border: 2px solid #5B5B5C; border-radius: 8px;";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "colaborador";
            checkbox.value = nome;

            const label = document.createElement("label");
            label.style.flex = "1";
            label.style.fontWeight = "500";
            label.textContent = nome;
            label.prepend(checkbox);

            div.appendChild(label);
            colaboradoresSection.appendChild(div);
        });
    } else {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhum colaborador encontrado para esta equipe.";
        aviso.style.color = "#999";
        colaboradoresSection.appendChild(aviso);
    }
});

// ============================
// Gerar mensagem
// ============================
gerarBtn.addEventListener("click", () => {
    const dataInput = document.getElementById("dataRecebimento").value;
    const responsavel = selectResponsavel.value;
    if (!responsavel) { alert("⚠️ Selecione um responsável!"); return; }

    let dataStr;
    if (dataInput) {
        const parts = dataInput.split("-");
        dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
        const d = new Date();
        dataStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }

    const selecionados = Array.from(document.querySelectorAll('input[name="colaborador"]:checked')).map(el=>el.value);
    if (selecionados.length === 0) { alert("⚠️ Selecione ao menos um colaborador!"); return; }

    let msg = `🔍 EFETIVO ${responsavel.toUpperCase()} 🔍\n📆 ${dataStr} 📆\n\n`;
    selecionados.forEach(n => { msg += `• ${n}\n`; });
    document.getElementById("resultado").value = msg;
});

// ============================
// Copiar mensagem e abrir WhatsApp
// ============================
copiarBtn.addEventListener("click", () => {
    const texto = document.getElementById("resultado").value;
    if (texto.trim() === "") { alert("Nenhuma mensagem foi gerada!"); return; }

    navigator.clipboard.writeText(texto)
        .then(() => {
            alert("Mensagem copiada com sucesso! Abrindo grupo do WhatsApp...");
            // Abre o grupo fixo do WhatsApp
            window.open("https://chat.whatsapp.com/IAbXun9LRzc61P6bm1coD8", "_blank");
        })
        .catch(() => {
            alert("Erro ao copiar a mensagem. Abra o grupo e cole manualmente.");
            window.open("https://chat.whatsapp.com/IAbXun9LRzc61P6bm1coD8", "_blank");
        });
});

// ============================
// Carregar nomes ao iniciar
// ============================
window.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Iniciando carregamento de dados...");
    carregarNomes();
});
