// ===== GERAÇÃO DE RELATÓRIO VISUAL =====

function gerarRelatorioVisual() {
    const dataHoje = getDataAtual();

    // Filtrar atividades até hoje
    const atividadesAteHoje = todosOsDados.filter(row => {
        const dataAtividade = row.DATA || '';
        return dataEhAnteriorOuIgual(dataAtividade, dataHoje);
    });

    if (atividadesAteHoje.length === 0) {
        alert('Nenhuma atividade encontrada para gerar o relatório.');
        return;
    }

    // Agrupar por encarregada
    const estatisticasPorEncarregada = {};

    atividadesAteHoje.forEach(atividade => {
        const encarregada = atividade.Encarregada || 'Sem Responsável';
        const situacao = (atividade['Situação'] || atividade['SituaÃ§Ã£o'] || '').trim().toLowerCase();
        const concluida = situacao === 'feito';

        if (!estatisticasPorEncarregada[encarregada]) {
            estatisticasPorEncarregada[encarregada] = {
                nome: encarregada,
                total: 0,
                realizadas: 0
            };
        }

        estatisticasPorEncarregada[encarregada].total++;
        if (concluida) {
            estatisticasPorEncarregada[encarregada].realizadas++;
        }
    });

    // Converter para array e ordenar por nome
    const colaboradores = Object.values(estatisticasPorEncarregada)
        .sort((a, b) => a.nome.localeCompare(b.nome));

    criarModalRelatorio(colaboradores, atividadesAteHoje.length);
}

function criarModalRelatorio(colaboradores, totalGeral) {
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
        font-weight: 600;
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
        font-weight: 600;
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
    titulo.textContent = "Relatório de Atividades - HSANA";
    titulo.style.cssText = `
        color: #fff;
        font-size: 32px;
        margin-bottom: 10px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
    `;

    const subtitulo = document.createElement("p");
    subtitulo.textContent = "Acompanhamento de Performance das Encarregadas";
    subtitulo.style.cssText = `
        color: #aaa;
        font-size: 16px;
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
        color: #888;
        font-size: 14px;
        font-family: 'Montserrat', sans-serif;
    `;

    header.appendChild(titulo);
    header.appendChild(subtitulo);
    header.appendChild(data);

    // Grid de colaboradores
    const grid = document.createElement("div");
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    `;

    // Para cada encarregada, cria um card
    colaboradores.forEach(colab => {
        const card = criarCardColaborador(
            colab.nome,
            colab.realizadas,
            colab.total
        );
        grid.appendChild(card);
    });

    // Resumo total
    const totalRealizadas = colaboradores.reduce((sum, c) => sum + c.realizadas, 0);
    const resumo = criarResumoTotal(totalRealizadas, totalGeral);

    // Monta tudo
    container.appendChild(botoesDiv);
    container.appendChild(header);
    container.appendChild(grid);
    container.appendChild(resumo);

    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

function criarCardColaborador(nome, realizadas, total) {
    const porcentagem = total > 0 ? ((realizadas / total) * 100) : 0;
    const isCompleto = realizadas >= total;

    const card = document.createElement("div");
    card.style.cssText = `
        background: #2a2a2a;
        border: 2px solid ${isCompleto ? '#4CAF50' : '#5b5b5b'};
        border-radius: 12px;
        padding: 24px;
        font-family: 'Montserrat', sans-serif;
        transition: transform 0.2s ease;
        position: relative;
        overflow: hidden;
    `;

    // Indicador de status
    const statusIndicator = document.createElement("div");
    statusIndicator.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${isCompleto ? '#4CAF50' : '#E94B22'};
        box-shadow: 0 0 8px ${isCompleto ? '#4CAF50' : '#E94B22'};
    `;

    // Nome da encarregada
    const nomeDiv = document.createElement("div");
    nomeDiv.textContent = nome;
    nomeDiv.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        color: #E94B22;
        margin-bottom: 20px;
        text-align: center;
    `;

    // Container de métricas
    const metricasDiv = document.createElement("div");
    metricasDiv.style.cssText = `
        background: #201F20;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 15px;
    `;

    // Números principais
    const numerosDiv = document.createElement("div");
    numerosDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 12px;
    `;

    const realizadasSpan = document.createElement("span");
    realizadasSpan.textContent = realizadas;
    realizadasSpan.style.cssText = `
        font-size: 36px;
        font-weight: 700;
        color: ${isCompleto ? '#4CAF50' : '#fff'};
    `;

    const separadorSpan = document.createElement("span");
    separadorSpan.textContent = '/';
    separadorSpan.style.cssText = `
        font-size: 24px;
        color: #666;
    `;

    const totalSpan = document.createElement("span");
    totalSpan.textContent = total;
    totalSpan.style.cssText = `
        font-size: 24px;
        color: #aaa;
        font-weight: 600;
    `;

    numerosDiv.appendChild(realizadasSpan);
    numerosDiv.appendChild(separadorSpan);
    numerosDiv.appendChild(totalSpan);

    // Labels descritivos
    const labelsDiv = document.createElement("div");
    labelsDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #888;
        padding: 0 8px;
        margin-bottom: 12px;
    `;

    const labelRealizadas = document.createElement("span");
    labelRealizadas.textContent = 'Realizadas';
    labelRealizadas.style.cssText = `color: ${isCompleto ? '#4CAF50' : '#fff'};`;

    const labelTotal = document.createElement("span");
    labelTotal.textContent = 'Programadas';

    labelsDiv.appendChild(labelRealizadas);
    labelsDiv.appendChild(labelTotal);

    // Barra de progresso
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
        width: 100%;
        height: 8px;
        background: #3a3a3a;
        border-radius: 4px;
        overflow: hidden;
    `;

    const progressFill = document.createElement("div");
    progressFill.style.cssText = `
        height: 100%;
        width: ${porcentagem}%;
        background: ${isCompleto
            ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
            : 'linear-gradient(90deg, #E94B22, #ff6b3d)'};
        border-radius: 4px;
        transition: width 0.5s ease;
    `;

    progressBar.appendChild(progressFill);

    metricasDiv.appendChild(numerosDiv);
    metricasDiv.appendChild(labelsDiv);
    metricasDiv.appendChild(progressBar);

    // Percentual
    const percentualDiv = document.createElement("div");
    percentualDiv.textContent = `${porcentagem.toFixed(1)}%`;
    percentualDiv.style.cssText = `
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        color: ${isCompleto ? '#4CAF50' : '#fff'};
    `;

    card.appendChild(statusIndicator);
    card.appendChild(nomeDiv);
    card.appendChild(metricasDiv);
    card.appendChild(percentualDiv);

    return card;
}

