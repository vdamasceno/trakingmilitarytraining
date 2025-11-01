// index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- Importar o serviço de e-mail ---
const { initializeEmailService } = require('./services/emailService'); // <<<<< NOVA LINHA

// IMPORTAR ROTAS
const authRoutes = require('./routes/auth');
const listasRoutes = require('./routes/listas');
const usuariosRoutes = require('./routes/usuarios');
const tacfRoutes = require('./routes/tacf'); // <<<<<<< NOVA LINHA
const tfmRoutes = require('./routes/tfm');   // <<<<<<< NOVA LINHA
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Rota de teste
app.get('/', (req, res) => {
  res.send('API do Tracking TFM está no ar!');
});

// USAR AS ROTAS
app.use('/auth', authRoutes);
app.use('/listas', listasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/tacf', tacfRoutes); // <<<<<<< NOVA LINHA (prefixo /tacf)
app.use('/tfm', tfmRoutes);   // <<<<<<< NOVA LINHA (prefixo /tfm)
app.use('/admin', adminRoutes); // <<<<<<< NOVA LINHA (prefixo /admin)


app.listen(PORT, async () => { // <<<<< ADICIONA 'async'
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // --- Inicializa o serviço de e-mail ---
  //try {
  //  await initializeEmailService(); // <<<<< NOVA LINHA
  //  console.log("Serviço de e-mail pronto para testes (Ethereal).");
  //} catch (error) {
  //  console.error("Falha grave ao iniciar serviço de e-mail.", error);
  //}
  // --- Fim da inicialização ---
});