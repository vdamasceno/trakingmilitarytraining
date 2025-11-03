// routes/strava.js (Completo com Rota de Atividades)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');
const axios = require('axios');

// --- Importar o novo serviço ---
const { 
  getValidAccessToken, 
  fetchRecentActivities, 
  parseStravaActivity 
} = require('../services/stravaService');

// ROTA 1: GET /strava/auth (Redireciona para o Strava)
router.get('/auth', authMiddleware, (req, res) => {
  // ... (código desta rota permanece o mesmo) ...
  const usuarioId = req.usuario.usuario_id;
  const stravaClientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL}/strava/callback`;
  const scope = 'activity:read_all';
  const state = usuarioId;
  const authUrl = `https://www.strava.com/oauth/authorize?` +
                  `client_id=${stravaClientId}` +
                  `&response_type=code` +
                  `&redirect_uri=${redirectUri}` +
                  `&approval_prompt=force` +
                  `&scope=${scope}` +
                  `&state=${state}`;
  res.status(200).json({ authUrl: authUrl });
});


// ROTA 2: GET /strava/callback (Recebe autorização)
router.get('/callback', async (req, res) => {
  // ... (código desta rota permanece o mesmo) ...
  try {
    const { code, state, error } = req.query;
    if (error === 'access_denied') { /* ... */ }
    const usuarioId = state;
    if (!code || !usuarioId) { /* ... */ }

    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

    await db.query(
      `UPDATE Usuario SET strava_access_token = $1, strava_refresh_token = $2, strava_expires_at = $3, strava_athlete_id = $4
       WHERE id = $5`,
      [access_token, refresh_token, expires_at, athlete.id, usuarioId]
    );

    res.status(200).send(
      '<h1>Sucesso!</h1><p>Sua conta do Strava foi conectada.</p><p>Você pode fechar esta janela e voltar para o aplicativo.</p>'
    );
  } catch (error) {
    console.error("Erro no callback do Strava:", error.response?.data || error.message);
    res.status(500).send('<h1>Erro na conexão com o Strava.</h1><p>Tente novamente mais tarde.</p>');
  }
});


// --- INÍCIO DA NOVA ROTA ---
// ROTA 3: GET /strava/activities
// Busca as atividades recentes do Strava para o usuário logado
router.get('/activities', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.usuario.usuario_id;

    // 1. Garante que temos um token válido (atualiza se necessário)
    const accessToken = await getValidAccessToken(usuarioId);

    // 2. Busca as atividades recentes no Strava
    const stravaActivities = await fetchRecentActivities(accessToken);

    // 3. "Traduz" as atividades para o formato do nosso app
    const parsedActivities = stravaActivities
      .map(parseStravaActivity) // Mapeia
      .filter(a => a !== null); // Remove atividades que não suportamos (ex: Yoga)

    res.status(200).json(parsedActivities);

  } catch (error) {
    // Trata erros (ex: "Usuário não conectado ao Strava")
    console.error("Erro ao buscar atividades do Strava:", error.message);
    res.status(500).json({ message: error.message || "Erro interno ao buscar atividades." });
  }
});
// --- FIM DA NOVA ROTA ---

module.exports = router;