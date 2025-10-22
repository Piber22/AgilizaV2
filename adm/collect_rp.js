// collect_rp.js

// Extrair o ID da planilha da URL original
// URL original: https://docs.google.com/spreadsheets/d/e/2PACX-1vRNW7MsqTP_FUxCN9AwLPH229I6M4ZeQqqb3STic9AMF_c2budXj0gKMFDRR-a4tW0JiMunFfcH9brR/pubhtml?gid=0
const SHEET_ID = "2PACX-1vSWRB_IYcrU6zgFqeB_FbOjhKeBTjDzoLnJlHYMAE4DvppA7U3_Uy5DzZIzk9Ce1NUonrTB4rw7AYwW";
const GID = "0"; // ID da aba "dados" (você precisa descobrir o GID correto)

// URL para buscar como CSV (mais fácil de parsear)
const sheetURL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${GID}&single=true&output=csv`;

// Função para parsear linha CSV corretamente (lidando com vírgulas dentro de aspas)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Adicionar o último valor
    result.push(current.trim());

    return result;
}

async function atualizarBlocos() {
    try {
        console.log("Buscando dados da planilha...");

        const response = await fetch(sheetURL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        console.log("CSV recebido:", csvText.substring(0, 200)); // Mostra início do CSV

        // Parsear CSV corretamente (lidando com vírgulas dentro de aspas)
        const lines = csvText.split('\n');

        if (lines.length < 2) {
            console.error("A planilha não tem dados suficientes");
            return;
        }

        // Pegar a segunda linha (índice 1, pois linha 1 é índice 0)
        // A linha 2 do Google Sheets corresponde a lines[1] no array
        const row2 = parseCSVLine(lines[1]);

        // Extrair valores das colunas A, B, C (índices 0, 1, 2)
        const valorA2 = row2[1]?.trim() || "?";
        const valorB2 = row2[2]?.trim() || "?";
        const valorC2 = row2[3]?.trim() || "?";

        console.log("Valores encontrados:", {
            A2: valorA2,
            B2: valorB2,
            C2: valorC2
        });

        // Atualizar blocos de ROUPARIA
        atualizarSecao("#rouparia", valorA2, valorB2, valorC2);

        // Atualizar blocos de ALMOXARIFADO
        //atualizarSecao("#almoxarifado", valorA2, valorB2, valorC2);

        // Atualizar blocos de ENCARREGADAS
        //atualizarSecao("#encarregadas", valorA2, valorB2, valorC2);

        console.log("Blocos atualizados com sucesso!");

    } catch (error) {
        console.error("Erro ao atualizar os blocos:", error);
        console.error("Detalhes:", error.message);
    }
}

function atualizarSecao(secaoId, valor1, valor2, valor3) {
    const bloco1 = document.querySelector(`${secaoId} .bloco-lateral-1`);
    const bloco2 = document.querySelector(`${secaoId} .bloco-lateral-2`);
    const bloco3 = document.querySelector(`${secaoId} .bloco-lateral-3`);

    if (bloco1) bloco1.innerText = valor1;
    if (bloco2) bloco2.innerText = valor2;
    if (bloco3) bloco3.innerText = valor3;
}

// Executar quando a página carregar
window.addEventListener("DOMContentLoaded", atualizarBlocos);

// Opciona l: Atualizar automaticamente a cada 5 minutos (300000 ms)
setInterval(atualizarBlocos, 300000);