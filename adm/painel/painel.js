console.log("✅ painel.js carregado!");

const SUPABASE_URL = "https://bcxtmhsliymapevhwsvc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeHRtaHNsaXltYXBldmh3c3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MTU3ODMsImV4cCI6MjExMTA5MTc4M30.z72vFgxE_5q3m_9enWFghaag0dg5_b9Nmoefo1klOB4";

// "sb" para não conflitar com o global window.supabase da CDN
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Categorias exatamente como são gravadas por auxiliar.js
const CATEGORIAS = [
    { chave: "PRESENTE",            titulo: "🟢 Presentes",             rotulo: "Presentes",       cor: "verde" },
    { chave: "ATRASO / SAÍDA ANT.", titulo: "🟡 Atraso / Saída ant.",   rotulo: "Atrasos / Saídas", cor: "amarelo" },
    { chave: "FALTA / ATESTADO",    titulo: "🔴 Faltas / Atestado",     rotulo: "Faltas",          cor: "vermelho" },
    { chave: "FÉRIAS",              titulo: "🔵 Folga / Férias",        rotulo: "Folgas",          cor: "azul" }
];

const SEM_REGISTRO = { chave: "SEM_REGISTRO", titulo: "⚪ Não informados", rotulo: "Não informados", cor: "cinza" };

// Elementos
const elData = document.getElementById("filtroData");
const elEquipe = document.getElementById("filtroEquipe");
const elBusca = document.getElementById("filtroBusca");
const elModoHistorico = document.getElementById("modoHistorico");
const elStatus = document.getElementById("status");
const elResumo = document.getElementById("resumo");
const elGrupos = document.getElementById("grupos");

// Estado
let registrosDoDia = [];      // linhas de efetivo_registros (dia ou mês, conforme o modo)
let colaboradoresAtivos = []; // linhas de colaboradores (para achar quem não foi informado)

// ---------- utilidades ----------
const norm = (s) => (s || "").toString().trim().toUpperCase();

function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function somarDias(iso, dias) {
    const [a, m, d] = iso.split("-").map(Number);
    const dt = new Date(a, m - 1, d + dias); // data local, sem problema de fuso
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function somarMeses(iso, meses) {
    const [a, m, d] = iso.split("-").map(Number);
    const dt = new Date(a, m - 1 + meses, 1);
    // Mantém o dia se possível; senão usa o último dia do mês alvo
    const ultimo = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    const dia = Math.min(d, ultimo);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function dataExtenso(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });
}

function mesExtenso(iso) {
    const [a, m] = iso.split("-").map(Number);
    return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", {
        month: "long", year: "numeric"
    });
}

function primeiroDiaMes(iso) {
    const [a, m] = iso.split("-");
    return `${a}-${m}-01`;
}

