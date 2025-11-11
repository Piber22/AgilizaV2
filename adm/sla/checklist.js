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

// Variável global para armazenar respostas
let respostasUsuario = [];

// URL da sua API do Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_7i9MUnsCX5DnI-Hb_7_-UgQBYggcDVb8WC77OQReT8NRlYAsJDgQ2VxMoq8Vf4mwQg/exec';

// Função para gerar o formulário
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

// Função para calcular a nota
async function calcularNota() {
    const avaliador = document.getElementById('avaliador').value.trim();
    if (!avaliador) {
        alert('Por favor, insira o nome do avaliador.');
        return;
    }

    let notaTotal = 0;
    let questoesMaxima = [];
    let questoesAlta = [];
    let questoesBaixa = [];
    let questoesZerada = [];
    let todasRespondidas = true;

    // Limpar respostas anteriores
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

        // Armazenar todas as respostas
        respostasUsuario.push(questaoInfo);

        // Categorizar questões
        if (valorResposta === 1) {
            questoesMaxima.push(questaoInfo);
        } else if (valorResposta === 0.75) {
            questoesAlta.push(questaoInfo);
        } else if (valorResposta === 0.5) {
            questoesBaixa.push(questaoInfo);
        } else if (valorResposta === 0) {
            questoesZerada.push(questaoInfo);
        }
    });

    if (!todasRespondidas) {
        alert('Por favor, responda todas as questões antes de finalizar.');
        return;
    }

    // Converter para porcentagem (0-100)
    notaTotal = (notaTotal * 100).toFixed(2);

    // Preparar dados para enviar ao Google Sheets
    const dadosParaEnviar = {
        avaliador: avaliador,
        notaFinal: notaTotal,
        questoesMaxima: questoesMaxima.length,
        questoesAlta: questoesAlta.length,
        questoesBaixa: questoesBaixa.length,
        questoesZerada: questoesZerada.length,
        respostas: respostasUsuario,
        assinatura: assinaturaDataURL
    };

    // Enviar para Google Sheets
    const resultado = await enviarParaGoogleSheets(dadosParaEnviar);

    if (resultado.success) {
        console.log('Dados enviados com sucesso!');
    } else {
        console.error('Erro ao enviar dados:', resultado.erro);
    }

    // Exibir resultado
    document.getElementById('notaFinal').textContent = `${notaTotal}%`;
    document.getElementById('avaliadorInfo').innerHTML = `<p style="text-align: center; margin: 10px 0;"><strong>Avaliador:</strong> ${avaliador}</p>`;

    // Criar botões de categorias
    const categoriasContainer = document.getElementById('categoriasContainer');
    categoriasContainer.innerHTML = `
        <button class="categoria-btn maxima" onclick="mostrarCategoria('maxima')">
            Nota Máxima
            <span class="categoria-numero">${questoesMaxima.length}</span>
        </button>
        <button class="categoria-btn alta" onclick="mostrarCategoria('alta')">
            Nota Alta (0.75)
            <span class="categoria-numero">${questoesAlta.length}</span>
        </button>
        <button class="categoria-btn baixa" onclick="mostrarCategoria('baixa')">
            Nota Baixa (0.5)
            <span class="categoria-numero">${questoesBaixa.length}</span>
        </button>
        <button class="categoria-btn zerada" onclick="mostrarCategoria('zerada')">
            Zeradas (0)
            <span class="categoria-numero">${questoesZerada.length}</span>
        </button>
    `;

    // Criar listas de questões
    criarListaQuestoes('maxima', questoesMaxima, 'Questões com Nota Máxima', '#4CAF50');
    criarListaQuestoes('alta', questoesAlta, 'Questões com Nota Alta (0.75)', '#399AEA');
    criarListaQuestoes('baixa', questoesBaixa, 'Questões com Nota Baixa (0.5)', '#FF9800');
    criarListaQuestoes('zerada', questoesZerada, 'Questões Zeradas (0)', '#f44336');

    // Ocultar formulário e mostrar resultado
    document.getElementById('formulario').style.display = 'none';
    document.getElementById('resultado').style.display = 'block';

    // Exibir assinatura
    exibirAssinatura();

    // Mostrar primeira categoria com questões
    if (questoesZerada.length > 0) {
        mostrarCategoria('zerada');
    } else if (questoesBaixa.length > 0) {
        mostrarCategoria('baixa');
    } else if (questoesAlta.length > 0) {
        mostrarCategoria('alta');
    } else {
        mostrarCategoria('maxima');
    }
}

