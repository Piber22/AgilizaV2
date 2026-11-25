console.log("✅ calendario.js carregado!");

// Reaproveita de painel.js: sb, norm, nomeEquipe, categoriaDe, infoCategoria,
// colaboradoresAtivos, carregarColaboradores, hojeISO, somarMeses, ultimoDiaMes, mesExtenso

const ICONE_CALENDARIO = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
const ICONE_LISTA = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`;

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const ROTULO_CURTO = {
    "PRESENTE": "Presente",
    "ATRASO / SAÍDA ANT.": "Atraso",
    "FALTA / ATESTADO": "Falta",
    "FÉRIAS": "Folga"
};

// Elementos
const elTelaPainel = document.getElementById("telaPainel");
const elTelaCal = document.getElementById("telaCalendario");
const elMain = document.querySelector("main");
const btnCal = document.getElementById("btnCalendario");
const calMes = document.getElementById("calMes");
const calEquipe = document.getElementById("calEquipe");
const calBusca = document.getElementById("calBusca");
const calTodosDias = document.getElementById("calTodosDias");
const calStatus = document.getElementById("calStatus");
const calTabelas = document.getElementById("calTabelas");

let calRegistros = [];

// ---------- alternar entre painel e calendário ----------
function calendarioAberto() {
    return !elTelaCal.hidden;
}

function alternarCalendario() {
    const abrir = !calendarioAberto();
    elTelaCal.hidden = !abrir;
    elTelaPainel.hidden = abrir;
    elMain.classList.toggle("largo", abrir);

    btnCal.innerHTML = abrir ? ICONE_LISTA : ICONE_CALENDARIO;
    const rotulo = abrir ? "Voltar ao painel do dia" : "Ver em modo calendário";
    btnCal.title = rotulo;
    btnCal.setAttribute("aria-label", rotulo);

    if (abrir) {
        if (!calMes.value) {
            const base = (typeof elData !== "undefined" && elData.value) ? elData.value : hojeISO();
            calMes.value = base.slice(0, 7);
        }
        carregarCalendario();
    }
}

// ---------- dados ----------
// O Supabase devolve no máximo 1000 linhas por consulta; busca em páginas.
async function buscarRegistrosDoMes(mes) {
    const inicio = `${mes}-01`;
    const fim = ultimoDiaMes(inicio);
    const tamanho = 1000;
    let todos = [];

    for (let de = 0; ; de += tamanho) {
        const { data, error } = await sb
            .from("efetivo_registros")
            .select("data, horario, equipe, categoria, colaborador")
            .gte("data", inicio)
            .lte("data", fim)
            .order("data")
            .order("equipe")
            .order("colaborador")
            .range(de, de + tamanho - 1);

        if (error) throw error;
        todos = todos.concat(data);
        if (data.length < tamanho) break;
    }
    return todos;
}

async function carregarCalendario() {
    const mes = calMes.value;
    if (!mes) return;

    calStatus.textContent = "Carregando...";

    try {
        if (colaboradoresAtivos.length === 0) await carregarColaboradores();
        calRegistros = await buscarRegistrosDoMes(mes);
        montarFiltroEquipeCal();
        renderizarCalendario();
    } catch (err) {
        console.error("❌ Erro ao carregar calendário:", err);
        calStatus.textContent = "Não foi possível carregar os dados. Confira a conexão e as permissões no Supabase.";
        calTabelas.innerHTML = "";
    }
}

function montarFiltroEquipeCal() {
    const atual = calEquipe.value;
    const equipes = new Set();
    calRegistros.forEach(r => equipes.add(norm(r.equipe)));
    colaboradoresAtivos.forEach(c => equipes.add(norm(c.equipe)));

    calEquipe.innerHTML = '<option value="">Todas</option>';
    [...equipes].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR")).forEach(e => {
        const op = document.createElement("option");
        op.value = e;
        op.textContent = nomeEquipe(e);
        calEquipe.appendChild(op);
    });
    calEquipe.value = equipes.has(atual) ? atual : "";
}

// ---------- renderização ----------
function diasDoMes(mes) {
    const [a, m] = mes.split("-").map(Number);
    const total = new Date(a, m, 0).getDate();
    return Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
}

function th(texto, classe) {
    const el = document.createElement("th");
    el.textContent = texto;
    if (classe) el.className = classe;
    return el;
}

function renderizarCalendario() {
    const mes = calMes.value;
    const equipeSel = calEquipe.value;
    const busca = calBusca.value.trim().toLowerCase();
    const todosDias = calTodosDias.checked;

    calTabelas.innerHTML = "";

    // Quais equipes mostrar
    const todasEquipes = new Set();
    calRegistros.forEach(r => todasEquipes.add(norm(r.equipe)));
    colaboradoresAtivos.forEach(c => todasEquipes.add(norm(c.equipe)));
    let equipes = [...todasEquipes].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
    if (equipeSel) equipes = [equipeSel];

    let algum = false;

    equipes.forEach(eq => {
        const regsEq = calRegistros.filter(r => norm(r.equipe) === eq);

        // Colunas: dias com registro dessa equipe (ou o mês inteiro, se marcado)
        const dias = todosDias
            ? diasDoMes(mes)
            : [...new Set(regsEq.map(r => r.data))].sort();
        if (dias.length === 0) return;

        // Linhas: colaboradores ativos da equipe + quem tem registro no mês
        const nomes = new Map(); // chave normalizada -> nome de exibição
        colaboradoresAtivos
            .filter(c => norm(c.equipe) === eq)
            .forEach(c => nomes.set(norm(c.nome), c.nome));
        regsEq.forEach(r => {
            if (!nomes.has(norm(r.colaborador))) nomes.set(norm(r.colaborador), r.colaborador);
        });

        const linhas = [...nomes.entries()]
            .filter(([, nome]) => !busca || nome.toLowerCase().includes(busca))
            .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
        if (linhas.length === 0) return;

        algum = true;

        // Índice: colaborador|data -> registro
        const indice = new Map();
        regsEq.forEach(r => indice.set(`${norm(r.colaborador)}|${r.data}`, r));

        // Bloco da equipe
        const bloco = document.createElement("div");
        bloco.className = "bloco-equipe";

        const h3 = document.createElement("h3");
        h3.textContent = nomeEquipe(eq);
        const cont = document.createElement("small");
        cont.textContent = `${linhas.length} colaborador(es), ${dias.length} dia(s)`;
        h3.appendChild(cont);
        bloco.appendChild(h3);

        const wrap = document.createElement("div");
        wrap.className = "tabela-wrap";
        const tabela = document.createElement("table");
        tabela.className = "tabela-cal";

        // Cabeçalho: linha 1 = data, linha 2 = dia da semana
        const thead = document.createElement("thead");
        const tr1 = document.createElement("tr");
        const tr2 = document.createElement("tr");

        const thNome = th("Colaborador", "col-nome");
        thNome.rowSpan = 2;
        tr1.appendChild(thNome);

        dias.forEach(iso => {
            const [a, m, d] = iso.split("-").map(Number);
            tr1.appendChild(th(`${String(d).padStart(2, "0")}/${MESES_ABREV[m - 1]}`));
            tr2.appendChild(th(DIAS_SEMANA[new Date(a, m - 1, d).getDay()]));
        });
        thead.append(tr1, tr2);
        tabela.appendChild(thead);

        // Corpo
        const tbody = document.createElement("tbody");
        linhas.forEach(([chave, nome]) => {
            const tr = document.createElement("tr");

            const tdNome = document.createElement("td");
            tdNome.className = "col-nome";
            tdNome.textContent = nome;
            tr.appendChild(tdNome);

            dias.forEach(iso => {
                const td = document.createElement("td");
                const reg = indice.get(`${chave}|${iso}`);

                if (!reg) {
                    td.className = "cel cel-vazio";
                    td.textContent = "–";
                } else {
                    const catChave = categoriaDe(reg);
                    const info = infoCategoria(catChave);
                    td.className = `cel cel-${info.cor}`;
                    td.textContent = ROTULO_CURTO[catChave] || reg.categoria;
                    td.title = `${reg.categoria}${reg.horario ? " (" + reg.horario.slice(0, 5) + ")" : ""}`;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        tabela.appendChild(tbody);

        wrap.appendChild(tabela);
        bloco.appendChild(wrap);
        calTabelas.appendChild(bloco);
    });

    const nomeMes = mesExtenso(`${mes}-01`);
    if (!algum) {
        calStatus.textContent = `${nomeMes}: nenhum registro encontrado.`;
        const p = document.createElement("p");
        p.className = "vazio";
        p.textContent = busca
            ? "Nenhum colaborador encontrado para essa busca."
            : "Nenhum efetivo enviado neste mês. Escolha outro mês ou marque \"Todos os dias do mês\".";
        calTabelas.appendChild(p);
    } else {
        calStatus.textContent = `${nomeMes}. Passe o mouse sobre uma célula para ver a categoria completa e o horário do envio.`;
    }
}

// ---------- eventos ----------
btnCal.innerHTML = ICONE_CALENDARIO;
btnCal.addEventListener("click", alternarCalendario);

calMes.addEventListener("change", carregarCalendario);
calEquipe.addEventListener("change", renderizarCalendario);
calBusca.addEventListener("input", renderizarCalendario);
calTodosDias.addEventListener("change", renderizarCalendario);

document.getElementById("calMesAnterior").addEventListener("click", () => {
    calMes.value = somarMeses(`${calMes.value || hojeISO().slice(0, 7)}-01`, -1).slice(0, 7);
    carregarCalendario();
});
document.getElementById("calMesSeguinte").addEventListener("click", () => {
    calMes.value = somarMeses(`${calMes.value || hojeISO().slice(0, 7)}-01`, 1).slice(0, 7);
    carregarCalendario();
});
document.getElementById("calAtualizar").addEventListener("click", async () => {
    await carregarColaboradores().catch(console.error);
    carregarCalendario();
});
