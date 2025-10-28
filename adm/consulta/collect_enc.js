// collect_enc.js — para planilha ENCARREGADAS

const SHEET_ID_ENC = "2PACX-1vTfAdbTie91WWcNgFSjWxz0jGeO-hI-Wnnf_JKOad0Yr-UfPznrXHRuCTUN-flOp9Mh5nG6DM0pKP8f";
const GID_ENC = "0";

// URL para buscar como CSV
const sheetURL_ENC = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_ENC}/pub?gid=${GID_ENC}&single=true&output=csv`;

// Função para parsear linha CSV corretamente
function parseCSVLineEnc(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') insideQuotes = !insideQuotes;
        else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else current += char;
    }
    result.push(current.trim());
    return result;
}

async function atualizarBlocosEnc() {
    try {
        console.log("Buscando dados da planilha ENCARREGADAS...");

        const response = await fetch(sheetURL_ENC);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const csvText = await response.text();
        console.log("CSV recebido (enc):", csvText.substring(0, 200));

        const lines = csvText.split('\n');
        if (lines.length < 2) {
            console.error("Planilha ENCARREGADAS sem dados suficientes");
            return;
        }

        const row2 = parseCSVLineEnc(lines[1]);
        const valorA2 = row2[1]?.trim() || "?";
        const valorB2 = row2[2]?.trim() || "?";
        const valorC2 = row2[3]?.trim() || "?";

        console.log("Valores ENCARREGADAS:", { A2: valorA2, B2: valorB2, C2: valorC2 });

        atualizarSecaoEnc("#encarregadas", valorA2, valorB2, valorC2);

        console.log("Blocos ENCARREGADAS atualizados com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar blocos ENCARREGADAS:", error);
        console.error("Detalhes:", error.message);
    }
}

function atualizarSecaoEnc(secaoId, valor1, valor2, valor3) {
    const bloco1 = document.querySelector(`${secaoId} .bloco-lateral-1`);
    const bloco2 = document.querySelector(`${secaoId} .bloco-lateral-2`);
    const bloco3 = document.querySelector(`${secaoId} .bloco-lateral-3`);

    if (bloco1) bloco1.innerText = valor1;
    if (bloco2) bloco2.innerText = valor2;
    if (bloco3) bloco3.innerText = valor3;
}

// Executar quando a página carregar
window.addEventListener("DOMContentLoaded", atualizarBlocosEnc);

// Atualizar automaticamente a cada 5 minutos
setInterval(atualizarBlocosEnc, 300000);
