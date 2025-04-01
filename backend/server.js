const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json()); // Permite requisições JSON
app.use(cors()); // Permite conexões de diferentes origens (diferentes computadores)

let saldo = 1000; // Saldo inicial do banco
let clienteAtual = null; // Cliente que está acessando a seção crítica
let fila = []; // Fila de clientes esperando pelo saque

// Rota para solicitar um saque
app.post('/saque', (req, res) => {
    const { clienteId, valor } = req.body;

    if (clienteAtual === null) {
        // Se nenhum cliente estiver sacando, permite o saque
        clienteAtual = clienteId;
        processarSaque(clienteId, valor, res);
    } else {
        // Se já há um cliente sacando, adiciona à fila
        fila.push({ clienteId, valor, res });
        console.log(`Cliente ${clienteId} entrou na fila para sacar R$ ${valor}`);
    }
});

// Função que processa o saque
function processarSaque(clienteId, valor, res) {
    if (valor > saldo) {
        res.json({ status: "Negado", mensagem: `Saldo insuficiente para Cliente ${clienteId}.` });
        console.log(`Saldo insuficiente para Cliente ${clienteId}. Saque negado.`);
        liberarAcesso();
    } else {
        console.log(`Cliente ${clienteId} está sacando R$ ${valor}...`);
        setTimeout(() => { // Simula o tempo de processamento
            saldo -= valor;
            res.json({ status: "Aprovado", mensagem: `Cliente ${clienteId} sacou R$ ${valor}. Saldo restante: R$ ${saldo}` });
            console.log(`Cliente ${clienteId} sacou R$ ${valor}. Saldo restante: R$ ${saldo}`);
            liberarAcesso();
        }, 3000); // Simula demora no processamento do saque
    }
}

// Libera acesso para o próximo cliente na fila
function liberarAcesso() {
    if (fila.length > 0) {
        let proximo = fila.shift(); // Pega o próximo da fila
        clienteAtual = proximo.clienteId;
        processarSaque(proximo.clienteId, proximo.valor, proximo.res);
    } else {
        clienteAtual = null; // Nenhum cliente na fila
    }
}

// Iniciando o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
