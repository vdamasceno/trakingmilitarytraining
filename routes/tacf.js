// routes/tacf.js (Código Completo - Atualizado)
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { calculateAge, getMencao } = require('../utils/tafCalculator');

router.use(authMiddleware);

// ROTA: POST /tacf (Salvar)
router.post('/', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    // --- Pegar novos campos do body ---
    const {
      data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
      peso, altura, cintura // <<<<< NOVOS CAMPOS
    } = req.body;

    // --- Converter altura (cm -> m) ---
    const alturaEmMetros = altura ? parseFloat(altura) / 100 : null; // <<<<< CONVERSÃO

    // --- Buscar dados do usuário (sem mudança) ---
    const userData = await db.query("SELECT data_nascimento, sexo FROM Usuario WHERE id = $1", [usuarioId]);
    if (userData.rows.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    const { data_nascimento, sexo } = userData.rows[0];
    // Adiciona verificação se sexo ou data_nascimento são nulos
    if (!data_nascimento || !sexo) {
        return res.status(400).json({ message: "Dados de usuário incompletos (Data de Nascimento ou Sexo) para calcular menções." });
    }
    const sexoMilitar = sexo?.toUpperCase().startsWith('M') ? 'M' : 'F';
    const idadeNoTeste = calculateAge(data_nascimento, data_teste);

    // --- Calcular Menções (sem mudança) ---
    const mencao_cooper = getMencao('cooper', sexoMilitar, idadeNoTeste, cooper_distancia);
    const mencao_abdominal = getMencao('abdominal', sexoMilitar, idadeNoTeste, abdominal_reps);
    const mencao_flexao = getMencao('flexao', sexoMilitar, idadeNoTeste, flexao_reps);

    // --- Adicionar novos campos no INSERT ---
    const novoLog = await db.query(
      `INSERT INTO LogTACF (usuario_id, data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
                            mencao_cooper, mencao_abdominal, mencao_flexao,
                            peso, altura, cintura) -- <<<< Novas Colunas
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) -- <<<< Novos Placeholders
       RETURNING *`,
      [usuarioId, data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
       mencao_cooper, mencao_abdominal, mencao_flexao,
       peso, alturaEmMetros, cintura] // <<<<< Novos Valores (altura em metros)
    );

    res.status(201).json({ message: "TAF salvo com sucesso!", log: novoLog.rows[0] });

  } catch (error) {
    console.error("Erro ao salvar TAF:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor ao salvar TAF." });
  }
});

// ROTA: GET /tacf (Listar)
router.get('/', async (req, res) => {
  console.log('>>> Backend recebeu GET /tacf <<<');
  try {
    const usuarioId = req.usuario.usuario_id;

    // --- Adicionar novas colunas no SELECT ---
    const logs = await db.query(
      `SELECT
         id, usuario_id, data_teste,
         cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
         mencao_cooper, mencao_abdominal, mencao_flexao,
         peso, altura, cintura -- <<<< Novas Colunas
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
router.put('/:id', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const logId = req.params.id;
    // --- Pegar novos campos do body ---
    const {
      data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps,
      peso, altura, cintura // <<<<< NOVOS CAMPOS
    } = req.body;

    // --- Converter altura (cm -> m) ---
    const alturaEmMetros = altura ? parseFloat(altura) / 100 : null; // <<<<< CONVERSÃO

    // --- Buscar dados do usuário e Calcular Menções (sem mudança) ---
    const userData = await db.query("SELECT data_nascimento, sexo FROM Usuario WHERE id = $1", [usuarioId]);
    if (userData.rows.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    const { data_nascimento, sexo } = userData.rows[0];
     // Adiciona verificação se sexo ou data_nascimento são nulos
     if (!data_nascimento || !sexo) {
        return res.status(400).json({ message: "Dados de usuário incompletos (Data de Nascimento ou Sexo) para calcular menções." });
    }
    const sexoMilitar = sexo?.toUpperCase().startsWith('M') ? 'M' : 'F';
    const idadeNoTeste = calculateAge(data_nascimento, data_teste);
    const mencao_cooper = getMencao('cooper', sexoMilitar, idadeNoTeste, cooper_distancia);
    const mencao_abdominal = getMencao('abdominal', sexoMilitar, idadeNoTeste, abdominal_reps);
    const mencao_flexao = getMencao('flexao', sexoMilitar, idadeNoTeste, flexao_reps);

    // --- Adicionar novos campos no UPDATE ---
    const resultado = await db.query(
      `UPDATE LogTACF
       SET data_teste = $1, cooper_distancia = $2, abdominal_reps = $3, flexao_reps = $4, barra_reps = $5,
           mencao_cooper = $8, mencao_abdominal = $9, mencao_flexao = $10,
           peso = $11, altura = $12, cintura = $13 -- <<<< Novas Colunas
       WHERE id = $6 AND usuario_id = $7
       RETURNING *`,
      [data_teste, cooper_distancia, abdominal_reps, flexao_reps, barra_reps, logId, usuarioId,
       mencao_cooper, mencao_abdominal, mencao_flexao,
       peso, alturaEmMetros, cintura] // <<<<< Novos Valores
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

// ROTA: DELETE /tacf/:id (Excluir) - Nenhuma mudança aqui
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