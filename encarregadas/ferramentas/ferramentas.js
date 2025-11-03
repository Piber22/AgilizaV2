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
            switch (button.id) {
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

    // === ATUALIZAÇÃO DINÂMICA DAS ESTATÍSTICAS ===
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOCdgTpKJg52io24jaXoqqCL2yXRyUeoK23-LbkNcZTBxzGuy8yxKTWXopmdqcP4bJboGeagpaHLPm/pub?output=csv";

    const selectResponsavel = document.getElementById("responsavel");
    const statValues = document.querySelectorAll(".stat-box .stat-value");

    // Função para atualizar as estatísticas
    function atualizarEstatisticas(responsavel) {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: function (results) {
                const dados = results.data;
                console.log("✅ Dados recebidos do Google Sheets:", dados);

                let ap = 0, ipsma = 0, opai = 0;

                if (!responsavel || responsavel === "") {
                    // SEM FILTRO: soma todos os responsáveis
                    dados.forEach(r => {
                        if (r.Responsável || r.Responsavel) {
                            ap += parseInt(r.AP || 0);
                            ipsma += parseInt(r.IPSMA || 0);
                            opai += parseInt(r.OPAI || 0);
                        }
                    });
                    console.log("📊 Total geral - AP:", ap, "IPSMA:", ipsma, "OPAI:", opai);
                } else {
                    // COM FILTRO: busca apenas o responsável selecionado
                    const registro = dados.find(r =>
                        (r.Responsável || r.Responsavel) &&
                        (r.Responsável || r.Responsavel).trim().toLowerCase() === responsavel.trim().toLowerCase()
                    );

                    console.log("🔍 Registro encontrado:", registro);

                    if (registro) {
                        ap = parseInt(registro.AP || 0);
                        ipsma = parseInt(registro.IPSMA || 0);
                        opai = parseInt(registro.OPAI || 0);
                    }
                }

                // Atualiza os valores na tela
                statValues[0].textContent = `${ap}/10`;
                statValues[1].textContent = `${ipsma}/10`;
                statValues[2].textContent = `${opai}/10`;

                // Aplica classes de cor (verde se >= 10, vermelho se < 10)
                statValues[0].className = (ap >= 10) ? "stat-value sucesso" : "stat-value pendente";
                statValues[1].className = (ipsma >= 10) ? "stat-value sucesso" : "stat-value pendente";
                statValues[2].className = (opai >= 10) ? "stat-value sucesso" : "stat-value pendente";
            },
            error: function (err) {
                console.error("❌ Erro ao carregar planilha:", err);
            }
        });
    }

    // Carrega os dados ao iniciar a página (mostra total geral)
    atualizarEstatisticas("");

    // Atualiza quando o usuário mudar o select
    selectResponsavel.addEventListener("change", function () {
        atualizarEstatisticas(this.value);
    });
});