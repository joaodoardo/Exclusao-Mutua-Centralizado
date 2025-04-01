// Estado do sistema
let balance = 1000;
let currentClient = null;
let isProcessing = false;
let queue = [];
let transactions = [];
let processingTime = 0;
let processingInterval = null;

// Elementos DOM
const clientIdSelect = document.getElementById('clientId');
const amountInput = document.getElementById('amount');
const withdrawBtn = document.getElementById('withdrawBtn');
const balanceDisplay = document.getElementById('balance');
const statusPanel = document.getElementById('statusPanel');
const queueDisplay = document.getElementById('queue');
const transactionsDisplay = document.getElementById('transactions');

// Função para formatar valor monetário
function formatMoney(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
}

// Função para adicionar transação ao histórico
function addTransaction(clientId, status, message) {
    const transaction = {
        id: Date.now(),
        clientId,
        status,
        message,
        timestamp: new Date().toLocaleTimeString()
    };
    
    transactions.unshift(transaction);
    renderTransactions();
}

// Função para renderizar transações
function renderTransactions() {
    if (transactions.length === 0) {
        transactionsDisplay.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">Nenhuma operação registrada</p>';
        return;
    }
    
    let html = '';
    transactions.forEach(tx => {
        let statusClass, borderClass;
        
        switch (tx.status) {
            case 'APPROVED':
                statusClass = 'status-approved';
                borderClass = 'transaction-approved';
                break;
            case 'DENIED':
                statusClass = 'status-denied';
                borderClass = 'transaction-denied';
                break;
            case 'REQUEST':
                statusClass = 'status-request';
                borderClass = 'transaction-request';
                break;
            case 'WAIT':
                statusClass = 'status-wait';
                borderClass = 'transaction-wait';
                break;
            default:
                statusClass = '';
                borderClass = '';
        }
        
        html += `
            <div class="transaction ${borderClass}">
                <div class="transaction-header">
                    <span class="transaction-client">Cliente ${tx.clientId}</span>
                    <span class="transaction-status ${statusClass}">${tx.status}</span>
                </div>
                <p>${tx.message}</p>
                <p class="transaction-time">${tx.timestamp}</p>
            </div>
        `;
    });
    
    transactionsDisplay.innerHTML = html;
}

// Função para renderizar fila de espera
function renderQueue() {
    if (queue.length === 0) {
        queueDisplay.innerHTML = '<p class="text-sm text-gray-500">Nenhum cliente na fila</p>';
        return;
    }
    
    let html = '';
    queue.forEach(client => {
        html += `
            <div class="queue-item">
                <span>Cliente ${client.clienteId}</span>
                <span>R$ ${client.valor.toFixed(2)}</span>
            </div>
        `;
    });
    
    queueDisplay.innerHTML = html;
}

// Função para atualizar status do sistema
function updateStatus() {
    if (isProcessing) {
        statusPanel.innerHTML = `
            <div class="status-processing">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span class="font-medium">Seção Crítica Ocupada</span>
                </div>
                <p class="text-sm mt-1">Cliente ${currentClient} está sacando</p>
                <p class="text-sm font-mono">Tempo restante: ${processingTime}s</p>
                <p class="text-xs text-gray-500 mt-1">(Tempo fixo de 20 segundos)</p>
            </div>
        `;
    } else {
        statusPanel.innerHTML = `
            <div class="status-available">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                    <span class="font-medium">Seção Crítica Livre</span>
                </div>
            </div>
        `;
    }
}

// Função para iniciar contagem regressiva
function startCountdown() {
    processingTime = 20;
    updateStatus();
    
    clearInterval(processingInterval);
    processingInterval = setInterval(() => {
        processingTime--;
        updateStatus();
        
        if (processingTime <= 0) {
            clearInterval(processingInterval);
            isProcessing = false;
            currentClient = null;
            updateStatus();
            processQueue();
        }
    }, 1000);
}










// Função para processar fila
function processQueue() {
    if (queue.length > 0 && !isProcessing) {
        const nextClient = queue.shift();
        currentClient = nextClient.clienteId;
        isProcessing = true;
        
        addTransaction(nextClient.clienteId, 'GRANT', `Acesso concedido para saque de R$ ${nextClient.valor.toFixed(2)}`);
        startCountdown();
        
        // Simular processamento do saque
        setTimeout(() => {
            if (nextClient.valor > balance) {
                addTransaction(nextClient.clienteId, 'DENIED', `Saldo insuficiente para saque de R$ ${nextClient.valor.toFixed(2)}`);
            } else {
                balance -= nextClient.valor;
                balanceDisplay.textContent = formatMoney(balance);
                addTransaction(nextClient.clienteId, 'APPROVED', `Saque de R$ ${nextClient.valor.toFixed(2)} realizado. Saldo: ${formatMoney(balance)}`);
            }
            
            isProcessing = false;
            currentClient = null;
            updateStatus();
            renderQueue();
            processQueue();
        }, 20000);
    }
}

// Função para solicitar saque
async function requestWithdraw() {
    const clientId = clientIdSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (!amount || isNaN(amount) || amount <= 0) {
        addTransaction(clientId, 'ERROR', 'Valor inválido para saque');
        return;
    }
    
    addTransaction(clientId, 'REQUEST', `Solicitou saque de R$ ${amount.toFixed(2)}`);
    
    if (isProcessing) {
        queue.push({ clienteId: clientId, valor: amount });
        addTransaction(clientId, 'WAIT', `Aguardando na fila para saque de R$ ${amount.toFixed(2)}`);
    } else {
        currentClient = clientId;
        isProcessing = true;
        addTransaction(clientId, 'GRANT', `Acesso concedido para saque de R$ ${amount.toFixed(2)}`);
        startCountdown();
        
        // Simular processamento do saque
        setTimeout(() => {
            if (amount > balance) {
                addTransaction(clientId, 'DENIED', `Saldo insuficiente para saque de R$ ${amount.toFixed(2)}`);
            } else {
                balance -= amount;
                balanceDisplay.textContent = formatMoney(balance);
                addTransaction(clientId, 'APPROVED', `Saque de R$ ${amount.toFixed(2)} realizado. Saldo: ${formatMoney(balance)}`);
            }
            
            isProcessing = false;
            currentClient = null;
            updateStatus();
            processQueue();
        }, 20000);
    }
    
    amountInput.value = '';
    renderQueue();
}

// Event Listeners
withdrawBtn.addEventListener('click', requestWithdraw);

// Inicialização
balanceDisplay.textContent = formatMoney(balance);
updateStatus();
renderQueue();
renderTransactions();