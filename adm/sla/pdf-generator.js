// pdf-generator.js
// Responsável EXCLUSIVAMENTE por gerar o PDF do checklist
// Não altera lógica de avaliação, apenas exporta o resultado visual

async function gerarPDFChecklist() {
    const { jsPDF } = window.jspdf;

    // === 1. CAPTURAR TELA DO RESULTADO (com html2canvas) ===
    const resultadoElement = document.getElementById('resultado');
    if (!resultadoElement) {
        alert('Erro: Resultado não encontrado. Finalize a avaliação primeiro.');
        return null;
    }

    try {
        const canvas = await html2canvas(resultadoElement, {
            scale: 2,
            backgroundColor: '#201F20',
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // === 2. CRIAR PDF COM jsPDF ===
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // === CABEÇALHO COM LOGO ===
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '../../img/icone.png'; // Caminho relativo ao HTML

        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = () => {
                console.warn('Logo não carregada. Continuando sem logo...');
                resolve();
            };
        });

        const logoWidth = 40;
        const logoHeight = 40;
        const logoX = (pageWidth - logoWidth) / 2;

        if (logoImg.complete && logoImg.naturalHeight !== 0) {
            pdf.addImage(logoImg, 'PNG', logoX, 10, logoWidth, logoHeight);
        }

        // Título
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(233, 75, 34); // #E94B22
        pdf.text('MANSERV - Equipe HSANA', pageWidth / 2, 55, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text('CHECKLIST DE QUALIDADE', pageWidth / 2, 63, { align: 'center' });

        // Linha laranja
        pdf.setDrawColor(233, 75, 34);
        pdf.setLineWidth(0.5);
        pdf.line(20, 68, pageWidth - 20, 68);

        // === DADOS GERAIS ===
        const avaliador = document.getElementById('avaliador')?.value || 'Não informado';
        const dataAtual = new Date().toLocaleString('pt-BR');
        const setor = "UTI 3º Andar"; // Futuro: campo no form

        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Avaliador: ${avaliador}`, 20, 78);
        pdf.text(`Data/Hora: ${dataAtual}`, 20, 85);
        pdf.text(`Setor: ${setor}`, 20, 92);

        // Linha cinza
        pdf.setDrawColor(100, 100, 100);
        pdf.line(20, 98, pageWidth - 20, 98);

        // === NOTA FINAL ===
        const notaFinal = document.getElementById('notaFinal')?.textContent || '0%';
        pdf.setFontSize(22);
        pdf.setTextColor(233, 75, 34);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`NOTA FINAL: ${notaFinal}`, pageWidth / 2, 110, { align: 'center' });

        // === CATEGORIAS COM CORES ===
        const catSpans = document.querySelectorAll('.categoria-numero');
        const catValues = Array.from(catSpans).map(span => span.textContent);

        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Máxima (1.0)', 35, 120);
        pdf.text('Alta (0.75)', 75, 120);
        pdf.text('Baixa (0.5)', 115, 120);
        pdf.text('Zerada (0)', 155, 120);

        pdf.setFontSize(18);
        pdf.setTextColor(76, 175, 80);   // Verde
        pdf.text(catValues[0] || '0', 45, 130);
        pdf.setTextColor(255, 193, 7);   // Amarelo
        pdf.text(catValues[1] || '0', 85, 130);
        pdf.setTextColor(255, 152, 0);   // Laranja
        pdf.text(catValues[2] || '0', 125, 130);
        pdf.setTextColor(244, 67, 54);   // Vermelho
        pdf.text(catValues[3] || '0', 165, 130);

        // === QUESTÕES ZERADAS ===
        let y = 145;
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('QUESTÕES ZERADAS:', 20, y);
        y += 7;

        const zeradas = document.querySelectorAll('#lista-zerada .problema-item');
        if (zeradas.length > 0) {
            pdf.setFont('helvetica', 'normal');
            zeradas.forEach(item => {
                const titulo = item.querySelector('.problema-titulo')?.textContent || '';
                const resposta = item.querySelector('.problema-resposta')?.textContent || '';
                const texto = `• ${titulo} → ${resposta}`;
                const linhas = pdf.splitTextToSize(texto, pageWidth - 50);
                linhas.forEach(linha => {
                    if (y > 270) {
                        pdf.addPage();
                        y = 20;
                    }
                    pdf.text(linha, 25, y);
                    y += 6;
                });
                y += 2;
            });
        } else {
            pdf.setFont('helvetica', 'italic');
            pdf.text('Nenhuma questão zerada.', 25, y);
            y += 10;
        }

        // === ASSINATURA DIGITAL ===
        const assinaturaDataURL = window.assinaturaDataURL || null;
        if (assinaturaDataURL) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('ASSINATURA DIGITAL DO AVALIADOR', 20, y);
            y += 10;
            try {
                pdf.addImage(assinaturaDataURL, 'PNG', 40, y, 120, 50);
                y += 60;
            } catch (e) {
                pdf.setFont('helvetica', 'italic');
                pdf.text('(Assinatura não disponível)', 40, y + 25);
                y += 40;
            }
        }

        // === RODAPÉ COM CÓDIGO DE VERIFICAÇÃO ===
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        const codigo = `CHK-${new Date().toISOString().slice(0,16).replace(/[-T:]/g,'').slice(0,13)}-${notaFinal.replace(/[^0-9]/g,'')}`;
        pdf.text(codigo, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text(`Gerado em: ${dataAtual}`, 20, pageHeight - 10);

        // === RETORNAR PDF COMO BASE64 ===
        return {
            base64: pdf.output('datauribase64'),
            blob: pdf.output('blob'),
            codigo: codigo,
            nomeArquivo: `${codigo}.pdf`
        };

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar o PDF. Verifique o console.');
        return null;
    }
}

// === EXPORTAR FUNÇÃO GLOBAL (para uso futuro) ===
window.gerarPDFChecklist = gerarPDFChecklist;