// server.js

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Criar ou abrir um banco de dados SQLite
const db = new sqlite3.Database('./alegrai-vos.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Chave fixa para autenticação
const AUTH_KEY = 'alegrai-vos@2025';

// Rota de autenticação
app.post('/login', (req, res) => {
    const { key } = req.body;

    if (key === AUTH_KEY) {
        return res.status(200).json({ message: 'Login bem-sucedido!' });
    } else {
        return res.status(401).json({ error: 'Chave de autenticação inválida!' });
    }
});

// Criar tabela se não existir
db.run(`CREATE TABLE IF NOT EXISTS dados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    telefone TEXT,
    cidade TEXT,
    bairro TEXT,
    grupo_oracao TEXT,
    paroquia TEXT,
    capela TEXT
)`);

/// Rota para salvar dados
app.post('/dados', (req, res) => {
    const { nome, telefone, cidade, bairro, grupo_oracao, paroquia, capela } = req.body;
    const sql = 'INSERT INTO dados (nome, telefone, cidade, bairro, grupo_oracao, paroquia, capela) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [nome, telefone, cidade, bairro, grupo_oracao, paroquia, capela], function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    });
  });

// Rota para buscar dados
app.get('/dados', (req, res) => {
    db.all('SELECT * FROM dados', [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});