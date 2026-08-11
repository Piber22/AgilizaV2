// =============================
// CONFIGURAÇÕES
// =============================
const sheetCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMs4JxlOx5o6W5cUGRmytAANh8B5HKO6yhvbLuYinisnZeU01mNM5DBAnopBGg9FYXMg0HXKMnNvek/pub?gid=0&single=true&output=csv";
const webAppUrl = "https://script.google.com/macros/s/AKfycbySEtbuzVzICf5gVwBz1cZcfQc-E6F-4Sqb5cC52nz0iyNBdWgO39fuq6whPdxzeOYK/exec";

let itensBD = []; // Onde ficam os itens carregados da planilha (ID + nome)

// =============================
// 1) Carregar lista de itens via CS V
// =============================
async function carregarItens() {
    try {
        const response = await fetch(sheetCSVUrl);
        const csvText = await response.text();

        const linhas = csvText.split("\n").map(l => l.trim()).filter(l => l !== "");
        const resultado = [];

        // Ignora a primeira linha (cabeçalho)
        for (let i = 1; i < linhas.length; i++) {
            const col = linhas[i].split(",");

            if (col.length >= 3) {
                resultado.push({
                    id: col[0],
                    item: col[1],
                    categoria: col[2],
                });
            }
        }

        itensBD = resultado;
        atualizarSelectsDeItens();
    } catch (erro) {
        console.error("Erro ao carregar itens:", erro);
        alert("Não foi possível carregar a lista de itens. Verifique a conexão.");
    }
}

// =============================
// 2) Preencher todos os selects .item
// =============================
function atualizarSelectsDeItens() {
    const selects = document.querySelectorAll(".item");

    // Ordenar itens alfabeticamente
    const itensOrdenados = [...itensBD].sort((a, b) =>
        a.item.localeCompare(b.item, "pt-BR")
    );

    selects.forEach(select => {
        const valorAtual = select.value; // preserva o valor se já estiver selecionado

        select.innerHTML = `<option value="">Selecione o item:</option>`;

        itensOrdenados.forEach(obj => {
            const option = document.createElement("option");
            option.value = obj.item;
            option.textContent = obj.item;
            option.dataset.id = obj.id;
            select.appendChild(option);
        });

        // Restaura o valor anterior (útil ao adicionar novos itens)
        if (valorAtual) {
            select.value = valorAtual;
        }
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

    container.appendChild(novo);

    // Reaproveita a função que já existe
    atualizarSelectsDeItens();
});

// =============================
// 4) Enviar dados ao WebApp
// =============================
document.getElementById("formMovimentos").addEventListener("submit", async (e) => {
    e.preventDefault();

    const botaoSalvar = e.target.querySelector('button[type="submit"]');
    const textoOriginal = botaoSalvar.textContent;

    // Estado de carregamento
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    botaoSalvar.style.opacity = "0.7";

    try {
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

            if (!itemNome) return; // ignora seções vazias

            registros.push({
                data: data,
                horario: horario,
                id: itemID,
                item: itemNome,
                tipo: secao.querySelector(".acao").value,
                quantidade: secao.querySelector(".quantidade").value,
                responsavel: responsavel,
            });
        });

        if (registros.length === 0) {
            alert("Adicione pelo menos um item.");
            return;
        }

        // Envia ao WebApp
        await fetch(webAppUrl, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(registros)
        });

        // Resetar formulário
        resetarFormulario();
        alert("Movimento registrado com sucesso!");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar. Tente novamente.");
    } finally {
        // Restaura o botão
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = textoOriginal;
        botaoSalvar.style.opacity = "1";
    }
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

    atualizarSelectsDeItens();
}

// Iniciar sistema
carregarItens();