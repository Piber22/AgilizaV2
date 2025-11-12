function criarCamposIPSMA(container) {
  container.innerHTML = "";

  // ===== 1. Data =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  const inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-ipsma";
  inputData.name = "data-ipsma";
  inputData.required = true;
  labelData.appendChild(inputData);

  // ===== 2. Horário de Início =====
  const labelHoraInicio = document.createElement("label");
  labelHoraInicio.textContent = "Horário de Início:";
  const inputHoraInicio = document.createElement("input");
  inputHoraInicio.type = "time";
  inputHoraInicio.id = "hora-inicio-ipsma";
  inputHoraInicio.name = "hora-inicio-ipsma";
  inputHoraInicio.required = true;
  labelHoraInicio.appendChild(inputHoraInicio);

  // ===== 3. Horário de Término =====
  const labelHoraFim = document.createElement("label");
  labelHoraFim.textContent = "Horário de Término:";
  const inputHoraFim = document.createElement("input");
  inputHoraFim.type = "time";
  inputHoraFim.id = "hora-fim-ipsma";
  inputHoraFim.name = "hora-fim-ipsma";
  inputHoraFim.required = true;
  labelHoraFim.appendChild(inputHoraFim);

  // ===== 4. Área, Máquina, Equipamento ou Ferramenta =====
  const labelLocal = document.createElement("label");
  labelLocal.textContent = "Área, máquina, equipamento ou ferramenta:";
  const inputLocal = document.createElement("input");
  inputLocal.type = "text";
  inputLocal.id = "local-ipsma";
  inputLocal.name = "local-ipsma";
  inputLocal.placeholder = "Ex: Prensa Hidráulica 01";
  inputLocal.required = true;
  labelLocal.appendChild(inputLocal);

  // ===== 5. Elementos Verificados =====
  const labelElementos = document.createElement("label");
  labelElementos.textContent = "Elementos verificados:";
  const inputElementos = document.createElement("input");
  inputElementos.type = "text";
  inputElementos.id = "elementos-ipsma";
  inputElementos.name = "elementos-ipsma";
  inputElementos.placeholder = "Ex: Proteção, sinalização, limpeza";
  inputElementos.required = true;
  labelElementos.appendChild(inputElementos);

  // ===== 6. Classificação do Desvio =====
  const labelClassificacao = document.createElement("label");
  labelClassificacao.textContent = "Classificação do desvio:";
  const selectClassificacao = document.createElement("select");
  selectClassificacao.id = "classificacao-ipsma";
  selectClassificacao.name = "classificacao-ipsma";
  selectClassificacao.required = true;
  const placeholderClass = document.createElement("option");
  placeholderClass.textContent = "";
  placeholderClass.value = "";
  placeholderClass.disabled = true;
  placeholderClass.selected = true;
  selectClassificacao.appendChild(placeholderClass);
  ["Crítico", "Moderado", "Despresível"].forEach(op => {
    const o = document.createElement("option");
    o.value = op;
    o.textContent = op;
    selectClassificacao.appendChild(o);
  });
  labelClassificacao.appendChild(selectClassificacao);

  // ===== 7. Conforme =====
  const labelConforme = document.createElement("label");
  labelConforme.textContent = "Conforme:";
  const selectConforme = document.createElement("select");
  selectConforme.id = "conforme-ipsma";
  selectConforme.name = "conforme-ipsma";
  selectConforme.required = true;
  const placeholderConf = document.createElement("option");
  placeholderConf.textContent = "";
  placeholderConf.value = "";
  placeholderConf.disabled = true;
  placeholderConf.selected = true;
  selectConforme.appendChild(placeholderConf);
  ["Item conforme", "Não conforme", "Não aplicável"].forEach(op => {
    const o = document.createElement("option");
    o.value = op;
    o.textContent = op;
    selectConforme.appendChild(o);
  });
  labelConforme.appendChild(selectConforme);

  // ===== 8. Checklist de Inspeção Rotineira =====
  const labelChecklist = document.createElement("label");
  labelChecklist.textContent = "Checklist de inspeção rotineira:";
  const selectChecklist = document.createElement("select");
  selectChecklist.id = "checklist-ipsma";
  selectChecklist.name = "checklist-ipsma";
  selectChecklist.required = true;
  const placeholderCheck = document.createElement("option");
  placeholderCheck.textContent = "";
  placeholderCheck.value = "";
  placeholderCheck.disabled = true;
  placeholderCheck.selected = true;
  selectChecklist.appendChild(placeholderCheck);
  ["Adequado", "Inadequado", "Inexistente"].forEach(op => {
    const o = document.createElement("option");
    o.value = op;
    o.textContent = op;
    selectChecklist.appendChild(o);
  });
  labelChecklist.appendChild(selectChecklist);

  // ===== 9. Ações Corretivas (sempre visível) =====
  const labelAcoes = document.createElement("label");
  labelAcoes.textContent = "Ações corretivas:";
  const inputAcoes = document.createElement("input");
  inputAcoes.type = "text";
  inputAcoes.id = "acoes-ipsma";
  inputAcoes.name = "acoes-ipsma";
  inputAcoes.placeholder = "Ex: Limpar área, sinalizar risco";
  labelAcoes.appendChild(inputAcoes);

  // Adiciona todos os campos ao container
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

  // ===== Validação em Tempo Real =====
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

  // Adiciona listeners em todos os campos
  container.querySelectorAll("input, select").forEach(campo => {
    campo.addEventListener("input", validarCampos);
    campo.addEventListener("change", validarCampos);
  });

  // Listener no select global de responsável
  const selectResponsavel = document.getElementById("responsavel");
  if (selectResponsavel) {
    selectResponsavel.addEventListener("change", validarCampos);
  }

  // ===== Coletar Dados =====
  function coletarDadosFormulario() {
    return {
      data: inputData.value,
      horario_inicio: inputHoraInicio.value,
      horario_termino: inputHoraFim.value,
      local_inspecionado: inputLocal.value,
      elementos_verificados: inputElementos.value,
      classificacao_desvio: selectClassificacao.value,
      conforme: selectConforme.value,
      checklist_rotineiro: selectChecklist.value,
      acoes_corretivas: inputAcoes.value,
      emitido_por: document.getElementById("responsavel")?.value || ""
    };
  }

  // ===== Envio para Google Sheets =====
  botaoEnviar.addEventListener("click", async () => {
    const dados = coletarDadosFormulario();
    const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbypJaPZVEuUHub4v3J-sXBYQzdMimdGR2XOLW1lyMMUbCd8Gb8P7ccYuX20ZVGMMb8zxw/exec';

    const sucesso = await fetch(URL_APPS_SCRIPT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(() => true).catch(() => false);

    if (sucesso) {
      const msg = document.createElement("div");
      msg.textContent = "Salvo!";
      msg.style.color = "#4CAF50";
      msg.style.textAlign = "center";
      msg.style.marginTop = "10px";
      botaoEnviar.parentNode.insertBefore(msg, botaoEnviar.nextSibling);

      // Limpa todos os campos
      container.querySelectorAll("input, select").forEach(c => c.value = "");
      botaoEnviar.disabled = true;
      botaoEnviar.style.opacity = "0.6";
      botaoEnviar.style.cursor = "not-allowed";

      setTimeout(() => msg.remove(), 2000);
    }
    const MAPA_RESPONSAVEIS = {
  "Graciela":   { re: "037120", funcao: "Encarregada" },
  "Giovana":    { re: "054651", funcao: "Encarregada" },
  "Jéssica":    { re: "049971", funcao: "Líder" },
  "Jacqueline": { re: "123456", funcao: "Líder" },
  "Daiane":     { re: "062074", funcao: "Encarregada" },
  "Ádrisson":   { re: "056367", funcao: "Planejador" }
};

function getDadosResponsavel(nome) {
  return MAPA_RESPONSAVEIS[nome] || { re: "", funcao: "" };
}
  });
}