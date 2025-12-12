console.log("✅ intervalo-mensagem.js carregado!");

// Gera a mensagem final
document.getElementById("gerarBtn").addEventListener("click", function() {
    let dataInput = document.getElementById("dataIntervalo").value;
    let dataStr;

    if (dataInput) {
        const parts = dataInput.split("-");
        dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
        const data = new Date();
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        dataStr = `${dia}/${mes}/${ano}`;
    }

    const responsavel = selectResponsavel.value || "";

    if (!responsavel) {
        alert("⚠️ Por favor, selecione um responsável!");
        return;
    }

    // Coleta todos os checkboxes marcados
    const todosCheckboxes = document.querySelectorAll('.checkbox-intervalo:checked');

    // Agrupa colaboradores por horário/status
    const intervalo12 = [];
    const intervalo13 = [];
    const faltas = [];

    todosCheckboxes.forEach(checkbox => {
        const nomeColaborador = checkbox.getAttribute('data-colaborador');
        const horario = checkbox.getAttribute('data-horario');

        if (horario === '12:00') {
            intervalo12.push(nomeColaborador);
        } else if (horario === '13:00') {
            intervalo13.push(nomeColaborador);
        } else if (horario === 'Falta') {
            faltas.push(nomeColaborador);
        }
    });

    // Ordena cada grupo alfabeticamente
    intervalo12.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    intervalo13.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    faltas.sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Monta a mensagem
    let msg = `🍽️ CONTROLE DE INTERVALO ${responsavel.toUpperCase()} 🍽️\n`;
    msg += `📆 ${dataStr} 📆\n\n`;

    // Intervalo 12:00
    if (intervalo12.length > 0) {
        msg += `🟢 INTERVALO 12:00 🟢\n`;
        intervalo12.forEach(nome => {
            msg += `${nome}\n`;
        });
        msg += '\n';
    }

    // Intervalo 13:00
    if (intervalo13.length > 0) {
        msg += `🔵 INTERVALO 13:00 🔵\n`;
        intervalo13.forEach(nome => {
            msg += `${nome}\n`;
        });
        msg += '\n';
    }

    // Caso não tenha nada marcado
    if (intervalo12.length === 0 && intervalo13.length === 0 && faltas.length === 0) {
        msg += `⚠️ Nenhum colaborador selecionado.\n`;
    }

    document.getElementById("resultado").value = msg;
    console.log("✅ Mensagem gerada com sucesso!");
});


// Copia a mensagem e abre o WhatsApp
document.getElementById("copiarBtn").addEventListener("click", function() {
    const textarea = document.getElementById("resultado");

    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }

    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            console.log("📋 Mensagem copiada para área de transferência");

            // Apenas abre o WhatsApp
            const whatsappAppURL = "whatsapp://";
            window.location.href = whatsappAppURL;

            console.log("📱 Abrindo WhatsApp");
        })
        .catch(err => {
            console.error("❌ Erro ao copiar: ", err);
            alert("Não foi possível copiar a mensagem.");
        });
});
