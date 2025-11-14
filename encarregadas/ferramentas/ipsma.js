// ================================================================
// IPSMA.JS – VERSÃO 100% INDEPENDENTE E FUNCIONAL
// ================================================================

// === MAPEAMENTO DE RESPONSÁVEIS (RE + FUNÇÃO) ===
const MAPA_RESPONSAVEIS = {
  "Graciela":   { re: "037120", funcao: "Encarregada" },
  "Giovana":    { re: "054651", funcao: "Encarregada" },
  "Jéssica":    { re: "049971", funcao: "Líder" },
  "Jacqueline": { re: "123456", funcao: "Líder" },
  "Daiane":     { re: "062074", funcao: "Encarregada" },
  "Ádrisson":   { re: "056367", funcao: "Planejador" }
};

// Função para obter RE e Função
function getDadosResponsavel(nome) {
  return MAPA_RESPONSAVEIS[nome] || { re: "", funcao: "" };
}

// ================================================================

function criarCamposIPSMA(container) {
  container.innerHTML = "";

  // ===== [1] DECLARAÇÃO DAS VARIÁVEIS NO ESCOPO DA FUNÇÃO =====
  let inputData, inputHoraInicio, inputHoraFim, inputLocal, inputElementos;
  let selectClassificacao, selectConforme, selectChecklist, inputAcoes;

  // ===== 1. Data =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-ipsma";
  inputData.name = "data-ipsma";
  inputData.required = true;
  labelData.appendChild(inputData);

  // ===== 2. Hora de início =====
  const labelHoraInicio = document.createElement("label");
  labelHoraInicio.textContent = "Hora de início:";
  inputHoraInicio = document.createElement("input");
  inputHoraInicio.type = "time";
  inputHoraInicio.id = "hora-inicio-ipsma";
  inputHoraInicio.name = "hora-inicio-ipsma";
  inputHoraInicio.required = true;
  labelHoraInicio.appendChild(inputHoraInicio);

  // ===== 3. Hora de término =====
  const labelHoraFim = document.createElement("label");
  labelHoraFim.textContent = "Hora de término:";
  inputHoraFim = document.createElement("input");
  inputHoraFim.type = "time";
  inputHoraFim.id = "hora-fim-ipsma";
  inputHoraFim.name = "hora-fim-ipsma";
  inputHoraFim.required = true;
  labelHoraFim.appendChild(inputHoraFim);

  // ===== 4. Local =====
  const labelLocal = document.createElement("label");
  labelLocal.textContent = "Área, máquina, equipamento ou ferramenta:";
  inputLocal = document.createElement("input");
  inputLocal.type = "text";
  inputLocal.id = "local-ipsma";
  inputLocal.name = "local-ipsma";
  inputLocal.placeholder = "Ex: A300, Bandeirante";
  inputLocal.required = true;
  labelLocal.appendChild(inputLocal);

  // ===== 5. Elementos verificados =====
  const labelElementos = document.createElement("label");
  labelElementos.textContent = "Elementos verificados:";
  inputElementos = document.createElement("input");
  inputElementos.type = "text";
  inputElementos.id = "elementos-ipsma";
  inputElementos.name = "elementos-ipsma";
  inputElementos.placeholder = "Ex: Proteção, sinalização, limpeza";
  inputElementos.required = true;
  labelElementos.appendChild(inputElementos);

  // ===== 6. Classificação do desvio =====
  const labelClassificacao = document.createElement("label");
  labelClassificacao.textContent = "Classificação do desvio:";
  selectClassificacao = document.createElement("select");
  selectClassificacao.id = "classificacao-ipsma";
  selectClassificacao.name = "classificacao-ipsma";
  selectClassificacao.required = true;
  const placeholderClass = document.createElement("option");
  placeholderClass.textContent = ""; placeholderClass.value = ""; placeholderClass.disabled = true; placeholderClass.selected = true;
  selectClassificacao.appendChild(placeholderClass);
  ["Crítico", "Moderado", "Despresível"].forEach(op => {
    const o = document.createElement("option"); o.value = op; o.textContent = op; selectClassificacao.appendChild(o);
  });
  labelClassificacao.appendChild(selectClassificacao);

  // ===== 7. Conforme =====
  const labelConforme = document.createElement("label");
  labelConforme.textContent = "Conforme:";
  selectConforme = document.createElement("select");
  selectConforme.id = "conforme-ipsma";
  selectConforme.name = "conforme-ipsma";
  selectConforme.required = true;
  const placeholderConf = document.createElement("option");
  placeholderConf.textContent = ""; placeholderConf.value = ""; placeholderConf.disabled = true; placeholderConf.selected = true;
  selectConforme.appendChild(placeholderConf);
  ["Item conforme", "Não conforme", "Não aplicável"].forEach(op => {
    const o = document.createElement("option"); o.value = op; o.textContent = op; selectConforme.appendChild(o);
  });
  labelConforme.appendChild(selectConforme);

  // ===== 8. Checklist =====
  const labelChecklist = document.createElement("label");
  labelChecklist.textContent = "Checklist de inspeção rotineira:";
  selectChecklist = document.createElement("select");
  selectChecklist.id = "checklist-ipsma";
  selectChecklist.name = "checklist-ipsma";
  selectChecklist.required = true;
  const placeholderCheck = document.createElement("option");
  placeholderCheck.textContent = ""; placeholderCheck.value = ""; placeholderCheck.disabled = true; placeholderCheck.selected = true;
  selectChecklist.appendChild(placeholderCheck);
  ["Adequado", "Inadequado", "Inexistente"].forEach(op => {
    const o = document.createElement("option"); o.value = op; o.textContent = op; selectChecklist.appendChild(o);
  });
  labelChecklist.appendChild(selectChecklist);

  // ===== 9. Ações corretivas =====
  const labelAcoes = document.createElement("label");
  labelAcoes.textContent = "Ações corretivas:";
  inputAcoes = document.createElement("input");
  inputAcoes.type = "text";
  inputAcoes.id = "acoes-ipsma";
  inputAcoes.name = "acoes-ipsma";
  inputAcoes.placeholder = "Ex: Limpar área, sinalizar risco";
  labelAcoes.appendChild(inputAcoes);

  // ===== Adiciona ao container =====
  container.append(
    labelData, labelHoraInicio, labelHoraFim,
    labelLocal, labelElementos,
    labelClassificacao, labelConforme, labelChecklist,
    labelAcoes
  );

  // ===== Botão Enviar =====
  const botaoEnviar = document.createElement("button");
  botaoEnviar.textContent = "Enviar";
  botaoEnviar.id = "enviar-ipsma";
  botaoEnviar.disabled = true;
  botaoEnviar.style.opacity = "0.6";
  botaoEnviar.style.cursor = "not-allowed";
  container.appendChild(botaoEnviar);

  // ===== Validação =====
  function validarCampos() {
    const campos = container.querySelectorAll("input, select");
    const todosPreenchidos = Array.from(campos).every(c => c.value.trim() !== "");
    const selectResponsavel = document.getElementById("responsavel");
    const responsavelValido = selectResponsavel && selectResponsavel.value && selectResponsavel.value !== "Todos";

    const podeEnviar = todosPreenchidos && responsavelValido;
    botaoEnviar.disabled = !podeEnviar;
    botaoEnviar.style.opacity = podeEnviar ? "1" : "0.6";
    botaoEnviar.style.cursor = podeEnviar ? "pointer" : "not-allowed";
  }

  container.querySelectorAll("input, select").forEach(c => {
    c.addEventListener("input", validarCampos);
    c.addEventListener("change", validarCampos);
  });
  document.getElementById("responsavel")?.addEventListener("change", validarCampos);

  // ===== COLETAR DADOS =====
  function coletarDadosFormulario() {
    const inspetor = document.getElementById("responsavel")?.value || "";
    const { re = "", funcao = "" } = getDadosResponsavel(inspetor);

    return {
      data: inputData.value,
      hora_inicio: inputHoraInicio.value,
      hora_termino: inputHoraFim.value,
      local_inspecionado: inputLocal.value,
      inspetor: inspetor,
      re: re,
      funcao: funcao,
      elementos_verificados: inputElementos.value,
      classificacao_desvio: selectClassificacao.value,
      conforme: selectConforme.value,
      checklist_rotineiro: selectChecklist.value,
      acoes_corretivas: inputAcoes.value,
      responsavel: inspetor
    };
  }

  // ===== ENVIO =====
  botaoEnviar.addEventListener("click", async () => {
    const dados = coletarDadosFormulario();
    const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbypJaPZVEuUHub4v3J-sXBYQzdMimdGR2XOLW1lyMMUbCd8Gb8P7ccYuX20ZVGMMb8zxw/exec'; // ← SUBSTITUA

    try {
      await fetch(URL_APPS_SCRIPT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      // Feedback visual
      const msg = document.createElement("div");
      msg.textContent = "Salvo!";
      msg.style.color = "#4CAF50";
      msg.style.textAlign = "center";
      msg.style.marginTop = "10px";
      msg.style.fontWeight = "bold";
      botaoEnviar.parentNode.insertBefore(msg, botaoEnviar.nextSibling);

      // Limpa formulário
      container.querySelectorAll("input, select").forEach(c => c.value = "");
      botaoEnviar.disabled = true;
      botaoEnviar.style.opacity = "0.6";
      botaoEnviar.style.cursor = "not-allowed";

      setTimeout(() => msg.remove(), 2000);
    } catch (err) {
      alert("Erro ao enviar. Verifique a conexão.");
    }
  });
}