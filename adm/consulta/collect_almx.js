// collect_almx.js

// Extrair o ID da planilha da URL original
const SHEET_ID_ALMX = "2PACX-1vTZDXxKdmGbbXvu77X5MTLRPzhUbtuhjEVi8-lq0rLOaYb-ukyOdBc94HnDYJ3tqL42lOH4Q8C6Q7Bl";
const GID_ALMX = "0";

// URL para buscar como CSV (mais fácil de parsear)
const sheetURL_ALMX = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_ALMX}/pub?gid=${GID_ALMX}&single=true&output=csv`;

// Função para parsear linha CSV corretamente (lidando com vírgulas dentro de aspas)
function parseCSVLineAlmx(line) {
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

async function atualizarBlocosAlmx() {
    try {
        console.log("Buscando dados da planilha do ALMOXARIFADO...");

        const response = await fetch(sheetURL_ALMX);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const csvText = await response.text();
        console.log("CSV recebido (almx):", csvText.substring(0, 200));

        const lines = csvText.split('\n');
        if (lines.length < 2) {
            console.error("A planilha do almoxarifado não tem dados suficientes");
            return;
        }

        const row2 = parseCSVLineAlmx(lines[1]);

        const valorA2 = row2[1]?.trim() || "?";
        const valorB2 = row2[2]?.trim() || "?";
        const valorC2 = row2[3]?.trim() || "?";

        console.log("Valores ALMOXARIFADO:", { A2: valorA2, B2: valorB2, C2: valorC2 });

        atualizarSecaoAlmx("#almoxarifado", valorA2, valorB2, valorC2);

        console.log("Blocos ALMOXARIFADO atualizados com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar os blocos do ALMOXARIFADO:", error);
        console.error("Detalhes:", error.message);
    }
}

function atualizarSecaoAlmx(secaoId, valor1, valor2, valor3) {
    const bloco1 = document.querySelector(`${secaoId} .bloco-lateral-1`);
    const bloco2 = document.querySelector(`${secaoId} .bloco-lateral-2`);
    const bloco3 = document.querySelector(`${secaoId} .bloco-lateral-3`);

    if (bloco1) bloco1.innerText = valor1;
    if (bloco2) bloco2.innerText = valor2;
    if (bloco3) bloco3.innerText = valor3;
}

// Executar quando a página carregar
window.addEventListener("DOMContentLoaded", atualizarBlocosAlmx);

// Atualizar automaticamente a cada 5 minutos
setInterval(atualizarBlocosAlmx, 300000);
