function criarCamposAP(container) {
  container.innerHTML = "";

  // ===== Campos =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  const inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-ap";
  inputData.name = "data-ap";
  inputData.required = true;
  labelData.appendChild(inputData);

  const labelSetor = document.createElement("label");
  labelSetor.textContent = "Setor da ocorrência:";
  const inputSetor = document.createElement("input");
  inputSetor.type = "text";
  inputSetor.id = "setor-ap";
  inputSetor.name = "setor-ap";
  labelSetor.appendChild(inputSetor);

  const labelTipo = document.createElement("label");
  labelTipo.textContent = "Tipo de desvio:";
  const selectTipo = document.createElement("select");
  selectTipo.id = "tipo-ap";
  selectTipo.name = "tipo-ap";
  const placeholder = document.createElement("option");
  placeholder.textContent = "";
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  selectTipo.appendChild(placeholder);
  ["Área","Equipamento/Máquina","Comportamento","Procedimentos","Ferramenta"]
    .forEach(op => {
      const o = document.createElement("option");
      o.value = op;
      o.textContent = op;
      selectTipo.appendChild(o);
    });
  labelTipo.appendChild(selectTipo);

  const divSubtipo = document.createElement("div");
  divSubtipo.id = "subtipo-container";
  selectTipo.addEventListener("change", () => {
    divSubtipo.innerHTML = "";
    const labelSubtipo = document.createElement("label");
    labelSubtipo.textContent = "Desvio:";
    const selectSubtipo = document.createElement("select");
    selectSubtipo.id = "subtipo-ap";
    selectSubtipo.name = "subtipo-ap";
    const placeholderSub = document.createElement("option");
    placeholderSub.textContent = "";
    placeholderSub.value = "";
    placeholderSub.disabled = true;
    placeholderSub.selected = true;
    selectSubtipo.appendChild(placeholderSub);

    let opcoesSub = [];
    switch (selectTipo.value) {
      case "Área":
        opcoesSub = ["Equipamento obstruído","Saída de emergência obstruída","Piso desnivelado/escorregadio","Local desorganizado/sujo","Risco de poluição ambiental","Instalação com rachadura","Instalação com infiltração","Armazenamento inadequado de resíduos"];
        break;
      case "Equipamento/Máquina":
        opcoesSub = ["Falta de proteção na máquina","Botoeira/sensor danificados","Partes móveis/cortantes desprotegidas","Estrutura sem contenção de vazamento","Equipamento/máquina sem manutenção","Checklist não preenchido","Extintores sem inspeção","Equipamento/máquina com excesso de sujeira"];
        break;
      case "Comportamento":
        opcoesSub = ["Uso indevido de celular","Comportamento inseguro","Uso incorreto de ferramentas","APR e PT preenchidos incorretamente","Não praticado direção segura","Ausência/mau uso do EPI","Postura inadequada","Crenças de Segurança não seguidas"];
        break;
      case "Procedimentos":
        opcoesSub = ["Inexistentes","Existentes e não seguidos","Não contempla todos os riscos","Não execução/inadequado de LIBRA"];
        break;
      case "Ferramenta":
        opcoesSub = ["Falha no isolamento elétrico","Ferramenta com avaria/improvisada","Ferramenta com excesso de sujeira","Transporte inadequado"];
        break;
    }

    opcoesSub.forEach(op => {
      const o = document.createElement("option");
      o.value = op;
      o.textContent = op;
      selectSubtipo.appendChild(o);
    });

    labelSubtipo.appendChild(selectSubtipo);
    divSubtipo.appendChild(labelSubtipo);
  });

  const labelCriticidade = document.createElement("label");
  labelCriticidade.textContent = "Criticidade:";
  const selectCriticidade = document.createElement("select");
  selectCriticidade.id = "criticidade-ap";
  selectCriticidade.name = "criticidade-ap";
  selectCriticidade.required = true;
  const placeholderCrit = document.createElement("option");
  placeholderCrit.textContent = "";
  placeholderCrit.value = "";
  placeholderCrit.disabled = true;
  placeholderCrit.selected = true;
  selectCriticidade.appendChild(placeholderCrit);
  ["Baixo","Moderado","Crítico"].forEach(op => {
    const o = document.createElement("option");
    o.value = op;
    o.textContent = op;
    selectCriticidade.appendChild(o);
  });
  labelCriticidade.appendChild(selectCriticidade);

  const labelAcao = document.createElement("label");
  labelAcao.textContent = "Ação imediata tomada:";
  const selectAcao = document.createElement("select");
  selectAcao.id = "acao-ap";
  selectAcao.name = "acao-ap";
  selectAcao.required = true;
  const placeholderAcao = document.createElement("option");
  placeholderAcao.textContent = "";
  placeholderAcao.value = "";
  placeholderAcao.disabled = true;
  placeholderAcao.selected = true;
  selectAcao.appendChild(placeholderAcao);
  ["Paralisação da atividade","Notificação do superior imediato ou cipeiro/representante","Orientação da equipe ou colega de trabalho","Acionamento da brigada de emergência","Evacuação da área","Adoção de medidas de contenção","Sinalização e/ou isolamento da área"]
    .forEach(op => {
      const o = document.createElement("option");
      o.value = op;
      o.textContent = op;
      selectAcao.appendChild(o);
    });
  labelAcao.appendChild(selectAcao);

  const labelRecebido = document.createElement("label");
  labelRecebido.textContent = "Recebido por:";
  const inputRecebido = document.createElement("input");
  inputRecebido.type = "text";
  inputRecebido.id = "recebido-ap";
  inputRecebido.name = "recebido-ap";
  labelRecebido.appendChild(inputRecebido);

  const labelTratado = document.createElement("label");
  labelTratado.textContent = "Desvio identificado foi tratado?";
  const selectTratado = document.createElement("select");
  selectTratado.id = "tratado-ap";
  selectTratado.name = "tratado-ap";
  selectTratado.required = true;
  const placeholderTratado = document.createElement("option");
  placeholderTratado.textContent = "";
  placeholderTratado.value = "";
  placeholderTratado.disabled = true;
  placeholderTratado.selected = true;
  selectTratado.appendChild(placeholderTratado);
  ["Sim","Não"].forEach(op => {
    const o = document.createElement("option");
    o.value = op;
    o.textContent = op;
    selectTratado.appendChild(o);
  });
  labelTratado.appendChild(selectTratado);

  container.append(labelData,labelSetor,labelTipo,divSubtipo,labelCriticidade,labelAcao,labelRecebido,labelTratado);

  const botaoEnviar = document.createElement("button");
  botaoEnviar.textContent = "Enviar";
  botaoEnviar.id = "enviar-ap";
  botaoEnviar.disabled = true;
  botaoEnviar.style.opacity = "0.6";
  botaoEnviar.style.cursor = "not-allowed";
  container.appendChild(botaoEnviar);

  // ===== Validação =====
  function validarCampos() {
    const campos = container.querySelectorAll("input, select");
    const todosPreenchidos = Array.from(campos).every(c => c.value.trim()!=="");
    botaoEnviar.disabled = !todosPreenchidos;
    botaoEnviar.style.opacity = todosPreenchidos ? "1" : "0.6";
    botaoEnviar.style.cursor = todosPreenchidos ? "pointer" : "not-allowed";
  }
  const campos = container.querySelectorAll("input, select");
  campos.forEach(c => { c.addEventListener("input", validarCampos); c.addEventListener("change", validarCampos); });

  // ===== Coletar dados =====
  function coletarDadosFormulario() {
    return {
      data: inputData.value,
      horario: new Date().toLocaleTimeString(),
      local_ocorrencia: inputSetor.value,
      tipo_desvio: selectTipo.value,
      desvio: container.querySelector("#subtipo-ap")?.value || "",
      criticidade: selectCriticidade.value,
      acao_imediata: selectAcao.value,
      emitido_por: document.getElementById("responsavel")?.value || "",
      recebido_por: inputRecebido.value,
      desvio_tratado: selectTratado.value
    };
  }

  // ===== Envio =====
  botaoEnviar.addEventListener("click", async () => {
    const dadosRecebimento = coletarDadosFormulario();

    const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycby5h7rUu-ohrqMWeZbw6kWxtO4wVU51MlMHftA2VmCsdGRdy5YamligI4CFaZiikVqYqQ/exec';

    async function enviarParaPlanilha(dados) {
      try {
        await fetch(URL_APPS_SCRIPT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });
        return true;
      } catch (erro) {
        console.error("❌ Erro:", erro);
        return false;
      }
    }

    const enviadoComSucesso = await enviarParaPlanilha(dadosRecebimento);

    if (enviadoComSucesso) {
    // Cria o container da mensagem
    const mensagem = document.createElement("div");
    mensagem.textContent = "Salvo!";
    mensagem.style.color = "#4CAF50";
    mensagem.style.textAlign = "center"; // centraliza horizontalmente
    mensagem.style.marginTop = "10px";   // distância do botão
    // Insere logo após o botão
    botaoEnviar.parentNode.insertBefore(mensagem, botaoEnviar.nextSibling);

    // Limpa os inputs
    container.querySelectorAll("input, select").forEach(campo => campo.value = "");

    // Reset do botão
    botaoEnviar.disabled = true;
    botaoEnviar.style.opacity = "0.6";
    botaoEnviar.style.cursor = "not-allowed";

    // Remove a mensagem após 2 segundos
    setTimeout(() => mensagem.remove(), 2000);
    }
  });
}
