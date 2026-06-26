document.addEventListener("DOMContentLoaded", function () {
    // === LÓGICA DOS BOTÕES ===
    const buttons = document.querySelectorAll(".login-option");
    const formsSection = document.getElementById("Forms");

    buttons.forEach((button) => {
        button.addEventListener("click", function () {
            // Se for o botão de relatório, chama a função específica
            if (button.id === "gerar-relatorio") {
                gerarRelatorioVisual();
                return;
            }

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
    const statBoxes = document.querySelectorAll(".stat-box");

    // Função para criar o HTML atualizado de cada stat-box
    function criarStatHTML(realizado, meta, label) {
        const porcentagem = Math.min((realizado / meta) * 100, 100);
        const isCompleto = realizado >= meta;

        return `
            <div class="status-indicator ${isCompleto ? 'completo' : ''}"></div>
            <div class="stat-label">${label}</div>
            <div class="stat-value">
                <div class="stat-numbers">
                    <span class="stat-realizado">${realizado}</span>
                    <span class="stat-separator">/</span>
                    <span class="stat-meta">${meta}</span>
                </div>
                <div class="stat-description">
                    <span class="desc-realizado">Realizados</span>
                    <span class="desc-meta">Meta</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${isCompleto ? 'completo' : ''}" style="width: ${porcentagem}%"></div>
            </div>
        `;
    }

    // Função para atualizar as estatísticas
    function atualizarEstatisticas(responsavel) {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: function (results) {
                const dados = results.data;
                console.log("✅ Dados recebidos do Google Sheets:", dados);

                let ap = 0, ipsma = 0, opai = 0;
                let metaAP, metaIPSMA, metaOPAI;

                if (!responsavel || responsavel === "") {
                    // SEM FILTRO: soma todos os responsáveis + meta da equipe
                    dados.forEach(r => {
                        if (r.Responsável || r.Responsavel) {
                            ap += parseInt(r.AP || 0);
                            ipsma += parseInt(r.IPSMA || 0);
                            opai += parseInt(r.OPAI || 0);
                        }
                    });
                    // Metas da equipe
                    metaAP = 106;
                    metaIPSMA = 10;
                    metaOPAI = 20;
                    console.log("📊 Total geral - AP:", ap, "IPSMA:", ipsma, "OPAI:", opai);
                } else {
                    // COM FILTRO: busca apenas o responsável selecionado + meta individual
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
                    // Metas individuais
                    metaAP = 18;
                    metaIPSMA = 2;
                    metaOPAI = 4;
                }

                // Atualiza os três boxes com o novo HTML (ordem: IPSMA, OPAI, AP)
                statBoxes[0].innerHTML = criarStatHTML(ipsma, metaIPSMA, "IPSMA:");
                statBoxes[1].innerHTML = criarStatHTML(opai, metaOPAI, "OPAI:");
                statBoxes[2].innerHTML = criarStatHTML(ap, metaAP, "AP:");

                // Adiciona classes de status aos boxes (ordem: IPSMA, OPAI, AP)
                statBoxes[0].className = `stat-box ${ipsma >= metaIPSMA ? 'completo' : 'pendente'}`;
                statBoxes[1].className = `stat-box ${opai >= metaOPAI ? 'completo' : 'pendente'}`;
                statBoxes[2].className = `stat-box ${ap >= metaAP ? 'completo' : 'pendente'}`;
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

        // Controla a visibilidade do botão de relatório
        const btnRelatorio = document.getElementById("gerar-relatorio");
        if (this.value.toLowerCase() === "adrisson" || this.value.toLowerCase() === "ádrisson") {
            btnRelatorio.style.display = "block";
        } else {
            btnRelatorio.style.display = "none";
        }
    });
});