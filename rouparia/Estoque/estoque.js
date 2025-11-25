// =============================
// CONFIGURAÇÕES
// =============================
const sheetCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvpPG9-1mNVgErsPa79TqB2koPrRIfU0Gd17hiojJ2gjdRAJgQtU3u8bLXx_E-NTS7mlrqxvTvAv7H/pub?output=csv";
const webAppUrl = "https://script.google.com/macros/s/AKfycbyP_jZ9ypcwSVa8kYRrwZAXAlFBu5x1IPMK0gDFy9cGLyuJytSEKwr6bMvntn6ELjLE/exec";

let itensBD = []; // Onde ficam os itens carregados da planilha (ID + nome)


// =============================
// 1) Carregar lista de itens via CSV
// =============================
async function carregarItens() {
    const response = await fetch(sheetCSVUrl);
    const csvText = await response.text();

    const linhas = csvText.split("\n").map(l => l.trim());
    const resultado = [];

    // Ignora a primeira linha (cabeçalho)
    for (let i = 1; i < linhas.length; i++) {
        const col = linhas[i].split(",");

        if (col.length >= 4) {
            resultado.push({
                id: col[0],
                item: col[1],
                categoria: col[2],
                local: col[3]
            });
        }
    }

    itensBD = resultado;

    atualizarSelectsDeItens();
}


// =============================
// 2) Preencher todos os selects .item
// =============================
function atualizarSelectsDeItens() {
    const selects = document.querySelectorAll(".item");

    selects.forEach(select => {
        select.innerHTML = `<option value="">Selecione o item:</option>`;

        itensBD.forEach(obj => {
            const option = document.createElement("option");
            option.value = obj.item;
            option.textContent = `${obj.item} (ID ${obj.id})`;
            option.dataset.id = obj.id;
            select.appendChild(option);
        });
    });
}


// =============================
// 3) Duplicar item ao clicar em "Adicionar item"
// =============================
document.getElementById("addItemBtn").addEventListener("click", () => {
    const container = document.getElementById("itensContainer");
    const modelo = document.querySelector(".item-section");

    const novo = modelo.cloneNode(true);

    // Limpar campos
    novo.querySelector(".item").value = "";
    novo.querySelector(".quantidade").value = "";
    novo.querySelector(".acao").value = "";
    novo.querySelector(".local").value = "";

    container.appendChild(novo);

    atualizarSelectsDeItens();
});


// =============================
// 4) Enviar dados ao WebApp
// =============================
document.getElementById("formMovimentos").addEventListener("submit", async (e) => {
    e.preventDefault();

    const responsavel = document.getElementById("responsavel").value.trim();
    const itensSecoes = document.querySelectorAll(".item-section");

    if (!responsavel) {
        alert("Informe o responsável.");
        return;
    }

    const agora = new Date();
    const data = agora.toLocaleDateString("pt-BR");
    const horario = agora.toLocaleTimeString("pt-BR");

    let registros = [];

    itensSecoes.forEach(secao => {
        const selectItem = secao.querySelector(".item");
        const itemNome = selectItem.value;
        const itemID = selectItem.options[selectItem.selectedIndex]?.dataset?.id || "";

        registros.push({
            data: data,
            horario: horario,
            id: itemID,
            item: itemNome,
            tipo: secao.querySelector(".acao").value,
            quantidade: secao.querySelector(".quantidade").value,
            observacao: ""
        });
    });

    // Envia ao WebApp
    const resposta = await fetch(webAppUrl, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(registros)
    });

    // Reseta formulário mantendo apenas 1 item
    resetarFormulario();

    alert("Movimento registrado com sucesso!");
});


// =============================
// 5) Resetar formulário
// =============================
function resetarFormulario() {
    document.getElementById("responsavel").value = "";

    const container = document.getElementById("itensContainer");
    const primeiro = document.querySelector(".item-section");

    // Mantém apenas o primeiro
    container.innerHTML = "";
    container.appendChild(primeiro);

    primeiro.querySelector(".item").value = "";
    primeiro.querySelector(".quantidade").value = "";
    primeiro.querySelector(".acao").value = "";
    primeiro.querySelector(".local").value = "";

    atualizarSelectsDeItens();
}


// Iniciar sistema
carregarItens();
