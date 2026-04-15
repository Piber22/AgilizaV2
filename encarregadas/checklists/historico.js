/* ============================================================
   historico.js — Aba "Histórico"
   Sempre busca dados do Google Sheets (CSV público)
   Atualização automática a cada 30s (somente se a aba estiver ativa)
   ============================================================ */

(function () {
  'use strict';

  const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4Za1br8T7LSYUcZuHPwoG4wNkBJDDuFIIG8WHcDtliuViD-tXGJAOx_IgsvY7VEu-BPEzuaZiWEkq/pub?gid=0&single=true&output=csv';

  let dadosSheets = [];      // cache dos dados
  let intervalo = null;
  let abaAtiva = false;

  // ── Render principal ───────────────────────────────────────
  window._renderHistorico = async function (forcarAtualizacao = false) {
  const container = document.getElementById('historicoContent');
  const statusDiv = document.getElementById('historicoStatus');

  // Se já temos dados e não é forçado, usa cache
  if (!forcarAtualizacao && dadosSheets.length > 0) {
    statusDiv.innerHTML = '';
    container.innerHTML = buildTable(dadosSheets);
    bindSearch();
    return;
  }

  // Mostra loading
  statusDiv.innerHTML = loadingHTML();
  container.innerHTML = '';

  try {
    const raw = await fetchSheetsCSV();

    // ---- FILTRO: apenas últimas 24h ----
    const agora = new Date();
    const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

    const rawFiltrado = raw.filter(linha => {
      const dataStr = linha.data || '';
      const horaStr = linha.hora || '';
      if (!dataStr || !horaStr) return false;

      const [dia, mes, ano] = dataStr.split('/');
      const [hora, minuto, segundo] = horaStr.split(':');
      if (!dia || !mes || !ano || !hora) return false;

      const dataRegistro = new Date(ano, mes - 1, dia, hora, minuto, segundo);
      return dataRegistro >= vinteQuatroHorasAtras;
    });
    // ------------------------------------

    dadosSheets = rawFiltrado;

    if (rawFiltrado.length === 0) {
      statusDiv.innerHTML = `<div class="sheets-status ok">ℹ️ Nenhum registro nas últimas 24 horas.</div>`;
      container.innerHTML = emptyHTML('Nenhum registro encontrado nas últimas 24 horas.');
      return;
    }

    statusDiv.innerHTML = `<div class="sheets-status ok">✔ ${rawFiltrado.length} registro(s) das últimas 24h — <span class="sheets-ts">${new Date().toLocaleTimeString('pt-BR')}</span></div>`;
    container.innerHTML = buildTable(rawFiltrado);
    bindSearch();
  } catch (err) {
    console.error('Sheets CSV error:', err);
    statusDiv.innerHTML = `<div class="sheets-status erro">✖ Não foi possível carregar a planilha. <button class="btn-link" onclick="window._renderHistorico(true)">Tentar novamente</button></div>`;
    container.innerHTML = '';
  }
};

  // ── Fetch do CSV com fallback proxy ─────────────────────────
  async function fetchSheetsCSV() {
    const urls = [
      SHEETS_CSV_URL,
      `https://corsproxy.io/?${encodeURIComponent(SHEETS_CSV_URL)}`
    ];

    let lastErr;
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text || text.length < 5) throw new Error('Resposta vazia');
        return parseCSV(text);
      } catch (e) {
        console.warn('CSV fetch falhou:', url, e.message);
        lastErr = e;
      }
    }
    throw lastErr;
  }

  // ── Parser CSV (robusto) ───────────────────────────────────
  function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lines.length < 2) return [];

    const headers = splitLine(lines[0]).map(h =>
      h.trim()
       .toLowerCase()
       .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
       .replace(/\s+/g, '_')
    );

    return lines.slice(1)
      .map(line => {
        const vals = splitLine(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
        return obj;
      })
      .filter(r => Object.values(r).some(v => v !== ''));
  }

  function splitLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  // ── Normaliza linha do Sheets para formato de exibição ─────
  function norm(r) {
    const get = (...keys) => {
      for (const k of keys) {
        const v = r[k];
        if (v !== undefined && v !== '') return v;
      }
      return '—';
    };

    const marcados   = parseInt(get('marcados', 'checked', 'itens_marcados', 'marcado')) || 0;
    const totalItems = parseInt(get('total', 'totalitems', 'total_items', 'itens_total', 'itens')) || 0;
    const pct        = totalItems > 0 ? Math.round((marcados / totalItems) * 100) : 0;

    return {
      id:            get('id', 'chk_id', 'registro_id'),
      data:          get('data', 'date', 'data_conclusao'),
      hora:          get('hora', 'time', 'horario'),
      responsavel:   get('responsavel', 'responsible'),
      higienista:    get('higienista', 'hygienist'),
      setor:         get('setor', 'sector', 'ward'),
      quarto:        get('quarto', 'room'),
      leito:         get('leito', 'bed'),
      marcados, totalItems, pct,
      nomeAssinante: get('nomeassinante', 'nome_assinante', 'assinante', 'signer', 'nome'),
      coren:         get('coren', 'coren_number', 'coren_no'),
      assinadoFlag:  get('assinatura', 'assinado', 'signed', 'assinou')
    };
  }

  // ── Constrói tabela HTML ───────────────────────────────────
  function buildTable(registros) {
    const dados = registros.map(norm);
    const rows  = dados.map(r => buildRow(r)).join('');
    return `
    <div class="historico-table-wrap">
      <table class="historico-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Hora</th>
            <th>Responsável</th>
            <th>Higienista</th>
            <th>Setor</th>
            <th>Quarto</th>
            <th>Leito</th>
            <th>Checklist</th>
            <th>Assinante</th>
            <th>COREN</th>
            <th>Assinatura</th>
          </tr>
        </thead>
        <tbody id="historicoTbody">${rows}</tbody>
      </table>
    </div>`;
  }

  function buildRow(r) {
    const pct = r.pct;
    const flag = (r.assinadoFlag || '').toLowerCase();
    const assinou = flag === 'sim' || flag === 'yes' || flag === 'true' || flag === '1';
    const sigEl = assinou
      ? `<span class="badge-signed">✔ Sim</span>`
      : `<span class="sig-pending">Não</span>`;

    const checkHTML = (r.marcados > 0 || r.totalItems > 0)
      ? `<span class="checklist-count">${r.marcados}/${r.totalItems}<span class="count-bar"><span class="count-fill" style="width:${pct}%"></span></span></span>`
      : `<span style="color:#666">—</span>`;

    const search = [r.id, r.responsavel, r.higienista, r.setor, r.quarto, r.leito, r.nomeAssinante]
      .join(' ').toLowerCase();

    return `
    <tr data-search="${search}">
      <td style="font-size:11px;color:#888">${r.id}</td>
      <td>${r.data}</td>
      <td style="font-size:12px;color:#aaa">${r.hora}</td>
      <td>${r.responsavel}</td>
      <td>${r.higienista}</td>
      <td>${r.setor}</td>
      <td><span class="badge-quarto">${r.quarto}</span></td>
      <td><span class="badge-leito">${r.leito}</span></td>
      <td>${checkHTML}</td>
      <td>${r.nomeAssinante || '—'}</td>
      <td>${r.coren || '—'}</td>
      <td>${sigEl}</td>
    </tr>`;
  }

  // ── Busca em tempo real ────────────────────────────────────
  function bindSearch() {
    let input = document.getElementById('searchHistorico');
    if (!input) return;
    const fresh = input.cloneNode(true);
    input.parentNode.replaceChild(fresh, input);
    fresh.addEventListener('input', () => {
      const q = fresh.value.toLowerCase().trim();
      document.querySelectorAll('#historicoTbody tr').forEach(row => {
        row.style.display = (!q || (row.dataset.search || '').includes(q)) ? '' : 'none';
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  function emptyHTML(msg) {
    return `<div class="historico-empty"><div class="empty-icon">◈</div><p>${msg}</p></div>`;
  }

  function loadingHTML() {
    return `<div class="sheets-loading"><div class="loading-spinner"></div><span>Buscando dados do Google Sheets…</span></div>`;
  }

  // ── Atualização automática periódica (somente se a aba estiver ativa) ──
  function iniciarAtualizacaoAutomatica() {
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(() => {
      if (abaAtiva) {
        window._renderHistorico(true); // força atualização
      }
    }, 30000); // 30 segundos
  }

  // ── Monitora qual aba está visível ─────────────────────────
  function observarAba() {
    const abaHistorico = document.getElementById('tab-historico');
    if (!abaHistorico) return;

    const observer = new MutationObserver(() => {
      abaAtiva = abaHistorico.classList.contains('active');
      if (abaAtiva) {
        // Se a aba ficou ativa, atualiza os dados (sempre traz novos)
        window._renderHistorico(true);
      }
    });
    observer.observe(abaHistorico, { attributes: true, attributeFilter: ['class'] });

    // Estado inicial
    abaAtiva = abaHistorico.classList.contains('active');
    if (abaAtiva) window._renderHistorico();
  }

  // ── Inicialização ──────────────────────────────────────────
  function init() {
    observarAba();
    iniciarAtualizacaoAutomatica();
  }

  init();
})();