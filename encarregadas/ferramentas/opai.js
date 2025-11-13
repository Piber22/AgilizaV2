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

    return questionBlock;
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

      // Adiciona listeners nos rádios
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
      const gruposRadio = new Set();
      divCondicional.querySelectorAll('input[type="radio"]').forEach(radio => {
        gruposRadio.add(radio.name);
      });

      for (const name of gruposRadio) {
        const marcado = container.querySelector(`input[name="${name}"]:checked`);
        if (!marcado) {
          condicionaisValidos = false;
          break;
        }
      }
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
    }
    else if (selectDesvios.value === "Sim") {
      const reacao = container.querySelector('input[name="reacao-pessoas"]:checked');
      const posicao = container.querySelector('input[name="posicao-pessoas"]:checked');
      const ordem = container.querySelector('input[name="ordem-limpeza"]:checked');
      const ferramenta = container.querySelector('input[name="ferramenta-equipamento"]:checked');
      const procedimentos = container.querySelector('input[name="procedimentos"]:checked');
      const epi = container.querySelector('input[name="epi"]:checked');

      dados.reacao_pessoas = reacao?.value || "";
      dados.posicao_pessoas = posicao?.value || "";
      dados.ordem_limpeza = ordem?.value || "";
      dados.ferramenta_equipamento = ferramenta?.value || "";
      dados.procedimentos = procedimentos?.value || "";
      dados.epi = epi?.value || "";
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