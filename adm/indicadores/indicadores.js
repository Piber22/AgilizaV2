// ==========================================================
// PAINEL DE INDICADORES — leitura direto do Google Sheets
// ==========================================================

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIF-t3yFLKftHvkmaX0JgrFeQpsro6AOQnfcjQjsL0da-BxbdUuRRaA62Zj7WsXM-QM0f9z0FOagYP/pub?output=csv";
const INTERVALO_ATUALIZACAO_MS = 5 * 60 * 1000; // 5 minutos

const MESES_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

let dadosBrutos = [];
let mesSelecionadoKey = null;
let filtroAtivo = null; // null | "excelentes" | "atencao" | "criticos"
let ultimoStatusPorItem = [];

// ----------------------------------------------------------
// Utilitários de parsing (formato brasileiro)
// ----------------------------------------------------------

function parseNumeroBR(valor) {
    if (valor === null || valor === undefined) return 0;
    let s = String(valor).trim();
    if (s === "") return 0;
    // remove separador de milhar (ponto) e troca vírgula decimal por ponto
    s = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

function parseDataBR(valor) {
    // formato esperado: DD/MM/AAAA
    const partes = String(valor).trim().split("/");
    if (partes.length !== 3) return null;
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);
    const d = new Date(ano, mes, dia);
    return isNaN(d.getTime()) ? null : d;
}

