console.log("✅ trocaplantao.js carregado!");

let dadosRecebidos = {};

document.addEventListener('DOMContentLoaded', () => {

    // INICIALIZAR CHECKBOXES CUSTOMIZADOS
    const checkboxes = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');
    console.log(`📦 Encontrados ${checkboxes.length} checkboxes`);

    checkboxes.forEach((checkbox, index) => {
        const label = checkbox.closest('label');
        const visualCheckbox = label.querySelector('.checkbox-visual');

        console.log(`✅ Inicializando checkbox ${index + 1}:`, checkbox.value);

        if (!visualCheckbox) {
            console.error(`❌ Checkbox visual não encontrado para ${checkbox.value}`);
            return;
        }

        // Evento de mudança no checkbox real
        checkbox.addEventListener('change', function() {
            console.log(`🔄 Checkbox ${this.value} mudou para:`, this.checked);
            if (this.checked) {
                visualCheckbox.classList.add('checked');
                visualCheckbox.textContent = '✓';
            } else {
                visualCheckbox.classList.remove('checked');
                visualCheckbox.textContent = '';
            }
        });

        // Permitir clicar no visual para marcar/desmarcar
        visualCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`👆 Clicou no visual do checkbox ${checkbox.value}`);
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        // Permitir clicar no label inteiro
        label.addEventListener('click', (e) => {
            // Evita duplo disparo se clicar no visual
            if (e.target === visualCheckbox) return;

            console.log(`👆 Clicou no label do checkbox ${checkbox.value}`);
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    document.getElementById("gerarBtn").addEventListener("click", function () {

        // DATA + HORA
        let dataInput = document.getElementById("dataRecebimento").value;
        let dataStr;
        let horarioStr;

        const agora = new Date();
        const hora = String(agora.getHours()).padStart(2, '0');
        const minuto = String(agora.getMinutes()).padStart(2, '0');
        horarioStr = `${hora}:${minuto}`;

        if (dataInput) {
            const p = dataInput.split("-");
            dataStr = `${p[2]}/${p[1]}/${p[0]}`;
        } else {
            const d = new Date();
            dataStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        }

        // CAMPOS
        const responsavel = document.getElementById("responsavel").value || "";
        const maquinas = document.getElementById("maquinas").value || "";
        const residuos_roupas = document.getElementById("residuos_roupas").value || "";
        const terminais_solicitadas = document.getElementById("terminais_solicitadas").value || "";
        const leitos_vestir = document.getElementById("leitos_vestir").value || "";
        const terminais_programadas = document.getElementById("terminais_programadas").value || "";
        const observacoes = document.getElementById("observacoes").value || "";

        // SACOLAS
        const sacolasSelecionadas = Array.from(
            document.querySelectorAll('.checkbox-grid input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        console.log("🎯 Sacolas selecionadas:", sacolasSelecionadas);

        // MENSAGEM
        let msg = `📋 TROCA DE PLANTÃO 📋\n`;
        msg += `📌 RESPONSÁVEL: ${responsavel.toUpperCase()}\n`;
        msg += `🗓️ DATA: ${dataStr} - ${horarioStr}\n\n`;
        msg += `*MÁQUINAS:* ${maquinas}\n\n`;
        msg += `*RESÍDUOS E ROUPAS:* ${residuos_roupas}\n\n`;
        msg += `*TERMINAIS OU ALTAS PENDENTES:* ${terminais_solicitadas}\n\n`;
        msg += `*LEITOS PARA VESTIR PENDENTES:* ${leitos_vestir}\n\n`;
        msg += `*TERMINAIS PROGRAMADAS NÃO EXECUTADAS:* ${terminais_programadas}\n\n`;
        msg += `*SACOLAS DEVOLVIDAS:* ${sacolasSelecionadas.length ? sacolasSelecionadas.join(', ') : 'Nenhuma'}\n\n`;
        msg += `*OBSERVAÇÕES:* ${observacoes}\n\n`;

        document.getElementById("resultado").value = msg;

        // OBJETO PARA SHEETS
        dadosRecebidos = {
            data: dataStr,
            horario: horarioStr,
            responsavel,
            sacolas_entregues: sacolasSelecionadas.join(', '),
            maquinas,
            residuos_roupas,
            terminais_solicitadas,
            leitos_vestir,
            terminais_programadas,
            observacoes
        };
    });

    // EVENTO BOTÃO COPIAR
    document.getElementById("copiarBtn").addEventListener("click", function () {
        const textarea = document.getElementById("resultado");

        if (!textarea.value) {
            alert("⚠️ Gere a mensagem primeiro!");
            return;
        }

        navigator.clipboard.writeText(textarea.value)
            .then(() => {
                console.log("📋 Mensagem copiada para área de transferência");

                // Código do convite do grupo do WhatsApp
                const inviteCode = "IAbXun9LRzc61P6bm1coD8";

                // Tenta abrir no app do WhatsApp
                const whatsappAppURL = `whatsapp://chat?code=${inviteCode}`;
                window.location.href = whatsappAppURL;
                console.log("📱 Abrindo grupo do WhatsApp");
            })
            .catch(err => {
                console.error("❌ Erro ao copiar: ", err);
                alert("Não foi possível copiar a mensagem.");
            });
    });

});