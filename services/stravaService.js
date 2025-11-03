// services/stravaService.js
const axios = require('axios');
const db = require('../db');

const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';

/**
 * Esta é a função mais importante. Ela garante que temos um token de acesso válido.
 * 1. Pega o token do banco.
 * 2. Verifica se expirou.
 * 3. Se expirou, usa o refresh_token para pegar um novo e o salva no banco.
 * 4. Retorna o token de acesso (antigo ou novo).
 */
const getValidAccessToken = async (usuarioId) => {
  // 1. Pega os tokens do usuário no banco
  const tokenRes = await db.query(
    'SELECT strava_access_token, strava_refresh_token, strava_expires_at FROM Usuario WHERE id = $1',
    [usuarioId]
  );

  if (tokenRes.rows.length === 0 || !tokenRes.rows[0].strava_access_token) {
    throw new Error('Usuário não conectado ao Strava.');
  }

  const userTokens = tokenRes.rows[0];
  const nowInSeconds = Math.floor(Date.now() / 1000);

  // 2. Verifica se o token expirou (expires_at é um timestamp em segundos)
  if (nowInSeconds < userTokens.strava_expires_at) {
    console.log(`[Strava] Token para usuário ${usuarioId} ainda é válido.`);
    return userTokens.strava_access_token; // Token está bom
  }

  // 3. Token expirou! Precisamos de um novo.
  console.log(`[Strava] Token para usuário ${usuarioId} expirou. Atualizando...`);

  const response = await axios.post(STRAVA_OAUTH_URL, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: userTokens.strava_refresh_token
  }); //

  const { access_token, refresh_token, expires_at } = response.data;

  // 4. Salva os NOVOS tokens no banco
  await db.query(
    `UPDATE Usuario 
     SET strava_access_token = $1, strava_refresh_token = $2, strava_expires_at = $3
     WHERE id = $4`,
    [access_token, refresh_token, expires_at, usuarioId]
  );

  console.log(`[Strava] Token para usuário ${usuarioId} foi atualizado.`);
  return access_token; // Retorna o novo token
};

/**
 * Busca as atividades recentes (últimos 7 dias) do Strava.
 */
const fetchRecentActivities = async (accessToken) => {
  // Pega o timestamp de 7 dias atrás (em segundos)
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

  const response = await axios.get(`${STRAVA_API_URL}/athlete/activities`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      after: sevenDaysAgo, // Busca apenas atividades depois desta data
      per_page: 20 // Limita a 20 atividades
    }
  }); //

  return response.data;
};

/**
 * "Traduz" os tipos de atividade do Strava para os IDs de exercício do nosso banco.
 */
const mapStravaTypeToExercicioId = (stravaType) => {
  // Baseado no nosso db/init.sql:
  // 1: Corrida, 2: Natação, 4: Bike Ergométrica, 5: Musculação
  switch (stravaType) {
    case 'Run':
    case 'VirtualRun':
      return 1; // Corrida
    case 'Swim':
      return 2; // Natação
    case 'Ride':
    case 'VirtualRide':
    case 'EBikeRide':
      return 4; // Bike Ergométrica
    case 'WeightTraining':
    case 'Workout': // 'Workout' pode ser HIT
      return 5; // Musculação / HIT (mapeamos para Musculação por simplicidade)
    default:
      return null; // Não suportamos este tipo (ex: Yoga, Remo)
  }
};

/**
 * Formata os dados brutos da atividade do Strava para o formato do nosso formulário TFM.
 */
const parseStravaActivity = (activity) => {
  const exercicio_id = mapStravaTypeToExercicioId(activity.type);

  // Se não reconhecermos o tipo de exercício, pulamos
  if (!exercicio_id) return null;

  // Cria o objeto de detalhes
  const detalhes_treino = {};

  // Dados principais
  const data_treino = activity.start_date_local.slice(0, 16); // Formato AAAA-MM-DDTHH:mm
  const percepcao_intensidade = activity.perceived_exertion || null;

  // Dados dinâmicos (detalhes)
  const tempo_min = (activity.moving_time / 60).toFixed(1); // Converte segundos para minutos
  const fc_media_bpm = activity.average_heartrate ? activity.average_heartrate.toFixed(0) : null;

  if (fc_media_bpm) detalhes_treino.fc_media_bpm = fc_media_bpm;

  if (exercicio_id === 1 || exercicio_id === 4) { // Corrida ou Bike
    detalhes_treino.distancia_km = (activity.distance / 1000).toFixed(2); // Converte metros para km
    detalhes_treino.tempo_min = tempo_min;
  } else if (exercicio_id === 2) { // Natação
    detalhes_treino.distancia_m = activity.distance.toFixed(0);
    detalhes_treino.tempo_min = tempo_min;
  } else if (exercicio_id === 5) { // Musculação / Workout
    detalhes_treino.duracao_min = tempo_min;
  }

  return {
    id: activity.id, // ID do Strava (para evitar duplicatas)
    data_treino,
    exercicio_id,
    percepcao_intensidade,
    detalhes_treino
  };
};


module.exports = {
  getValidAccessToken,
  fetchRecentActivities,
  parseStravaActivity
};