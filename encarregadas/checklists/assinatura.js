/* ============================================================
   assinatura.js — Aba "Coletar Assinatura" (AGRUPADO POR SETOR)
   ============================================================ */

(function () {
  'use strict';

  window._renderAssinatura = function () {
    const container = document.getElementById('assinaturaContent');
    const registros = JSON.parse(localStorage.getItem('higicontrol_registros') || '[]');
    const pendentes = registros.filter(r => !r.assinatura);

    if (pendentes.length === 0) {
      container.innerHTML = `
        <div class="assinatura-empty">
          <div class="empty-icon">✎</div>
          <p>Nenhum registro aguardando assinatura.</p>
          <p style="font-size:13px;margin-top:8px;color:var(--text-dim)">Finalize um checklist na aba Registro para coletar a assinatura.</p>
        </div>`;
      return;
    }

    // Agrupa pendentes por setor
    const grupos = new Map();
    pendentes.forEach(reg => {
      if (!grupos.has(reg.setor)) grupos.set(reg.setor, []);
      grupos.get(reg.setor).push(reg);
    });

    let html = '';
    for (const [setor, registrosGrupo] of grupos.entries()) {
      html += buildGrupo(setor, registrosGrupo);
    }
    container.innerHTML = html;

    // Inicializa os canvases e listeners para cada grupo
    for (const [setor, registrosGrupo] of grupos.entries()) {
      initCanvas(setor);
      // Armazena os IDs dos registros do grupo no próprio canvas para uso no save
      const canvas = document.getElementById(`sigCanvas-${setor}`);
      if (canvas) {
        canvas.dataset.registrosIds = JSON.stringify(registrosGrupo.map(r => r.id));
      }
    }
  };

  function buildGrupo(setor, registros) {
    // Monta a lista de registros do setor
    const listaItems = registros.map(r => {
      const pct = Math.round((r.marcados / r.totalItems) * 100);
      return `
        <div class="grupo-registro-item">
          <span><strong>Quarto ${r.quarto} — Leito ${r.leito}</strong> (${r.data} ${r.hora})</span>
          <span>Responsável: ${r.responsavel} | Higienista: ${r.higienista}</span>
          <span>Checklist: ${r.marcados}/${r.totalItems} (${pct}%)</span>
        </div>
      `;
    }).join('');

    return `
    <div class="grupo-assinatura-card" id="grupo-${setor.replace(/\s/g, '')}">
      <div class="grupo-header">
        <span class="grupo-titulo">📌 Setor: ${setor}</span>
        <span class="grupo-qtd">${registros.length} checklist(s)</span>
      </div>
      <div class="grupo-registros">
        ${listaItems}
      </div>
      <div class="assinatura-wrapper">
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label">Nome do Assinante</label>
          <input type="text" id="nomeAssinante-${setor.replace(/\s/g, '')}" class="form-input" placeholder="Nome completo" />
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label">COREN</label>
          <input type="text" id="coren-${setor.replace(/\s/g, '')}" class="form-input" placeholder="Número do COREN" />
        </div>
        <div class="signature-area" id="sigArea-${setor.replace(/\s/g, '')}">
          <canvas id="sigCanvas-${setor.replace(/\s/g, '')}" height="160"></canvas>
        </div>
        <div class="sig-toolbar">
          <span class="sig-note">Assine com o dedo ou mouse na área branca</span>
          <div style="display:flex;gap:8px">
            <button class="btn-secondary btn-sm" onclick="clearSigGrupo('${setor.replace(/\s/g, '')}')">↺ Limpar</button>
            <button class="btn-primary btn-sm" onclick="saveSigGrupo('${setor.replace(/\s/g, '')}')">✔ Salvar Assinatura (para todos do setor)</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function initCanvas(setorId) {
    const canvasId = `sigCanvas-${setorId}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const area = document.getElementById(`sigArea-${setorId}`);
    canvas.width = area.offsetWidth || 600;

    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    function startDraw(e) {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x; lastY = pos.y;
      ctx.beginPath(); ctx.moveTo(lastX, lastY);
    }
    function draw(e) {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x; lastY = pos.y;
    }
    function stopDraw() { drawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
  }

  window.clearSigGrupo = function (setorId) {
    const canvas = document.getElementById(`sigCanvas-${setorId}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  window.saveSigGrupo = function (setorId) {
    const canvas = document.getElementById(`sigCanvas-${setorId}`);
    if (!canvas) return;

    // Verificar se algo foi assinado
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasContent = data.some((val, idx) => idx % 4 === 3 && val > 0);
    if (!hasContent) {
      alert('Por favor, realize a assinatura antes de salvar.');
      return;
    }

    // Coleta nome e COREN
    const nomeInput = document.getElementById(`nomeAssinante-${setorId}`);
    const corenInput = document.getElementById(`coren-${setorId}`);
    const nomeAssinante = nomeInput ? nomeInput.value.trim() : '';
    const coren = corenInput ? corenInput.value.trim() : '';

    if (!nomeAssinante) {
      alert('Informe o nome do assinante.');
      nomeInput.focus();
      return;
    }
    if (!coren) {
      alert('Informe o número do COREN.');
      corenInput.focus();
      return;
    }

    const dataURL = canvas.toDataURL('image/png');
    const registros = JSON.parse(localStorage.getItem('higicontrol_registros') || '[]');
    const ids = JSON.parse(canvas.dataset.registrosIds || '[]');

    // Aplica a assinatura, nome e COREN em todos os registros do grupo
    let atualizados = 0;
    ids.forEach(id => {
      const idx = registros.findIndex(r => r.id === id);
      if (idx !== -1) {
        registros[idx].assinatura = dataURL;
        registros[idx].nomeAssinante = nomeAssinante;
        registros[idx].coren = coren;
        atualizados++;
      }
    });

    if (atualizados > 0) {
      localStorage.setItem('higicontrol_registros', JSON.stringify(registros));
    }

    // Feedback visual: remove o grupo inteiro ou mostra mensagem
    const grupoDiv = document.getElementById(`grupo-${setorId}`);
    if (grupoDiv) {
      grupoDiv.style.borderColor = 'rgba(0,229,160,0.5)';
      grupoDiv.style.background = 'rgba(0,229,160,0.04)';
      grupoDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;padding:16px">
          <span style="font-size:32px;color:var(--success)">✔</span>
          <div>
            <div style="font-family:var(--font-head);font-size:18px;color:var(--success);letter-spacing:.06em">Assinatura salva!</div>
            <div style="font-size:13px;color:var(--text-muted)">${atualizados} checklist(s) do setor ${setorId} assinados por ${nomeAssinante} (COREN ${coren})</div>
          </div>
        </div>`;
      setTimeout(() => window._renderAssinatura(), 2000);
    }
  };

  // Render inicial se aba já estiver ativa
  if (document.getElementById('tab-assinatura').classList.contains('active')) {
    window._renderAssinatura();
  }

})();