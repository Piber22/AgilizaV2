// ================================================================
// OPAI.JS – FRONT-END COMPLETO (sem envio por enquanto)
// ================================================================

// === MAPEAMENTO DE RESPONSÁVEIS (RE + FUNÇÃO) – para uso futuro ===
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

// ================================================================

function criarCamposOPAI(container) {
  container.innerHTML = "";

  // ===== [1] VARIÁVEIS NO ESCOPO =====
  let inputData, selectEquipe, selectPessoas, inputLocal;
  let selectDesvios, inputComportamentos; // condicional
  let divComportamentos; // container do campo condicional

  // ===== 1. Data =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-opai";
  inputData.name = "data-opai";
  inputData.required = true;
  labelData.appendChild(inputData);

  // ===== 2. Equipe observada (select) =====
  const labelEquipe = document.createElement("label");
  labelEquipe.textContent = "Equipe observada:";
  selectEquipe = document.createElement("select");
  selectEquipe.id = "equipe-opai";
  selectEquipe.name = "equipe-opai";
  selectEquipe.required = true;
  const placeholderEquipe = document.createElement("option");
  placeholderEquipe.textContent = ""; placeholderEquipe.value = ""; placeholderEquipe.disabled = true; placeholderEquipe.selected = true;
  selectEquipe.appendChild(placeholderEquipe);
  ["Graciela", "Giovana", "Jéssica", "Jacqueline"].forEach(nome => {
    const o = document.createElement("option"); o.value = nome; o.textContent = nome; selectEquipe.appendChild(o);
  });
  labelEquipe.appendChild(selectEquipe);

  // ===== 3. Nº de pessoas (1 a 5) =====
  const labelPessoas = document.createElement("label");
  labelPessoas.textContent = "Nº de pessoas:";
  selectPessoas = document.createElement("select");
  selectPessoas.id = "pessoas-opai";
  selectPessoas.name = "pessoas-opai";
  selectPessoas.required = true;
  const placeholderP = document.createElement("option");
  placeholderP.textContent = ""; placeholderP.value = ""; placeholderP.disabled = true; placeholderP.selected = true;
  selectPessoas.appendChild(placeholderP);
  for (let i = 1; i <= 5; i++) {
    const o = document.createElement("option"); o.value = i; o.textContent = i; selectPessoas.appendChild(o);
  }
  labelPessoas.appendChild(selectPessoas);

  // ===== 4. Local observado =====
  const labelLocal = document.createElement("label");
  labelLocal.textContent = "Local observado:";
  inputLocal = document.createElement("input");
  inputLocal.type = "text";
  inputLocal.id = "local-opai";
  inputLocal.name = "local-opai";
  inputLocal.placeholder = "Ex: Setor de Montagem";
  inputLocal.required = true;
  labelLocal.appendChild(inputLocal);

  // ===== 5. Foram encontrados desvios? =====
  const labelDesvios = document.createElement("label");
  labelDesvios.textContent = "Foram encontrados desvios?";
  selectDesvios = document.createElement("select");
  selectDesvios.id = "desvios-opai";
  selectDesvios.name = "desvios-opai";
  selectDesvios.required = true;
  const placeholderD = document.createElement("option");
  placeholderD.textContent = ""; placeholderD.value = ""; placeholderD.disabled = true; placeholderD.selected = true;
  selectDesvios.appendChild(placeholderD);
  ["Sim", "Não"].forEach(op => {
    const o = document.createElement("option"); o.value = op; o.textContent = op; selectDesvios.appendChild(o);
  });
  labelDesvios.appendChild(selectDesvios);

  // ===== 6. Campo condicional: Comportamentos seguros (só se "Não") =====
  divComportamentos = document.createElement("label");
  divComportamentos.style.display = "none"; // oculto inicialmente
  divComportamentos.innerHTML = "<span>Apontar comportamentos seguros / atitudes positivas encontradas:</span>";
  inputComportamentos = document.createElement("input");
  inputComportamentos.type = "text";
  inputComportamentos.id = "comportamentos-opai";
  inputComportamentos.name = "comportamentos-opai";
  inputComportamentos.placeholder = "Ex: Uso correto de EPI, organização do local";
  divComportamentos.appendChild(inputComportamentos);

  // ===== Adiciona ao container =====
  container.append(
    labelData,
    labelEquipe,
    labelPessoas,
    labelLocal,
    labelDesvios,
    divComportamentos
  );

  // ===== Botão Enviar =====
  const botaoEnviar = document.createElement("button");
  botaoEnviar.textContent = "Enviar";
  botaoEnviar.id = "enviar-opai";
  botaoEnviar.disabled = true;
  botaoEnviar.style.opacity = "0.6";
  botaoEnviar.style.cursor = "not-allowed";
  container.appendChild(botaoEnviar);

  // ===== LÓGICA CONDICIONAL: mostra campo se "Não" =====
  selectDesvios.addEventListener("change", () => {
    if (selectDesvios.value === "Não") {
      divComportamentos.style.display = "flex";
      inputComportamentos.required = true;
    } else {
      divComportamentos.style.display = "none";
      inputComportamentos.required = false;
      inputComportamentos.value = "";
    }
    validarCampos();
  });

  // ===== VALIDAÇÃO EM TEMPO REAL =====
  function validarCampos() {
    const campos = [
      inputData,
      selectEquipe,
      selectPessoas,
      inputLocal,
      selectDesvios
    ];
    if (selectDesvios.value === "Não") {
      campos.push(inputComportamentos);
    }

    const todosPreenchidos = campos.every(c => c.value.trim() !== "");
    const selectResponsavel = document.getElementById("responsavel");
    const responsavelValido = selectResponsavel && selectResponsavel.value && selectResponsavel.value !== "Todos";

    const podeEnviar = todosPreenchidos && responsavelValido;
    botaoEnviar.disabled = !podeEnviar;
    botaoEnviar.style.opacity = podeEnviar ? "1" : "0.6";
    botaoEnviar.style.cursor = podeEnviar ? "pointer" : "not-allowed";
  }

  // Listeners
  [inputData, selectEquipe, selectPessoas, inputLocal, selectDesvios, inputComportamentos].forEach(campo => {
    campo.addEventListener("input", validarCampos);
    campo.addEventListener("change", validarCampos);
  });
  document.getElementById("responsavel")?.addEventListener("change", validarCampos);

  // ===== (ENVIO FUTURO – COMENTADO) =====
  /*
  botaoEnviar.addEventListener("click", async () => {
    const dados = coletarDados();
    // await fetch(...);
  });
  */
}