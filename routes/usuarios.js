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

// routes/usuarios.js

// ... (imports e rotas GET /me, PUT /me, GET /me/historico, GET /me/tfm-stats) ...

// ROTA: GET /usuarios/me/percentis (ATUALIZADA com Gamificação TAF e TFM)
router.get('/me/percentis', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;

    // 1. Descobre o sexo e OM do usuário logado
    const userRes = await db.query("SELECT sexo, organizacao_id FROM Usuario WHERE id = $1", [usuarioId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    const { sexo, organizacao_id } = userRes.rows[0];

    if (!sexo || !organizacao_id) {
      return res.status(400).json({ message: "Perfil incompleto. Não é possível calcular percentis sem Sexo e OM." });
    }

    // 2. Query SQL de Gamificação (agora com TFM 30 dias)
    const percentileQuery = `
      WITH 
      -- CTE 1: Pega o TAF mais recente de cada usuário do grupo (Sexo + OM)
      UltimosTAFs AS (
        SELECT DISTINCT ON (t.usuario_id)
            t.usuario_id,
            t.cooper_distancia,
            t.flexao_reps,
            t.barra_reps
        FROM LogTACF t
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE u.sexo = $1 AND u.organizacao_id = $2
        ORDER BY t.usuario_id, t.data_teste DESC
      ),

      -- CTE 2: Pega o Tempo Total de TFM nos últimos 30 dias de cada usuário do grupo
      TFMTempo30d AS (
        SELECT
            t.usuario_id,
            SUM(
                COALESCE((t.detalhes_treino ->> 'tempo_min')::numeric, 0) +
                COALESCE((t.detalhes_treino ->> 'duracao_min')::numeric, 0) +
                COALESCE(
                    (t.detalhes_treino ->> 'tempo_estimulo_s')::numeric *
                    (t.detalhes_treino ->> 'numero_sessoes')::numeric / 60.0,
                    0
                )
            ) AS total_tempo_min_30d
        FROM LogTFM t
        JOIN Usuario u ON t.usuario_id = u.id
        WHERE u.sexo = $1 AND u.organizacao_id = $2
          AND t.data_treino >= (NOW() - INTERVAL '30 days')
        GROUP BY t.usuario_id
      ),

      -- CTE 3: Junta os dados de TAF e TFM (pode haver usuário só com TAF ou só com TFM)
      Combinado AS (
        SELECT
            COALESCE(taf.usuario_id, tfm.usuario_id) as usuario_id,
            taf.cooper_distancia,
            taf.flexao_reps,
            taf.barra_reps,
            tfm.total_tempo_min_30d
        FROM UltimosTAFs taf
        FULL OUTER JOIN TFMTempo30d tfm ON taf.usuario_id = tfm.usuario_id
      ),

      -- CTE 4: Calcula os rankings (percentil) para todos no grupo
      Rankings AS (
        SELECT
            usuario_id,
            (PERCENT_RANK() OVER (ORDER BY cooper_distancia ASC NULLS FIRST)) * 100 as cooper_percentil,
            (PERCENT_RANK() OVER (ORDER BY flexao_reps ASC NULLS FIRST)) * 100 as flexao_percentil,
            (PERCENT_RANK() OVER (ORDER BY barra_reps ASC NULLS FIRST)) * 100 as barra_percentil,
            (PERCENT_RANK() OVER (ORDER BY total_tempo_min_30d ASC NULLS FIRST)) * 100 as tfm_tempo_percentil
        FROM Combinado
      )

      -- Query Final: Pega apenas os dados do usuário logado
      SELECT
          ROUND(COALESCE(cooper_percentil, 0)) as cooper_percentil,
          ROUND(COALESCE(flexao_percentil, 0)) as flexao_percentil,
          ROUND(COALESCE(barra_percentil, 0)) as barra_percentil,
          ROUND(COALESCE(tfm_tempo_percentil, 0)) as tfm_tempo_percentil -- <<<< NOVO CAMPO
      FROM Rankings
      WHERE usuario_id = $3;
    `;
    
    const params = [sexo, organizacao_id, usuarioId];
    const percentisRes = await db.query(percentileQuery, params);

    if (percentisRes.rows.length === 0) {
      // Usuário não tem TAF nem TFM
      return res.status(200).json({
        cooper_percentil: null,
        flexao_percentil: null,
        barra_percentil: null,
        tfm_tempo_percentil: null,
        message: "Nenhum dado registrado para calcular percentis."
      });
    }
    
    // Retorna os dados com o novo campo
    res.status(200).json(percentisRes.rows[0]);

  } catch (error) {
    console.error("Erro ao calcular percentis:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor ao calcular percentis." });
  }
});

