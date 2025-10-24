// db/index.js

const { Pool } = require('pg'); // Importa o Pool do 'pg'
require('dotenv').config(); // Precisamos das variáveis do .env aqui também

// Configuração da conexão usando as variáveis de ambiente
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Função de "Query" que vamos usar em todo o projeto
// Isso nos permite centralizar a lógica de log e conexão
module.exports = {
  query: (text, params) => pool.query(text, params),
};