console.log("✅ trocaplantao.js carregado!");

let dadosRecebidos = {};

document.addEventListener('DOMContentLoaded', () => {

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

        // MENSAGEM
        let msg = `📋 TROCA DE PLANTÃO 📋\n`;
        msg += `📌 RESPONSÁVEL: ${responsavel.toUpperCase()}\n`;
        msg += `🗓️ DATA: ${dataStr} - ${horarioStr}\n\n`;
        msg += `*MÁQUINAS:* ${maquinas}\n\n`;
        msg += `*RESÍDUOS E ROUPAS:* ${residuos_roupas}\n\n`;
        msg += `*TERMINAIS OU ALTAS PENDENTES:* ${terminais_solicitadas}\n\n`;
        msg += `*LEITOS PARA VESTIR PENDENTES:* ${leitos_vestir}\n\n`;
        msg += `*TERMINAIS PROGRAMADAS NÃO EXECUTADAS:* ${terminais_programadas}\n\n`;
        msg += `*SACOLAS ENTREGUES:* ${sacolasSelecionadas.length ? sacolasSelecionadas.join(', ') : 'Nenhuma'}\n\n`;
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

});
