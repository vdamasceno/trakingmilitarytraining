// routes/usuarios.js (Código Completo - Verifique se o seu está assim)
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// Todas as rotas aqui são protegidas
router.use(authMiddleware);

// --- 1. FUNÇÃO "PORTEIRO" DE VALIDAÇÃO ---
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(400).json({
    message: "Dados inválidos",
    errors: extractedErrors,
  });
};

// --- 2. REGRAS DE VALIDAÇÃO PARA ATUALIZAÇÃO ---
const updateProfileRules = [
  body('nome', 'Nome é obrigatório').notEmpty().trim(),
  body('posto', 'Posto é obrigatório').notEmpty().trim(),
  body('organizacao_id', 'Organização Militar é obrigatória').isNumeric(),
  body('data_nascimento').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('sexo').optional().isIn(['Masculino', 'Feminino'])
];


// ROTA: GET /usuarios/me (Buscar meus dados)
router.get('/me', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const resultado = await db.query(
      `SELECT id, saram, email, nome, posto, data_nascimento, sexo, organizacao_id
       FROM Usuario
       WHERE id = $1`,
      [usuarioId]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ROTA: PUT /usuarios/me (Editar / Salvar meus dados)
router.put('/me',
  updateProfileRules,
  validate,
  async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const { nome, posto, data_nascimento, sexo, organizacao_id } = req.body;

    const resultado = await db.query(
      `UPDATE Usuario
       SET nome = $1, posto = $2, data_nascimento = $3, sexo = $4, organizacao_id = $5
       WHERE id = $6
       RETURNING id, nome, email, posto, data_nascimento, sexo, organizacao_id`,
      [nome, posto, data_nascimento, sexo, organizacao_id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado para atualização." });
    }

    res.status(200).json({
      message: "Dados atualizados com sucesso!",
      usuario: resultado.rows[0]
    });

  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});


// --- 3. ROTA FALTANDO (PROVAVELMENTE) ---
// ROTA: GET /usuarios/me/historico (Dados para gráficos de evolução)
router.get('/me/historico', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;

    const resultado = await db.query(
      `SELECT
         data_teste,
         peso,
         cooper_distancia,
         flexao_reps,
         barra_reps
       FROM LogTACF
       WHERE usuario_id = $1
         AND data_teste IS NOT NULL
       ORDER BY data_teste ASC`, // ASC para gráfico de linha
      [usuarioId]
    );

    // Formata os dados para facilitar o uso no Recharts
    const historicoFormatado = resultado.rows.map(log => ({
        data: new Date(log.data_teste).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        peso: log.peso ? parseFloat(log.peso) : null,
        cooper: log.cooper_distancia ? parseInt(log.cooper_distancia, 10) : null,
        flexao: log.flexao_reps ? parseInt(log.flexao_reps, 10) : null,
        barra: log.barra_reps ? parseInt(log.barra_reps, 10) : null
    }));

    res.status(200).json(historicoFormatado);

  } catch (error) {
    console.error("Erro ao buscar histórico do usuário:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor ao buscar histórico." });
  }
});
// --- FIM DA ROTA FALTANDO ---


module.exports = router;