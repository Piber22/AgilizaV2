console.log("✅ trocaplantao.js carregado!");

let dadosRecebidos = {};

document.addEventListener('DOMContentLoaded', () => {

    // INICIALIZAR CHECKBOXES CUSTOMIZADOS
    const checkboxes = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');

    checkboxes.forEach((checkbox, index) => {
        const label = checkbox.closest('label');
        const visualCheckbox = label.querySelector('.checkbox-visual');

        if (!visualCheckbox) return;

        checkbox.addEventListener('change', function() {
            if (this.checked) {
                visualCheckbox.classList.add('checked');
                visualCheckbox.textContent = '✓';
            } else {
                visualCheckbox.classList.remove('checked');
                visualCheckbox.textContent = '';
            }
        });

        visualCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        label.addEventListener('click', (e) => {
            if (e.target === visualCheckbox) return;
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    // TOAST DE AVISO DISCRETO
    function mostrarAviso(mensagem) {
        let toast = document.getElementById("avisoToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "avisoToast";
            toast.style.cssText = [
                "position: fixed",
                "bottom: 28px",
                "left: 50%",
                "transform: translateX(-50%) translateY(12px)",
                "background: #ffffff",
                "color: #555",
                "padding: 11px 22px",
                "border-radius: 10px",
                "box-shadow: 0 4px 18px rgba(0,0,0,0.13)",
                "font-family: 'Montserrat', sans-serif",
                "font-size: 13.5px",
                "font-weight: 500",
                "border-left: 4px solid #e6a817",
                "opacity: 0",
                "transition: opacity 0.25s ease, transform 0.25s ease",
                "z-index: 9999",
                "white-space: nowrap",
                "pointer-events: none"
            ].join(";");
            document.body.appendChild(toast);
        }

        toast.textContent = "⚠️  " + mensagem;
        toast.style.transition = "none";
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(12px)";
        toast.getBoundingClientRect();
        toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";

        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(-50%) translateY(12px)";
        }, 2800);
    }

    document.getElementById("gerarBtn").addEventListener("click", function () {

        const dataInput = document.getElementById("dataRecebimento").value;
        const responsavelInput = document.getElementById("responsavel").value;

        if (!dataInput && !responsavelInput) {
            mostrarAviso("Preencha a data e selecione o responsável");
            return;
        }
        if (!dataInput) {
            mostrarAviso("Necessário preencher a data");
            return;
        }
        if (!responsavelInput) {
            mostrarAviso("Necessário selecionar o responsável");
            return;
        }

        // DATA + HORA
        const agora = new Date();
        const hora = String(agora.getHours()).padStart(2, '0');
        const minuto = String(agora.getMinutes()).padStart(2, '0');
        const horarioStr = hora + ":" + minuto;

        const p = dataInput.split("-");
        const dataStr = p[2] + "/" + p[1] + "/" + p[0];

        const responsavel = responsavelInput;
        const maquinas = document.getElementById("maquinas").value || "";
        const residuos_roupas = document.getElementById("residuos_roupas").value || "";
        const terminais_solicitadas = document.getElementById("terminais_solicitadas").value || "";
        const leitos_vestir = document.getElementById("leitos_vestir").value || "";
        const terminais_programadas = document.getElementById("terminais_programadas").value || "";
        const observacoes = document.getElementById("observacoes").value || "";

        const sacolasSelecionadas = Array.from(
            document.querySelectorAll('.checkbox-grid input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        let msg = "📋 TROCA DE PLANTÃO 📋\n";
        msg += "📌 RESPONSÁVEL: " + responsavel.toUpperCase() + "\n";
        msg += "🗓️ DATA: " + dataStr + " - " + horarioStr + "\n\n";
        msg += "*MÁQUINAS:* " + maquinas + "\n\n";
        msg += "*RESÍDUOS E ROUPAS:* " + residuos_roupas + "\n\n";
        msg += "*TERMINAIS OU ALTAS PENDENTES:* " + terminais_solicitadas + "\n\n";
        msg += "*LEITOS PARA VESTIR PENDENTES:* " + leitos_vestir + "\n\n";
        msg += "*TERMINAIS PROGRAMADAS NÃO EXECUTADAS:* " + terminais_programadas + "\n\n";
        msg += "*SACOLAS DEVOLVIDAS:* " + (sacolasSelecionadas.length ? sacolasSelecionadas.join(', ') : 'Nenhuma') + "\n\n";
        msg += "*OBSERVAÇÕES:* " + observacoes + "\n\n";

        document.getElementById("resultado").value = msg;

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

    document.getElementById("copiarBtn").addEventListener("click", function () {
        const textarea = document.getElementById("resultado");

        if (!textarea.value) {
            alert("⚠️ Gere a mensagem primeiro!");
            return;
        }

        navigator.clipboard.writeText(textarea.value)
            .then(() => {
                const inviteCode = "IAbXun9LRzc61P6bm1coD8";
                const whatsappAppURL = "whatsapp://chat?code=" + inviteCode;
                window.location.href = whatsappAppURL;
            })
            .catch(err => {
                console.error("❌ Erro ao copiar: ", err);
                alert("Não foi possível copiar a mensagem.");
            });
    });

});