// routes/auth.js

const express = require('express');
const router = express.Router(); // Usamos o Router do Express
const db = require('../db'); // Nossa conexão com o banco
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ROTA: POST /auth/register (Cadastro de Militar)
router.post('/register', async (req, res) => {
  try {
    // 1. Pegar os dados do corpo da requisição
    const { 
      saram, email, senha, nome, posto, 
      data_nascimento, sexo, organizacao_id 
    } = req.body;

    // Validação simples (em um projeto real, seria mais robusta)
    if (!saram || !email || !senha || !nome) {
      return res.status(400).json({ message: "Campos obrigatórios (SARAM, Email, Senha, Nome) não foram preenchidos." });
    }

    // 2. Verificar se SARAM ou Email já existem
    const userExists = await db.query(
      "SELECT * FROM Usuario WHERE saram = $1 OR email = $2",
      [saram, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: "SARAM ou Email já cadastrado." });
    }

    // 3. Criptografar a senha
    const salt = await bcrypt.genSalt(10); // Gera o "sal"
    const senhaHash = await bcrypt.hash(senha, salt); // Gera o hash

    // 4. Salvar no banco
    const newUser = await db.query(
      `INSERT INTO Usuario (saram, email, senha_hash, nome, posto, data_nascimento, sexo, organizacao_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nome, email, saram`, // RETURNING nos devolve os dados inseridos
      [saram, email, senhaHash, nome, posto, data_nascimento, sexo, organizacao_id]
    );

    // 5. Responder com sucesso
    res.status(201).json({ 
      message: "Usuário criado com sucesso!",
      usuario: newUser.rows[0] 
    });

  } catch (error) {
    console.error("Erro ao registrar usuário:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});


// ROTA: POST /auth/login (Login)
router.post('/login', async (req, res) => {
  try {
    // 1. Pegar dados do login
    const { saram, senha } = req.body;

    if (!saram || !senha) {
      return res.status(400).json({ message: "SARAM e Senha são obrigatórios." });
    }

    // 2. Buscar usuário pelo SARAM
    const result = await db.query("SELECT * FROM Usuario WHERE saram = $1", [saram]);
    const usuario = result.rows[0];

    if (!usuario) {
      // Não achou o usuário
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // 3. Comparar a senha enviada com a senha_hash do banco
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      // Senha errada
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // 4. Se chegou aqui, o login está CORRETO. Vamos criar o Token JWT.
    const secret = process.env.JWT_SECRET;
    
    // O 'payload' é o que guardamos dentro do token
    const payload = {
      usuario_id: usuario.id,
      nivel_acesso: usuario.nivel_acesso
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: '8h' // Token expira em 8 horas
    });

    // 5. Enviar o token e os dados básicos do usuário
    res.status(200).json({
      message: "Login bem-sucedido!",
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        nivel_acesso: usuario.nivel_acesso
      }
    });

  } catch (error) {
    console.error("Erro no login:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});


module.exports = router; // Exporta o router para ser usado no index.js