function ultimoDiaMes(iso) {
    const [a, m] = iso.split("-").map(Number);
    const ultimo = new Date(a, m, 0).getDate();
    return `${a}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
}

function formatarDataCurta(iso) {
    const [a, m, d] = iso.split("-");
    return `${d}/${m}`;
}

function categoriaDe(registro) {
    const c = norm(registro.categoria);
    if (c.startsWith("FOLGA")) return "FÉRIAS"; // aceita o rótulo antigo, se existir
    return c;
}

function infoCategoria(chave) {
    return CATEGORIAS.find(c => c.chave === chave) || { chave, titulo: chave, rotulo: chave, cor: "cinza" };
}

function nomeEquipe(e) {
    const t = (e || "").trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function modoHistoricoAtivo() {
    return elModoHistorico && elModoHistorico.checked;
}

// ---------- carregamento ----------
async function carregarColaboradores() {
    const { data, error } = await sb
        .from("colaboradores")
        .select("nome, equipe")
        .eq("ativo", true);
    if (error) throw error;
    colaboradoresAtivos = data;
}

async function carregarDados() {
    const data = elData.value;
    if (!data) return;

    elStatus.textContent = "Carregando...";

    try {
        if (colaboradoresAtivos.length === 0) await carregarColaboradores();

        let query = sb
            .from("efetivo_registros")
            .select("data, horario, equipe, categoria, colaborador");

        if (modoHistoricoAtivo()) {
            // Mês inteiro da data selecionada
            const inicio = primeiroDiaMes(data);
            const fim = ultimoDiaMes(data);
            query = query
                .gte("data", inicio)
                .lte("data", fim)
                .order("data")
                .order("colaborador");
        } else {
            // Apenas o dia
            query = query
                .eq("data", data)
                .order("colaborador");
        }

        const { data: linhas, error } = await query;
        if (error) throw error;

        registrosDoDia = linhas;
        montarFiltroEquipe();
        renderizar();
    } catch (err) {
        console.error("❌ Erro ao carregar registros:", err);
        elStatus.textContent = "Não foi possível carregar os dados. Confira a conexão e as permissões no Supabase.";
        elResumo.innerHTML = "";
        elGrupos.innerHTML = "";
    }
}

function montarFiltroEquipe() {
    const atual = elEquipe.value;
    const equipes = new Set();
    registrosDoDia.forEach(r => equipes.add(norm(r.equipe)));
    colaboradoresAtivos.forEach(c => equipes.add(norm(c.equipe)));

    elEquipe.innerHTML = '<option value="">Todas</option>';
    [...equipes].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR")).forEach(e => {
        const op = document.createElement("option");
        op.value = e;
        op.textContent = nomeEquipe(e);
        elEquipe.appendChild(op);
    });
    elEquipe.value = equipes.has(atual) ? atual : "";
}

// ---------- renderização ----------
function renderizar() {
    if (modoHistoricoAtivo()) {
        renderizarHistorico();
    } else {
        renderizarDia();
    }
}

function renderizarDia() {
    const equipeSel = elEquipe.value;
    const busca = elBusca.value.trim().toLowerCase();

    // Registros do filtro de equipe (o resumo ignora a busca por nome)
    const doFiltro = registrosDoDia.filter(r => !equipeSel || norm(r.equipe) === equipeSel);

    // Quem está cadastrado nas equipes consideradas mas não apareceu no efetivo do dia
    const equipesComEnvio = new Set(registrosDoDia.map(r => norm(r.equipe)));
    const jaInformados = new Set(registrosDoDia.map(r => norm(r.colaborador)));
    const naoInformados = colaboradoresAtivos.filter(c => {
        const eq = norm(c.equipe);
        const considerar = equipeSel ? eq === equipeSel : equipesComEnvio.has(eq);
        return considerar && !jaInformados.has(norm(c.nome));
    });

    renderizarStatusDia(doFiltro);
    renderizarResumo(doFiltro, naoInformados);
    renderizarGrupos(doFiltro, naoInformados, busca);
}

function renderizarStatusDia(registros) {
    const dia = dataExtenso(elData.value);
    if (registros.length === 0) {
        elStatus.textContent = `${dia}: nenhum efetivo registrado.`;
        return;
    }
    // Último horário de envio por equipe
    const ultimo = {};
    registros.forEach(r => {
        const e = nomeEquipe(r.equipe);
        const h = (r.horario || "").slice(0, 5);
        if (!ultimo[e] || h > ultimo[e]) ultimo[e] = h;
    });
    const envios = Object.entries(ultimo).map(([e, h]) => `${e} às ${h}`).join(", ");
    elStatus.textContent = `${dia}. Último envio: ${envios}.`;
}

function renderizarResumo(registros, naoInformados) {
    elResumo.innerHTML = "";
    elResumo.hidden = false;

    const itens = CATEGORIAS.map(cat => ({
        ...cat,
        total: registros.filter(r => categoriaDe(r) === cat.chave).length
    }));
    itens.push({ ...SEM_REGISTRO, total: naoInformados.length });

    itens.forEach(i => {
        const box = document.createElement("div");
        box.className = `indicador cor-${i.cor}`;

        const num = document.createElement("div");
        num.className = "numero";
        num.textContent = i.total;

        const rot = document.createElement("div");
        rot.className = "rotulo";
        rot.textContent = i.rotulo;

        box.append(num, rot);
        elResumo.appendChild(box);
    });
}

function renderizarGrupos(registros, naoInformados, busca) {
    elGrupos.innerHTML = "";

    const passaBusca = (nome) => !busca || nome.toLowerCase().includes(busca);
    let algumGrupo = false;

    const montarGrupo = (cat, itens) => {
        if (itens.length === 0) return;
        algumGrupo = true;

        const sec = document.createElement("div");
        sec.className = `grupo cor-${cat.cor}`;

        const h3 = document.createElement("h3");
        h3.textContent = cat.titulo;
        const cont = document.createElement("small");
        cont.textContent = itens.length;
        h3.appendChild(cont);
        sec.appendChild(h3);

        const ul = document.createElement("ul");
        itens.forEach(({ nome, equipe }) => {
            const li = document.createElement("li");
            const spanNome = document.createElement("span");
            spanNome.textContent = nome;
            li.appendChild(spanNome);

            // Mostra a equipe ao lado do nome só quando o filtro é "Todas"
            if (!elEquipe.value && equipe) {
                const spanEq = document.createElement("span");
                spanEq.className = "equipe";
                spanEq.textContent = nomeEquipe(equipe);
                li.appendChild(spanEq);
            }
            ul.appendChild(li);
        });
        sec.appendChild(ul);
        elGrupos.appendChild(sec);
    };

    CATEGORIAS.forEach(cat => {
        const itens = registros
            .filter(r => categoriaDe(r) === cat.chave && passaBusca(r.colaborador))
            .map(r => ({ nome: r.colaborador, equipe: r.equipe }))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        montarGrupo(cat, itens);
    });

    // Categorias que não conhecemos (evita sumir dado por causa de texto inesperado)
    const conhecidas = new Set(CATEGORIAS.map(c => c.chave));
    const outros = registros
        .filter(r => !conhecidas.has(categoriaDe(r)) && passaBusca(r.colaborador))
        .map(r => ({ nome: `${r.colaborador} (${r.categoria})`, equipe: r.equipe }));
    montarGrupo({ titulo: "Outros", cor: "cinza" }, outros);

    const pend = naoInformados
        .filter(c => passaBusca(c.nome))
        .map(c => ({ nome: c.nome, equipe: c.equipe }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    montarGrupo(SEM_REGISTRO, pend);

    if (!algumGrupo) {
        const p = document.createElement("p");
        p.className = "vazio";
        p.textContent = busca
            ? "Nenhum colaborador encontrado para essa busca."
            : "Nada para mostrar nesta data. Escolha outro dia ou confira se o efetivo foi enviado.";
        elGrupos.appendChild(p);
    }
}

// ---------- modo histórico do mês ----------
function renderizarHistorico() {
    const equipeSel = elEquipe.value;
    const busca = elBusca.value.trim().toLowerCase();
    const mes = mesExtenso(elData.value);

    elResumo.innerHTML = "";
    elResumo.hidden = true; // resumo diário não faz sentido no histórico

    // Filtra por equipe e busca
    let filtrados = registrosDoDia.filter(r => {
        if (equipeSel && norm(r.equipe) !== equipeSel) return false;
        if (busca && !(r.colaborador || "").toLowerCase().includes(busca)) return false;
        return true;
    });

    if (!busca) {
        elStatus.textContent = `${mes}: digite o nome de um colaborador para ver o histórico do mês.`;
        elGrupos.innerHTML = "";
        const p = document.createElement("p");
        p.className = "vazio";
        p.textContent = "Ative o histórico e digite um nome na busca para ver todos os registros do mês (ex.: 01/11 PRESENTE, 02/11 FALTA…).";
        elGrupos.appendChild(p);
        return;
    }

    // Agrupa por colaborador
    const porPessoa = new Map();
    filtrados.forEach(r => {
        const nome = r.colaborador || "(sem nome)";
        if (!porPessoa.has(nome)) porPessoa.set(nome, []);
        porPessoa.get(nome).push(r);
    });

    // Ordena nomes
    const nomes = [...porPessoa.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

    if (nomes.length === 0) {
        elStatus.textContent = `${mes}: nenhum registro encontrado para "${elBusca.value.trim()}".`;
        elGrupos.innerHTML = "";
        const p = document.createElement("p");
        p.className = "vazio";
        p.textContent = "Nenhum registro neste mês para esse nome. Confira a escrita ou o mês selecionado.";
        elGrupos.appendChild(p);
        return;
    }

    elStatus.textContent = `${mes}: histórico de ${nomes.length} colaborador(es).`;

    elGrupos.innerHTML = "";

    nomes.forEach(nome => {
        const regs = porPessoa.get(nome)
            .sort((a, b) => (a.data || "").localeCompare(b.data || ""));

        // Contagem por categoria para o subtítulo
        const contagem = {};
        regs.forEach(r => {
            const c = categoriaDe(r);
            contagem[c] = (contagem[c] || 0) + 1;
        });

        const sec = document.createElement("div");
        sec.className = "grupo grupo-historico";

        const h3 = document.createElement("h3");
        h3.textContent = nome;
        const cont = document.createElement("small");
        cont.textContent = `${regs.length} registro(s)`;
        h3.appendChild(cont);
        sec.appendChild(h3);

        // Lista cronológica: data + categoria
        const ul = document.createElement("ul");
        ul.className = "lista-historico";

        regs.forEach(r => {
            const cat = infoCategoria(categoriaDe(r));
            const li = document.createElement("li");
            li.className = `item-historico cor-${cat.cor}`;

            const spanData = document.createElement("span");
            spanData.className = "data-hist";
            spanData.textContent = formatarDataCurta(r.data);

            const spanCat = document.createElement("span");
            spanCat.className = "cat-hist";
            spanCat.textContent = cat.rotulo || r.categoria;

            li.append(spanData, spanCat);

            // Equipe só se filtro "Todas"
            if (!elEquipe.value && r.equipe) {
                const spanEq = document.createElement("span");
                spanEq.className = "equipe";
                spanEq.textContent = nomeEquipe(r.equipe);
                li.appendChild(spanEq);
            }

            ul.appendChild(li);
        });

        sec.appendChild(ul);
        elGrupos.appendChild(sec);
    });
}

// ---------- eventos e inicialização ----------
function iniciarPainel() {
    if (!elData.value) elData.value = hojeISO();
    atualizarUIModo();
    carregarDados();
}

function atualizarUIModo() {
    // No modo histórico, as setas mudam o mês
    const btnAnt = document.getElementById("diaAnterior");
    const btnSeg = document.getElementById("diaSeguinte");
    if (modoHistoricoAtivo()) {
        btnAnt.setAttribute("aria-label", "Mês anterior");
        btnSeg.setAttribute("aria-label", "Próximo mês");
        elBusca.placeholder = "Digite o nome para ver o histórico";
    } else {
        btnAnt.setAttribute("aria-label", "Dia anterior");
        btnSeg.setAttribute("aria-label", "Próximo dia");
        elBusca.placeholder = "Digite um nome";
    }
}

elData.addEventListener("change", carregarDados);
elEquipe.addEventListener("change", renderizar);
elBusca.addEventListener("input", renderizar);

elModoHistorico.addEventListener("change", () => {
    atualizarUIModo();
    carregarDados(); // precisa recarregar (dia vs mês)
});

document.getElementById("btnAtualizar").addEventListener("click", async () => {
    await carregarColaboradores().catch(console.error);
    carregarDados();
});

document.getElementById("diaAnterior").addEventListener("click", () => {
    const base = elData.value || hojeISO();
    elData.value = modoHistoricoAtivo()
        ? somarMeses(base, -1)
        : somarDias(base, -1);
    carregarDados();
});

document.getElementById("diaSeguinte").addEventListener("click", () => {
    const base = elData.value || hojeISO();
    elData.value = modoHistoricoAtivo()
        ? somarMeses(base, 1)
        : somarDias(base, 1);
    carregarDados();
});
