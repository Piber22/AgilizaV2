// ===== MÓDULO DE RELATÓRIO - DDS =====

document.addEventListener('DOMContentLoaded', () => {
    const btnGerarRelatorio = document.getElementById('btnGerarRelatorio');
    if (btnGerarRelatorio) {
        btnGerarRelatorio.addEventListener('click', gerarRelatorio);
    }
});

// ===== GERAR RELATÓRIO =====

function gerarRelatorio() {
    const equipes   = window.equipesParaRelatorio;
    const totalProg = window.totalProgRelatorio;
    const totalExec = window.totalExecRelatorio;
    const dataIni   = window.filtroInicialAtual;
    const dataFim   = window.filtroFinalAtual;
    const hoje      = window.getDataAtual ? window.getDataAtual() : new Date().toLocaleDateString('pt-BR');

    if (!equipes || equipes.length === 0) {
        alert('Aguarde o carregamento dos dados ou não há registros disponíveis.');
        return;
    }

    // Remove modal anterior se existir
    const existente = document.getElementById('modal-relatorio');
    if (existente) existente.remove();

    // ── Overlay ──
    const overlay = document.createElement('div');
    overlay.id = 'modal-relatorio';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.92); z-index: 9999;
        display: flex; justify-content: center; align-items: flex-start;
        padding: 20px; overflow-y: auto;
    `;

    // ── Container ──
    const container = document.createElement('div');
    container.id = 'relatorio-container';
    container.style.cssText = `
        background: #201F20; border-radius: 15px; padding: 40px;
        max-width: 900px; width: 100%; position: relative; margin: auto;
    `;

    // ── Botões de ação ──
    const botoesDiv = document.createElement('div');
    botoesDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 30px; justify-content: flex-end;';

    const btnFechar = document.createElement('button');
    btnFechar.textContent = '✕ Fechar';
    btnFechar.style.cssText = `
        padding: 10px 20px; background: #5b5b5b; color: white; border: none;
        border-radius: 8px; cursor: pointer; font-size: 14px;
        font-family: 'Montserrat', sans-serif; font-weight: 600;
    `;
    btnFechar.onclick = () => overlay.remove();

    const btnBaixar = document.createElement('button');
    btnBaixar.textContent = '📷 Baixar Imagem';
    btnBaixar.style.cssText = `
        padding: 10px 20px; background: #E94B22; color: white; border: none;
        border-radius: 8px; cursor: pointer; font-size: 14px;
        font-family: 'Montserrat', sans-serif; font-weight: 600;
    `;
    btnBaixar.onclick = () => baixarImagem(container, botoesDiv);

    botoesDiv.appendChild(btnFechar);
    botoesDiv.appendChild(btnBaixar);

    // ── Header do relatório ──
    const header = criarHeaderRelatorio(dataIni, dataFim, hoje);

    // ── Grid de equipes ──
    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 18px;
        margin-bottom: 30px;
    `;

    equipes.forEach(eq => {
        const pct     = eq.programado > 0 ? (eq.executado / eq.programado) * 100 : 0;
        const completa = pct >= 100;
        grid.appendChild(criarCardEquipe(eq.nome, eq.executado, eq.programado, pct, completa));
    });

    // ── Resumo geral ──
    const resumo = criarResumoGeral(totalExec, totalProg);

    container.appendChild(botoesDiv);
    container.appendChild(header);
    container.appendChild(grid);
    container.appendChild(resumo);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

// ===== COMPONENTES DO RELATÓRIO =====

function criarHeaderRelatorio(dataIni, dataFim, hoje) {
    const header = document.createElement('div');
    header.style.cssText = `
        text-align: center; margin-bottom: 35px;
        border-bottom: 2px solid #E94B22; padding-bottom: 20px;
    `;

    let textoPeriodo;
    if (dataIni && dataFim)  textoPeriodo = `Período: ${dataIni} até ${dataFim}`;
    else if (dataIni)        textoPeriodo = `A partir de ${dataIni}`;
    else if (dataFim)        textoPeriodo = `Até ${dataFim}`;
    else                     textoPeriodo = `Data: ${hoje}`;

    header.innerHTML = `
        <h1 style="color:#fff; font-size:28px; margin-bottom:8px; font-family:'Montserrat',sans-serif; font-weight:700;">
            Relatório de DDS
        </h1>
        <p style="color:#aaa; font-size:15px; margin-bottom:8px;">
            Acompanhamento de DDS por Equipe
        </p>
        <p style="color:#E94B22; font-size:14px; font-weight:600;">
            ${textoPeriodo}
        </p>
        <p style="color:#666; font-size:12px; margin-top:4px;">
            Gerado em: ${hoje}
        </p>
    `;
    return header;
}

