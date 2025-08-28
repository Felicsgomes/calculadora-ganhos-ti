// Suas credenciais do Firebase já estão aqui
const firebaseConfig = {
  apiKey: "AIzaSyDakKq5sF2FbwgmZh0M847rR8XJBaiKNE8",
  authDomain: "controle-de-ganhos-be71e.firebaseapp.com",
  projectId: "controle-de-ganhos-be71e",
  storageBucket: "controle-de-ganhos-be71e.appspot.com",
  messagingSenderId: "893459783087",
  appId: "1:893459783087:web:3a8852fc8b23de8e2c635a"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // Elementos de Login e App
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentUserEl = document.getElementById('currentUser');
    
    // Elementos do App principal
    const addServiceForm = document.getElementById('addServiceForm');
    const serviceList = document.getElementById('serviceList');
    const totalGainsEl = document.getElementById('totalGains');
    const serviceCountEl = document.getElementById('serviceCount');

    // Elementos do Modal de Edição
    const editModal = document.getElementById('editModal');
    const editServiceForm = document.getElementById('editServiceForm');
    const closeModalBtn = document.querySelector('.close-button');

    const borderColors = ['#0072c6', '#6a00ff', '#fa6800', '#18837e', '#a20025', '#00a300'];
    let allServices = [];
    let currentUserName = localStorage.getItem('userName');

    // --- LÓGICA DE LOGIN E CONTROLE DE VISIBILIDADE ---
    function showApp() {
        currentUserEl.textContent = currentUserName;
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        loadServices();
    }

    function showLogin() {
        localStorage.removeItem('userName');
        currentUserName = null;
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }

    loginBtn.addEventListener('click', () => {
        const userName = usernameInput.value.trim();
        if (userName) {
            currentUserName = userName;
            localStorage.setItem('userName', currentUserName);
            showApp();
        } else {
            alert('Por favor, digite um nome de usuário.');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Você tem certeza que deseja sair?')) {
            showLogin();
        }
    });
    
    // --- LÓGICA DO FIREBASE (CRUD) ---
    async function loadServices() {
        if (!currentUserName) return;

        serviceList.innerHTML = '<p>Carregando serviços...</p>';
        try {
            const querySnapshot = await db.collection("servicos")
                .where("userName", "==", currentUserName)
                .orderBy("date", "desc")
                .get();
            
            allServices = [];
            serviceList.innerHTML = '';
            if (querySnapshot.empty) {
                serviceList.innerHTML = '<p>Nenhum serviço lançado por você ainda.</p>';
            }
            
            querySnapshot.forEach((doc) => {
                const serviceData = doc.data();
                serviceData.id = doc.id;
                const serviceWithJsDate = { ...serviceData, date: serviceData.date.toDate() };
                allServices.push(serviceWithJsDate);
                renderService(serviceWithJsDate);
            });
            updateSummary();
        } catch (error) {
            console.error("Erro ao carregar serviços: ", error);
            serviceList.innerHTML = '<p>Ocorreu um erro ao carregar os serviços. Verifique o console para mais detalhes.</p>';
        }
    }

    function calculateValues(startDateTime, endDateTime, serviceType) {
        const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
        const baseHours = 3;
        const gracePeriodLimit = baseHours + (20 / 60);
        let extraHours = 0;
        if (totalHours > gracePeriodLimit) extraHours = totalHours - gracePeriodLimit;
        
        const valorAtendimentoBase = 120.00;
        const valorHoraExtra = 25.00;
        const valorDiaria = 250.00;
        const atendimentoTotal = valorAtendimentoBase + (extraHours * valorHoraExtra);
        const chosenValue = (serviceType === 'atendimento') ? atendimentoTotal : valorDiaria;

        return { totalHours, atendimentoTotal, diariaValue: valorDiaria, chosenValue };
    }

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

        const values = calculateValues(startDateTime, endDateTime, serviceType);

        db.collection("servicos").add({
            userName: currentUserName,
            name: serviceName,
            date: startDateTime,
            type: serviceType,
            atendimentoValue: values.atendimentoTotal,
            diariaValue: values.diariaValue,
            chosenValue: values.chosenValue,
            hours: values.totalHours
        }).then(() => {
            alert("Serviço salvo com sucesso!");
            addServiceForm.reset();
            loadServices();
        }).catch(error => console.error("Erro ao salvar: ", error));
    });

    serviceList.addEventListener('click', (e) => {
        const serviceItem = e.target.closest('.service-item');
        if (!serviceItem) return;
        const serviceId = serviceItem.dataset.id;
        
        if (e.target.classList.contains('delete')) {
            deleteService(serviceId);
        } else if (e.target.classList.contains('edit')) {
            openEditModal(serviceId);
        }
    });

    function deleteService(id) {
        if (confirm("Você tem certeza que deseja excluir este serviço?")) {
            db.collection("servicos").doc(id).delete()
            .then(() => {
                alert("Serviço excluído com sucesso!");
                loadServices();
            })
            .catch(error => console.error("Erro ao excluir: ", error));
        }
    }

    // --- LÓGICA DO MODAL DE EDIÇÃO ---
    function openEditModal(id) {
        const service = allServices.find(s => s.id === id);
        if (!service) return;

        document.getElementById('editServiceId').value = service.id;
        document.getElementById('editServiceName').value = service.name;
        
        const date = new Date(service.date);
        const endDate = new Date(date.getTime() + service.hours * 3600 * 1000);

        document.getElementById('editServiceDate').value = date.toISOString().split('T')[0];
        document.getElementById('editStartTime').value = date.toTimeString().split(' ')[0].substring(0, 5);
        document.getElementById('editEndTime').value = endDate.toTimeString().split(' ')[0].substring(0, 5);
        document.getElementById('editServiceType').value = service.type;
        
        editModal.style.display = 'block';
    }

    closeModalBtn.onclick = () => editModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };
    
    editServiceForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const id = document.getElementById('editServiceId').value;
        const serviceName = document.getElementById('editServiceName').value;
        const serviceDate = document.getElementById('editServiceDate').value;
        const startTime = document.getElementById('editStartTime').value;
        const endTime = document.getElementById('editEndTime').value;
        const serviceType = document.getElementById('editServiceType').value;

        const startDateTime = new Date(`${serviceDate}T${startTime}`);
        let endDateTime = new Date(`${serviceDate}T${endTime}`);
        if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);

        const values = calculateValues(startDateTime, endDateTime, serviceType);

        const updatedService = {
            userName: currentUserName,
            name: serviceName,
            date: startDateTime,
            type: serviceType,
            atendimentoValue: values.atendimentoTotal,
            diariaValue: values.diariaValue,
            chosenValue: values.chosenValue,
            hours: values.totalHours
        };

        db.collection("servicos").doc(id).update(updatedService)
        .then(() => {
            alert("Serviço atualizado com sucesso!");
            editModal.style.display = 'none';
            loadServices();
        })
        .catch(error => console.error("Erro ao atualizar: ", error));
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO E ATUALIZAÇÃO ---
    function renderService(service) {
        const listItem = document.createElement('li');
        listItem.classList.add('service-item');
        listItem.setAttribute('data-id', service.id);
        
        const colorIndex = (allServices.findIndex(s => s.id === service.id)) % borderColors.length;
        listItem.style.borderLeftColor = borderColors[colorIndex];

        const endDate = new Date(service.date.getTime() + service.hours * 3600 * 1000);
        const durationH = Math.floor(service.hours);
        const durationM = Math.round((service.hours - durationH) * 60);
        const durationText = `${durationH}h ${durationM}min`;
        
        const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        listItem.innerHTML = `
            <div class="service-item-main">
                <div class="details">
                    <div class="service-title">${service.name}</div>
                    <div class="timestamps">
                        <div><strong>Entrada:</strong> ${service.date.toLocaleString('pt-BR', formatOptions)}</div>
                        <div><strong>Saída:</strong> ${endDate.toLocaleString('pt-BR', formatOptions)}</div>
                    </div>
                    <div class="duration">Duração total: ${durationText}</div>
                </div>
                <div class="service-actions">
                    <i class="fas fa-edit action-icon edit" title="Editar"></i>
                    <i class="fas fa-trash action-icon delete" title="Excluir"></i>
                </div>
                <div class="value">R$ ${service.chosenValue.toFixed(2)}</div>
            </div>
        `;
        serviceList.appendChild(listItem);
    }

    function updateSummary() {
        const totalGains = allServices.reduce((sum, s) => sum + s.chosenValue, 0);
        const serviceCount = allServices.length;
        totalGainsEl.textContent = `R$ ${totalGains.toFixed(2)}`;
        serviceCountEl.textContent = serviceCount;
    }

    // --- INICIALIZAÇÃO ---
    if (currentUserName) {
        showApp();
    } else {
        showLogin();
    }
});