// script.js
document.addEventListener('DOMContentLoaded', () => {
  const addServiceForm = document.getElementById('addServiceForm');
  const serviceList = document.getElementById('serviceList');
  const totalGainsEl = document.getElementById('totalGains');
  const serviceCountEl = document.getElementById('serviceCount');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const borderColors = ['#0072c6', '#6a00ff', '#fa6800', '#18837e', '#a20025', '#00a300'];

  let allServices = [];
  let totalGains = 0;
  let serviceCount = 0;

  addServiceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const serviceName = document.getElementById('serviceName').value;
      const serviceDate = document.getElementById('serviceDate').value;
      const startTime = document.getElementById('startTime').value;
      const endTime = document.getElementById('endTime').value;
      const serviceType = document.getElementById('serviceType').value;

      if (!serviceName || !serviceDate || !startTime || !endTime) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      const startDateTime = new Date(`${serviceDate}T${startTime}`);
      let endDateTime = new Date(`${serviceDate}T${endTime}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        alert('A data ou hora inserida é inválida.');
        return;
      }

      if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);

      const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
      const baseHours = 3;
      const gracePeriodLimit = baseHours + (20 / 60);
      let extraHours = 0;
      if (totalHours > gracePeriodLimit) extraHours = totalHours - gracePeriodLimit;

      const valorAtendimentoBase = 120.00;
      const valorHoraExtra = 25.00;
      const valorDiaria = 250.00;
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
    } catch (error) {
      console.error("Ocorreu um erro:", error);
      alert("Não foi possível adicionar o serviço.");
    }
  });

  function renderService(serviceName, startDateTime, endDateTime, totalHours, serviceType, atendimentoTotal, valorDiaria) {
    const listItem = document.createElement('li');
    listItem.classList.add('service-item');
    const colorIndex = serviceCount % borderColors.length;
    listItem.style.borderLeftColor = borderColors[colorIndex];

    const durationH = Math.floor(totalHours);
    const durationM = Math.round((totalHours - durationH) * 60);
    const durationText = `${durationH}h ${durationM}min`;

    let comparisonText = '';
    if (serviceType === 'atendimento') {
      comparisonText = valorDiaria > atendimentoTotal
        ? `Compensava mais a Diária (R$ ${valorDiaria.toFixed(2)})`
        : 'Atendimento Padrão foi a melhor opção.';
    } else {
      comparisonText = atendimentoTotal > valorDiaria
        ? `Compensava mais o Atendimento (R$ ${atendimentoTotal.toFixed(2)})`
        : 'A Diária foi a melhor opção.';
    }

    const hourlyRate = totalHours > 0 ? ((serviceType === 'atendimento' ? atendimentoTotal : valorDiaria) / totalHours) : 0;
    const extraHours = totalHours > (3 + 20/60) ? totalHours - (3 + 20/60) : 0;
    const extraHoursH = Math.floor(extraHours);
    const extraHoursM = Math.round((extraHours - extraHoursH) * 60);
    const difference = Math.abs(atendimentoTotal - valorDiaria);

    let analysisHTML = '';
    if (serviceType === 'atendimento') {
      if (atendimentoTotal >= valorDiaria)
        analysisHTML = `<p class="analysis-result">Você ganhou R$ ${difference.toFixed(2)} a mais do que se tivesse cobrado por diária.</p>`;
      else
        analysisHTML = `<p class="analysis-result loss">Você deixou de ganhar R$ ${difference.toFixed(2)} por não ter cobrado a diária.</p>`;
    } else {
      if (valorDiaria >= atendimentoTotal)
        analysisHTML = `<p class="analysis-result">Você ganhou R$ ${difference.toFixed(2)} a mais por ter cobrado a diária.</p>`;
      else
        analysisHTML = `<p class="analysis-result loss">Você deixou de ganhar R$ ${difference.toFixed(2)} por não ter cobrado por atendimento.</p>`;
    }

    const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    listItem.innerHTML = `
      <div class="service-item-main">
        <div class="details">
          <div class="service-title">${serviceName}</div>
          <div class="timestamps"><div><strong>Entrada:</strong> ${startDateTime.toLocaleString('pt-BR', formatOptions)} | <strong>Saída:</strong> ${endDateTime.toLocaleString('pt-BR', formatOptions)}</div></div>
          <div class="duration">Duração total: ${durationText}</div>
          <div class="comparison">${comparisonText}</div>
        </div>
        <div class="value">R$ ${(serviceType === 'atendimento' ? atendimentoTotal : valorDiaria).toFixed(2)}</div>
      </div>
      <button class="details-toggle">Ver detalhes</button>
      <div class="details-content">
        <p><strong>Cálculo Base:</strong></p>
        <p>• Horas Extras Feitas: ${extraHoursH}h ${extraHoursM}min</p>
        <p>• Valor Recebido por Extras: R$ ${(extraHours * 25).toFixed(2)}</p>
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
      detailsToggleBtn.textContent = detailsContent.classList.contains('visible') ? 'Ocultar detalhes' : 'Ver detalhes';
    });
  }

  function updateSummary() {
    totalGains = allServices.reduce((sum, service) => sum + service.chosenValue, 0);
    serviceCount = allServices.length;
    totalGainsEl.textContent = `R$ ${totalGains.toFixed(2)}`;
    serviceCountEl.textContent = serviceCount;
  }

  downloadPdfBtn.addEventListener('click', () => {
    if (allServices.length === 0) {
      alert("Nenhum serviço foi adicionado para gerar o relatório.");
      return;
    }

    const reportTotalGains = allServices.reduce((sum, s) => sum + s.chosenValue, 0);
    const reportTotalHours = allServices.reduce((sum, s) => sum + s.hours, 0);
    const reportAvgHourlyRate = reportTotalHours > 0 ? (reportTotalGains / reportTotalHours) : 0;
    const reportTotalHoursH = Math.floor(reportTotalHours);
    const reportTotalHoursM = Math.round((reportTotalHours - reportTotalHoursH) * 60);

    // HTML de cada serviço para o PDF
    let servicesHTML = '';
    allServices.forEach((s, index) => {
      const hoursH = Math.floor(s.hours);
      const hoursM = Math.round((s.hours - hoursH) * 60);
      servicesHTML += `
        <div style="margin-top: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
          <p><strong>Serviço ${index + 1}:</strong> ${s.name}</p>
          <p><strong>Data:</strong> ${s.date.toLocaleDateString('pt-BR')}</p>
          <p><strong>Duração:</strong> ${hoursH}h ${hoursM}min</p>
          <p><strong>Valor Recebido:</strong> R$ ${s.chosenValue.toFixed(2)}</p>
        </div>
      `;
    });

    const reportHTML = `
      <div style="font-family: Arial, sans-serif; padding: 25px; font-size: 12pt;">
        <h1 style="font-size: 18pt; color: #000; margin-bottom: 25px;">Relatório de Ganhos</h1>
        <div style="font-size: 14pt; line-height: 1.6;">
          <p><strong>Total de Horas Trabalhadas:</strong> ${reportTotalHoursH}h ${reportTotalHoursM}min</p>
          <p><strong>Valor Total Recebido:</strong> R$ ${reportTotalGains.toFixed(2)}</p>
          <p><strong>Média de Ganhos por Hora:</strong> R$ ${reportAvgHourlyRate.toFixed(2)}</p>
          ${servicesHTML}
        </div>
      </div>
    `;

    const reportElement = document.createElement('div');
    reportElement.innerHTML = reportHTML;

    const opt = {
      margin: 0.5,
      filename: 'relatorio-de-ganhos.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(reportElement).set(opt).save();
  });
});
