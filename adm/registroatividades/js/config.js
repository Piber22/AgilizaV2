const CONFIG = {
  // URL pública do CSV (aba principal)
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=876524337&single=true&output=csv',

  // URL do Google Apps Script Web App para atualizar a planilha
  webAppUrl: 'https://script.google.com/macros/s/AKfycbzU4yan3MMnTxUw3DCyjaX6o0u4FJvAjcEc9XXianDUz17NsTQP3fqrn4ZEg21d_QAXGQ/exec',

  // URL do Apps Script dedicado para salvar evidências no Drive
  evidenciasUrl: 'https://script.google.com/macros/s/AKfycbxD2L28njGa3ka8mJPfY8Enf5EZ3HVs-cQjjz2GEXIC0bWqkorOJcZE1E9IoaoQswg1/exec',

  // Intervalo de atualização automática (ms)
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutos
};

const WEEKDAYS  = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const MONTHS    = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];