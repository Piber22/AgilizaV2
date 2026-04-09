/* ============================================================
   api.js — Comunicação com Google Sheets
   - Busca dados via Web App GET (sempre fresquinho, sem cache)
   - Fallback para CSV público se Web App falhar
   - Atualiza planilha via Web App POST (no-cors)
   ============================================================ */

// ── Dados globais ─────────────────────────────────────────────
let allActivities = [];

// ── Utilitários de data ───────────────────────────────────────

function getDataAtual() {
  const hoje = new Date();
  const d = String(hoje.getDate()).padStart(2, '0');
  const m = String(hoje.getMonth() + 1).padStart(2, '0');
  const y = hoje.getFullYear();
  return `${d}/${m}/${y}`;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getHorarioAtual() {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function parseActivityDate(str) {
  if (!str) return null;
  const s = str.trim();
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    if (d && m && y) return new Date(Number(y), Number(m) - 1, Number(d));
  }
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    if (y && m && d) return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return null;
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear()
      && d.getMonth()    === t.getMonth()
      && d.getDate()     === t.getDate();
}

function formatDateDisplay(d) {
  const weekday = WEEKDAYS[d.getDay()];
  const day     = d.getDate();
  const month   = MONTHS[d.getMonth()];
  const year    = d.getFullYear();
  return {
    weekday: isToday(d) ? 'Hoje' : weekday,
    full: `${day} de ${month}, ${year}`
  };
}

function formatDatetime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ── CSV Parser (usado como fallback) ─────────────────────────

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (c === ',' && !inQ) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
    if (values.length < 2) continue;
    const row = { rowIndex: i + 1 };
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    data.push(row);
  }
  return data;
}

// ── Fetch dados ───────────────────────────────────────────────
// Fonte primária: Web App GET — retorna JSON direto da planilha,
// sem o cache de ~1-5 min que o CSV público tem.
// Fonte secundária: CSV público (fallback se Web App falhar).

async function fetchActivities() {
  showLoader(true);

  try {
    const res = await fetch(CONFIG.webAppUrl + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.erro) throw new Error(json.erro);
    allActivities = json.dados || [];
    console.log('Web App GET: ' + allActivities.length + ' registros carregados');

  } catch (err) {
    console.warn('Web App GET falhou, usando CSV de fallback:', err.message);
    try {
      const res2 = await fetch(CONFIG.csvUrl + '&t=' + Date.now());
      if (!res2.ok) throw new Error('HTTP ' + res2.status);
      const text = await res2.text();
      allActivities = parseCSV(text);
      console.log('CSV fallback: ' + allActivities.length + ' registros');
    } catch (err2) {
      console.error('Fallback CSV também falhou:', err2);
      allActivities = [];
    }
  }

  showLoader(false);
  renderList();
}

// ── Helpers de atividade ──────────────────────────────────────

function getActivitiesForDate(d) {
  const key = dateKey(d);
  return allActivities.filter(a => {
    const ad = parseActivityDate(a['DATA']);
    return ad && dateKey(ad) === key;
  });
}

function getSituacao(row) {
  const v = row['Situacao'] || row['Situação'] || row['SituaÃ§Ã£o'] || '';
  return v.trim().toLowerCase();
}

function isCompleted(activity) {
  if (getCompletion(activity.rowIndex)) return true;
  return getSituacao(activity) === 'feito';
}

// Retorna dados de execução da planilha para exibição quando não há localStorage local
function getSheetExecutionData(activity) {
  let horario   = activity['Horario']   || activity['Horário']   || '';
  const assinante = activity['Assinante'] || '';
  const coren     = activity['Coren']     || activity['COREN']     || '';
  const execucao  = activity['Execução']  || activity['ExecuÃ§Ã£o'] || activity['Execucao'] || '';

  // Limpar horário inválido: Sheets às vezes converte "HH:MM" para serial de data (30/12/1899)
  if (horario.includes('1899') || horario.includes('1900')) horario = '';

  return { horario, assinante, coren, execucao };
}

// ── Atualização via Web App POST ──────────────────────────────

async function atualizarViaWebApp(rowIndex, checked, signerName, signerCoren) {
  if (!CONFIG.webAppUrl) throw new Error('Web App URL não configurada');

  const situacao     = checked ? 'Feito' : '';
  const dataExecucao = checked ? getDataAtual() : '';
  const horario      = checked ? getHorarioAtual() : '';
  const assinante    = signerName  || '';
  const coren        = signerCoren || '';

  const payload = { row: rowIndex, situacao, execucao: dataExecucao, horario, assinante, coren };
  console.log('📤 Enviando para Web App:', JSON.stringify(payload));

  await fetch(CONFIG.webAppUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
}

// ── Compressão de imagens ─────────────────────────────────────
// Redimensiona e comprime um base64 antes de enviar ao Drive.
// Fotos:     máx 1200px no lado maior, qualidade 0.75 (JPEG)
// Assinatura: mantém tamanho original, qualidade 0.90 (PNG)

function comprimirImagem(base64, tipo) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas  = document.createElement('canvas');
      const ctx     = canvas.getContext('2d');

      if (tipo === 'assinatura') {
        // Assinatura: sem redimensionamento, só exporta como PNG otimizado
        canvas.width  = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png', 0.90));
        return;
      }

      // Fotos: redimensionar para no máximo 1200px no lado maior
      const MAX = 1200;
      let w = img.width;
      let h = img.height;

      if (w > MAX || h > MAX) {
        if (w >= h) { h = Math.round((h / w) * MAX); w = MAX; }
        else        { w = Math.round((w / h) * MAX); h = MAX; }
      }

      canvas.width  = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };

    img.onerror = () => {
      // Se falhar, devolve o base64 original sem compressão
      console.warn('Falha ao comprimir imagem, usando original');
      resolve(base64);
    };

    img.src = base64;
  });
}

// Comprime um array de base64 em paralelo
async function comprimirArquivos(arquivos, tipo) {
  return Promise.all(arquivos.map(b64 => comprimirImagem(b64, tipo)));
}

// ── Envio de evidências ao Drive ──────────────────────────────

async function enviarEvidencias(activity, tipo, arquivos) {
  if (!CONFIG.evidenciasUrl) throw new Error('URL de evidências não configurada');

  // Comprimir antes de enviar
  const arquivosComprimidos = await comprimirArquivos(arquivos, tipo);

  const payload = {
    row:      activity.rowIndex,
    id:       activity['ID'] || String(activity.rowIndex),
    terminal: activity['Terminal'] || activity['TERMINAL'] || 'Atividade',
    data:     getDataAtual(),
    horario:  getHorarioAtual(),
    tipo,
    arquivos: arquivosComprimidos,
  };

  console.log('📤 Enviando evidências ao Drive:', tipo, arquivosComprimidos.length + ' arquivo(s)');
  console.log('📦 Payload evidências:', JSON.stringify({ row: payload.row, id: payload.id, tipo: payload.tipo, arquivos: payload.arquivos.length }));

  await fetch(CONFIG.evidenciasUrl, {
    method: 'POST',
    mode:   'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(payload),
  });

  // Aguarda o Apps Script processar (salvar no Drive + gravar na planilha)
  await new Promise(resolve => setTimeout(resolve, 3000));
}