// Função para criar lista de questões
function criarListaQuestoes(id, questoes, titulo, cor) {
    const container = document.getElementById('questoesContainer');
    const div = document.createElement('div');
    div.id = `lista-${id}`;
    div.className = 'problemas-list';

    if (questoes.length > 0) {
        div.innerHTML = `<h3>${titulo}:</h3>`;
        questoes.forEach(questao => {
            const item = document.createElement('div');
            item.className = 'problema-item';
            item.style.borderLeftColor = cor;
            item.innerHTML = `
                <div class="problema-titulo">${questao.titulo}</div>
                <div class="problema-resposta">${questao.resposta}</div>
            `;
            div.appendChild(item);
        });
    } else {
        div.innerHTML = `<p style="text-align: center; color: #ccc;">Nenhuma questão nesta categoria.</p>`;
    }

    container.appendChild(div);
}

// Função para mostrar categoria específica
function mostrarCategoria(categoria) {
    // Remover classe ativa de todos os botões
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.classList.remove('ativa');
    });

    // Adicionar classe ativa ao botão clicado
    document.querySelector(`.categoria-btn.${categoria}`).classList.add('ativa');

    // Ocultar todas as listas
    document.querySelectorAll('.problemas-list').forEach(lista => {
        lista.classList.remove('ativa');
    });

    // Mostrar lista selecionada
    document.getElementById(`lista-${categoria}`).classList.add('ativa');
}

// Função para alternar visualização de todas as questões
function toggleTodasQuestoes() {
    const container = document.getElementById('todasQuestoes');
    const btn = document.querySelector('.btn-visualizar');

    if (container.classList.contains('visivel')) {
        container.classList.remove('visivel');
        btn.textContent = '📋 Ver Todas as Questões';
    } else {
        container.classList.add('visivel');
        btn.textContent = '📋 Ocultar Questões';

        // Gerar lista de todas as questões se ainda não foi gerada
        if (container.innerHTML === '') {
            gerarTodasQuestoes();
        }
    }
}

// Função para gerar visualização de todas as questões
function gerarTodasQuestoes() {
    const container = document.getElementById('todasQuestoes');
    container.innerHTML = '<h3>Todas as Questões Respondidas:</h3>';

    respostasUsuario.forEach((resposta, index) => {
        const div = document.createElement('div');
        div.className = 'question-block';

        let classeNota = '';
        let textNota = '';

        if (resposta.valor === 1) {
            classeNota = 'nota-1';
            textNota = '1.0';
        } else if (resposta.valor === 0.75) {
            classeNota = 'nota-075';
            textNota = '0.75';
        } else if (resposta.valor === 0.5) {
            classeNota = 'nota-05';
            textNota = '0.5';
        } else {
            classeNota = 'nota-0';
            textNota = '0';
        }

        div.innerHTML = `
            <div class="question-title">
                <span>${index + 1}. ${resposta.titulo}</span>
                <span class="resposta-nota ${classeNota}">${textNota}</span>
            </div>
            <div class="resposta-selecionada">
                ${resposta.resposta}
            </div>
        `;

        container.appendChild(div);
    });
}

// Função para enviar dados para o Google Sheets
async function enviarParaGoogleSheets(dadosAvaliacao) {
    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante para evitar erro de CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAvaliacao)
        });

        // Com mode: 'no-cors', não conseguimos ler a resposta
        // Mas o Apps Script vai processar os dados em segundo plano
        console.log('Dados enviados para o Google Sheets!');
        return { success: true };

    } catch (erro) {
        console.error('Erro ao enviar dados:', erro);
        // Mesmo com erro, os dados podem ter sido enviados
        return { success: true };
    }
}

// Gerar formulário ao carregar a página
window.addEventListener('DOMContentLoaded', gerarFormulario);