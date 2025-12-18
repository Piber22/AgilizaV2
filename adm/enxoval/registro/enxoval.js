console.log("✅ enxoval.js carregado!");

// Variáveis globais para armazenar as fotos
let fotoSujo = null;
let fotoLimpo = null;

document.addEventListener('DOMContentLoaded', () => {
    // Definir data atual como padrão
    const hoje = new Date();
    document.getElementById("dataRegistro").value = hoje.toISOString().split('T')[0];

    // ===== SUJO =====
    document.getElementById("cameraSujo").addEventListener("click", () => {
        if (isMobile()) {
            document.getElementById("inputCameraSujo").click();
        } else {
            alert("📷 A câmera só pode ser usada em celular.");
        }
    });

    document.getElementById("galeraSujo").addEventListener("click", () => {
        document.getElementById("inputFotoSujo").click();
    });

    document.getElementById("inputCameraSujo").addEventListener("change", (e) => {
        handleFotoSelecionada(e, "sujo");
    });

    document.getElementById("inputFotoSujo").addEventListener("change", (e) => {
        handleFotoSelecionada(e, "sujo");
    });

    // ===== LIMPO =====
    document.getElementById("cameraLimpo").addEventListener("click", () => {
        if (isMobile()) {
            document.getElementById("inputCameraLimpo").click();
        } else {
            alert("📷 A câmera só pode ser usada em celular.");
        }
    });

    document.getElementById("galeraLimpo").addEventListener("click", () => {
        document.getElementById("inputFotoLimpo").click();
    });

    document.getElementById("inputCameraLimpo").addEventListener("change", (e) => {
        handleFotoSelecionada(e, "limpo");
    });

    document.getElementById("inputFotoLimpo").addEventListener("change", (e) => {
        handleFotoSelecionada(e, "limpo");
    });

    // Botão salvar
    document.getElementById("salvarBtn").addEventListener("click", salvarRegistro);
});


// Função para processar foto selecionada
function handleFotoSelecionada(event, tipo) {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
        mostrarMensagem("Por favor, selecione apenas arquivos de imagem.", "erro");
        return;
    }

    // Ler arquivo e criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewId = tipo === "sujo" ? "previewSujo" : "previewLimpo";
        const previewArea = document.getElementById(previewId);

        // Limpar preview anterior
        previewArea.innerHTML = '';

        // Criar elemento de imagem
        const img = document.createElement('img');
        img.src = e.target.result;
        previewArea.appendChild(img);

        // Armazenar a foto na variável global
        if (tipo === "sujo") {
            fotoSujo = file;
        } else {
            fotoLimpo = file;
        }

        console.log(`✅ Foto ${tipo} carregada:`, file.name);
    };
    reader.readAsDataURL(file);
}

// Função para mostrar mensagens de status
function mostrarMensagem(texto, tipo) {
    const mensagemDiv = document.getElementById("mensagemStatus");
    mensagemDiv.textContent = texto;
    mensagemDiv.className = `mensagem-status ${tipo}`;

    // Remover mensagem após 5 segundos
    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

// Função para validar dados
function validarDados() {
    const data = document.getElementById("dataRegistro").value;

    if (!data) {
        mostrarMensagem("Por favor, selecione uma data.", "erro");
        return false;
    }

    if (!fotoSujo) {
        mostrarMensagem("Por favor, adicione uma foto do enxoval sujo.", "erro");
        return false;
    }

    if (!fotoLimpo) {
        mostrarMensagem("Por favor, adicione uma foto do enxoval limpo.", "erro");
        return false;
    }

    return true;
}

// Função para salvar registro
async function salvarRegistro() {
    console.log("📝 Iniciando salvamento do registro...");

    // Validar dados
    if (!validarDados()) {
        return;
    }

    // Desabilitar botão durante o salvamento
    const btnSalvar = document.getElementById("salvarBtn");
    btnSalvar.disabled = true;
    btnSalvar.textContent = "⏳ Salvando...";

    try {
        // Coletar dados do formulário
        const dataInput = document.getElementById("dataRegistro").value;
        const parts = dataInput.split("-");
        const dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;

        const dados = {
            data: dataFormatada,
            mopsSujos: document.getElementById("mopsSujos").value || "0",
            panosSujos: document.getElementById("panosSujos").value || "0",
            mopsLimpos: document.getElementById("mopsLimpos").value || "0",
            panosLimpos: document.getElementById("panosLimpos").value || "0"
        };

        console.log("📊 Dados coletados:", dados);

        // Enviar fotos para o Google Drive
        const resultado = await enviarParaDrive(dados, fotoSujo, fotoLimpo);

        if (resultado) {
            mostrarMensagem("✅ Registro salvo com sucesso no Google Drive!", "sucesso");
            limparFormulario();
        } else {
            mostrarMensagem("❌ Erro ao salvar o registro. Tente novamente.", "erro");
        }

    } catch (erro) {
        console.error("❌ Erro ao salvar registro:", erro);
        mostrarMensagem("❌ Erro ao salvar o registro. Tente novamente.", "erro");
    } finally {
        // Reabilitar botão
        btnSalvar.disabled = false;
        btnSalvar.textContent = "💾 Salvar Registro";
    }
}

// Função para limpar formulário após salvamento
function limparFormulario() {
    // Resetar inputs numéricos
    document.getElementById("mopsSujos").value = "0";
    document.getElementById("panosSujos").value = "0";
    document.getElementById("mopsLimpos").value = "0";
    document.getElementById("panosLimpos").value = "0";

    // Limpar previews de fotos
    document.getElementById("previewSujo").innerHTML = '<span class="preview-text">Nenhuma foto selecionada</span>';
    document.getElementById("previewLimpo").innerHTML = '<span class="preview-text">Nenhuma foto selecionada</span>';

    // Resetar inputs de arquivo
    document.getElementById("inputFotoSujo").value = "";
    document.getElementById("inputCameraSujo").value = "";
    document.getElementById("inputFotoLimpo").value = "";
    document.getElementById("inputCameraLimpo").value = "";

    // Limpar variáveis globais
    fotoSujo = null;
    fotoLimpo = null;

    console.log("🧹 Formulário limpo");
}