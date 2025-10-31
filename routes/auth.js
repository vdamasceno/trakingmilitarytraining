// routes/auth.js (Código Completo - Refatorado com express-validator)
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- NOVAS IMPORTAÇÕES PARA VALIDAÇÃO ---
const { body, validationResult } = require('express-validator');
// --- FIM DAS NOVAS IMPORTAÇÕES ---


// --- 1. DEFINIÇÃO DAS REGRAS DE VALIDAÇÃO DO BACKEND ---
const registerValidationRules = [
  // saram: não pode estar vazio
  body('saram', 'SARAM é obrigatório').notEmpty().trim(),
  
  // email: deve ser um email válido
  body('email', 'Email inválido').isEmail().normalizeEmail(),
  
  // senha: deve ter no mínimo 8 caracteres
  body('senha', 'Senha deve ter no mínimo 8 caracteres').isLength({ min: 8 }),
  
  // nome: não pode estar vazio
  body('nome', 'Nome é obrigatório').notEmpty().trim(),
  
  // posto: não pode estar vazio
  body('posto', 'Posto é obrigatório').notEmpty().trim(),

  // organizacao_id: deve ser um número
  body('organizacao_id', 'Organização Militar é obrigatória').isNumeric(),

  // data_nascimento (opcional): deve ser uma data válida se fornecida
  body('data_nascimento').optional({ checkFalsy: true }).isISO8601().toDate(),

  // sexo (opcional): deve ser 'Masculino' ou 'Feminino' se fornecido
  body('sexo').optional().isIn(['Masculino', 'Feminino'])
];
// --- FIM DA DEFINIÇÃO DAS REGRAS ---


// --- 2. FUNÇÃO " porteiro" DE VALIDAÇÃO ---
// Middleware que checa se houve erros
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // Sem erros, continua para a rota
  }

  // Se houver erros, formata e envia uma resposta 400 (Bad Request)
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(400).json({
    message: "Dados inválidos",
    errors: extractedErrors,
  });
};
// --- FIM DA FUNÇÃO "PORTEIRO" ---


// ROTA: POST /auth/register (Cadastro de Militar)
// --- 3. APLICANDO OS MIDDLEWARES NA ROTA ---
router.post('/register', 
  registerValidationRules, // 1º Roda as regras de validação
  validate,                // 2º Checa se houve erros de validação
  async (req, res) => {    // 3º SÓ RODA SE TUDO ESTIVER VÁLIDO
  
  // NÃO PRECISAMOS MAIS DESTA VALIDAÇÃO MANUAL:
  // if (!saram || !email || !senha || !nome) { ... }
  
  try {
    // 1. Pegar os dados (já validados e sanitizados)
    const { 
      saram, email, senha, nome, posto, 
      data_nascimento, sexo, organizacao_id 
    } = req.body;

    // 2. Verificar se SARAM ou Email já existem (Lógica de Negócio)
    const userExists = await db.query(
      "SELECT * FROM Usuario WHERE saram = $1 OR email = $2",
      [saram, email]
    );

    if (userExists.rows.length > 0) {
      // 409: Conflito
      return res.status(409).json({ message: "SARAM ou Email já cadastrado." });
    }

    // 3. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 4. Salvar no banco
    const newUser = await db.query(
      `INSERT INTO Usuario (saram, email, senha_hash, nome, posto, data_nascimento, sexo, organizacao_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nome, email, saram`,
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
// (Não precisa de validação complexa, mas podemos adicionar)
router.post('/login', 
  [ // Regras simples para o login
    body('saram', 'SARAM é obrigatório').notEmpty(),
    body('senha', 'Senha é obrigatória').notEmpty()
  ],
  validate, // Reutilizamos o mesmo "porteiro"
  async (req, res) => {
  try {
    const { saram, senha } = req.body;
    
    // NÃO PRECISAMOS MAIS DESTA VALIDAÇÃO:
    // if (!saram || !senha) { ... }

    const result = await db.query("SELECT * FROM Usuario WHERE saram = $1", [saram]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const secret = process.env.JWT_SECRET;
    const payload = {
      usuario_id: usuario.id,
      nivel_acesso: usuario.nivel_acesso
    };
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

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


module.exports = router;