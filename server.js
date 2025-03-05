const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./database.db');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Aumenta o limite de tamanho do payload
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // Para formulários

// Criar tabela se não existir
db.run(`CREATE TABLE IF NOT EXISTS dados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    telefone TEXT,
    cidade TEXT,
    bairro TEXT,
    grupo_oracao TEXT,
    paroquia TEXT,
    capela TEXT,
     UNIQUE (nome, telefone, cidade))`);

// Endpoint para receber os dados do Excel
app.post('/upload', (req, res) => {
  const data = req.body; // Espera-se que seja um array de objetos

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).send('Nenhum dado fornecido para inserção.');
  }

  const stmt = db.prepare(`INSERT INTO dados (nome, telefone, cidade, bairro, grupo_oracao, paroquia, capela) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  let insertCount = 0; // Contador para inserções bem-sucedidas

  data.forEach(row => {
    stmt.run(row.nome, row.telefone, row.cidade, row.bairro, row.grupo_oracao, row.paroquia, row.capela, function(err) {
      if (err) {
        console.error('Erro ao inserir dados:', err.message);
      } else {
        insertCount++;
        console.log(`Dados inseridos: ${row.nome}, ${row.telefone}, ${row.cidade}, ${row.bairro}, ${row.grupo_oracao}, ${row.paroquia}, ${row.capela}`);
      }
    });
  });

  stmt.finalize(() => {
    console.log(`${insertCount} dados inseridos com sucesso!`);
    res.send(`${insertCount} dados inseridos com sucesso!`);
  });
});

// Rota para buscar dados
app.get('/dados', (req, res) => {
  db.all('SELECT * FROM dados', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar dados:', err.message);
      return res.status(400).json({ error: err.message });
    }
    console.log('Dados buscados com sucesso:', rows);
    res.json(rows);
  });
});

// Endpoint para criar nova tabela com dados únicos
app.post('/create-updated-table', (req, res) => {
  const uniqueData = req.body; // Dados únicos enviados no corpo da requisição

  // Criação da nova tabela
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS dados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    telefone TEXT,
    cidade TEXT,
    bairro TEXT,
    grupo_oracao TEXT,
    paroquia TEXT,
    capela TEXT,
    UNIQUE (nome, telefone, cidade)`;

  db.run(createTableQuery, (err) => {
    if (err) return res.status(500).send(err.message);

    // Inserir dados únicos na nova tabela
    const insertQuery = `
      INSERT INTO updated_data (nome, telefone, cidade, bairro, grupo_oracao, paroquia, capela) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const uniqueSet = new Set(); // Para garantir que não temos duplicatas
    const values = [];

    uniqueData.forEach(item => {
      const key = `${item.nome}-${item.telefone}-${item.cidade}-${item.bairro}-${item.grupo_oracao}-${item.paroquia}-${item.capela}`;
      if (!uniqueSet.has(key)) {
        uniqueSet.add(key);
        values.push([item.nome, item.telefone, item.cidade, item.bairro, item.grupo_oracao, item.paroquia, item.capela]);
      }
    });

    // Inserir os dados únicos na tabela
    const stmt = db.prepare(insertQuery);
    let insertCount = 0;

    values.forEach(value => {
      stmt.run(value, function(err) {
        if (err) {
          console.error('Erro ao inserir dados únicos:', err.message);
        } else {
          insertCount++;
        }
      });
    });

    stmt.finalize(() => {
      res.status(200).send(`${insertCount} dados únicos inseridos na tabela 'updated_data' com sucesso!`);
    });
  });
});

// Endpoint para buscar dados da tabela 'updated_data'
app.get('/updated-data', (req, res) => {
  db.all('SELECT * FROM updated_data', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar dados da nova tabela:', err.message);
      return res.status(400).json({ error: err.message });
    }
    console.log('Dados da nova tabela buscados com sucesso:', rows);
    res.json(rows); // Retorna os dados da nova tabela
  });
});

// Inicializa o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});