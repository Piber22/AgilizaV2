// collect_rp.js

const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRNW7MsqTP_FUxCN9AwLPH229I6M4ZeQqqb3STic9AMF_c2budXj0gKMFDRR-a4tW0JiMunFfcH9brR/pubhtml?gid=0";

async function atualizarBlocos() {
    try {
        const response = await fetch(sheetURL);
        const htmlText = await response.text();

        // Criar DOM temporário
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Seleciona a tabela (Google Sheets usa a classe "waffle")
        const table = doc.querySelector("table.waffle") || doc.querySelector("table");

        if (!table) {
            console.error("Tabela não encontrada no HTML retornado");
            console.log("HTML retornado:", htmlText.substring(0, 500)); // mostra primeiros 500 caracteres para debug
            return;
        }

        // Pega todas as linhas da tabela
        const rows = table.querySelectorAll("tr");

        if (rows.length < 2) {
            console.error("Número insuficiente de linhas na tabela");
            return;
        }

        // Linha 2 (índice 1, pois a linha 1 é geralmente o cabeçalho - índice 0)
        const row2 = rows[1];
        const cells = row2.querySelectorAll("td");

        // Pega os valores das células A2, B2, C2
        const valorA2 = cells[0]?.innerText.trim() || "?";
        const valorB2 = cells[1]?.innerText.trim() || "?";
        const valorC2 = cells[2]?.innerText.trim() || "?";

        console.log("Valores encontrados:", valorA2, valorB2, valorC2);

        // Atualiza os blocos de ROUPARIA
        const roupariaBloco1 = document.querySelector("#rouparia .bloco-lateral-1");
        const roupariaBloco2 = document.querySelector("#rouparia .bloco-lateral-2");
        const roupariaBloco3 = document.querySelector("#rouparia .bloco-lateral-3");

        if (roupariaBloco1) roupariaBloco1.innerText = valorA2;
        if (roupariaBloco2) roupariaBloco2.innerText = valorB2;
        if (roupariaBloco3) roupariaBloco3.innerText = valorC2;

        // Atualiza os blocos de ALMOXARIFADO (assumindo que você quer os mesmos valores)
        const almoxBloco1 = document.querySelector("#almoxarifado .bloco-lateral-1");
        const almoxBloco2 = document.querySelector("#almoxarifado .bloco-lateral-2");
        const almoxBloco3 = document.querySelector("#almoxarifado .bloco-lateral-3");

        if (almoxBloco1) almoxBloco1.innerText = valorA2;
        if (almoxBloco2) almoxBloco2.innerText = valorB2;
        if (almoxBloco3) almoxBloco3.innerText = valorC2;

        // Atualiza os blocos de ENCARREGADAS
        const encarregBloco1 = document.querySelector("#encarregadas .bloco-lateral-1");
        const encarregBloco2 = document.querySelector("#encarregadas .bloco-lateral-2");
        const encarregBloco3 = document.querySelector("#encarregadas .bloco-lateral-3");

        if (encarregBloco1) encarregBloco1.innerText = valorA2;
        if (encarregBloco2) encarregBloco2.innerText = valorB2;
        if (encarregBloco3) encarregBloco3.innerText = valorC2;

    } catch (error) {
        console.error("Erro ao atualizar os blocos:", error);
    }
}

window.addEventListener("DOMContentLoaded", atualizarBlocos);