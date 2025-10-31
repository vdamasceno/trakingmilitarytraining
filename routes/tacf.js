// routes/tacf.js (Código Completo - Refatorado com express-validator)
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { calculateAge, getMencao } = require('../utils/tafCalculator');

// --- NOVAS IMPORTAÇÕES PARA VALIDAÇÃO ---
const { body, validationResult } = require('express-validator');
// --- FIM DAS NOVAS IMPORTAÇÕES ---

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

// --- 2. REGRAS DE VALIDAÇÃO PARA O TACF ---
const tacfValidationRules = [
  // Data é obrigatória e deve ser uma data
  body('data_teste', 'Data do Teste é obrigatória').isISO8601().toDate(),

  // Campos numéricos opcionais
  // checkFalsy: true -> permite que '0', null ou "" (string vazia) sejam aceitos como "vazios"
  // .toFloat() / .toInt() -> converte o valor para número
  body('peso').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Peso deve ser um número positivo').toFloat(),
  body('altura').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Altura deve ser um número positivo').toFloat(),
  body('cintura').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Cintura deve ser um número positivo').toFloat(),
  body('cooper_distancia').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Cooper deve ser um número inteiro positivo').toInt(),
  body('abdominal_reps').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Abdominal deve ser um número inteiro positivo').toInt(),
  body('flexao_reps').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Flexão deve ser um número inteiro positivo').toInt(),
  body('barra_reps').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Barra deve ser um número inteiro positivo').toInt(),
];


// ROTA: POST /tacf (Salvar)
// --- 3. APLICANDO OS MIDDLEWARES NA ROTA ---
router.post('/', 
  tacfValidationRules, // 1º Roda as regras
  validate,            // 2º Checa os erros
  async (req, res) => {  // 3º Roda a lógica de negócio
  
  try {
    const usuarioId = req.usuario.usuario_id;
    // Dados já validados e convertidos (toFloat, toInt) pelo express-validator
    const { 
      data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
      peso, altura, cintura
    } = req.body;

    const alturaEmMetros = altura ? altura / 100 : null; // (Altura vem em cm do form)

    const userData = await db.query("SELECT data_nascimento, sexo FROM Usuario WHERE id = $1", [usuarioId]);
    if (userData.rows.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    
    const { data_nascimento, sexo } = userData.rows[0];
    if (!data_nascimento || !sexo) {
        return res.status(400).json({ message: "Dados de usuário incompletos (Data de Nascimento ou Sexo) para calcular menções." });
    }
    const sexoMilitar = sexo.toUpperCase().startsWith('M') ? 'M' : 'F';
    const idadeNoTeste = calculateAge(data_nascimento, data_teste);

    const mencao_cooper = getMencao('cooper', sexoMilitar, idadeNoTeste, cooper_distancia);
    const mencao_abdominal = getMencao('abdominal', sexoMilitar, idadeNoTeste, abdominal_reps);
    const mencao_flexao = getMencao('flexao', sexoMilitar, idadeNoTeste, flexao_reps);

    const novoLog = await db.query(
      `INSERT INTO LogTACF (usuario_id, data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps, 
                            mencao_cooper, mencao_abdominal, mencao_flexao,
                            peso, altura, cintura)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [usuarioId, data_teste, cooper_distancia || null, abdominal_reps || null, flexao_reps || null, barra_reps || null,
       mencao_cooper, mencao_abdominal, mencao_flexao,
       peso || null, alturaEmMetros || null, cintura || null]
    );

    res.status(201).json({ message: "TAF salvo com sucesso!", log: novoLog.rows[0] });

  } catch (error) {
    console.error("Erro ao salvar TAF:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor ao salvar TAF." });
  }
});

// ROTA: GET /tacf (Listar)
// (Esta rota não muda)
router.get('/', async (req, res) => {
  console.log('>>> Backend recebeu GET /tacf <<<');
  try {
    const usuarioId = req.usuario.usuario_id;
    const logs = await db.query(
      `SELECT 
         id, usuario_id, data_teste, 
         cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
         mencao_cooper, mencao_abdominal, mencao_flexao,
         peso, altura, cintura
       FROM LogTACF 
       WHERE usuario_id = $1 
       ORDER BY data_teste DESC`,
      [usuarioId]
    );
    res.status(200).json(logs.rows);
  } catch (error) {
    console.error("Erro ao listar TAFs:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});


// ROTA: PUT /tacf/:id (Editar)
// --- 3. APLICANDO OS MIDDLEWARES NA ROTA ---
router.put('/:id', 
  tacfValidationRules, // 1º Roda as regras
  validate,            // 2º Checa os erros
  async (req, res) => {  // 3º Roda a lógica de negócio
  
  try {
    const usuarioId = req.usuario.usuario_id;
    const logId = req.params.id;
    
    // Dados já validados e convertidos
    const { 
      data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
      peso, altura, cintura
    } = req.body;

    const alturaEmMetros = altura ? altura / 100 : null;

    const userData = await db.query("SELECT data_nascimento, sexo FROM Usuario WHERE id = $1", [usuarioId]);
    if (userData.rows.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    
    const { data_nascimento, sexo } = userData.rows[0];
    if (!data_nascimento || !sexo) {
      return res.status(400).json({ message: "Dados de usuário incompletos (Data de Nascimento ou Sexo) para calcular menções." });
    }
    const sexoMilitar = sexo.toUpperCase().startsWith('M') ? 'M' : 'F';
    const idadeNoTeste = calculateAge(data_nascimento, data_teste);

    const mencao_cooper = getMencao('cooper', sexoMilitar, idadeNoTeste, cooper_distancia);
    const mencao_abdominal = getMencao('abdominal', sexoMilitar, idadeNoTeste, abdominal_reps);
    const mencao_flexao = getMencao('flexao', sexoMilitar, idadeNoTeste, flexao_reps);

    const resultado = await db.query(
      `UPDATE LogTACF
       SET data_teste = $1, cooper_distancia = $2, abdominal_reps = $3, flexao_reps = $4, barra_reps = $5,
           mencao_cooper = $8, mencao_abdominal = $9, mencao_flexao = $10,
           peso = $11, altura = $12, cintura = $13
       WHERE id = $6 AND usuario_id = $7
       RETURNING *`,
      [data_teste, cooper_distancia || null, abdominal_reps || null, flexao_reps || null, barra_reps || null, logId, usuarioId,
       mencao_cooper, mencao_abdominal, mencao_flexao,
       peso || null, alturaEmMetros || null, cintura || null]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "Registro de TAF não encontrado ou não pertence a este usuário." });
    }
    res.status(200).json({ message: "TAF atualizado com sucesso!", log: resultado.rows[0] });

  } catch (error) {
    console.error("Erro ao atualizar TAF:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor ao atualizar TAF." });
  }
});

// ROTA: DELETE /tacf/:id (Excluir)
// (Não precisa de validação de body)
router.delete('/:id', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const logId = req.params.id;

    const resultado = await db.query(
      "DELETE FROM LogTACF WHERE id = $1 AND usuario_id = $2",
      [logId, usuarioId]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ message: "Registro de TAF não encontrado ou não pertence a este usuário." });
    }
    res.status(204).send();

  } catch (error) {
    console.error("Erro ao excluir TAF:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;