// routes/usuarios.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas aqui também são protegidas
router.use(authMiddleware);

// ROTA: GET /usuarios/me (Buscar meus dados)
router.get('/me', async (req, res) => {
  try {
    // Quem sou "eu"? O middleware colocou em req.usuario!
    const usuarioId = req.usuario.usuario_id;

    // Buscamos os dados, mas NÃO a senha_hash
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
router.put('/me', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;

    // Pegamos os dados que o usuário PODE alterar
    const { nome, posto, data_nascimento, sexo, organizacao_id } = req.body;

    // (O usuário não pode alterar SARAM, email ou senha por esta rota)
    
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

// ROTA: GET /usuarios/me/historico (Dados para gráficos de evolução)
router.get('/me/historico', async (req, res) => {
  // Middleware 'authMiddleware' já está aplicado a este arquivo
  try {
    const usuarioId = req.usuario.usuario_id;

    // Buscamos apenas os dados relevantes para os gráficos, ordenados por data ASCENDENTE
    const resultado = await db.query(
      `SELECT 
         data_teste, 
         peso, 
         cooper_distancia, 
         flexao_reps, 
         barra_reps 
       FROM LogTACF 
       WHERE usuario_id = $1 
         AND data_teste IS NOT NULL -- Garante que temos uma data para o eixo X
       ORDER BY data_teste ASC`, // ASC para gráfico de linha
      [usuarioId]
    );

    // Formata os dados para facilitar o uso no Recharts
    const historicoFormatado = resultado.rows.map(log => ({
        // Formata a data como 'DD/MM/AAAA' para o eixo X
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

module.exports = router;