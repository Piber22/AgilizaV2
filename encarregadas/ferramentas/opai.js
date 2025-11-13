function criarCamposOPAI(container) {
  container.innerHTML = "";

  // ===== Campos Base =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  const inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-opai";
  inputData.required = true;
  labelData.appendChild(inputData);

  const labelEquipe = document.createElement("label");
  labelEquipe.textContent = "Equipe observada:";
  const selectEquipe = document.createElement("select");
  selectEquipe.id = "equipe-opai";
  selectEquipe.required = true;
  const placeholderEquipe = document.createElement("option");
  placeholderEquipe.textContent = "";
  placeholderEquipe.value = "";
  placeholderEquipe.disabled = true;
  placeholderEquipe.selected = true;
  selectEquipe.appendChild(placeholderEquipe);
  ["Graciela", "Giovana", "Jéssica", "Jacqueline"].forEach(nome => {
    const opcao = document.createElement("option");
    opcao.value = nome;
    opcao.textContent = nome;
    selectEquipe.appendChild(opcao);
  });
  labelEquipe.appendChild(selectEquipe);

  const labelPessoas = document.createElement("label");
  labelPessoas.textContent = "Nº de pessoas:";
  const selectPessoas = document.createElement("select");
  selectPessoas.id = "pessoas-opai";
  selectPessoas.required = true;
  const placeholderPessoas = document.createElement("option");
  placeholderPessoas.textContent = "";
  placeholderPessoas.value = "";
  placeholderPessoas.disabled = true;
  placeholderPessoas.selected = true;
  selectPessoas.appendChild(placeholderPessoas);
  for (let i = 1; i <= 5; i++) {
    const opcao = document.createElement("option");
    opcao.value = i;
    opcao.textContent = i;
    selectPessoas.appendChild(opcao);
  }
  labelPessoas.appendChild(selectPessoas);

  const labelLocal = document.createElement("label");
  labelLocal.textContent = "Local observado:";
  const inputLocal = document.createElement("input");
  inputLocal.type = "text";
  inputLocal.id = "local-opai";
  inputLocal.placeholder = "Ex: Setor de Montagem";
  inputLocal.required = true;
  labelLocal.appendChild(inputLocal);

  const labelDesvios = document.createElement("label");
  labelDesvios.textContent = "Foram encontrados desvios?";
  const selectDesvios = document.createElement("select");
  selectDesvios.id = "desvios-opai";
  selectDesvios.required = true;
  const placeholderDesvios = document.createElement("option");
  placeholderDesvios.textContent = "";
  placeholderDesvios.value = "";
  placeholderDesvios.disabled = true;
  placeholderDesvios.selected = true;
  selectDesvios.appendChild(placeholderDesvios);
  ["Sim", "Não"].forEach(opcao => {
    const opt = document.createElement("option");
    opt.value = opcao;
    opt.textContent = opcao;
    selectDesvios.appendChild(opt);
  });
  labelDesvios.appendChild(selectDesvios);

  // ===== Container para campos condicionais =====
  const divCondicional = document.createElement("div");
  divCondicional.id = "campos-condicionais";

  // ===== Helper: Criar campo de rádio =====
  function criarGrupoRadio(pergunta, name, opcoes) {
    const questionBlock = document.createElement("div");
    questionBlock.className = "radio-question-block";
    questionBlock.dataset.groupName = name; // Para identificar o grupo

    const spanPergunta = document.createElement("span");
    spanPergunta.className = "radio-group-title";
    spanPergunta.textContent = pergunta;
    questionBlock.appendChild(spanPergunta);

    opcoes.forEach(opcao => {
      const labelOpcao = document.createElement("label");
      labelOpcao.className = "radio-option-label";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = name;
      radio.value = opcao;
      radio.classList.add("campo-condicional");

      const spanOpcao = document.createElement("span");
      spanOpcao.textContent = opcao;

      labelOpcao.appendChild(radio);
      labelOpcao.appendChild(spanOpcao);
      questionBlock.appendChild(labelOpcao);
    });

    // Container para campos extras (inicialmente vazio)
    const camposExtrasContainer = document.createElement("div");
    camposExtrasContainer.className = "campos-extras-container";
    camposExtrasContainer.id = `extras-${name}`;
    camposExtrasContainer.style.display = "none";
    camposExtrasContainer.style.marginTop = "15px";
    camposExtrasContainer.style.paddingLeft = "10px";
    camposExtrasContainer.style.borderLeft = "3px solid #E94B22";

    questionBlock.appendChild(camposExtrasContainer);

    // Adicionar listener para mostrar/ocultar campos extras e permitir desmarcar
    let ultimoRadioMarcado = null;

    opcoes.forEach((_, index) => {
      const radio = questionBlock.querySelectorAll('input[type="radio"]')[index];

      // Listener no click para permitir desmarcar
      radio.addEventListener("click", (e) => {
        if (ultimoRadioMarcado === radio) {
          // Se clicar no mesmo que já estava marcado, desmarca
          radio.checked = false;
          ultimoRadioMarcado = null;
          limparCamposExtras(name);
          validarCampos();
        } else {
          // Se marcar um diferente, atualiza o último marcado
          ultimoRadioMarcado = radio;
          mostrarCamposExtras(name, camposExtrasContainer);
          validarCampos();
        }
      });

      // Listener no change para atualizar quando mudar via teclado
      radio.addEventListener("change", () => {
        if (radio.checked) {
          ultimoRadioMarcado = radio;
          mostrarCamposExtras(name, camposExtrasContainer);
        }
      });
    });

    return questionBlock;
  }

  // ===== Função para mostrar campos extras =====
  function mostrarCamposExtras(groupName, container) {
    // Limpa conteúdo anterior
    container.innerHTML = "";

    // 1. Ação Corretiva Imediata
    const labelAcao = document.createElement("label");
    const spanAcao = document.createElement("span");
    spanAcao.textContent = "Ação corretiva imediata:";
    const selectAcao = document.createElement("select");
    selectAcao.id = `acao-${groupName}`;
    selectAcao.required = true;
    selectAcao.classList.add("campo-extra");

    const placeholderAcao = document.createElement("option");
    placeholderAcao.value = "";
    placeholderAcao.textContent = "";
    placeholderAcao.disabled = true;
    placeholderAcao.selected = true;
    selectAcao.appendChild(placeholderAcao);

    [
      "Conscientizado o colaborador",
      "Corrigida a condição insegura",
      "Comunicado ao supervisor",
      "Interrompido o serviço",
      "Solicitado a correção da condição insegura"
    ].forEach(opcao => {
      const opt = document.createElement("option");
      opt.value = opcao;
      opt.textContent = opcao;
      selectAcao.appendChild(opt);
    });

    labelAcao.appendChild(spanAcao);
    labelAcao.appendChild(selectAcao);

    // 2. Criticidade
    const labelCriticidade = document.createElement("label");
    const spanCriticidade = document.createElement("span");
    spanCriticidade.textContent = "Criticidade:";
    const selectCriticidade = document.createElement("select");
    selectCriticidade.id = `criticidade-${groupName}`;
    selectCriticidade.required = true;
    selectCriticidade.classList.add("campo-extra");

    const placeholderCriticidade = document.createElement("option");
    placeholderCriticidade.value = "";
    placeholderCriticidade.textContent = "";
    placeholderCriticidade.disabled = true;
    placeholderCriticidade.selected = true;
    selectCriticidade.appendChild(placeholderCriticidade);

    ["DESPREZÍVEL", "MODERADO", "CRÍTICO", "NÃO APLICÁVEL"].forEach(opcao => {
      const opt = document.createElement("option");
      opt.value = opcao;
      opt.textContent = opcao;
      selectCriticidade.appendChild(opt);
    });

    labelCriticidade.appendChild(spanCriticidade);
    labelCriticidade.appendChild(selectCriticidade);

    // 3. Descrição do desvio
    const labelDescricao = document.createElement("label");
    const spanDescricao = document.createElement("span");
    spanDescricao.textContent = "Descrição do desvio / observação:";
    const inputDescricao = document.createElement("input");
    inputDescricao.type = "text";
    inputDescricao.id = `descricao-${groupName}`;
    inputDescricao.placeholder = "Descreva o desvio observado";
    inputDescricao.required = true;
    inputDescricao.classList.add("campo-extra");

    labelDescricao.appendChild(spanDescricao);
    labelDescricao.appendChild(inputDescricao);

    // Adiciona os campos ao container
    container.appendChild(labelAcao);
    container.appendChild(labelCriticidade);
    container.appendChild(labelDescricao);

    // Mostra o container
    container.style.display = "block";

    // Adiciona listeners para validação
    selectAcao.addEventListener("change", validarCampos);
    selectCriticidade.addEventListener("change", validarCampos);
    inputDescricao.addEventListener("input", validarCampos);
  }

  // ===== Função para limpar campos extras quando desmarcar =====
  function limparCamposExtras(groupName) {
    const container = document.getElementById(`extras-${groupName}`);
    if (container) {
      container.innerHTML = "";
      container.style.display = "none";
    }
  }

  // ===== Lógica condicional: "Não" =====
  selectDesvios.addEventListener("change", () => {
    divCondicional.innerHTML = "";

    if (selectDesvios.value === "Não") {
      const labelComportamentos = document.createElement("label");
      const spanComportamentos = document.createElement("span");
      spanComportamentos.textContent = "Apontar comportamentos seguros / atitudes positivas encontradas:";

      const inputComportamentos = document.createElement("input");
      inputComportamentos.type = "text";
      inputComportamentos.id = "comportamentos-opai";
      inputComportamentos.placeholder = "Ex: Uso correto de EPI";
      inputComportamentos.classList.add("campo-condicional");

      labelComportamentos.appendChild(spanComportamentos);
      labelComportamentos.appendChild(inputComportamentos);
      divCondicional.appendChild(labelComportamentos);

      inputComportamentos.addEventListener("input", validarCampos);
    }
    else if (selectDesvios.value === "Sim") {
      const grupoReacao = criarGrupoRadio(
        "Reação das Pessoas",
        "reacao-pessoas",
        ["Mudança de posição", "Parando o serviço", "Ajustando o EPI", "Adequando ao serviço"]
      );

      const grupoPosicao = criarGrupoRadio(
        "Posição das Pessoas",
        "posicao-pessoas",
        ["Bater contra/ser atingido", "Ficar preso entre", "Risco de queda", "Risco de queimadura", "Risco de choque elétrico", "Inalar contaminantes", "Absorver contaminantes", "Ingerir contaminantes", "Postura inadequada", "Esforço inadequado"]
      );

      const grupoOrdem = criarGrupoRadio(
        "Ordem, Limpeza e Organização",
        "ordem-limpeza",
        ["Local sujo", "Local desorganizado", "Local com vazamentos / Poluição ambiental"]
      );

      const grupoFerramenta = criarGrupoRadio(
        "Ferramenta/ Equipamento",
        "ferramenta-equipamento",
        ["Impróprios para o serviço", "Usados incorretamente", "Em condições inseguras"]
      );

      const grupoProcedimentos = criarGrupoRadio(
        "Procedimentos",
        "procedimentos",
        ["Adequados e não seguidos", "Inadequados", "Não existente"]
      );

      const grupoEPI = criarGrupoRadio(
        "EPI",
        "epi",
        ["Cabeça", "Sistema respiratório", "Olhos e faces", "Ouvidos", "Mãos e braços", "Tronco", "Pés e pernas"]
      );

      divCondicional.appendChild(grupoReacao);
      divCondicional.appendChild(grupoPosicao);
      divCondicional.appendChild(grupoOrdem);
      divCondicional.appendChild(grupoFerramenta);
      divCondicional.appendChild(grupoProcedimentos);
      divCondicional.appendChild(grupoEPI);

      // Adiciona listeners nos rádios para validação
      divCondicional.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener("change", validarCampos);
      });
    }

    validarCampos();
  });

  // ===== Monta o formulário =====
  container.append(
    labelData,
    labelEquipe,
    labelPessoas,
    labelLocal,
    labelDesvios,
    divCondicional
  );

  // ===== Botão Enviar =====
  const botaoEnviar = document.createElement("button");
  botaoEnviar.textContent = "Enviar";
  botaoEnviar.id = "enviar-opai";
  botaoEnviar.disabled = true;
  botaoEnviar.style.opacity = "0.6";
  botaoEnviar.style.cursor = "not-allowed";
  container.appendChild(botaoEnviar);

  // ===== Validação =====
  function validarCampos() {
    // Valida campos base
    const camposBase = [inputData, selectEquipe, selectPessoas, inputLocal, selectDesvios];
    const basePreenchida = camposBase.every(c => c.value && c.value.trim() !== "");

    // Valida campos condicionais
    let condicionaisValidos = true;

    if (selectDesvios.value === "Não") {
      const inputComportamentos = container.querySelector("#comportamentos-opai");
      condicionaisValidos = inputComportamentos && inputComportamentos.value.trim() !== "";
    }
    else if (selectDesvios.value === "Sim") {
      // Verificar se pelo menos um grupo foi marcado
      const gruposRadio = ["reacao-pessoas", "posicao-pessoas", "ordem-limpeza",
                          "ferramenta-equipamento", "procedimentos", "epi"];

      let peloMenosUmGrupoMarcado = false;
      let todosGruposMarcadosValidos = true;

      gruposRadio.forEach(groupName => {
        const radioMarcado = container.querySelector(`input[name="${groupName}"]:checked`);

        if (radioMarcado) {
          peloMenosUmGrupoMarcado = true;

          // Verificar se os campos extras deste grupo estão preenchidos
          const selectAcao = container.querySelector(`#acao-${groupName}`);
          const selectCriticidade = container.querySelector(`#criticidade-${groupName}`);
          const inputDescricao = container.querySelector(`#descricao-${groupName}`);

          if (!selectAcao || !selectAcao.value ||
              !selectCriticidade || !selectCriticidade.value ||
              !inputDescricao || !inputDescricao.value.trim()) {
            todosGruposMarcadosValidos = false;
          }
        }
      });

      condicionaisValidos = peloMenosUmGrupoMarcado && todosGruposMarcadosValidos;
    } else {
      condicionaisValidos = false;
    }

    // Valida responsável
    const selectResponsavel = document.getElementById("responsavel");
    const responsavelValido = selectResponsavel &&
                              selectResponsavel.value.trim() !== "" &&
                              selectResponsavel.value !== "Todos";

    // Habilita/desabilita botão
    const podeEnviar = basePreenchida && condicionaisValidos && responsavelValido;
    botaoEnviar.disabled = !podeEnviar;
    botaoEnviar.style.opacity = podeEnviar ? "1" : "0.6";
    botaoEnviar.style.cursor = podeEnviar ? "pointer" : "not-allowed";
  }

  // ===== Listeners =====
  const camposBase = [inputData, selectEquipe, selectPessoas, inputLocal, selectDesvios];
  camposBase.forEach(campo => {
    campo.addEventListener("input", validarCampos);
    campo.addEventListener("change", validarCampos);
  });

  const selectResponsavel = document.getElementById("responsavel");
  if (selectResponsavel) {
    selectResponsavel.addEventListener("change", validarCampos);
  }

  // ===== Coletar dados =====
  function coletarDadosFormulario() {
    const dados = {
      data: inputData.value,
      equipe_observada: selectEquipe.value,
      num_pessoas: selectPessoas.value,
      local_observado: inputLocal.value,
      encontrou_desvios: selectDesvios.value,
      responsavel: document.getElementById("responsavel")?.value || ""
    };

    if (selectDesvios.value === "Não") {
      const inputComportamentos = container.querySelector("#comportamentos-opai");
      dados.comportamentos_seguros = inputComportamentos?.value || "";

      // Limpar campos de desvios quando não há desvios
      for (let i = 1; i <= 6; i++) {
        dados[`desvio${i}_categoria`] = "";
        dados[`desvio${i}_opcao`] = "";
        dados[`desvio${i}_acao`] = "";
        dados[`desvio${i}_criticidade`] = "";
        dados[`desvio${i}_descricao`] = "";
      }
    }
    else if (selectDesvios.value === "Sim") {
      const gruposRadio = ["reacao-pessoas", "posicao-pessoas", "ordem-limpeza",
                          "ferramenta-equipamento", "procedimentos", "epi"];

      let desvioIndex = 1;

      // Primeiro, inicializa todos os campos de desvios como vazios
      for (let i = 1; i <= 6; i++) {
        dados[`desvio${i}_categoria`] = "";
        dados[`desvio${i}_opcao`] = "";
        dados[`desvio${i}_acao`] = "";
        dados[`desvio${i}_criticidade`] = "";
        dados[`desvio${i}_descricao`] = "";
      }

      // Depois, preenche apenas os desvios marcados
      gruposRadio.forEach(groupName => {
        const radioMarcado = container.querySelector(`input[name="${groupName}"]:checked`);

        if (radioMarcado && desvioIndex <= 6) {
          // Mapeamento dos nomes técnicos para nomes legíveis
          const categoriasMap = {
            "reacao-pessoas": "Reação das Pessoas",
            "posicao-pessoas": "Posição das Pessoas",
            "ordem-limpeza": "Ordem, Limpeza e Organização",
            "ferramenta-equipamento": "Ferramenta/Equipamento",
            "procedimentos": "Procedimentos",
            "epi": "EPI"
          };

          dados[`desvio${desvioIndex}_categoria`] = categoriasMap[groupName];
          dados[`desvio${desvioIndex}_opcao`] = radioMarcado.value;
          dados[`desvio${desvioIndex}_acao`] = container.querySelector(`#acao-${groupName}`)?.value || "";
          dados[`desvio${desvioIndex}_criticidade`] = container.querySelector(`#criticidade-${groupName}`)?.value || "";
          dados[`desvio${desvioIndex}_descricao`] = container.querySelector(`#descricao-${groupName}`)?.value || "";

          desvioIndex++;
        }
      });

      dados.comportamentos_seguros = ""; // Limpa quando há desvios
    }

    return dados;
  }

  // ===== Envio =====
  botaoEnviar.addEventListener("click", async () => {
    const dadosFormulario = coletarDadosFormulario();

    const URL_APPS_SCRIPT = 'SUA_URL_AQUI'; // Substitua pela URL do Google Apps Script

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

    const enviadoComSucesso = await enviarParaPlanilha(dadosFormulario);

    if (enviadoComSucesso) {
      const mensagem = document.createElement("div");
      mensagem.textContent = "Salvo!";
      mensagem.style.color = "#4CAF50";
      mensagem.style.textAlign = "center";
      mensagem.style.marginTop = "10px";
      botaoEnviar.parentNode.insertBefore(mensagem, botaoEnviar.nextSibling);

      // Limpa os campos
      container.querySelectorAll("input, select").forEach(campo => campo.value = "");
      divCondicional.innerHTML = "";

      // Reset do botão
      botaoEnviar.disabled = true;
      botaoEnviar.style.opacity = "0.6";
      botaoEnviar.style.cursor = "not-allowed";

      setTimeout(() => mensagem.remove(), 2000);
    }
  });
}