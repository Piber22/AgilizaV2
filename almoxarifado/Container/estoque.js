// =============================
// CONFIGURAÇÕES
// =============================

// URL da aba de ESTOQUE (com os itens e quantidades atuais)
const estoqueCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMs4JxlOx5o6W5cUGRmytAANh8B5HKO6yhvbLuYinisnZeU01mNM5DBAnopBGg9FYXMg0HXKMnNvek/pub?output=csv";

// URL da aba de MOVIMENTAÇÕES (com o histórico de entradas e saídas)
// Substitua SHEET_GID pelo gid da aba de movimentações
const movimentacoesCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMs4JxlOx5o6W5cUGRmytAANh8B5HKO6yhvbLuYinisnZeU01mNM5DBAnopBGg9FYXMg0HXKMnNvek/pub?gid=1661889548&output=csv";

let dadosEstoque = [];
let dadosMovimentacoes = [];


// =============================
// CARREGAR ESTOQUE ATUAL
// =============================
async function carregarEstoque() {
    try {
        const response = await fetch(estoqueCSVUrl);
        const csvText = await response.text();
        const linhas = csvText.split("\n").map(l => l.trim()).filter(l => l);

        dadosEstoque = [];
        const categorias = new Set();

        // Ignora a primeira linha (cabeçalho)
        for (let i = 1; i < linhas.length; i++) {
            const colunas = linhas[i].split(",");

            if (colunas.length >= 4) {
                dadosEstoque.push({
                    id: colunas[0],
                    item: colunas[1],
                    categoria: colunas[2],
                    quantidade: parseInt(colunas[3]) || 0
                });
                categorias.add(colunas[2]);
            }
        }

        // Preencher filtro de categorias
        const selectCat = document.getElementById("filtroCategoria");
        selectCat.innerHTML = '<option value="">Todas as categorias</option>';
        [...categorias].sort().forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            selectCat.appendChild(option);
        });

        exibirEstoque(dadosEstoque);
    } catch (error) {
        console.error("Erro ao carregar estoque:", error);
        document.querySelector("#tabelaEstoque tbody").innerHTML =
            '<tr><td colspan="5" class="loading">Erro ao carregar dados</td></tr>';
    }
}


// =============================
// EXIBIR ESTOQUE
// =============================
function exibirEstoque(dados) {
    const tbody = document.querySelector("#tabelaEstoque tbody");

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Nenhum item encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map(item => {
        const status = item.quantidade <= 5 ? 'status-baixo' : 'status-ok';
        const statusTexto = item.quantidade <= 5 ? 'Baixo' : 'OK';

        return `
            <tr>
                <td>${item.id}</td>
                <td>${item.item}</td>
                <td>${item.categoria}</td>
                <td>${item.quantidade}</td>
                <td class="${status}">${statusTexto}</td>
            </tr>
        `;
    }).join('');
}


// =============================
// FILTRAR ESTOQUE
// =============================
function filtrarEstoque() {
    const filtroTexto = document.getElementById("filtroEstoque").value.toLowerCase();
    const filtroCategoria = document.getElementById("filtroCategoria").value;

    const filtrados = dadosEstoque.filter(item => {
        const matchTexto = item.item.toLowerCase().includes(filtroTexto);
        const matchCategoria = !filtroCategoria || item.categoria === filtroCategoria;
        return matchTexto && matchCategoria;
    });

    exibirEstoque(filtrados);
}


// =============================
// CARREGAR MOVIMENTAÇÕES
// =============================
async function carregarMovimentacoes() {
    try {
        const response = await fetch(movimentacoesCSVUrl);
        const csvText = await response.text();
        const linhas = csvText.split("\n").map(l => l.trim()).filter(l => l);

        dadosMovimentacoes = [];

        // Ignora a primeira linha (cabeçalho)
        // Ajuste os índices conforme a estrutura da sua aba de movimentações
        for (let i = 1; i < linhas.length; i++) {
            const colunas = linhas[i].split(",");

            if (colunas.length >= 7) {
                dadosMovimentacoes.push({
                    data: colunas[0],        // Data
                    horario: colunas[1],     // Horário
                    id: colunas[2],          // ID do item
                    item: colunas[3],        // Nome do item
                    tipo: colunas[4],        // Entrada ou Saída
                    quantidade: colunas[5],  // Quantidade
                    responsavel: colunas[6]  // Responsável
                });
            }
        }

        // Ordenar do mais recente para o mais antigo
        dadosMovimentacoes.reverse();

        exibirMovimentacoes(dadosMovimentacoes);
    } catch (error) {
        console.error("Erro ao carregar movimentações:", error);
        document.querySelector("#tabelaMovimentacoes tbody").innerHTML =
            '<tr><td colspan="6" class="loading">Erro ao carregar dados</td></tr>';
    }
}


// =============================
// EXIBIR MOVIMENTAÇÕES
// =============================
function exibirMovimentacoes(dados) {
    const tbody = document.querySelector("#tabelaMovimentacoes tbody");

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Nenhuma movimentação encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map(mov => {
        const tipoClass = mov.tipo === 'Entrada' ? 'entrada' : 'saida';

        return `
            <tr>
                <td>${mov.data}</td>
                <td>${mov.horario}</td>
                <td>${mov.item}</td>
                <td class="${tipoClass}">${mov.tipo}</td>
                <td>${mov.quantidade}</td>
                <td>${mov.responsavel}</td>
            </tr>
        `;
    }).join('');
}


// =============================
// FILTRAR MOVIMENTAÇÕES
// =============================
function filtrarMovimentacoes() {
    const filtroTexto = document.getElementById("filtroMovItem").value.toLowerCase();
    const dataInicio = document.getElementById("filtroDataInicio").value;
    const dataFim = document.getElementById("filtroDataFim").value;
    const filtroTipo = document.getElementById("filtroTipo").value;

    const filtrados = dadosMovimentacoes.filter(mov => {
        const matchTexto = mov.item.toLowerCase().includes(filtroTexto);
        const matchTipo = !filtroTipo || mov.tipo === filtroTipo;

        // Filtro de data (assumindo formato DD/MM/YYYY)
        let matchData = true;
        if (dataInicio || dataFim) {
            const partesData = mov.data.split('/');
            if (partesData.length === 3) {
                const dataMovStr = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

                if (dataInicio && dataMovStr < dataInicio) matchData = false;
                if (dataFim && dataMovStr > dataFim) matchData = false;
            }
        }

        return matchTexto && matchTipo && matchData;
    });

    exibirMovimentacoes(filtrados);
}


// =============================
// TROCAR ABAS
// =============================
function trocarAba(aba) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover active dos botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Ativar aba selecionada
    document.getElementById(aba).classList.add('active');
    event.target.classList.add('active');

    // Carregar dados de movimentações ao entrar na aba pela primeira vez
    if (aba === 'movimentacoes' && dadosMovimentacoes.length === 0) {
        carregarMovimentacoes();
    }
}


// =============================
// INICIALIZAR
// =============================
carregarEstoque();