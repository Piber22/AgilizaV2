/* ============================================================
   registro.js — Aba "Registro"
   ============================================================ */

// URL do seu Web App do Google Apps Script (substitua pela sua)
const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzkR3FNn0-EeRNYRSIY4DPKO-Np11G-nuBvEBmHEkANDOrW6j1SUh9zFBxbajYG1jKvjw/exec';

async function enviarParaSheets(registro, metodo = 'POST') {
  try {
    await fetch(SHEETS_WEBAPP_URL, {
      method: metodo,
      mode: 'no-cors',        // 👈 muda para no-cors
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registro),
    });
    console.log(`📤 Enviado para Sheets (${registro.id}) - modo no-cors`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar para Sheets:', error);
    return false;
  }
}

(function () {
  'use strict';



  // ── Tab switching ──────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
      if (target === 'assinatura') window._renderAssinatura && window._renderAssinatura();
      if (target === 'historico') window._renderHistorico && window._renderHistorico();
    });
  });

  // ── Leito selection ────────────────────────────────────────
  document.querySelectorAll('.leito-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.leito-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('leito').value = btn.dataset.leito;
    });
  });

  // ── Checklist progress ─────────────────────────────────────
  const checkboxes = document.querySelectorAll('#checklistGrid input[type="checkbox"]');
  const total = checkboxes.length;

// ========== MAPEAMENTO SETOR -> QUARTOS ==========
const quartosPorSetor = {
  "5 - Prolongados": [
    "2513", "2514", "2515", "2516", "2517", "2518", "2519", "2520", "2521", "2522"
  ],
  "5 - Giro Rápido": [
    "2501", "2502", "2503", "2504", "2505", "2506", "2507", "2508", "2509", "2510", "2511"
  ],
  "5 - UTI": [
    "BOX 01", "BOX 02", "BOX 03", "BOX 04", "BOX 05", "BOX 06", "BOX 07", "BOX 08", "BOX 09", "BOX 10"
  ],
  "4 - Lado A": [
    "2412", "2413", "2414", "2415", "2416", "2417", "2418", "2419"
  ],
  "4 - Lado B": [
    "2401", "2402", "2403", "2405", "2406", "2407", "2408", "2409", "2410", "2411"
  ],
  "3": [
    "2303", "2304", "2305", "2306", "2307"
  ],
  "2": [
    "2203", "2204", "2205", "2206", "2207"
  ],
  "USR": [
    "1101", "1102", "1103", "1104", "1105"
  ],
  "USMM": [
    "1201", "1202", "1203", "1204", "1205", "1206", "1207", "1208"
  ]
};

// Função para popular o select de quartos
function popularQuartos(setor) {
  const quartoSelect = document.getElementById('quarto');
  // Limpa as opções atuais (mantém apenas a primeira placeholder)
  quartoSelect.innerHTML = '<option value="" disabled selected>Selecione o quarto</option>';

  if (!setor || !quartosPorSetor[setor]) return;

  const quartos = quartosPorSetor[setor];
  quartos.forEach(q => {
    const option = document.createElement('option');
    option.value = q;
    option.textContent = q;
    quartoSelect.appendChild(option);
  });
}

// Adicione o listener para o campo setor
const setorSelect = document.getElementById('setor');
setorSelect.addEventListener('change', (e) => {
  popularQuartos(e.target.value);
  // Opcional: resetar o campo leito quando o setor mudar
  document.querySelectorAll('.leito-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('leito').value = '';
});

// ========== REMOÇÃO DO RELÓGIO ==========
// Remova completamente as funções updateClock e o setInterval.
// Se houver chamadas a updateClock() no início, apague-as.




  function updateProgress() {
    const checked = document.querySelectorAll('#checklistGrid input:checked').length;
    const pct = (checked / total) * 100;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressLabel').textContent = checked + ' / ' + total;
  }
  checkboxes.forEach(cb => cb.addEventListener('change', updateProgress));
  updateProgress();

  // ── Limpar form ────────────────────────────────────────────
  document.getElementById('btnLimpar').addEventListener('click', resetForm);

  function resetForm() {
  document.getElementById('registroForm').reset();
  document.querySelectorAll('.leito-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('leito').value = '';
  // Limpa o select de quartos e setor
  const setor = document.getElementById('setor');
  setor.value = '';
  popularQuartos('');  // limpa as opções de quarto
  updateProgress();
}

  // ── Submit ─────────────────────────────────────────────────
  document.getElementById('registroForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const responsavel = document.getElementById('responsavel').value.trim();
    const higienista  = document.getElementById('higienista').value.trim();
    const setor       = document.getElementById('setor').value;
    const quarto      = document.getElementById('quarto').value;
    const leito       = document.getElementById('leito').value;

    if (!leito) {
      alert('Por favor, selecione o leito (A–F).');
      return;
    }

    const checked  = document.querySelectorAll('#checklistGrid input:checked').length;
    const items    = [];
    document.querySelectorAll('#checklistGrid .check-item').forEach(item => {
      items.push({
        label:   item.querySelector('span').textContent.trim(),
        checked: item.querySelector('input').checked
      });
    });

    const now = new Date();
    const record = {
      id:          'CHK-' + Date.now(),
      data:        now.toLocaleDateString('pt-BR'),
      hora:        now.toLocaleTimeString('pt-BR'),
      responsavel,
      higienista,
      setor,
      quarto,
      leito,
      checklist:   items,
      totalItems:  total,
      marcados:    checked,
      assinatura:  null
    };

    // Salva no localStorage
    const registros = JSON.parse(localStorage.getItem('higicontrol_registros') || '[]');
    registros.unshift(record);
    localStorage.setItem('higicontrol_registros', JSON.stringify(registros));

    // Envia para o Google Sheets (novo registro, sem assinatura)
    enviarParaSheets(record, 'POST');

    // Modal
    document.getElementById('modalSub').textContent =
      `Quarto ${quarto} — Leito ${leito} | ${setor} | ${checked}/${total} itens marcados`;
    document.getElementById('modalOverlay').classList.add('open');

    // Último ID para assinatura
    window._lastRegistroId = record.id;
  });

  // ── Modal actions ──────────────────────────────────────────
  document.getElementById('btnModalAssinar').addEventListener('click', () => {
    closeModal();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="assinatura"]').classList.add('active');
    document.getElementById('tab-assinatura').classList.add('active');
    window._renderAssinatura && window._renderAssinatura();
    resetForm();
  });

  document.getElementById('btnModalFechar').addEventListener('click', () => {
    closeModal();
    resetForm();
  });

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

})();