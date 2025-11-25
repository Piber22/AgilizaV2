// =================================================
// 1. CONFIGURAÇÃO
// =================================================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvpPG9-1mNVgErsPa79TqB2koPrRIfU0Gd17hiojJ2gjdRAJgQtU3u8bLXx_E-NTS7mlrqxvTvAv7H/pub?output=csv";

// Lista estruturada de itens
let listaDeItens = [];

// =================================================
// 2. Carregar os itens da planilha (com ID)
// =================================================
async function carregarItens() {
    try {
        const resposta = await fetch(CSV_URL);
        const csvTexto = await resposta.text();

        const linhas = csvTexto.split("\n").map(l => l.trim());
        const cabecalho = linhas.shift(); // remove header

        listaDeItens = linhas
            .map(linha => linha.split(","))
            .filter(col => col.length >= 4)  // valida linha completa
            .map(col => ({
                id: col[0],
                item: col[1],
                categoria: col[2],
                local: col[3]
            }));

        popularTodosSelects();

    } catch (erro) {
        console.error("Erro ao carregar itens:", erro);
        alert("Erro ao carregar itens do estoque!");
    }
}

// =================================================
// 3. Popular os SELECTS com ID + Nome
// =================================================
function popularTodosSelects() {
    document.querySelectorAll("select.item").forEach(select => popularSelect(select));
}

function popularSelect(select) {
    select.innerHTML = `<option value="">Selecione:</option>`;

    listaDeItens.forEach(obj => {
        const opt = document.createElement("option");
        opt.value = obj.id;           // <-- IMPORTANTE: value será o ID
        opt.textContent = obj.item;   // <-- Mostramos o nome
        select.appendChild(opt);
    });
}

// =================================================
// 4. Adicionar novo item
// =================================================
document.getElementById("addItemBtn").addEventListener("click", () => {
    const container = document.getElementById("itensContainer");
    const modelo = container.querySelector(".item-section");

    const novoItem = modelo.cloneNode(true);

    // limpa todos os campos
    novoItem.querySelectorAll("input, select").forEach(el => el.value = "");

    container.appendChild(novoItem);

    // popular o novo select
    const novoSelect = novoItem.querySelector("select.item");
    popularSelect(novoSelect);
});

// =================================================
// 5. Ao salvar: reset mantém apenas 1 item
// =================================================
document.getElementById("formMovimentos").addEventListener("submit", (e) => {
    e.preventDefault();

    // Em breve faremos o envio pro Google Sheets
    alert("Movimento salvo! (implementaremos o envio depois)");

    // Reset
    const form = document.getElementById("formMovimentos");
    form.reset();

    const container = document.getElementById("itensContainer");

    // deixa apenas o primeiro bloco
    const modelo = container.querySelector(".item-section");
    container.innerHTML = "";
    container.appendChild(modelo);

    // repopular o select do item
    popularTodosSelects();
});

// =================================================
// 6. Inicialização
// =================================================
carregarItens();
