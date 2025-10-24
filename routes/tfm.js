// routes/tfm.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ROTA: POST /tfm (Salvar um novo treino diário)
router.post('/', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const { 
      data_treino, percepcao_intensidade, exercicio_id, detalhes_treino 
    } = req.body;

    // 'detalhes_treino' deve ser um objeto JSON. Ex: { "distancia_km": 5, "tempo_min": 30 }
    
    const novoLog = await db.query(
      `INSERT INTO LogTFM (usuario_id, data_treino, percepcao_intensidade, exercicio_id, detalhes_treino)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuarioId, data_treino, percepcao_intensidade, exercicio_id, detalhes_treino]
    );

    res.status(201).json({
      message: "Treino (TFM) salvo com sucesso!",
      log: novoLog.rows[0]
    });

  } catch (error) {
    console.error("Erro ao salvar TFM:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ROTA: GET /tfm (Listar todos os meus treinos)
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;

    // Aqui fazemos um JOIN (ligação) com a tabela Exercicio para já trazer o nome
    const logs = await db.query(
      `SELECT t.*, e.nome as exercicio_nome 
       FROM LogTFM t
       JOIN Exercicio e ON t.exercicio_id = e.id
       WHERE t.usuario_id = $1 
       ORDER BY t.data_treino DESC`,
      [usuarioId]
    );

    res.status(200).json(logs.rows);

  } catch (error) {
    console.error("Erro ao listar TFMs:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ROTA: PUT /tfm/:id (Editar um treino específico)
router.put('/:id', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const logId = req.params.id;
    
    const { 
      data_treino, percepcao_intensidade, exercicio_id, detalhes_treino 
    } = req.body;

    const resultado = await db.query(
      `UPDATE LogTFM
       SET data_treino = $1, percepcao_intensidade = $2, exercicio_id = $3, detalhes_treino = $4
       WHERE id = $5 AND usuario_id = $6
       RETURNING *`, // Segurança!
      [data_treino, percepcao_intensidade, exercicio_id, detalhes_treino, logId, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "Registro de TFM não encontrado ou não pertence a este usuário." });
    }

    res.status(200).json({
      message: "TFM atualizado com sucesso!",
      log: resultado.rows[0]
    });

  } catch (error) {
    console.error("Erro ao atualizar TFM:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ROTA: DELETE /tfm/:id (Excluir um treino específico)
router.delete('/:id', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;
    const logId = req.params.id;

    const resultado = await db.query(
      "DELETE FROM LogTFM WHERE id = $1 AND usuario_id = $2",
      [logId, usuarioId]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ message: "Registro de TFM não encontrado ou não pertence a este usuário." });
    }
    
    res.status(204).send(); 

  } catch (error) {
    console.error("Erro ao excluir TFM:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});


module.exports = router;