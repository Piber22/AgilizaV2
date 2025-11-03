document.addEventListener("DOMContentLoaded", function () {
    // === LÓGICA DOS BOTÕES ===
    const buttons = document.querySelectorAll(".login-option");
    const formsSection = document.getElementById("Forms");

    buttons.forEach((button) => {
        button.addEventListener("click", function () {
            // Toggle: se já ativo, desativa e limpa
            if (button.classList.contains("active")) {
                button.classList.remove("active");
                formsSection.innerHTML = "";
                return;
            }

            // Remove a seleção de todos os outros
            buttons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");

            // Limpa inputs existentes
            formsSection.innerHTML = "";

            // Chama a função correspondente à ferramenta
            switch(button.id) {
                case "ap":
                    if (typeof criarCamposAP === "function") {
                        criarCamposAP(formsSection);
                    }
                    break;
                case "ipsma":
                    if (typeof criarCamposIPSMA === "function") {
                        criarCamposIPSMA(formsSection);
                    }
                    break;
                case "opai":
                    if (typeof criarCamposOPAI === "function") {
                        criarCamposOPAI(formsSection);
                    }
                    break;
            }
        });
    });

    // === NOVO TRECHO: ATUALIZAÇÃO DINÂMICA DAS ESTATÍSTICAS ===
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOCdgTpKJg52io24jaXoqqCL2yXRyUeoK23-LbkNcZTBxzGuy8yxKTWXopmdqcP4bJboGeagpaHLPm/pub?gid=0&single=true&output=csv";
    const selectResponsavel = document.getElementById("responsavel");
    const estatisticasSection = document.getElementById("estatisticas");
    const statValues = document.querySelectorAll(".stat-box .stat-value");

    // Quando o usuário escolher um responsável
    selectResponsavel.addEventListener("change", function() {
        const responsavel = this.value;

        Papa.parse(url, {
            download: true,
            header: true,
            complete: function(results) {
                const dados = results.data;

                // Encontra o registro do responsável (ignora maiúsculas/minúsculas e espaços)
                const registro = dados.find(r =>
                    r.Responsável &&
                    r.Responsável.trim().toLowerCase() === responsavel.trim().toLowerCase()
                );

                if (registro) {
                    estatisticasSection.style.display = "block";

                    // Atualiza valores dinâmicos (atingido/meta)
                    statValues[0].textContent = `${registro.AP || 0}/10`;
                    statValues[1].textContent = `${registro.IPSMA || 0}/10`;
                    statValues[2].textContent = `${registro.OPAI || 0}/10`;

                    // Aplica classes visuais conforme desempenho
                    statValues[0].className = (registro.AP >= 10) ? "stat-value sucesso" : "stat-value pendente";
                    statValues[1].className = (registro.IPSMA >= 10) ? "stat-value sucesso" : "stat-value pendente";
                    statValues[2].className = (registro.OPAI >= 10) ? "stat-value sucesso" : "stat-value pendente";
                } else {
                    estatisticasSection.style.display = "block";
                    statValues.forEach(v => {
                        v.textContent = "0/10";
                        v.className = "stat-value pendente";
                    });
                }
            },
            error: function(err) {
                console.error("Erro ao carregar planilha:", err);
            }
        });
    });
});
