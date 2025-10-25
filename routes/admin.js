// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// IMPORTANTE: Todas as rotas aqui são protegidas E requerem admin
router.use(authMiddleware);  // 1º Checa se está logado
router.use(adminMiddleware); // 2º Checa se é gerente

// ROTA: GET /admin/stats (ATUALIZADA com mais filtros e métricas)
router.get('/stats', async (req, res) => {
  try {
    // --- Ler filtros da query string ---
    const { om_id, sexo } = req.query;
    const filterOmId = (om_id && om_id !== 'todos') ? parseInt(om_id, 10) : null;
    // Normaliza o filtro de sexo (permite 'Masculino', 'Feminino' ou 'todos')
    const filterSexo = (sexo && sexo !== 'todos' && ['Masculino', 'Feminino'].includes(sexo)) ? sexo : null;

    // Parâmetros para as queries SQL que usam ambos os filtros
    const queryParams = [filterOmId, filterSexo];

    // --- Consultas SQL Atualizadas e Novas ---

    // 1. Contagem total de usuários (filtrados por OM e Sexo)
    const totalUsuariosQuery = `
        SELECT COUNT(*)
        FROM Usuario u
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND ($2::varchar IS NULL OR u.sexo = $2::varchar)
          AND u.nivel_acesso = 'usuario'
    `;
    const totalUsuarios = await db.query(totalUsuariosQuery, queryParams);

    // 2. Contagem de treinos (TFM) por exercício (filtrados por OM e Sexo)
    const treinosPorExercicioQuery = `
        SELECT e.nome, COUNT(t.id) as total
        FROM LogTFM t
        JOIN Exercicio e ON t.exercicio_id = e.id
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND ($2::varchar IS NULL OR u.sexo = $2::varchar)
        GROUP BY e.nome
        ORDER BY total DESC
    `;
    const treinosPorExercicio = await db.query(treinosPorExercicioQuery, queryParams);

    // 3. Contagem de treinos por OM (ignora filtros, sempre mostra todas OMs)
    const treinosPorOMQuery = `
        SELECT om.sigla, COUNT(t.id) as total
        FROM LogTFM t
        JOIN Usuario u ON t.usuario_id = u.id
        JOIN OrganizacaoMilitar om ON u.organizacao_id = om.id
        WHERE om.grupo = 'GUARNAE-RJ'
        GROUP BY om.sigla
        ORDER BY total DESC
    `;
    const treinosPorOM = await db.query(treinosPorOMQuery); // Sem queryParams

    // 4. Média dos resultados do TACF (TAF) (filtrados por OM e Sexo)
    const mediasTACFQuery = `
        SELECT
            AVG(t.cooper_distancia) as media_cooper,
            AVG(t.abdominal_reps) as media_abdominal,
            AVG(t.flexao_reps) as media_flexao,
            AVG(t.barra_reps) as media_barra, -- <<<< Média Barra adicionada
            AVG(t.peso) as media_peso,         -- <<<< Média Peso adicionada
            AVG(t.cintura) as media_cintura,   -- <<<< Média Cintura adicionada
            -- Média IMC (calculada onde altura > 0 para evitar divisão por zero)
            AVG(CASE WHEN t.altura > 0 THEN t.peso / (t.altura * t.altura) ELSE NULL END) as media_imc -- <<<< Média IMC adicionada
        FROM LogTACF t
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND ($2::varchar IS NULL OR u.sexo = $2::varchar)
    `;
    const mediasTACF = await db.query(mediasTACFQuery, queryParams);

    // 5. Total de Treinos TFM Registrados (filtrados por OM e Sexo)
    const totalTFMQuery = `
        SELECT COUNT(t.id) as total
        FROM LogTFM t
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND ($2::varchar IS NULL OR u.sexo = $2::varchar)
    `;
    const totalTFM = await db.query(totalTFMQuery, queryParams);

    // 6. Média de Percepção de Intensidade (TFM) (filtrados por OM e Sexo)
    const mediaIntensidadeQuery = `
        SELECT AVG(t.percepcao_intensidade) as media_intensidade
        FROM LogTFM t
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND ($2::varchar IS NULL OR u.sexo = $2::varchar)
          AND t.percepcao_intensidade IS NOT NULL
    `;
    const mediaIntensidade = await db.query(mediaIntensidadeQuery, queryParams);


    // --- Montar o objeto de resposta com todos os dados ---
    const mediasTAFResult = mediasTACF.rows[0] || {}; // Garante que não é null
    const mediaIntensidadeResult = mediaIntensidade.rows[0] || {}; // Garante que não é null

    res.status(200).json({
      totalUsuarios: totalUsuarios.rows[0].count || 0,
      treinosPorExercicio: treinosPorExercicio.rows,
      treinosPorOM: treinosPorOM.rows,
      // Médias TAF
      mediasTACF: {
        media_cooper: mediasTAFResult.media_cooper,
        media_abdominal: mediasTAFResult.media_abdominal,
        media_flexao: mediasTAFResult.media_flexao,
        media_barra: mediasTAFResult.media_barra, // <<<< Média Barra
        media_peso: mediasTAFResult.media_peso,     // <<<< Média Peso
        media_cintura: mediasTAFResult.media_cintura, // <<<< Média Cintura
        media_imc: mediasTAFResult.media_imc        // <<<< Média IMC
      },
      // Novos Totais e Médias TFM
      totalTFM: totalTFM.rows[0].total || 0,                 // <<<< Total TFM
      mediaIntensidade: mediaIntensidadeResult.media_intensidade // <<<< Média Intensidade
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;