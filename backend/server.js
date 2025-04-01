const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let saldo = 1000; //Saldo inicial do banco
let coordenador = { clienteAtual: null, fila: [] }; //Coordenador central

//Cliente solicita acesso à seção crítica (REQUEST)
app.post('/request', (req, res) => {
    const { clienteId, valor } = req.body;

    if (coordenador.clienteAtual === null) {
        //Se a seção crítica está livre, concede acesso imediatamente
        coordenador.clienteAtual = clienteId;
        res.json({ status: "GRANT", mensagem: "Acesso concedido. Pode sacar." });
    } else {
        //Se já há um cliente sacando, entra na fila
        coordenador.fila.push({ clienteId, valor, res });
        console.log(`Banco: Cliente ${clienteId} entrou na fila para saque de R$ ${valor}`);
    }
});

//Cliente realiza o saque e envia RELEASE ao coordenador
app.post('/release', (req, res) => {
    const { clienteId, valor } = req.body;
    
    if (clienteId !== coordenador.clienteAtual) {
        return res.status(400).json({ mensagem: "Erro: Cliente não tem permissão." });
    }

    if (valor > saldo) {
        res.json({ status: "Negado", mensagem: "Saldo insuficiente." });
        console.log(`Banco: Saldo insuficiente para Cliente ${clienteId}. Saque negado.`);
    } else {
        saldo -= valor;
        res.json({ status: "Aprovado", mensagem: `Saque de R$ ${valor} realizado. Saldo: R$ ${saldo}` });
        console.log(`Banco: Cliente ${clienteId} sacou R$ ${valor}. Saldo restante: R$ ${saldo}`);
    }

    liberarAcesso();
});

//Libera o acesso para o próximo da fila
function liberarAcesso() {
    if (coordenador.fila.length > 0) {
        let proximo = coordenador.fila.shift();
        coordenador.clienteAtual = proximo.clienteId;
        proximo.res.json({ status: "GRANT", mensagem: "Agora é sua vez de sacar." });
    } else {
        coordenador.clienteAtual = null;
    }
}

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