function criarResumoTotal(realizadas, total) {
    const porcentagem = total > 0 ? ((realizadas / total) * 100) : 0;
    const isCompleto = realizadas >= total;

    const resumoDiv = document.createElement("div");
    resumoDiv.style.cssText = `
        background: #2a2a2a;
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
        margin-bottom: 25px;
        text-align: center;
        font-weight: 700;
    `;

    const gridResumo = document.createElement("div");
    gridResumo.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    `;

    // Box Total Programadas
    const boxProgramadas = criarBoxResumo("Total Programadas", total, "#5b5b5b");

    // Box Total Realizadas
    const boxRealizadas = criarBoxResumo("Total Realizadas", realizadas, "#4CAF50");

    // Box Percentual
    const boxPercentual = document.createElement("div");
    boxPercentual.style.cssText = `
        background: #201F20;
        border: 2px solid ${isCompleto ? '#4CAF50' : '#E94B22'};
        border-radius: 10px;
        padding: 20px;
        text-align: center;
    `;

    const labelPercentual = document.createElement("div");
    labelPercentual.textContent = "Conclusão Geral";
    labelPercentual.style.cssText = `
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
    `;

    const valorPercentual = document.createElement("div");
    valorPercentual.textContent = `${porcentagem.toFixed(1)}%`;
    valorPercentual.style.cssText = `
        font-size: 40px;
        font-weight: 700;
        color: ${isCompleto ? '#4CAF50' : '#E94B22'};
    `;

    boxPercentual.appendChild(labelPercentual);
    boxPercentual.appendChild(valorPercentual);

    gridResumo.appendChild(boxProgramadas);
    gridResumo.appendChild(boxRealizadas);
    gridResumo.appendChild(boxPercentual);

    resumoDiv.appendChild(tituloResumo);
    resumoDiv.appendChild(gridResumo);

    return resumoDiv;
}

function criarBoxResumo(label, valor, corBorda) {
    const box = document.createElement("div");
    box.style.cssText = `
        background: #201F20;
        border: 2px solid ${corBorda};
        border-radius: 10px;
        padding: 20px;
        text-align: center;
    `;

    const labelDiv = document.createElement("div");
    labelDiv.textContent = label;
    labelDiv.style.cssText = `
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
    `;

    const valorDiv = document.createElement("div");
    valorDiv.textContent = valor;
    valorDiv.style.cssText = `
        font-size: 40px;
        font-weight: 700;
        color: #fff;
    `;

    box.appendChild(labelDiv);
    box.appendChild(valorDiv);

    return box;
}

function baixarComoImagem() {
    const container = document.getElementById("relatorio-container");

    // Verifica se html2canvas está carregado
    if (typeof html2canvas === 'undefined') {
        alert("Carregando biblioteca de captura de imagem...");
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
    const displayOriginal = botoes.style.display;
    botoes.style.display = 'none';

    html2canvas(container, {
        backgroundColor: '#201F20',
        scale: 2, // Melhor qualidade
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Mostra os botões novamente
        botoes.style.display = displayOriginal;

        // Converte para imagem e faz download
        const link = document.createElement('a');
        const hoje = new Date();
        const dataFormatada = `${hoje.getDate().toString().padStart(2, '0')}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}-${hoje.getFullYear()}`;
        link.download = `relatorio-atividades-hsana-${dataFormatada}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        botoes.style.display = displayOriginal;
        console.error("Erro ao gerar imagem:", err);
        alert("Erro ao gerar imagem. Tente novamente.");
    });
}