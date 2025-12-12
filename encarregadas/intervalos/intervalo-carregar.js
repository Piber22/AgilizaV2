console.log("✅ intervalo-carregar.js carregado!");

// URL da planilha CSV publicada no Google Drive
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_yv1A_ct69W6MfQyZgYOmXchjyl_YGRCfcSLraUJYFL5LdaUHwWTbcm7zU6obsgnG2LJFiUZ62lgf/pub?gid=0&single=true&output=csv";

// Objeto para armazenar os colaboradores por equipe
let equipes = {};

// Função auxiliar para fazer parse de CSV
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

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
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

// Função para carregar os nomes da planilha
async function carregarNomes() {
    try {
        console.log("📄 Carregando dados da planilha...");

        const response = await fetch(urlCSV);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.text();
        console.log("✅ Dados recebidos da planilha");
        console.log("Primeiros 200 caracteres:", data.substring(0, 200));

        const linhas = parseCSV(data);
        console.log(`📊 Total de linhas processadas: ${linhas.length}`);

        // Processa as linhas (pula o cabeçalho)
        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i];

            if (linha.length < 2) {
                console.warn(`⚠️ Linha ${i} ignorada (colunas insuficientes):`, linha);
                continue;
            }

            const colaborador = linha[0].trim();
            const equipeOriginal = linha[1].trim();

            if (!colaborador || !equipeOriginal) {
                console.warn(`⚠️ Linha ${i} ignorada (dados vazios):`, linha);
                continue;
            }

            // Normaliza o nome da equipe
            const equipe = equipeOriginal.charAt(0).toUpperCase() + equipeOriginal.slice(1).toLowerCase();

            if (!equipes[equipe]) {
                equipes[equipe] = [];
            }
            equipes[equipe].push(colaborador);

            console.log(`✅ Adicionado: ${colaborador} → ${equipe}`);
        }

        // Ordena os colaboradores de cada equipe
        for (let equipe in equipes) {
            equipes[equipe].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        }

        console.log("✅ Estrutura final de equipes:", equipes);
        console.log(`📋 Total de equipes carregadas: ${Object.keys(equipes).length}`);

        if (Object.keys(equipes).length === 0) {
            console.error("❌ ERRO: Nenhuma equipe foi carregada!");
            alert("⚠️ Não foi possível carregar os dados da planilha.");
        } else {
            console.log("🎉 Dados carregados com sucesso!");
        }

    } catch (err) {
        console.error("❌ Erro ao carregar dados:", err);
        alert("Erro ao carregar a planilha. Verifique se ela está publicada corretamente.");
    }
}

// Carrega os nomes ao abrir a página
window.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Iniciando carregamento de dados...");
    carregarNomes();
});