/* ============================================================
   historico.js — Aba "Histórico"
   ============================================================ */

(function () {
  'use strict';

  window._renderHistorico = function () {
    const container = document.getElementById('historicoContent');
    const registros = JSON.parse(localStorage.getItem('higicontrol_registros') || '[]');

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="historico-empty">
          <div class="empty-icon">◈</div>
          <p>Nenhum registro encontrado.</p>
          <p style="font-size:13px;margin-top:8px;color:var(--text-dim)">Os registros finalizados aparecerão aqui.</p>
        </div>`;
      return;
    }

    container.innerHTML = buildTable(registros);
    bindSearch(registros);
  };

  function buildTable(registros) {
    const rows = registros.map(r => buildRow(r)).join('');
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
    const pct   = Math.round((r.marcados / r.totalItems) * 100);
    const sigEl = r.assinatura
      ? `<span class="sig-thumb"><img src="${r.assinatura}" alt="Assinatura" /></span>`
      : `<span class="sig-pending">Aguardando</span>`;

    return `
    <tr data-search="${[r.id, r.responsavel, r.higienista, r.setor, r.quarto, r.leito].join(' ').toLowerCase()}">
      <td>${r.id}</td>
      <td>${r.data}</td>
      <td style="font-family:var(--font-mono);font-size:12px">${r.hora}</td>
      <td>${r.responsavel}</td>
      <td>${r.higienista}</td>
      <td>${r.setor}</td>
      <td><span class="badge-quarto">${r.quarto}</span></td>
      <td><span class="badge-leito">${r.leito}</span></td>
      <td>
        <span class="checklist-count">
          ${r.marcados}/${r.totalItems}
          <span class="count-bar">
            <span class="count-fill" style="width:${pct}%"></span>
          </span>
        </span>
      </td>
      <td>${r.nomeAssinante || '—'}</td>
      <td>${r.coren || '—'}</td>
      <td>${sigEl}</td>
    </tr>`;
  }

  function bindSearch(registros) {
    const input = document.getElementById('searchHistorico');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      const tbody = document.getElementById('historicoTbody');
      if (!tbody) return;
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        const haystack = row.dataset.search || '';
        row.style.display = (!q || haystack.includes(q)) ? '' : 'none';
      });
    });
  }

  // ── Export CSV ─────────────────────────────────────────────
  document.getElementById('btnExportar').addEventListener('click', () => {
    const registros = JSON.parse(localStorage.getItem('higicontrol_registros') || '[]');
    if (registros.length === 0) { alert('Nenhum registro para exportar.'); return; }

    const header = ['ID','Data','Hora','Responsavel','Higienista','Setor','Quarto','Leito','Marcados','Total','Assinatura'];
    const rows = registros.map(r => [
      r.id, r.data, r.hora, r.responsavel, r.higienista,
      r.setor, r.quarto, r.leito, r.marcados, r.totalItems,
      r.assinatura ? 'Sim' : 'Não'
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv  = [header.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'higicontrol_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Render se aba já ativa
  if (document.getElementById('tab-historico').classList.contains('active')) {
    window._renderHistorico();
  }

})();