// ROTA: GET /usuarios/me/tfm-stats (Calcula estatísticas mensais do TFM)
router.get('/me/tfm-stats', async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;

    // 1. Pegar filtros de ano e mês da query string (ex: ?ano=2025&mes=11)
    const { ano, mes } = req.query;

    // 2. Se não vierem filtros, usa o ano e mês atuais
    const dataAtual = new Date();
    const filterAno = ano ? parseInt(ano, 10) : dataAtual.getFullYear();
    // getMonth() é 0-11, então somamos 1
    const filterMes = mes ? parseInt(mes, 10) : dataAtual.getMonth() + 1; 

    // 3. A Query SQL de Agregação
    // Esta query faz todo o cálculo no banco de dados
    const statsQuery = `
      SELECT
          -- Métrica 1: Total de Treinos
          COUNT(*) AS total_treinos,

          -- Métrica 2: Média de Intensidade (arredondada para 1 casa decimal)
          ROUND(AVG(percepcao_intensidade), 1) AS media_intensidade,

          -- Métrica 3: Tempo Total (em minutos)
          SUM(
              -- COALESCE trata campos nulos como 0
              -- ->> 'campo' extrai o valor do JSON como texto
              -- ::numeric converte o texto para número
              COALESCE((detalhes_treino ->> 'tempo_min')::numeric, 0) +
              COALESCE((detalhes_treino ->> 'duracao_min')::numeric, 0) +
              -- Lógica do HIT: (tempo_estimulo_s * numero_sessoes) / 60 para virar minutos
              COALESCE(
                  (detalhes_treino ->> 'tempo_estimulo_s')::numeric *
                  (detalhes_treino ->> 'numero_sessoes')::numeric / 60.0,
                  0
              )
          ) AS total_tempo_min,

          -- Métrica 4: Distância Total (em km)
          SUM(
              COALESCE((detalhes_treino ->> 'distancia_km')::numeric, 0) +
              -- Lógica da Natação: (distancia_m / 1000) para virar km
              COALESCE((detalhes_treino ->> 'distancia_m')::numeric / 1000.0, 0)
          ) AS total_distancia_km

      FROM LogTFM
      WHERE
          usuario_id = $1
          AND EXTRACT(YEAR FROM data_treino) = $2
          AND EXTRACT(MONTH FROM data_treino) = $3;
    `;

    const params = [usuarioId, filterAno, filterMes];
    const statsRes = await db.query(statsQuery, params);

    // Se não houver treinos no mês (total_treinos será 0 ou null)
    if (statsRes.rows.length === 0 || !statsRes.rows[0].total_treinos || statsRes.rows[0].total_treinos === '0') {
      return res.status(200).json({
        totalTreinos: 0,
        mediaIntensidade: 0,
        totalTempo: 0,
        totalDistancia: 0,
        message: "Nenhum treino TFM registrado para este período."
      });
    }

    const stats = statsRes.rows[0];

    // 4. Formatar a resposta final
    res.status(200).json({
      totalTreinos: parseInt(stats.total_treinos, 10),
      // Converte o total de minutos em horas, com 1 casa decimal
      totalTempo: stats.total_tempo_min ? (parseFloat(stats.total_tempo_min) / 60.0).toFixed(1) : '0.0',
      // Formata com 1 casa decimal
      totalDistancia: stats.total_distancia_km ? parseFloat(stats.total_distancia_km).toFixed(1) : '0.0',
      // Formata com 1 casa decimal
      mediaIntensidade: stats.media_intensidade ? parseFloat(stats.media_intensidade).toFixed(1) : '0.0'
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas TFM:", error.message, error.stack);
    res.status(500).json({ message: "Erro interno no servidor ao buscar estatísticas TFM." });
  }
});

module.exports = router;