function formatarNumero(n) {
    return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function diasNoMes(ano, mesIndex) {
    return new Date(ano, mesIndex + 1, 0).getDate();
}

function chaveMes(ano, mesIndex) {
    return `${ano}-${String(mesIndex + 1).padStart(2, "0")}`;
}

// ----------------------------------------------------------
// Carregamento dos dados
// ----------------------------------------------------------

async function carregarDados() {
    const btnAtualizar = document.getElementById("btnAtualizar");
    btnAtualizar.classList.add("girando");

    const lista = document.getElementById("listaIndicadores");

    try {
        const resposta = await fetch(CSV_URL, { cache: "no-store" });
        if (!resposta.ok) throw new Error("Falha ao buscar a planilha (" + resposta.status + ")");

        // Tenta identificar a última alteração pelo cabeçalho HTTP
        const lastModified = resposta.headers.get("last-modified");
        atualizarSeloDataHora(lastModified);

        const textoCsv = await resposta.text();
        const parsed = Papa.parse(textoCsv, { header: true, skipEmptyLines: true });

        dadosBrutos = parsed.data.map(linha => {
            const data = parseDataBR(linha["Data"]);
            return {
                data,
                mes: (linha["Mes"] || "").trim(),
                indicador: (linha["Indicador"] || "").trim(),
                maximo: parseNumeroBR(linha["Maximo"]),
                meta: parseNumeroBR(linha["Meta"]),
                realizado: parseNumeroBR(linha["Realizado"]),
                tipo: (linha["Tipo"] || "").trim(),
                tipoMeta: (linha["TipoMeta"] || "Acima").trim() || "Acima"
            };
        }).filter(l => l.data && l.indicador);

        if (dadosBrutos.length === 0) {
            lista.innerHTML = '<p class="empty">Nenhum indicador encontrado na planilha.</p>';
            return;
        }

        montarFiltroMes();
        renderizarTudo();

    } catch (erro) {
        console.error(erro);
        lista.innerHTML = '<p class="error">Não foi possível carregar os dados da planilha. Tente novamente em instantes.</p>';
        document.getElementById("ultimaAtualizacao").textContent = "Falha ao consultar a base de dados";
    } finally {
        btnAtualizar.classList.remove("girando");
    }
}

function atualizarSeloDataHora(lastModified) {
    const el = document.getElementById("ultimaAtualizacao");
    if (lastModified) {
        const d = new Date(lastModified);
        if (!isNaN(d.getTime())) {
            const dataFmt = d.toLocaleDateString("pt-BR");
            const horaFmt = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            el.textContent = `Base atualizada em ${dataFmt} às ${horaFmt}`;
            return;
        }
    }
    const agora = new Date();
    el.textContent = `Dados consultados em ${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// ----------------------------------------------------------
// Filtro de mês
// ----------------------------------------------------------

function montarFiltroMes() {
    const select = document.getElementById("selectMes");

    const chaves = new Map(); // chave -> {label, ano, mesIndex, data}
    dadosBrutos.forEach(l => {
        const ano = l.data.getFullYear();
        const mesIndex = l.data.getMonth();
        const chave = chaveMes(ano, mesIndex);
        if (!chaves.has(chave)) {
            const label = (l.mes ? capitalizar(l.mes) : capitalizar(MESES_PT[mesIndex])) + "/" + ano;
            chaves.set(chave, { label, ano, mesIndex });
        }
    });

    const chavesOrdenadas = Array.from(chaves.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // define seleção padrão: mês atual se existir na planilha, senão o mais recente
    const hoje = new Date();
    const chaveHoje = chaveMes(hoje.getFullYear(), hoje.getMonth());
    if (!mesSelecionadoKey) {
        mesSelecionadoKey = chaves.has(chaveHoje) ? chaveHoje : chavesOrdenadas[chavesOrdenadas.length - 1][0];
    }

    select.innerHTML = "";
    chavesOrdenadas.forEach(([chave, info]) => {
        const opt = document.createElement("option");
        opt.value = chave;
        opt.textContent = info.label;
        if (chave === mesSelecionadoKey) opt.selected = true;
        select.appendChild(opt);
    });

    select.onchange = () => {
        mesSelecionadoKey = select.value;
        renderizarTudo();
    };
}

function capitalizar(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizar(s) {
    return String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .toLowerCase()
        .trim();
}

// ----------------------------------------------------------
// Cálculo de status (compara com o ritmo esperado até hoje)
// ----------------------------------------------------------

function calcularStatus(item) {
    const hoje = new Date();
    const ano = item.data.getFullYear();
    const mesIndex = item.data.getMonth();
    const totalDias = diasNoMes(ano, mesIndex);

    const ehMesAtual = ano === hoje.getFullYear() && mesIndex === hoje.getMonth();
    const dataInicioMes = new Date(ano, mesIndex, 1);
    const ehMesPassado = dataInicioMes < new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ehMesFuturo = dataInicioMes > new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const tipo = normalizar(item.tipo).startsWith("med") ? "Média" : "Acumulativa";
    const tipoMetaNorm = normalizar(item.tipoMeta);
    const binaria = tipoMetaNorm.startsWith("bin");
    const abaixo = tipoMetaNorm.startsWith("aba");

    if (ehMesFuturo) {
        return { banda: "futuro", esperadoHoje: null, diaAtual: null, totalDias, tipo, abaixo, binaria, ehMesAtual, ehMesPassado, ehMesFuturo };
    }

    let diaAtual = Math.min(hoje.getDate(), totalDias);

    // ---- NOVO: indicador binário — só importa "atingiu ou não" ----
    if (binaria) {
        const atingiu = item.realizado >= item.meta;
        const banda = atingiu ? "bom" : (ehMesPassado ? "critico" : "atencao");
        return {
            banda, esperadoHoje: item.meta,
            diaAtual: ehMesPassado ? totalDias : diaAtual,
            totalDias, tipo, abaixo, binaria, atingiu,
            ehMesAtual, ehMesPassado, ehMesFuturo
        };
    }

    let esperadoHoje;
    if (tipo === "Acumulativa") {
        if (ehMesAtual) {
            esperadoHoje = item.meta * (diaAtual / totalDias);
        } else {
            esperadoHoje = item.meta;
            diaAtual = totalDias;
        }
    } else {
        esperadoHoje = item.meta;
    }

    let ratio;
    if (abaixo) {
        ratio = item.realizado > 0 ? esperadoHoje / item.realizado : (esperadoHoje > 0 ? 2 : 1);
    } else {
        ratio = esperadoHoje > 0 ? item.realizado / esperadoHoje : (item.realizado > 0 ? 2 : 1);
    }

    let banda;
    if (ratio >= 1.15) banda = "excelente";
    else if (ratio >= 1.0) banda = "bom";
    else if (ratio >= 0.85) banda = "atencao";
    else banda = "critico";

    return { banda, esperadoHoje, diaAtual, totalDias, tipo, abaixo, binaria, ratio, ehMesAtual, ehMesPassado, ehMesFuturo };
}

const LABEL_BANDA = {
    excelente: "Excelente",
    bom: "No prazo",
    atencao: "Atenção",
    critico: "Crítico",
    futuro: "Aguardando"
};

// ----------------------------------------------------------
// Renderização
// ----------------------------------------------------------

// bandas que cada botão de resumo representa
const BANDAS_DO_FILTRO = {
    excelentes: ["excelente", "bom"],
    atencao: ["atencao"],
    criticos: ["critico"]
};

const TITULO_DO_FILTRO = {
    total: "Todos os indicadores",
    excelentes: "Indicadores excelentes / no prazo",
    atencao: "Indicadores em atenção",
    criticos: "Indicadores críticos"
};

// ordem e rótulos usados ao agrupar por status na visão "todos"
const ORDEM_GRUPOS = ["critico", "atencao", "bom", "excelente", "futuro"];
const LABEL_GRUPO = {
    critico: "Críticos",
    atencao: "Atenção",
    bom: "No prazo",
    excelente: "Excelentes",
    futuro: "Aguardando início"
};

function renderizarTudo() {
    const [anoStr, mesStr] = mesSelecionadoKey.split("-");
    const ano = parseInt(anoStr, 10);
    const mesIndex = parseInt(mesStr, 10) - 1;

    const doMes = dadosBrutos.filter(l => l.data.getFullYear() === ano && l.data.getMonth() === mesIndex);

    ultimoStatusPorItem = doMes.map(item => ({ item, status: calcularStatus(item) }));

    renderizarHero(ultimoStatusPorItem, ano, mesIndex);
    renderizarResumo(ultimoStatusPorItem);
    renderizarLista();
}

function renderizarHero(statusPorItem, ano, mesIndex) {
    const hero = document.getElementById("hero");
    const icone = document.getElementById("heroIcone");
    const titulo = document.getElementById("heroTitulo");
    const subtitulo = document.getElementById("heroSubtitulo");

    if (statusPorItem.length === 0) {
        hero.className = "hero";
        icone.textContent = "ℹ️";
        titulo.textContent = "Nenhum indicador cadastrado para este mês.";
        subtitulo.textContent = "";
        return;
    }

    const contagem = { excelente: 0, bom: 0, atencao: 0, critico: 0, futuro: 0 };
    statusPorItem.forEach(({ status }) => contagem[status.banda]++);

    let classe, ic, msg;
    if (contagem.critico > 0) {
        classe = "hero-critico";
        ic = "⚠️";
        msg = contagem.critico === 1
            ? "1 indicador crítico precisa de atenção imediata"
            : `${contagem.critico} indicadores críticos precisam de atenção imediata`;
    } else if (contagem.atencao > 0) {
        classe = "hero-atencao";
        ic = "🔎";
        msg = contagem.atencao === 1
            ? "1 indicador está em zona de atenção"
            : `${contagem.atencao} indicadores estão em zona de atenção`;
    } else {
        classe = "hero-bom";
        ic = "✅";
        msg = "Tudo certo! Todos os indicadores estão no ritmo da meta";
    }

    hero.className = `hero ${classe}`;
    icone.textContent = ic;
    titulo.textContent = msg;

    // subtítulo: contexto do andamento do mês
    const hoje = new Date();
    const totalDias = diasNoMes(ano, mesIndex);
    const ehMesAtual = ano === hoje.getFullYear() && mesIndex === hoje.getMonth();
    const dataInicioMes = new Date(ano, mesIndex, 1);
    const ehMesPassado = dataInicioMes < new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    if (ehMesAtual) {
        const diaAtual = Math.min(hoje.getDate(), totalDias);
        const pctMes = Math.round((diaAtual / totalDias) * 100);
        subtitulo.textContent = `Mês em andamento — dia ${diaAtual} de ${totalDias} (${pctMes}% do mês decorrido)`;
    } else if (ehMesPassado) {
        subtitulo.textContent = "Mês encerrado — resultado final";
    } else {
        subtitulo.textContent = "Mês futuro — ainda não iniciado";
    }
}

function renderizarResumo(statusPorItem) {
    const contagem = { excelente: 0, bom: 0, atencao: 0, critico: 0, futuro: 0 };
    statusPorItem.forEach(({ status }) => contagem[status.banda]++);

    document.getElementById("totalIndicadores").textContent = statusPorItem.length;
    document.getElementById("totalExcelentes").textContent = contagem.excelente + contagem.bom;
    document.getElementById("totalAtencao").textContent = contagem.atencao;
    document.getElementById("totalCriticos").textContent = contagem.critico;

    atualizarEstadoVisualDosFiltros();
}

function atualizarEstadoVisualDosFiltros() {
    document.querySelectorAll(".stat-box").forEach(box => {
        const chave = box.dataset.filtro;
        const ativo = (chave === "total" && !filtroAtivo) || (chave === filtroAtivo);
        box.classList.toggle("ativo", ativo);
    });
}

function aplicarFiltro(chave) {
    if (chave === "total") {
        filtroAtivo = null;
    } else {
        filtroAtivo = (filtroAtivo === chave) ? null : chave; // clique de novo = remove o filtro
    }
    atualizarEstadoVisualDosFiltros();
    renderizarLista();
}

function renderizarLista() {
    const lista = document.getElementById("listaIndicadores");
    const titulo = document.getElementById("tituloLista");
    const btnLimpar = document.getElementById("btnLimparFiltro");

    if (ultimoStatusPorItem.length === 0) {
        titulo.textContent = TITULO_DO_FILTRO.total;
        btnLimpar.hidden = true;
        lista.innerHTML = '<p class="empty">Nenhum indicador para este mês.</p>';
        return;
    }

    let itens = ultimoStatusPorItem;
    if (filtroAtivo) {
        const bandasAceitas = BANDAS_DO_FILTRO[filtroAtivo];
        itens = ultimoStatusPorItem.filter(({ status }) => bandasAceitas.includes(status.banda));
    }

    titulo.textContent = `${TITULO_DO_FILTRO[filtroAtivo || "total"]} (${itens.length})`;
    btnLimpar.hidden = !filtroAtivo;

    if (itens.length === 0) {
        lista.innerHTML = '<p class="empty">Nenhum indicador nessa classificação.</p>';
        return;
    }

    lista.innerHTML = "";

    if (!filtroAtivo) {
        // visão "todos": agrupa por status para organizar visualmente o que precisa de atenção primeiro
        ORDEM_GRUPOS.forEach(banda => {
            const doGrupo = itens.filter(({ status }) => status.banda === banda);
            if (doGrupo.length === 0) return;

            const header = document.createElement("div");
            header.className = `grupo-header grupo-${banda}`;
            header.innerHTML = `<span>${LABEL_GRUPO[banda]} (${doGrupo.length})</span><span class="linha"></span>`;
            lista.appendChild(header);

            doGrupo.forEach(({ item, status }) => lista.appendChild(criarCard(item, status)));
        });
    } else {
        itens.forEach(({ item, status }) => lista.appendChild(criarCard(item, status)));
    }
}

function criarCard(item, status) {
    const card = document.createElement("div");
    card.className = `indicador-card status-${status.banda}`;

    const pctMaximo = item.maximo > 0 ? Math.min(100, (item.realizado / item.maximo) * 100) : 0;
    const pctMeta = item.maximo > 0 ? Math.min(100, (item.meta / item.maximo) * 100) : 0;
    const pctHoje = (status.esperadoHoje !== null && item.maximo > 0)
        ? Math.min(100, (status.esperadoHoje / item.maximo) * 100)
        : null;
    const mostrarMarcadorHoje = status.tipo === "Acumulativa" && status.ehMesAtual && pctHoje !== null;

    const frase = montarFraseSimples(item, status);

    card.innerHTML = `
        <div class="indicador-header">
            <div class="indicador-nome" title="${escapeHtml(item.indicador)}">${escapeHtml(item.indicador)}</div>
            <span class="status-badge status-${status.banda}">${LABEL_BANDA[status.banda]}</span>
        </div>

        ${montarBlocoMetrica(item, status)}

        <p class="card-frase">${frase}</p>

        <div class="progress-track" title="Realizado ${formatarNumero(item.realizado)} de meta ${formatarNumero(item.meta)}">
            <div class="progress-fill status-${status.banda}" style="width:${pctMaximo}%;"></div>
            <div class="progress-marker marker-meta" style="left:${pctMeta}%;"></div>
            ${mostrarMarcadorHoje ? `<div class="progress-marker marker-hoje" style="left:${pctHoje}%;"></div>` : ""}
        </div>

        <div class="card-rodape">
            <span>Realizado <strong>${formatarNumero(item.realizado)}</strong></span>
            <span>Meta final <strong>${formatarNumero(item.meta)}</strong></span>
        </div>
    `;

    return card;
}

// bloco com "Esperado X   Realizado Y" (ou ✓/✗ para indicadores binários, ou "—" para mês futuro)
function montarBlocoMetrica(item, status) {
    if (status.banda === "futuro") {
        return `
        <div class="card-metrica-dupla">
            <span class="metrica-item-numero" style="color: var(--text-dim);">—</span>
            <span class="metrica-label-solta">mês futuro</span>
        </div>`;
    }

    if (status.binaria) {
        const numero = status.atingiu ? "✓" : "✗";
        const rotulo = status.atingiu ? "meta atingida" : "meta não atingida";
        return `
        <div class="card-metrica-dupla">
            <span class="metrica-item-numero status-${status.banda}">${numero}</span>
            <span class="metrica-label-solta">${rotulo}</span>
        </div>`;
    }

    const esperado = formatarNumero(status.esperadoHoje);
    const realizado = formatarNumero(item.realizado);

    return `
        <div class="card-metrica-dupla">
            <div class="metrica-item">
                <span class="metrica-item-numero">${esperado}</span>
                <span class="metrica-item-label">Esperado</span>
            </div>
            <div class="metrica-item">
                <span class="metrica-item-numero status-${status.banda}">${realizado}</span>
                <span class="metrica-item-label">Realizado</span>
            </div>
        </div>`;
}



// frase curta, em linguagem simples, sem jargão técnico
function montarFraseSimples(item, status) {
    if (status.banda === "futuro") {
        return "Mês ainda não iniciado.";
    }

    if (status.binaria) {
        if (status.atingiu) return "Meta atingida.";
        return status.ehMesPassado
            ? "Mês encerrado sem atingir a meta."
            : "Meta ainda não atingida neste mês.";
    }

    if (status.tipo === "Acumulativa" && status.ehMesAtual) {
        switch (status.banda) {
            case "excelente": return "Muito à frente do ritmo necessário para bater a meta.";
            case "bom": return "No ritmo certo para bater a meta do mês.";
            case "atencao": return "Levemente abaixo do ritmo ideal — vale acompanhar.";
            case "critico": return "Abaixo do ritmo necessário para bater a meta do mês.";
        }
    }

    if (status.tipo === "Acumulativa" && status.ehMesPassado) {
        return (item.realizado >= item.meta)
            ? "Mês encerrado com a meta atingida."
            : "Mês encerrado abaixo da meta.";
    }

    // Média
    if (status.abaixo) {
        return (item.realizado <= item.meta)
            ? "Média dentro do limite estabelecido."
            : "Média acima do limite estabelecido.";
    }
    return (status.banda === "critico" || status.banda === "atencao")
        ? "Média abaixo do esperado."
        : "Média dentro ou acima da meta.";
}

function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
}

// ----------------------------------------------------------
// Inicialização
// ----------------------------------------------------------

document.getElementById("btnAtualizar").addEventListener("click", carregarDados);

document.querySelectorAll(".stat-box").forEach(box => {
    box.addEventListener("click", () => aplicarFiltro(box.dataset.filtro));
});

document.getElementById("btnLimparFiltro").addEventListener("click", () => aplicarFiltro("total"));

carregarDados();
setInterval(carregarDados, INTERVALO_ATUALIZACAO_MS);