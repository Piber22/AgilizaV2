document.addEventListener("DOMContentLoaded", function () {

    const itensContainer = document.getElementById("itensContainer");
    const addItemBtn = document.getElementById("addItemBtn");
    const formMovimentos = document.getElementById("formMovimentos");

    // 🔧 Função para criar um bloco de item
    function criarItemSection() {
        const bloco = document.createElement("section");
        bloco.classList.add("item-section");

        bloco.innerHTML = `
            <label>Item:
                <input type="text" class="item" required placeholder="Item:">
            </label>

            <label>Quantidade:
                <input type="number" class="quantidade" required min="1" placeholder="Quantidade:">
            </label>

            <label>Ação:
                <select class="acao" required>
                    <option value="">Selecione:</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                </select>
            </label>

            <label>Local:
                <select class="local" required>
                    <option value="">Selecione:</option>
                    <option value="Sala100">Sala 100</option>
                    <option value="PCD">Banheiro PCD</option>
                </select>
            </label>
        `;

        return bloco;
    }

    // ➕ Adicionar novo item
    addItemBtn.addEventListener("click", () => {
        itensContainer.appendChild(criarItemSection());
    });

    // 📄 Registrar movimento
    formMovimentos.addEventListener("submit", function (e) {
        e.preventDefault();

        const responsavel = document.getElementById("responsavel").value;

        const itens = [...document.querySelectorAll(".item-section")].map(sec => {
            return {
                item: sec.querySelector(".item").value,
                quantidade: sec.querySelector(".quantidade").value,
                acao: sec.querySelector(".acao").value,
                local: sec.querySelector(".local").value
            };
        });

        // 🔥 Aqui você pode escolher o destino dos dados (planilha, API, histórico, etc.)
        console.log("Responsável:", responsavel);
        console.log("Movimentações:", itens);

        alert("Movimentação registrada com sucesso!");

        // 🔄 RESET total do formulário
        formMovimentos.reset();

        // remover todos os itens adicionados
        itensContainer.innerHTML = "";

        // recriar apenas 1 item-section inicial
        itensContainer.appendChild(criarItemSection());
    });

});
