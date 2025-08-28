// script.js
document.addEventListener('DOMContentLoaded', () => {
  const addServiceForm = document.getElementById('addServiceForm');
  const serviceList = document.getElementById('serviceList');
  const totalGainsEl = document.getElementById('totalGains');
  const serviceCountEl = document.getElementById('serviceCount');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const borderColors = ['#0072c6', '#6a00ff', '#fa6800', '#18837e', '#a20025', '#00a300'];

  const valorAtendimentoBase = 120.00;
  const valorHoraExtra = 25.00;
  const valorDiaria = 250.00;

  let allServices = [];
  let totalGains = 0;
  let serviceCount = 0;

  addServiceForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const serviceName = document.getElementById('serviceName').value;
    const serviceDate = document.getElementById('serviceDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const serviceType = document.getElementById('serviceType').value;

    if (!serviceName || !serviceDate || !startTime || !endTime) return alert('Preencha todos os campos.');

    const startDateTime = new Date(`${serviceDate}T${startTime}`);
    let endDateTime = new Date(`${serviceDate}T${endTime}`);
    if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);

    const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
    const baseHours = 3;
    const gracePeriodLimit = baseHours + (20 / 60);
    let extraHours = 0;
    if (totalHours > gracePeriodLimit) extraHours = totalHours - gracePeriodLimit;

    const atendimentoTotal = valorAtendimentoBase + (extraHours * valorHoraExtra);
    let serviceValue = (serviceType === 'atendimento') ? atendimentoTotal : valorDiaria;

    allServices.push({
      name: serviceName,
      date: startDateTime,
      atendimentoValue: atendimentoTotal,
      diariaValue: valorDiaria,
      chosenValue: serviceValue,
      hours: totalHours
    });

    renderService(serviceName, startDateTime, endDateTime, totalHours, serviceType, atendimentoTotal, valorDiaria);
    updateSummary();
    addServiceForm.reset();
  });

  function renderService(serviceName, startDateTime, endDateTime, totalHours, serviceType, atendimentoTotal, valorDiaria) {
    const listItem = document.createElement('li');
    listItem.classList.add('service-item');
    const colorIndex = (serviceCount) % borderColors.length;
    listItem.style.borderLeftColor = borderColors[colorIndex];

    const durationH = Math.floor(totalHours);
    const durationM = Math.round((totalHours - durationH) * 60);
    const durationText = `${durationH}h ${durationM}min`;

    const comparisonText = serviceType === 'atendimento'
      ? valorDiaria > atendimentoTotal ? `Compensava mais a Diária (R$ ${valorDiaria.toFixed(2)})` : 'Atendimento Padrão foi a melhor opção.'
      : atendimentoTotal > valorDiaria ? `Compensava mais o Atendimento (R$ ${atendimentoTotal.toFixed(2)})` : 'A Diária foi a melhor opção.';

    const hourlyRate = totalHours > 0 ? ((serviceType === 'atendimento' ? atendimentoTotal : valorDiaria) / totalHours) : 0;
    const extraHours = totalHours > (3 + 20/60) ? totalHours - (3 + 20/60) : 0;
    const extraHoursH = Math.floor(extraHours);
    const extraHoursM = Math.round((extraHours - extraHoursH) * 60);
    const difference = Math.abs(atendimentoTotal - valorDiaria);

    let analysisHTML = '';
    if (serviceType === 'atendimento') {
      if (atendimentoTotal >= valorDiaria) analysisHTML = `<p class="analysis-result">Você ganhou R$ ${difference.toFixed(2)} a mais do que se tivesse cobrado a diária.</p>`;
      else analysisHTML = `<p class="analysis-result loss">Você deixou de ganhar R$ ${difference.toFixed(2)} por não ter cobrado a diária.</p>`;
    } else {
      if (valorDiaria >= atendimentoTotal) analysisHTML = `<p class="analysis-result">Você ganhou R$ ${difference.toFixed(2)} a mais por ter cobrado a diária.</p>`;
      else analysisHTML = `<p class="analysis-result loss">Você deixou de ganhar R$ ${difference.toFixed(2)} por não ter cobrado por atendimento.</p>`;
    }

    const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    listItem.innerHTML = `
      <div class="service-item-main">
        <div class="details">
          <div class="service-title">${serviceName}</div>
          <div class="timestamps">
            <div><strong>Entrada:</strong> ${startDateTime.toLocaleString('pt-BR', formatOptions)} | <strong>Saída:</strong> ${endDateTime.toLocaleString('pt-BR', formatOptions)}</div>
          </div>
          <div class="duration">Duração total: ${durationText}</div>
          <div class="comparison">${comparisonText}</div>
        </div>
        <div class="value">R$ ${(serviceType === 'atendimento' ? atendimentoTotal : valorDiaria).toFixed(2)}</div>
      </div>
      <button class="details-toggle">Ver detalhes</button>
      <div class="details-content">
        <p><strong>Regras de Cálculo:</strong></p>
        <p>• Valor Fixo Atendimento: R$ ${valorAtendimentoBase.toFixed(2)}</p>
        <p>• Valor por Hora Extra: R$ ${valorHoraExtra.toFixed(2)}</p>
        <hr>
        <p><strong>Detalhamento do Serviço:</strong></p>
        <p>• Horas Extras Feitas: ${extraHoursH}h ${extraHoursM}min</p>
        <p>• Valor Recebido por Extras: R$ ${(extraHours * valorHoraExtra).toFixed(2)}</p>
        <p>• Ganho por Hora no Serviço: R$ ${hourlyRate.toFixed(2)}</p>
        <div class="analysis-section">
          <p><strong>Análise Financeira:</strong></p>
          <p>• Valor como Atendimento: R$ ${atendimentoTotal.toFixed(2)}</p>
          <p>• Valor como Diária: R$ ${valorDiaria.toFixed(2)}</p>
          ${analysisHTML}
        </div>
      </div>
    `;

    serviceList.prepend(listItem);

    const detailsToggleBtn = listItem.querySelector('.details-toggle');
    detailsToggleBtn.addEventListener('click', () => {
      const detailsContent = listItem.querySelector('.details-content');
      detailsContent.classList.toggle('visible');
      detailsToggleBtn.textContent = detailsContent.classList.contains('visible') ? 'Ocular detalhes' : 'Ver detalhes';
    });
  }

  function updateSummary() {
    totalGains = allServices.reduce((sum, service) => sum + service.chosenValue, 0);
    serviceCount = allServices.length;
    totalGainsEl.textContent = `R$ ${totalGains.toFixed(2)}`;
    serviceCountEl.textContent = serviceCount;
  }

  downloadPdfBtn.addEventListener('click', () => {
    if (allServices.length === 0) return alert("Nenhum serviço foi adicionado para gerar o relatório.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;
    doc.setFontSize(18);
    doc.text("Relatório de Ganhos", 14, y);
    y += 10;
    doc.setFontSize(12);

    const reportTotalGains = allServices.reduce((sum, s) => sum + s.chosenValue, 0);
    const reportTotalHours = allServices.reduce((sum, s) => sum + s.hours, 0);
    const reportAvgHourlyRate = reportTotalHours > 0 ? (reportTotalGains / reportTotalHours) : 0;
    const reportTotalHoursH = Math.floor(reportTotalHours);
    const reportTotalHoursM = Math.round((reportTotalHours - reportTotalHoursH) * 60);

    doc.text(`Total de Serviços: ${allServices.length}`, 14, y); y += 7;
    doc.text(`Total de Horas Trabalhadas: ${reportTotalHoursH}h ${reportTotalHoursM}min`, 14, y); y += 7;
    doc.text(`Valor Total Recebido: R$ ${reportTotalGains.toFixed(2)}`, 14, y); y += 7;
    doc.text(`Média de Ganhos por Hora: R$ ${reportAvgHourlyRate.toFixed(2)}`, 14, y); y += 10;

    allServices.forEach((s, index) => {
      const hoursH = Math.floor(s.hours);
      const hoursM = Math.round((s.hours - hoursH) * 60);
      doc.text(`Serviço ${index + 1}: ${s.name}`, 14, y); y += 6;
      doc.text(`Data: ${s.date.toLocaleDateString('pt-BR')}`, 14, y); y += 6;
      doc.text(`Duração: ${hoursH}h ${hoursM}min`, 14, y); y += 6;
      doc.text(`Valor Recebido: R$ ${s.chosenValue.toFixed(2)}`, 14, y); y += 8;

      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save("relatorio-de-ganhos.pdf");
  });
});