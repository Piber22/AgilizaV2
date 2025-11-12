// ================================================================
// OPAI.JS – FRONT-END 100% FUNCIONAL (sem envio)
// ================================================================

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

  // ===== VARIÁVEIS NO ESCOPO =====
  let inputData, selectEquipe, selectPessoas, inputLocal;
  let selectDesvios, inputComportamentos;
  let divComportamentos;

  // ===== 1. Data =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-opai";
  inputData.required = true;
  labelData.appendChild(inputData);

  // ===== 2. Equipe observada =====
  const labelEquipe = document.createElement("label");
  labelEquipe.textContent = "Equipe observada:";
  selectEquipe = document.createElement("select");
  selectEquipe.id = "equipe-opai";
  selectEquipe.required = true;
  const phEquipe = document.createElement("option");
  phEquipe.value = ""; phEquipe.textContent = ""; phEquipe.disabled = true; phEquipe.selected = true;
  selectEquipe.appendChild(phEquipe);
  ["Graciela", "Giovana", "Jéssica", "Jacqueline"].forEach(n => {
    const o = document.createElement("option"); o.value = n; o.textContent = n; selectEquipe.appendChild(o);
  });
  labelEquipe.appendChild(selectEquipe);

  // ===== 3. Nº de pessoas =====
  const labelPessoas = document.createElement("label");
  labelPessoas.textContent = "Nº de pessoas:";
  selectPessoas = document.createElement("select");
  selectPessoas.id = "pessoas-opai";
  selectPessoas.required = true;
  const phP = document.createElement("option");
  phP.value = ""; phP.textContent = ""; phP.disabled = true; phP.selected = true;
  selectPessoas.appendChild(phP);
  for (let i = 1; i <= 5; i++) {
    const o = document.createElement("option"); o.value = i; o.textContent = i; selectPessoas.appendChild(o);
  }
  labelPessoas.appendChild(selectPessoas);

  // ===== 4. Local =====
  const labelLocal = document.createElement("label");
  labelLocal.textContent = "Local observado:";
  inputLocal = document.createElement("input");
  inputLocal.type = "text";
  inputLocal.id = "local-opai";
  inputLocal.placeholder = "Ex: Setor de Montagem";
  inputLocal.required = true;
  labelLocal.appendChild(inputLocal);

  // ===== 5. Desvios? =====
  const labelDesvios = document.createElement("label");
  labelDesvios.textContent = "Foram encontrados desvios?";
  selectDesvios = document.createElement("select");
  selectDesvios.id = "desvios-opai";
  selectDesvios.required = true;
  const phD = document.createElement("option");
  phD.value = ""; phD.textContent = ""; phD.disabled = true; phD.selected = true;
  selectDesvios.appendChild(phD);
  ["Sim", "Não"].forEach(op => {
    const o = document.createElement("option"); o.value = op; o.textContent = op; selectDesvios.appendChild(o);
  });
  labelDesvios.appendChild(selectDesvios);

  // ===== 6. Campo condicional =====
  divComportamentos = document.createElement("label");
  divComportamentos.style.display = "none";
  divComportamentos.innerHTML = "<span>Apontar comportamentos seguros / atitudes positivas:</span>";
  inputComportamentos = document.createElement("input");
  inputComportamentos.type = "text";
  inputComportamentos.id = "comportamentos-opai";
  inputComportamentos.placeholder = "Ex: Uso correto de EPI";
  inputComportamentos.required = false; // inicial
  divComportamentos.appendChild(inputComportamentos);

  // ===== Adiciona ao DOM =====
  container.append(labelData, labelEquipe, labelPessoas, labelLocal, labelDesvios, divComportamentos);

  // ===== Botão Enviar =====
  const botaoEnviar = document.createElement("button");
  botaoEnviar.textContent = "Enviar";
  botaoEnviar.id = "enviar-opai";
  botaoEnviar.disabled = true;
  botaoEnviar.style.opacity = "0.6";
  botaoEnviar.style.cursor = "not-allowed";
  container.appendChild(botaoEnviar);

  // ===== LÓGICA CONDICIONAL =====
  selectDesvios.addEventListener("change", () => {
    if (selectDesvios.value === "Não") {
      divComportamentos.style.display = "block"; // ou "flex" se CSS suportar
      inputComportamentos.required = true;
    } else {
      divComportamentos.style.display = "none";
      inputComportamentos.required = false;
      inputComportamentos.value = "";
    }
    validarCampos();
  });

  // ===== VALIDAÇÃO =====
  function validarCampos() {
    const campos = [inputData, selectEquipe, selectPessoas, inputLocal, selectDesvios];
    if (selectDesvios.value === "Não") campos.push(inputComportamentos);

    const todosPreenchidos = campos.every(c => c.value.trim() !== "");
    const responsavel = document.getElementById("responsavel");
    const responsavelValido = responsavel && responsavel.value && responsavel.value !== "Todos";

    const podeEnviar = todosPreenchidos && responsavelValido;
    botaoEnviar.disabled = !podeEnviar;
    botaoEnviar.style.opacity = podeEnviar ? "1" : "0.6";
    botaoEnviar.style.cursor = podeEnviar ? "pointer" : "not-allowed";
  }

  // Listeners
  [inputData, selectEquipe, selectPessoas, inputLocal, selectDesvios, inputComportamentos].forEach(c => {
    c.addEventListener("input", validarCampos);
    c.addEventListener("change", validarCampos);
  });
  document.getElementById("responsavel")?.addEventListener("change", validarCampos);

  // Chama validação inicial
  validarCampos();
}