// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware'); // O porteiro
const adminMiddleware = require('../middleware/adminMiddleware'); // O segurança

// IMPORTANTE: Todas as rotas aqui são protegidas E requerem admin
router.use(authMiddleware);  // 1º Checa se está logado
router.use(adminMiddleware); // 2º Checa se é gerente

// ROTA: GET /admin/stats (Estatísticas para o Dashboard - AGORA COM FILTRO)
router.get('/stats', async (req, res) => {
  try {
    // --- Ler o filtro om_id da query string ---
    // Ex: /admin/stats?om_id=1
    const { om_id } = req.query; 
    // Se om_id for 'todos' ou indefinido, usamos null (sem filtro)
    const filterOmId = (om_id && om_id !== 'todos') ? parseInt(om_id, 10) : null; 
    
    // Parâmetro para as queries SQL (será null se não filtrar)
    const queryParams = [filterOmId]; 

    // --- Ajustar as consultas SQL para usar o filtro ---

    // 1. Contagem total de usuários (filtrados por OM, se aplicável)
    // Usamos COALESCE para tratar o caso de filterOmId ser NULL
    const totalUsuariosQuery = `
        SELECT COUNT(*) 
        FROM Usuario u
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND u.nivel_acesso = 'usuario' -- Contar apenas militares normais
    `;
    const totalUsuarios = await db.query(totalUsuariosQuery, queryParams);

    // 2. Contagem de treinos (TFM) por exercício (filtrados por OM do usuário)
    const treinosPorExercicioQuery = `
        SELECT e.nome, COUNT(t.id) as total
        FROM LogTFM t
        JOIN Exercicio e ON t.exercicio_id = e.id
        JOIN Usuario u ON t.usuario_id = u.id 
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
        GROUP BY e.nome
        ORDER BY total DESC
    `;
    const treinosPorExercicio = await db.query(treinosPorExercicioQuery, queryParams);

    // 3. Contagem de treinos por OM (ignora o filtro aqui, pois queremos todas as OMs)
    const treinosPorOMQuery = `
        SELECT om.sigla, COUNT(t.id) as total
        FROM LogTFM t
        JOIN Usuario u ON t.usuario_id = u.id
        JOIN OrganizacaoMilitar om ON u.organizacao_id = om.id
        WHERE om.grupo = 'GUARNAE-RJ'
        GROUP BY om.sigla
        ORDER BY total DESC
    `;
    // Não passamos queryParams aqui
    const treinosPorOM = await db.query(treinosPorOMQuery); 
    
    // 4. Média dos resultados do TACF (TAF) (filtrados por OM do usuário)
    const mediasTACFQuery = `
        SELECT 
            AVG(t.cooper_distancia) as media_cooper,
            AVG(t.abdominal_reps) as media_abdominal,
            AVG(t.flexao_reps) as media_flexao,
            AVG(t.barra_reps) as media_barra
        FROM LogTACF t
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE ($1::int IS NULL OR u.organizacao_id = $1::int)
          AND (t.cooper_distancia > 0 OR t.abdominal_reps > 0) -- Evita dividir por zero
    `;
    const mediasTACF = await db.query(mediasTACFQuery, queryParams);

    // 5. Junta tudo em um objeto de resposta
    res.status(200).json({
      totalUsuarios: totalUsuarios.rows[0].count,
      treinosPorExercicio: treinosPorExercicio.rows,
      treinosPorOM: treinosPorOM.rows, // Gráfico de OMs continua mostrando todas
      mediasTACF: mediasTACF.rows[0] || { // Garante que não é null se não houver TAFs
          media_cooper: 0, 
          media_abdominal: 0, 
          media_flexao: 0, 
          media_barra: 0 
      }
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;