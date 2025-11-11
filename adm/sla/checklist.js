// Dados das questões
const questoes = [
    {
        titulo: "APRESENTAÇÃO PESSOAL",
        peso: 0.05,
        opcoes: [
            { texto: "Unhas limpas e aparadas, cabelos arrumados e barbeados.", valor: 1 },
            { texto: "Com até 01 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 02 itens não conforme.", valor: 0.50 },
            { texto: "Unhas sujas, despenteados e com barba.", valor: 0 }
        ]
    },
    {
        titulo: "UNIFORME",
        peso: 0.025,
        opcoes: [
            { texto: "Utiliza completo, corretamente e está limpo.", valor: 1 },
            { texto: "Com até 01 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 02 itens não conforme.", valor: 0.50 },
            { texto: "Não utiliza completo, incorretamente e está sujo.", valor: 0 }
        ]
    },
    {
        titulo: "POSTURA E CORDIALIDADE",
        peso: 0.025,
        opcoes: [
            { texto: "Bom relacionamento com paciente, equipe de assistência médica e enfermagem, e colegas Manserv.", valor: 1 },
            { texto: "Com até 01 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 02 itens não conforme.", valor: 0.50 },
            { texto: "Não possui bom relacionamento.", valor: 0 }
        ]
    },
    {
        titulo: "CARRO FUNCIONAL",
        peso: 0.05,
        opcoes: [
            { texto: "Carro Funcional completo e limpo.", valor: 1 },
            { texto: "Com até 02 itens não conforme.", valor: 0.75 },
            { texto: "Com até 04 itens não conforme.", valor: 0.50 },
            { texto: "Mais de 04 itens não conforme.", valor: 0 }
        ]
    },
    {
        titulo: "PRODUTOS QUÍMICOS",
        peso: 0.05,
        opcoes: [
            { texto: "Borrifadores padrão e identificados, e utilizados corretamente, e dentro da validade.", valor: 1 },
            { texto: "Até 01 item acima não conforme.", valor: 0.75 },
            { texto: "Até 02 item acima não conforme.", valor: 0.50 },
            { texto: "Embalagens fora do padrão e não identificados, utilizados incorretamente e fora da validade.", valor: 0 }
        ]
    },
    {
        titulo: "UTILIZAÇÃO CORRETA DE EPI'S E EPC'S",
        peso: 0.05,
        opcoes: [
            { texto: "Utiliza corretamente e higieniza o EPI.", valor: 1 },
            { texto: "Utiliza corretamente no local, higieniza, mas desparamenta incorretamente.", valor: 0.75 },
            { texto: "Utiliza incorretamente mas higieniza o EPI.", valor: 0.50 },
            { texto: "Não utiliza.", valor: 0 }
        ]
    },
    {
        titulo: "TETO FIXO (até 2mts de altura)",
        peso: 0.03,
        opcoes: [
            { texto: "Sem pó, sem manchas removíveis e sem teias.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com pó, com manchas removíveis e com teias.", valor: 0 }
        ]
    },
    {
        titulo: "PAREDES E DIVISÓRIAS",
        peso: 0.04,
        opcoes: [
            { texto: "Sem pó, sem manchas removíveis e sem teias.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com pó, com manchas removíveis e com teias.", valor: 0 }
        ]
    },
    {
        titulo: "PORTAS",
        peso: 0.03,
        opcoes: [
            { texto: "Limpas, sem manchas removíveis e sem poeira.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Sujas, com manchas removíveis e com poeira.", valor: 0 }
        ]
    },
    {
        titulo: "VIDROS INTERNOS E JANELAS (parapeito e esquadria)",
        peso: 0.05,
        opcoes: [
            { texto: "Sem marcas, sem respingos e sem pó.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com marcas, com respingos e com pó.", valor: 0 }
        ]
    },
    {
        titulo: "MOBILIÁRIOS (parte externa)",
        peso: 0.05,
        opcoes: [
            { texto: "Sem manchas, sem respingos e sem pó.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com manchas, com respingos e com pó.", valor: 0 }
        ]
    },
    {
        titulo: "PISOS GERAIS (tratamento no vinílico e lavação no carpete)",
        peso: 0.05,
        opcoes: [
            { texto: "Limpos sem detritos, sem manchas removíveis e sem limo.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com detritos, com manchas removíveis e com limo.", valor: 0 }
        ]
    },
    {
        titulo: "BANHEIROS",
        peso: 0.05,
        opcoes: [
            { texto: "Limpos sem detritos, sem manchas removíveis e sem limo.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com detritos, com manchas removíveis e com limo.", valor: 0 }
        ]
    },
    {
        titulo: "LAVATÓRIOS (PIA)",
        peso: 0.05,
        opcoes: [
            { texto: "Limpos sem detritos, sem manchas removíveis, válvulas e bordas limpas.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com detritos, com manchas removíveis e válvulas e bordas sujas.", valor: 0 }
        ]
    },
    {
        titulo: "VASOS SANITÁRIOS E MICTÓRIOS",
        peso: 0.05,
        opcoes: [
            { texto: "Limpos sem detritos, sem manchas removíveis, descargas higienizadas e sem crostas ou manchas amareladas.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Com detritos, com manchas removíveis, descargas não higienizadas, com crostas ou manchas amareladas.", valor: 0 }
        ]
    },
    {
        titulo: "REPOSIÇÃO DE INSUMOS",
        peso: 0.05,
        opcoes: [
            { texto: "Sem excesso, dispenser abastecido e limpo.", valor: 1 },
            { texto: "Com até 01 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 02 itens acima não conforme.", valor: 0.50 },
            { texto: "Com excesso, dispenser desabastecido e sujo.", valor: 0 }
        ]
    },
    {
        titulo: "LIXEIRAS",
        peso: 0.05,
        opcoes: [
            { texto: "Limpa e com saco de lixo.", valor: 1 },
            { texto: "Limpa e sem saco de lixo.", valor: 0.75 },
            { texto: "Suja ou Transbordando.", valor: 0.50 },
            { texto: "Suja e Transbordando.", valor: 0 }
        ]
    },
    {
        titulo: "COLETA SELETIVA (segregação)",
        peso: 0.05,
        opcoes: [
            { texto: "Utilização das cores de sacos corretamente na coleta e na segregação, respeitar a capacidade do cesto, transportar o resíduo conforme seu grupo (A,B,C,D,E) de forma separada.", valor: 1 },
            { texto: "Com até 01 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 02 itens acima não conforme.", valor: 0.50 },
            { texto: "Não utiliza as cores dos sacos corretamente na coleta e na segregação, não respeitar a capacidade do cesto, não transporta o resíduo conforme seu grupo.", valor: 0 }
        ]
    },
    {
        titulo: "ELEVADORES",
        peso: 0.05,
        opcoes: [
            { texto: "Paredes, portas e espelhos limpos sem manchas removíveis.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Paredes, portas e espelhos sujos e com manchas removíveis.", valor: 0 }
        ]
    },
    {
        titulo: "CAIXILHOS DE ELEVADORES",
        peso: 0.05,
        opcoes: [
            { texto: "Portas externas e botões limpos, e trilhos sem detritos.", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Portas externas e botões sujos, e trilhos sem detritos.", valor: 0 }
        ]
    },
    {
        titulo: "ESCADA (corrimão, parede, teto e degrau)",
        peso: 0.05,
        opcoes: [
            { texto: "Limpa ou lavadas em toda estrutura.", valor: 1 },
            { texto: "Limpa ou necessitando de lavação.", valor: 0.75 },
            { texto: "Suja mas com lavação.", valor: 0.50 },
            { texto: "Suja e sem lavação.", valor: 0 }
        ]
    },
    {
        titulo: "ORGANIZAÇÃO DML",
        peso: 0.05,
        opcoes: [
            { texto: "Limpo, Organizado e Abastecido (se aplicável).", valor: 1 },
            { texto: "Com até 1 item acima não conforme.", valor: 0.75 },
            { texto: "Com até 2 itens acima não conforme.", valor: 0.50 },
            { texto: "Sujo, desorganizado e desabastecido (se aplicável).", valor: 0 }
        ]
    }
];

// === GERAR FORMULÁRIO ===
function gerarFormulario() {
    const form = document.getElementById('checklistForm');
    questoes.forEach((questao, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-block';

        const titulo = document.createElement('div');
        titulo.className = 'question-title';
        titulo.textContent = `${index + 1}. ${questao.titulo}`;
        questionDiv.appendChild(titulo);

        questao.opcoes.forEach((opcao, opcaoIndex) => {
            const label = document.createElement('label');
            label.className = 'option-label';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `questao${index}`;
            radio.value = opcao.valor;
            radio.required = true;

            label.appendChild(radio);
            label.appendChild(document.createTextNode(opcao.texto));
            questionDiv.appendChild(label);
        });

        form.appendChild(questionDiv);
    });
}

// === CALCULAR NOTA ===
function calcularNota() {
    const avaliador = document.getElementById('avaliador').value.trim();
    if (!avaliador) {
        alert('Por favor, insira o nome do avaliador.');
        return;
    }

    let notaTotal = 0;
    let questoesMaxima = [], questoesAlta = [], questoesBaixa = [], questoesZerada = [];
    let todasRespondidas = true;
    respostasUsuario = [];

    questoes.forEach((questao, index) => {
        const respostaSelecionada = document.querySelector(`input[name="questao${index}"]:checked`);
        if (!respostaSelecionada) {
            todasRespondidas = false;
            return;
        }

        const valorResposta = parseFloat(respostaSelecionada.value);
        const pontuacao = valorResposta * questao.peso;
        notaTotal += pontuacao;

        const questaoInfo = {
            titulo: questao.titulo,
            resposta: respostaSelecionada.nextSibling.textContent,
            pontuacao: valorResposta,
            valor: valorResposta
        };

        respostasUsuario.push(questaoInfo);

        if (valorResposta === 1) questoesMaxima.push(questaoInfo);
        else if (valorResposta === 0.75) questoesAlta.push(questaoInfo);
        else if (valorResposta === 0.5) questoesBaixa.push(questaoInfo);
        else if (valorResposta === 0) questoesZerada.push(questaoInfo);
    });

    if (!todasRespondidas) {
        alert('Por favor, responda todas as questões antes de finalizar.');
        return;
    }

    notaTotal = (notaTotal * 100).toFixed(2);

    document.getElementById('notaFinal').textContent = `${notaTotal}%`;
    document.getElementById('avaliadorInfo').innerHTML = `<p style="text-align: center; margin: 10px 0;"><strong>Avaliador:</strong> ${avaliador}</p>`;

    const categoriasContainer = document.getElementById('categoriasContainer');
    categoriasContainer.innerHTML = `
        <button class="categoria-btn maxima" onclick="mostrarCategoria('maxima')">
            Nota Máxima <span class="categoria-numero">${questoesMaxima.length}</span>
        </button>
        <button class="categoria-btn alta" onclick="mostrarCategoria('alta')">
            Nota Alta (0.75) <span class="categoria-numero">${questoesAlta.length}</span>
        </button>
        <button class="categoria-btn baixa" onclick="mostrarCategoria('baixa')">
            Nota Baixa (0.5) <span class="categoria-numero">${questoesBaixa.length}</span>
        </button>
        <button class="categoria-btn zerada" onclick="mostrarCategoria('zerada')">
            Zeradas (0) <span class="categoria-numero">${questoesZerada.length}</span>
        </button>
    `;

    criarListaQuestoes('maxima', questoesMaxima, 'Questões com Nota Máxima', '#4CAF50');
    criarListaQuestoes('alta', questoesAlta, 'Questões com Nota Alta (0.75)', '#FFC107');
    criarListaQuestoes('baixa', questoesBaixa, 'Questões com Nota Baixa (0.5)', '#FF9800');
    criarListaQuestoes('zerada', questoesZerada, 'Questões Zeradas (0)', '#f44336');

    document.getElementById('formulario').style.display = 'none';
    document.getElementById('resultado').style.display = 'block';

    // Exibir assinatura (se já tiver)
    if (window.assinaturaDataURL) {
        exibirAssinatura();
    }

    // Mostrar categoria crítica
    if (questoesZerada.length > 0) mostrarCategoria('zerada');
    else if (questoesBaixa.length > 0) mostrarCategoria('baixa');
    else if (questoesAlta.length > 0) mostrarCategoria('alta');
    else mostrarCategoria('maxima');
}

// === FUNÇÕES AUXILIARES (mantidas) ===
function criarListaQuestoes(id, questoes, titulo, cor) { /* ... seu código ... */ }
function mostrarCategoria(categoria) { /* ... seu código ... */ }
function toggleTodasQuestoes() { /* ... seu código ... */ }
function gerarTodasQuestoes() { /* ... seu código ... */ }

// === EXIBIR ASSINATURA NO RESULTADO ===
function exibirAssinatura() {
    if (window.assinaturaDataURL && document.getElementById('assinaturaContainer')) {
        document.getElementById('assinaturaContainer').innerHTML = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #5b5b5b;">
                <h3 style="text-align: center; margin-bottom: 10px;">Assinatura Digital</h3>
                <div style="text-align: center;">
                    <img src="${window.assinaturaDataURL}" alt="Assinatura" style="max-width: 100%; border: 2px solid #5b5b5b; border-radius: 8px; background-color: white; padding: 10px;">
                </div>
            </div>
        `;
    }
}

// === FLUXO FINAL COM PDF ===
async function finalizarComPDF() {
    try {
        calcularNota();

        const pdfResultado = await gerarPDFChecklist();
        if (!pdfResultado) return;

        // Baixar PDF
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfResultado.blob);
        link.download = pdfResultado.nomeArquivo;
        link.click();

        // Mensagem de sucesso
        const resultadoSection = document.getElementById('resultado');
        const sucessoDiv = document.createElement('div');
        sucessoDiv.style.cssText = `
            text-align: center; margin: 20px 0; padding: 15px;
            background-color: #1a1a1a; border: 2px solid #4CAF50;
            border-radius: 8px; color: #4CAF50; font-weight: bold;
        `;
        sucessoDiv.innerHTML = `
            <p>PDF gerado com sucesso!</p>
            <p><strong>${pdfResultado.nomeArquivo}</strong></p>
            <p>Pronto para auditoria.</p>
        `;
        resultadoSection.appendChild(sucessoDiv);

    } catch (error) {
        console.error('Erro ao finalizar:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
    }
}

// === EVENTO DO BOTÃO ===
document.addEventListener('DOMContentLoaded', () => {
    gerarFormulario();
    document.getElementById('enviar-btn').addEventListener('click', () => {
        window.abrirModalAssinatura();
    });
});

// === SOBRESCREVER confirmarAssinatura DO assinatura.js ===
window.confirmarAssinatura = function() {
    if (window.assinaturaVazia) {
        alert('Por favor, faça sua assinatura antes de confirmar.');
        return;
    }
    window.assinaturaDataURL = canvas.toDataURL('image/png');
    window.fecharModalAssinatura();
    finalizarComPDF();
};

// Variáveis globais
let respostasUsuario = [];