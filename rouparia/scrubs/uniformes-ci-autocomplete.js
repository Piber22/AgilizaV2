// =============================
// CI — AUTOCOMPLETE DE NOMES
// uniformes-ci-autocomplete.js
// =============================

let _nomesHistorico = [];
let _carregado      = false;

// ── Normalizar nome para comparação (sem acentos, lowercase) ─────────────────
function ac_normalizar(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

// ── Capitalizar nome corretamente  ─────────────────────────────────────────────
function ac_capitalizar(str) {
    const minusculas = ['de', 'da', 'do', 'dos', 'das', 'e'];
    return str.trim().split(' ')
        .map((p, i) => (i > 0 && minusculas.includes(p.toLowerCase()))
            ? p.toLowerCase()
            : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
}

// ── Score fuzzy simples (sem lib externa) ─────────────────────────────────────
// Retorna 0–1: 1 = match perfeito, 0 = sem match
function ac_score(query, nome) {
    const q = ac_normalizar(query);
    const n = ac_normalizar(nome);

    if (n.includes(q)) return 1;               // substring exata = prioridade máxima

    // Verifica se todas as palavras da query batem em alguma parte do nome
    const palavrasQuery = q.split(' ').filter(Boolean);
    const matches = palavrasQuery.filter(p => n.includes(p));
    if (matches.length === palavrasQuery.length) return 0.9;
    if (matches.length > 0) return 0.5 * (matches.length / palavrasQuery.length);

    // Fallback: caracteres em comum / tamanho
    let comum = 0;
    for (const c of q) if (n.includes(c)) comum++;
    return (comum / Math.max(q.length, n.length)) * 0.4;
}

// ── Carregar nomes únicos do histórico ────────────────────────────────────────
async function ac_carregarNomes() {
    if (_carregado) return;
    try {
        const res  = await fetch(CSV_HISTORICO_URL);
        const text = await res.text();
        const linhas = text.split('\n').slice(1).map(l => l.trim()).filter(Boolean);

        const set = new Set();
        linhas.forEach(linha => {
            const campos = linha.split(',');
            const nome   = (campos[2] || '').replace(/^"|"$/g, '').trim();
            if (nome.length >= 3) set.add(ac_capitalizar(nome));
        });

        _nomesHistorico = [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        _carregado = true;
    } catch (e) {
        console.warn('Autocomplete: não foi possível carregar histórico.', e);
    }
}

// ── Buscar sugestões para uma query ──────────────────────────────────────────
function ac_buscar(query) {
    if (!query || query.trim().length < 2) return [];

    return _nomesHistorico
        .map(nome => ({ nome, score: ac_score(query, nome) }))
        .filter(({ score }) => score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(({ nome }) => nome);
}

// ── Montar dropdown num input ─────────────────────────────────────────────────
function ac_inicializarInput(input, onSelect) {
    ac_carregarNomes();

    let dropdown = null;

    function removerDropdown() {
        if (dropdown) { dropdown.remove(); dropdown = null; }
    }

    function mostrarSugestoes(sugestoes) {
        removerDropdown();
        if (!sugestoes.length) return;

        dropdown = document.createElement('ul');
        dropdown.className = 'ac-dropdown';

        sugestoes.forEach(nome => {
            const li = document.createElement('li');
            li.className    = 'ac-item';
            li.textContent  = nome;
            li.addEventListener('mousedown', (e) => {
                e.preventDefault(); // evita blur antes do click
                input.value = nome;
                removerDropdown();
                if (onSelect) onSelect(nome);
            });
            dropdown.appendChild(li);
        });

        // Posiciona abaixo do input
        const rect = input.getBoundingClientRect();
        dropdown.style.width = input.offsetWidth + 'px';
        document.body.appendChild(dropdown);

        // Reposicionar usando offsetParent para ser preciso
        const inputRect = input.getBoundingClientRect();
        dropdown.style.top  = (window.scrollY + inputRect.bottom) + 'px';
        dropdown.style.left = (window.scrollX + inputRect.left)   + 'px';
    }

    input.addEventListener('input', () => {
        mostrarSugestoes(ac_buscar(input.value));
    });

    input.addEventListener('blur', () => {
        // Pequeno delay para o mousedown do item ter tempo de disparar
        setTimeout(removerDropdown, 150);
    });

    input.addEventListener('keydown', (e) => {
        if (!dropdown) return;
        const items = dropdown.querySelectorAll('.ac-item');
        const ativo = dropdown.querySelector('.ac-item.ativo');
        let idx     = [...items].indexOf(ativo);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (ativo) ativo.classList.remove('ativo');
            items[Math.min(idx + 1, items.length - 1)].classList.add('ativo');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (ativo) ativo.classList.remove('ativo');
            items[Math.max(idx - 1, 0)].classList.add('ativo');
        } else if (e.key === 'Enter' && ativo) {
            e.preventDefault();
            input.value = ativo.textContent;
            removerDropdown();
            if (onSelect) onSelect(input.value);
        } else if (e.key === 'Escape') {
            removerDropdown();
        }
    });
}