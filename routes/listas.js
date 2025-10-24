// routes/listas.js (VERSÃO NOVA - CORRIGIDA)
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware'); // Importamos o "porteiro"

// IMPORTANTE: Todas as rotas neste arquivo usarão o authMiddleware
// Isso significa que o usuário DEVE estar logado para acessá-las
// ROTA: GET /listas/organizacoes
router.get('/organizacoes', async (req, res) => {
  try {
    // Filtramos pelo grupo "GUARNAE-RJ" conforme sua solicitação
    const resultado = await db.query(
      "SELECT id, sigla, nome FROM OrganizacaoMilitar WHERE grupo = $1 ORDER BY sigla",
      ['GUARNAE-RJ']
    );

    res.status(200).json(resultado.rows);

  } catch (error) {
    console.error("Erro ao buscar organizações:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ROTA: GET /listas/exercicios
router.get('/exercicios', authMiddleware, async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT id, nome, campos_necessarios FROM Exercicio ORDER BY nome"
    );
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error("Erro ao buscar exercícios:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;