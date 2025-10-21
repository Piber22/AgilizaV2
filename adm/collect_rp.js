// collect_rp.js

const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRNW7MsqTP_FUxCN9AwLPH229I6M4ZeQqqb3STic9AMF_c2budXj0gKMFDRR-a4tW0JiMunFfcH9brR/pubhtml?gid=0"; // gid=0 normalmente é a primeira aba, ajuste se necessário

async function atualizarBlocos() {
    try {
        const response = await fetch(sheetURL);
        const htmlText = await response.text();

        // Criar DOM temporário
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Seleciona todas as células da primeira tabela (aba "dados")
        const table = doc.querySelector("table"); // assume que a aba "dados" é a primeira
        const cells = table.querySelectorAll("tr td");

        // Pega os valores das células A2, B2, C2
        const valorA2 = cells[0*table.rows[0].cells.length + 0]?.innerText.trim() || "?"; // A2
        const valorB2 = cells[1*table.rows[0].cells.length + 1]?.innerText.trim() || "?"; // B2
        const valorC2 = cells[2*table.rows[0].cells.length + 2]?.innerText.trim() || "?"; // C2

        // Atualiza os blocos
        document.querySelector(".bloco-lateral-1").innerText = valorA2;
        document.querySelector(".bloco-lateral-2").innerText = valorB2;
        document.querySelector(".bloco-lateral-3").innerText = valorC2;

    } catch (error) {
        console.error("Erro ao atualizar os blocos:", error);
    }
}

window.addEventListener("DOMContentLoaded", atualizarBlocos);
