// =============================
// CONFIGURAÇÕES
// =============================
const sheetCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvpPG9-1mNVgErsPa79TqB2koPrRIfU0Gd17hiojJ2gjdRAJgQtU3u8bLXx_E-NTS7mlrqxvTvAv7H/pub?output=csv";
const webAppUrl = "https://script.google.com/macros/s/AKfycbxC3StOSfHE_mGOZ-AUIK-oo4EPZNVFaoIz-1i8fGPbYQ4-UiA4rC0jf7DCh_kNH9pq/exec";

let itensBD = [];


// =============================
// 1) Carregar lista de itens via CSV
// =============================
async function carregarItens() {
    try {
        const response = await fetch(sheetCSVUrl);
        const csvText = await response.text();

        const linhas = csvText.split("\n").map(l => l.trim());
        const resultado = [];

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
        console.log("✅ Itens carregados:", itensBD.length);
    } catch (erro) {
        console.error("❌ Erro ao carregar itens:", erro);
        alert("Erro ao carregar a lista de itens. Verifique a conexão.");
    }
}


// =============================
// 2) Preencher todos os selects .item
// =============================
function atualizarSelectsDeItens() {
    const selects = document.querySelectorAll(".item");

    const itensOrdenados = [...itensBD].sort((a, b) =>
        a.item.localeCompare(b.item, "pt-BR")
    );

    selects.forEach(select => {
        select.innerHTML = `<option value="">Selecione o item:</option>`;

        itensOrdenados.forEach(obj => {
            const option = document.createElement("option");
            option.value = obj.item;
            option.textContent = obj.item;
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

    novo.querySelector(".item").value = "";
    novo.querySelector(".quantidade").value = "";
    novo.querySelector(".acao").value = "";
    novo.querySelector(".local").value = "";

    container.appendChild(novo);

    const novoSelect = novo.querySelector(".item");
    novoSelect.innerHTML = `<option value="">Selecione o item:</option>`;

    const itensOrdenados = [...itensBD].sort((a, b) =>
        a.item.localeCompare(b.item, "pt-BR")
    );

    itensOrdenados.forEach(obj => {
        const option = document.createElement("option");
        option.value = obj.item;
        option.textContent = obj.item;
        option.dataset.id = obj.id;
        novoSelect.appendChild(option);
    });
});


// =============================
// 4) Enviar dados ao WebApp
// =============================
document.getElementById("formMovimentos").addEventListener("submit", async (e) => {
    e.preventDefault();

    const responsavel = document.getElementById("responsavel").value.trim();
    const itensSecoes = document.querySelectorAll(".item-section");

    if (!responsavel) {
        alert("⚠️ Informe o responsável.");
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
        const quantidade = secao.querySelector(".quantidade").value;
        const acao = secao.querySelector(".acao").value;
        const local = secao.querySelector(".local").value;

        // Só adiciona se tiver item selecionado
        if (itemNome && quantidade && acao) {
            registros.push({
                data: data,
                horario: horario,
                id: itemID,
                item: itemNome,
                tipo: acao,
                quantidade: quantidade,
                responsavel: responsavel,
                local: local,
                observacao: ""
            });
        }
    });

    if (registros.length === 0) {
        alert("⚠️ Preencha pelo menos um item completo.");
        return;
    }

    console.log("📤 Enviando dados:", registros);

    try {
        // Usar no-cors - não conseguimos ler a resposta, mas os dados são enviados!
        await fetch(webAppUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(registros)
        });

        console.log("✅ Requisição enviada com sucesso!");

        // Resetar formulário
        resetarFormulario();

        alert("✅ Movimento registrado com sucesso!");

    } catch (erro) {
        console.error("❌ Erro ao enviar:", erro);
        alert("❌ Erro ao enviar dados. Tente novamente.");
    }
});


// =============================
// 5) Resetar formulário
// =============================
function resetarFormulario() {
    document.getElementById("responsavel").value = "";

    const container = document.getElementById("itensContainer");
    const primeiro = document.querySelector(".item-section");

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