function criarCardEquipe(nome, executado, programado, pct, completa) {
    const cor      = completa ? '#4CAF50' : '#E94B22';
    const corNums  = completa ? '#4CAF50' : '#fff';
    const gradBar  = completa
        ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
        : 'linear-gradient(90deg, #E94B22, #ff6b3d)';

    const card = document.createElement('div');
    card.style.cssText = `
        background: #2a2a2a;
        border: 2px solid ${completa ? '#4CAF50' : '#3a3a3a'};
        border-radius: 12px; padding: 22px;
        font-family: 'Montserrat', sans-serif; position: relative;
    `;

    card.innerHTML = `
        <div style="position:absolute; top:14px; right:14px; width:10px; height:10px;
                    border-radius:50%; background:${cor};"></div>
        <div style="font-size:16px; font-weight:700; color:#fff; margin-bottom:18px;">${nome}</div>
        <div style="display:flex; align-items:baseline; gap:6px; justify-content:center; margin-bottom:8px;">
            <span style="font-size:32px; font-weight:700; color:${corNums};">${executado}</span>
            <span style="font-size:22px; color:#666;">/</span>
            <span style="font-size:22px; color:#aaa; font-weight:600;">${programado}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#888;
                    padding:0 4px; margin-bottom:12px;">
            <span style="color:${corNums};">Executados</span>
            <span>Programados</span>
        </div>
        <div style="width:100%; height:8px; background:#3a3a3a; border-radius:4px;
                    overflow:hidden; margin-bottom:12px;">
            <div style="height:100%; width:${Math.min(pct, 100)}%;
                        background:${gradBar}; border-radius:4px;"></div>
        </div>
        <div style="text-align:center; font-size:22px; font-weight:700; color:${corNums};">
            ${pct.toFixed(1)}%
        </div>
    `;
    return card;
}

function criarResumoGeral(executado, programado) {
    const pct = programado > 0 ? (executado / programado) * 100 : 0;
    const ok  = pct >= 85;

    const div = document.createElement('div');
    div.style.cssText = `
        background: #2a2a2a; border: 3px solid #E94B22; border-radius: 12px;
        padding: 28px; margin-top: 10px; font-family: 'Montserrat', sans-serif;
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;
    `;

    function boxResumo(label, valor, cor, borderCor) {
        const b = document.createElement('div');
        b.style.cssText = `
            background: #201F20; border: 2px solid ${borderCor};
            border-radius: 10px; padding: 18px; text-align: center;
        `;
        b.innerHTML = `
            <div style="color:#fff; font-size:14px; font-weight:600; margin-bottom:12px;">${label}</div>
            <div style="font-size:36px; font-weight:700; color:${cor};">${valor}</div>
        `;
        return b;
    }

    grid.appendChild(boxResumo('Total Programados', programado, '#fff',    '#5b5b5b'));
    grid.appendChild(boxResumo('Total Executados',  executado,  '#4CAF50', '#5b5b5b'));
    grid.appendChild(boxResumo('Conclusão Geral',   `${pct.toFixed(1)}%`,
        ok ? '#4CAF50' : '#E94B22',
        ok ? '#4CAF50' : '#E94B22'));

    div.innerHTML = `
        <h2 style="color:#E94B22; font-size:22px; margin-bottom:22px;
                   text-align:center; font-weight:700;">Resumo Geral</h2>
    `;
    div.appendChild(grid);
    return div;
}

// ===== EXPORTAR COMO PNG =====

function baixarImagem(container, botoesDiv) {
    botoesDiv.style.display = 'none';

    html2canvas(container, {
        backgroundColor: '#201F20',
        scale: 2,
        logging: false,
        useCORS: true
    }).then(canvas => {
        botoesDiv.style.display = 'flex';

        const hoje = new Date();
        const data = `${String(hoje.getDate()).padStart(2, '0')}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${hoje.getFullYear()}`;

        const link = document.createElement('a');
        link.download = `relatorio-dds-${data}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        botoesDiv.style.display = 'flex';
        console.error('Erro ao gerar imagem:', err);
        alert('Erro ao gerar imagem. Tente novamente.');
    });
}