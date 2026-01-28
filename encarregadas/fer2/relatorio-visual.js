// ===== GERAÇÃO DE RELATÓRIO VISUAL =====

function gerarRelatorioVisual() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOCdgTpKJg52io24jaXoqqCL2yXRyUeoK23-LbkNcZTBxzGuy8yxKTWXopmdqcP4bJboGeagpaHLPm/pub?output=csv";

    Papa.parse(url, {
        download: true,
        header: true,
        complete: function (results) {
            const dados = results.data;

            // Filtra apenas registros válidos
            const colaboradores = dados.filter(r => r.Responsável || r.Responsavel);

            // Cria o modal/overlay para exibir o relatório
            criarModalRelatorio(colaboradores);
        },
        error: function (err) {
            console.error("❌ Erro ao carregar dados:", err);
            alert("Erro ao carregar dados do relatório.");
        }
    });
}

function criarModalRelatorio(colaboradores) {
    // Remove modal anterior se existir
    const modalExistente = document.getElementById("modal-relatorio");
    if (modalExistente) {
        modalExistente.remove();
    }

    // Cria overlay
    const overlay = document.createElement("div");
    overlay.id = "modal-relatorio";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        overflow-y: auto;
    `;

    // Container do relatório
    const container = document.createElement("div");
    container.id = "relatorio-container";
    container.style.cssText = `
        background: #201F20;
        border-radius: 15px;
        padding: 40px;
        max-width: 1200px;
        width: 100%;
        position: relative;
    `;

    // Botões de ação
    const botoesDiv = document.createElement("div");
    botoesDiv.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
        justify-content: flex-end;
    `;

    // Botão Fechar
    const btnFechar = document.createElement("button");
    btnFechar.textContent = "✕ Fechar";
    btnFechar.style.cssText = `
        padding: 10px 20px;
        background: #5b5b5b;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-family: 'Montserrat', sans-serif;
    `;
    btnFechar.onclick = () => overlay.remove();

    // Botão Baixar como Imagem
    const btnBaixar = document.createElement("button");
    btnBaixar.textContent = "📷 Baixar como Imagem";
    btnBaixar.style.cssText = `
        padding: 10px 20px;
        background: #E94B22;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-family: 'Montserrat', sans-serif;
    `;
    btnBaixar.onclick = () => baixarComoImagem();

    botoesDiv.appendChild(btnFechar);
    botoesDiv.appendChild(btnBaixar);

    // Header do relatório
    const header = document.createElement("div");
    header.style.cssText = `
        text-align: center;
        margin-bottom: 40px;
        border-bottom: 2px solid #E94B22;
        padding-bottom: 20px;
    `;

    const titulo = document.createElement("h1");
    titulo.textContent = "Acompanhamento de ferramentas PDS";
    titulo.style.cssText = `
        color: #fff;
        font-size: 32px;
        margin-bottom: 10px;
        font-family: 'Montserrat', sans-serif;
    `;

    const data = document.createElement("p");
    const hoje = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    data.textContent = hoje;
    data.style.cssText = `
        color: #aaa;
        font-size: 16px;
        font-family: 'Montserrat', sans-serif;
    `;

    header.appendChild(titulo);
    header.appendChild(data);

    // Grid de colaboradores
    const grid = document.createElement("div");
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    `;

    // Metas individuais
    const metaAP = 18;
    const metaIPSMA = 2;
    const metaOPAI = 4;

    // Para cada colaborador, cria um card
    colaboradores.forEach(colab => {
        const nome = colab.Responsável || colab.Responsavel;
        const ap = parseInt(colab.AP || 0);
        const ipsma = parseInt(colab.IPSMA || 0);
        const opai = parseInt(colab.OPAI || 0);

        const card = criarCardColaborador(nome, ap, ipsma, opai, metaAP, metaIPSMA, metaOPAI);
        grid.appendChild(card);
    });

    // Resumo total
    const resumo = criarResumoTotal(colaboradores);

    // Monta tudo
    container.appendChild(botoesDiv);
    container.appendChild(header);
    container.appendChild(grid);
    container.appendChild(resumo);

    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

function criarCardColaborador(nome, ap, ipsma, opai, metaAP, metaIPSMA, metaOPAI) {
    const card = document.createElement("div");
    card.style.cssText = `
        background: #201F20;
        border: 2px solid #5b5b5b;
        border-radius: 12px;
        padding: 20px;
        font-family: 'Montserrat', sans-serif;
    `;

    // Nome do colaborador
    const nomeDiv = document.createElement("div");
    nomeDiv.textContent = nome;
    nomeDiv.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        color: #E94B22;
        margin-bottom: 15px;
        text-align: center;
    `;

    // Métricas
    const metricas = document.createElement("div");
    metricas.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
    `;

    // Função auxiliar para criar linha de métrica
    function criarMetrica(label, realizado, meta) {
        const porcentagem = Math.min((realizado / meta) * 100, 100);
        const isCompleto = realizado >= meta;

        const metricaDiv = document.createElement("div");
        metricaDiv.style.cssText = `
            background: #222323;
            border-radius: 8px;
            padding: 12px;
        `;

        const labelDiv = document.createElement("div");
        labelDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;

        const labelText = document.createElement("span");
        labelText.textContent = label;
        labelText.style.cssText = `
            color: #fff;
            font-weight: 600;
            font-size: 14px;
        `;

        const valores = document.createElement("span");
        valores.textContent = `${realizado} / ${meta}`;
        valores.style.cssText = `
            color: ${isCompleto ? '#4CAF50' : '#fff'};
            font-weight: 700;
            font-size: 16px;
        `;

        labelDiv.appendChild(labelText);
        labelDiv.appendChild(valores);

        // Barra de progresso
        const progressBar = document.createElement("div");
        progressBar.style.cssText = `
            width: 100%;
            height: 6px;
            background: #3a3a3a;
            border-radius: 3px;
            overflow: hidden;
        `;

        const progressFill = document.createElement("div");
        progressFill.style.cssText = `
            height: 100%;
            width: ${porcentagem}%;
            background: ${isCompleto ? 'linear-gradient(90deg, #4CAF50, #66BB6A)' : 'linear-gradient(90deg, #E94B22, #ff6b3d)'};
            border-radius: 3px;
            transition: width 0.5s ease;
        `;

        progressBar.appendChild(progressFill);
        metricaDiv.appendChild(labelDiv);
        metricaDiv.appendChild(progressBar);

        return metricaDiv;
    }

    metricas.appendChild(criarMetrica("IPSMA", ipsma, metaIPSMA));
    metricas.appendChild(criarMetrica("OPAI", opai, metaOPAI));
    metricas.appendChild(criarMetrica("AP", ap, metaAP));

    card.appendChild(nomeDiv);
    card.appendChild(metricas);

    return card;
}

function criarResumoTotal(colaboradores) {
    const resumoDiv = document.createElement("div");
    resumoDiv.style.cssText = `
        background: #201f20;
        border: 3px solid #E94B22;
        border-radius: 12px;
        padding: 30px;
        margin-top: 20px;
        font-family: 'Montserrat', sans-serif;
    `;

    const tituloResumo = document.createElement("h2");
    tituloResumo.textContent = "Resumo Geral da Equipe";
    tituloResumo.style.cssText = `
        color: #E94B22;
        font-size: 24px;
        margin-bottom: 20px;
        text-align: center;
    `;

    // Calcula totais
    let totalAP = 0, totalIPSMA = 0, totalOPAI = 0;
    colaboradores.forEach(colab => {
        totalAP += parseInt(colab.AP || 0);
        totalIPSMA += parseInt(colab.IPSMA || 0);
        totalOPAI += parseInt(colab.OPAI || 0);
    });

    const metaTotalAP = 106;
    const metaTotalIPSMA = 10;
    const metaTotalOPAI = 20;

    const gridResumo = document.createElement("div");
    gridResumo.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    `;

    function criarBoxResumo(label, realizado, meta) {
        const porcentagem = Math.min((realizado / meta) * 100, 100);
        const isCompleto = realizado >= meta;

        const box = document.createElement("div");
        box.style.cssText = `
            background: #222323;
            border: 2px solid ${isCompleto ? '#4CAF50' : '#5b5b5b'};
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        `;

        const labelDiv = document.createElement("div");
        labelDiv.textContent = label;
        labelDiv.style.cssText = `
            color: #fff;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
        `;

        const valoresDiv = document.createElement("div");
        valoresDiv.style.cssText = `
            font-size: 32px;
            font-weight: 700;
            color: ${isCompleto ? '#4CAF50' : '#fff'};
            margin-bottom: 10px;
        `;
        valoresDiv.innerHTML = `${realizado} <span style="color: #888; font-size: 24px;">/</span> ${meta}`;

        const porcentagemDiv = document.createElement("div");
        porcentagemDiv.textContent = `${porcentagem.toFixed(0)}%`;
        porcentagemDiv.style.cssText = `
            color: ${isCompleto ? '#4CAF50' : '#aaa'};
            font-size: 16px;
            font-weight: 600;
        `;

        box.appendChild(labelDiv);
        box.appendChild(valoresDiv);
        box.appendChild(porcentagemDiv);

        return box;
    }

    gridResumo.appendChild(criarBoxResumo("IPSMA Total", totalIPSMA, metaTotalIPSMA));
    gridResumo.appendChild(criarBoxResumo("OPAI Total", totalOPAI, metaTotalOPAI));
    gridResumo.appendChild(criarBoxResumo("AP Total", totalAP, metaTotalAP));

    resumoDiv.appendChild(tituloResumo);
    resumoDiv.appendChild(gridResumo);

    return resumoDiv;
}

function baixarComoImagem() {
    const container = document.getElementById("relatorio-container");

    // Usa html2canvas para capturar o container
    if (typeof html2canvas === 'undefined') {
        alert("Biblioteca html2canvas não carregada. Adicionando...");
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            setTimeout(() => capturarImagem(container), 100);
        };
        document.head.appendChild(script);
    } else {
        capturarImagem(container);
    }
}

function capturarImagem(container) {
    // Esconde os botões temporariamente
    const botoes = container.querySelector('div');
    botoes.style.display = 'none';

    html2canvas(container, {
        backgroundColor: '#201F20',
        scale: 2, // Melhor qualidade
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Mostra os botões novamente
        botoes.style.display = 'flex';

        // Converte para imagem e faz download
        const link = document.createElement('a');
        const hoje = new Date().toISOString().split('T')[0];
        link.download = `relatorio-hsana-${hoje}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        botoes.style.display = 'flex';
        console.error("Erro ao gerar imagem:", err);
        alert("Erro ao gerar imagem. Tente novamente.");
    });
}