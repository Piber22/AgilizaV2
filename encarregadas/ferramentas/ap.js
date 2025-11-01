function criarCamposAP(container) {
  // Limpa conteúdo anterior
  container.innerHTML = "";

  // ===== Criar todos os campos =====
  const inputData = document.createElement("input");
  inputData.type = "date"; inputData.id = "data-ap"; inputData.required = true;

  const inputSetor = document.createElement("input");
  inputSetor.type = "text"; inputSetor.id = "setor-ap";

  const selectTipo = document.createElement("select");
  selectTipo.id = "tipo-ap";
  const placeholder = document.createElement("option");
  placeholder.textContent = ""; placeholder.value = ""; placeholder.disabled = true; placeholder.selected = true;
  selectTipo.appendChild(placeholder);
  ["Área","Equipamento/Máquina","Comportamento","Procedimentos","Ferramenta"].forEach(op => {
    const option = document.createElement("option"); option.value = op; option.textContent = op;
    selectTipo.appendChild(option);
  });

  const divSubtipo = document.createElement("div"); divSubtipo.id = "subtipo-container";
  selectTipo.addEventListener("change", () => {
    divSubtipo.innerHTML = "";
    const selectSubtipo = document.createElement("select"); selectSubtipo.id = "subtipo-ap";
    const placeholderSub = document.createElement("option"); placeholderSub.textContent = ""; placeholderSub.value = ""; placeholderSub.disabled = true; placeholderSub.selected = true;
    selectSubtipo.appendChild(placeholderSub);

    let opcoesSub = [];
    switch(selectTipo.value){
      case "Área": opcoesSub = ["Equipamento obstruído","Saída de emergência obstruída","Piso desnivelado/escorregadio","Local desorganizado/sujo","Risco de poluição ambiental","Instalação com rachadura","Instalação com infiltração","Armazenamento inadequado de resíduos"]; break;
      case "Equipamento/Máquina": opcoesSub = ["Falta de proteção na máquina","Botoeira/sensor danificados","Partes móveis/cortantes desprotegidas","Estrutura sem contenção de vazamento","Equipamento/máquina sem manutenção","Checklist não preenchido","Extintores sem inspeção","Equipamento/máquina com excesso de sujeira"]; break;
      case "Comportamento": opcoesSub = ["Uso indevido de celular","Comportamento inseguro","Uso incorreto de ferramentas","APR e PT preenchidos incorretamente","Não praticado direção segura","Ausência/mau uso do EPI","Postura inadequada","Crenças de Segurança não seguidas"]; break;
      case "Procedimentos": opcoesSub = ["Inexistentes","Existentes e não seguidos","Não contempla todos os riscos","Não execução/inadequado de LIBRA"]; break;
      case "Ferramenta": opcoesSub = ["Falha no isolamento elétrico","Ferramenta com avaria/improvisada","Ferramenta com excesso de sujeira","Transporte inadequado"]; break;
    }
    opcoesSub.forEach(op => { const option = document.createElement("option"); option.value = op; option.textContent = op; selectSubtipo.appendChild(option); });
    divSubtipo.appendChild(selectSubtipo);
  });

  const selectCriticidade = document.createElement("select"); selectCriticidade.id = "criticidade-ap"; selectCriticidade.required = true;
  const placeholderCrit = document.createElement("option"); placeholderCrit.textContent = ""; placeholderCrit.value = ""; placeholderCrit.disabled = true; placeholderCrit.selected = true;
  selectCriticidade.appendChild(placeholderCrit);
  ["Baixo","Moderado","Crítico"].forEach(op => { const option = document.createElement("option"); option.value = op; option.textContent = op; selectCriticidade.appendChild(option); });

  const selectAcao = document.createElement("select"); selectAcao.id = "acao-ap"; selectAcao.required = true;
  const placeholderAcao = document.createElement("option"); placeholderAcao.textContent = ""; placeholderAcao.value = ""; placeholderAcao.disabled = true; placeholderAcao.selected = true; selectAcao.appendChild(placeholderAcao);
  ["Paralisação da atividade","Notificação do superior imediato ou cipeiro/representante","Orientação da equipe ou colega de trabalho","Acionamento da brigada de emergência","Evacuação da área","Adoção de medidas de contenção","Sinalização e/ou isolamento da área"].forEach(op => { const option = document.createElement("option"); option.value = op; option.textContent = op; selectAcao.appendChild(option); });

  const inputRecebido = document.createElement("input"); inputRecebido.type = "text"; inputRecebido.id = "recebido-ap";

  const selectTratado = document.createElement("select"); selectTratado.id = "tratado-ap"; selectTratado.required = true;
  const placeholderTratado = document.createElement("option"); placeholderTratado.textContent = ""; placeholderTratado.value = ""; placeholderTratado.disabled = true; placeholderTratado.selected = true; selectTratado.appendChild(placeholderTratado);
  ["Sim","Não"].forEach(op => { const option = document.createElement("option"); option.value = op; option.textContent = op; selectTratado.appendChild(option); });

  container.append(inputData, inputSetor, selectTipo, divSubtipo, selectCriticidade, selectAcao, inputRecebido, selectTratado);

  // ===== Botão Enviar =====
  const botaoEnviar = document.createElement("button"); botaoEnviar.textContent = "Enviar"; botaoEnviar.id = "enviar-ap"; botaoEnviar.disabled = true; botaoEnviar.style.opacity = "0.6"; botaoEnviar.style.cursor = "not-allowed";
  container.appendChild(botaoEnviar);

  // ===== Função de validação =====
  function validarCampos() {
    const campos = container.querySelectorAll("input, select");
    const todosPreenchidos = Array.from(campos).every(c => c.value.trim() !== "");
    botaoEnviar.disabled = !todosPreenchidos;
    botaoEnviar.style.opacity = todosPreenchidos ? "1" : "0.6";
    botaoEnviar.style.cursor = todosPreenchidos ? "pointer" : "not-allowed";
  }
  container.querySelectorAll("input, select").forEach(c => { c.addEventListener("input", validarCampos); c.addEventListener("change", validarCampos); });

  // ===== Função para coletar dados do formulário =====
  function coletarDadosFormulario() {
    return {
      data: inputData.value,
      horario: new Date().toLocaleTimeString(),
      local_ocorrencia: inputSetor.value,
      tipo_desvio: selectTipo.value,
      desvio: divSubtipo.querySelector("#subtipo-ap")?.value || "",
      criticidade: selectCriticidade.value,
      acao_imediata: selectAcao.value,
      emitido_por: document.getElementById("responsavel")?.value || "",
      recebido_por: inputRecebido.value,
      desvio_tratado: selectTratado.value
    };
  }

  // ===== Evento click do botão =====
  botaoEnviar.addEventListener("click", async () => {
    const dadosRecebimento = coletarDadosFormulario();
    console.log("✅ Dados coletados:", dadosRecebimento);

    // Enviar para planilha
    const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycby5h7rUu-ohrqMWeZbw6kWxtO4wVU51MlMHftA2VmCsdGRdy5YamligI4CFaZiikVqYqQ/exec';
    try {
      await fetch(URL_APPS_SCRIPT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosRecebimento)
      });
      console.log("✅ Dados enviados para o Apps Script!");
    } catch (erro) {
      console.error("❌ Erro ao enviar:", erro);
    }
  });
}
