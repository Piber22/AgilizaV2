// sheet.js - Integração com Google Sheets via CSV
let dadosPlanilha = []; // Armazena os dados parseados

// URL da planilha em CSV (ajuste gid se necessário)
const urlCSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?output=csv&gid=0';

// Função para carregar dados da planilha
async function carregarDados() {
    try {
        const response = await fetch(urlCSV);
        if (!response.ok) throw new Error('Erro ao carregar planilha');
        const csvText = await response.text();

        // Parse CSV com PapaParse
        const resultado = Papa.parse(csvText, {
            header: true, // Primeira linha como headers
            skipEmptyLines: true,
            dynamicTyping: { date: true } // Converte datas automaticamente
        });

        dadosPlanilha = resultado.data;
        console.log('Dados carregados:', dadosPlanilha); // Para debug

        // Preencher select de responsáveis (únicos da planilha)
        preencherResponsaveis();

        // Carregar dados iniciais na seção #dados
        filtrarEExibirDados();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        document.getElementById('dados').innerHTML += '<p style="color: red;">Erro ao carregar planilha. Verifique o link.</p>';
    }
}

// Preencher select #responsavel com opções únicas da planilha (além das fixas)
function preencherResponsaveis() {
    const select = document.getElementById('responsavel');
    const responsaveisUnicos = [...new Set(dadosPlanilha.map(row => row.Responsavel).filter(Boolean))];

    responsaveisUnicos.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.textContent = nome;
        select.appendChild(option);
    });
}

// Filtrar e exibir dados na seção #dados (tabela dinâmica)
function filtrarEExibirDados() {
    const dataSelecionada = document.getElementById('dataRecebimento').value;
    const responsavelSelecionado = document.getElementById('responsavel').value;

    const dadosFiltrados = dadosPlanilha.filter(row => {
        const dataRow = row.Data ? new Date(row.Data).toISOString().split('T')[0] : '';
        return (!dataSelecionada || dataRow === dataSelecionada) &&
               (!responsavelSelecionado || row.Responsavel === responsavelSelecionado);
    });

    const secaoDados = document.getElementById('dados');
    if (dadosFiltrados.length === 0) {
        secaoDados.innerHTML = '<h2>Consulta</h2><p>Nenhum dado encontrado para os filtros selecionados.</p>';
        return;
    }

    // Criar tabela dinâmica
    let tabelaHTML = '<h2>Consulta</h2><table><thead><tr>';
    // Headers dinâmicos (ajuste se necessário)
    const headers = Object.keys(dadosFiltrados[0]);
    headers.forEach(header => {
        tabelaHTML += `<th>${header}</th>`;
    });
    tabelaHTML += '</tr></thead><tbody>';

    dadosFiltrados.forEach(row => {
        tabelaHTML += '<tr>';
        headers.forEach(header => {
            tabelaHTML += `<td>${row[header] || ''}</td>`;
        });
        tabelaHTML += '</tr>';
    });

    tabelaHTML += '</tbody></table>';
    secaoDados.innerHTML = tabelaHTML;

    // Estilo básico (adicione no CSS se quiser)
    const style = document.createElement('style');
    style.textContent = `
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    `;
    document.head.appendChild(style);
}

// Event listeners para refiltrar ao mudar inputs
document.getElementById('dataRecebimento').addEventListener('change', filtrarEExibirDados);
document.getElementById('responsavel').addEventListener('change', filtrarEExibirDados);

// Gerar mensagem no botão #gerarBtn (integre com recebimento.js se necessário)
document.getElementById('gerarBtn').addEventListener('click', () => {
    const dataSelecionada = document.getElementById('dataRecebimento').value;
    const responsavelSelecionado = document.getElementById('responsavel').value;

    if (!dataSelecionada || !responsavelSelecionado) {
        alert('Selecione data e responsável!');
        return;
    }

    const dadosFiltrados = dadosPlanilha.filter(row => {
        const dataRow = row.Data ? new Date(row.Data).toISOString().split('T')[0] : '';
        return dataRow === dataSelecionada && row.Responsavel === responsavelSelecionado;
    });

    if (dadosFiltrados.length === 0) {
        document.getElementById('resultado').value = 'Nenhum item encontrado.';
        return;
    }

    // Gerar mensagem formatada (exemplo: resumo de itens)
    let mensagem = `Mensagem de Recebimento - ${dataSelecionada}\nResponsável: ${responsavelSelecionado}\n\nItens Recebidos:\n`;
    let totalItens = 0;

    dadosFiltrados.forEach(row => {
        mensagem += `- ${row.Item || 'Item'}: ${row.Quantidade || 0} un. (${row.Observacoes || 'OK'})\n`;
        totalItens += parseInt(row.Quantidade || 0);
    });

    mensagem += `\nTotal: ${totalItens} itens. Confirmação pendente.`;

    document.getElementById('resultado').value = mensagem;
});

// Copiar mensagem (adicione se não tiver no recebimento.js)
document.getElementById('copiarBtn').addEventListener('click', () => {
    const textarea = document.getElementById('resultado');
    textarea.select();
    document.execCommand('copy');
    alert('Mensagem copiada!');
});

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', carregarDados);