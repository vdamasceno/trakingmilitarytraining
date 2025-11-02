// src/pages/MinhaEvolucao.jsx (Código Completo - CORRIGIDO)
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip // Importação do Tooltip do MUI
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip, // Renomeado para evitar conflito com o Tooltip do MUI
  Legend
} from 'recharts';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// --- Constantes de Filtro ---
const MESES = [
  { valor: 1, nome: 'Janeiro' }, { valor: 2, nome: 'Fevereiro' }, { valor: 3, nome: 'Março' },
  { valor: 4, nome: 'Abril' }, { valor: 5, nome: 'Maio' }, { valor: 6, nome: 'Junho' },
  { valor: 7, nome: 'Julho' }, { valor: 8, nome: 'Agosto' }, { valor: 9, nome: 'Setembro' },
  { valor: 10, nome: 'Outubro' }, { valor: 11, nome: 'Novembro' }, { valor: 12, nome: 'Dezembro' },
];
const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => ANO_ATUAL - i);


// --- Componente 1: StatCard (Para TFM) ---
const StatCard = ({ title, value, unit = '' }) => (
  <Paper 
    elevation={3} 
    sx={{ 
      padding: {xs: 2, md: 3}, 
      textAlign: 'center', 
      height: '100%' 
    }}
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="p" color="primary.main" sx={{ fontWeight: 'bold' }}>
      {value}
      {unit && <Typography variant="h6" component="span" color="text.secondary" sx={{ ml: 0.5 }}>{unit}</Typography>}
    </Typography>
  </Paper>
);

// --- Componente 2: TrophyCard (Para Ranking TAF) ---
const TrophyCard = ({ title, percentil }) => {
  const getTrophyInfo = () => {
    const p = parseFloat(percentil);
    if (isNaN(p) || p === null) return { color: 'disabled', text: 'Sem dados' };
    if (p >= 95) return { color: '#FFD700', text: `Percentil ${p} (Ouro)` }; // Ouro
    if (p >= 90) return { color: '#C0C0C0', text: `Percentil ${p} (Prata)` }; // Prata
    if (p >= 85) return { color: '#CD7F32', text: `Percentil ${p} (Bronze)` }; // Bronze
    return { color: 'action', text: `Percentil ${p}` };
  };
  const { color, text } = getTrophyInfo();
  
  return (
    <Paper elevation={3} sx={{ padding: {xs: 2, md: 3}, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
      <EmojiEventsIcon sx={{ fontSize: 60, color: color, my: 1 }} />
      <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>{text}</Typography>
    </Paper>
  );
};

// --- Componente 3: GraficoEvolucao (Gráficos de Linha TAF - CORRIGIDO) ---
const GraficoEvolucao = ({ data, dataKey, nome, unidade, cor }) => (
    <Paper elevation={3} sx={{ padding: 2, height: '350px', width: '100%', minWidth: '250px' }}>
        <Typography variant="h6" gutterBottom align="center">{nome}</Typography>
        {/* O CÓDIGO DO GRÁFICO QUE FALTAVA */}
        <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.filter(item => item[dataKey] !== null)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis label={{ value: unidade, angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} name={nome} stroke={cor} activeDot={{ r: 8 }} connectNulls />
            </LineChart>
        </ResponsiveContainer>
    </Paper>
);
// --- FIM DA CORREÇÃO ---


export default function MinhaEvolucao() {
  // Estados TAF
  const [historicoTaf, setHistoricoTaf] = useState([]);
  const [percentisTaf, setPercentisTaf] = useState(null);
  const [carregandoTaf, setCarregandoTaf] = useState(true);
  const [erroTaf, setErroTaf] = useState(null);
  // Estados TFM
  const [tfmStats, setTfmStats] = useState(null);
  const [carregandoTfmStats, setCarregandoTfmStats] = useState(true);
  const [erroTfmStats, setErroTfmStats] = useState(null);
  const [selectedAno, setSelectedAno] = useState(ANO_ATUAL);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);

  // useEffect 1: Busca dados do TAF (Gráficos e Percentis)
  useEffect(() => {
    setCarregandoTaf(true);
    setErroTaf(null);
    Promise.all([
      apiClient.get('/usuarios/me/historico'),
      apiClient.get('/usuarios/me/percentis')
    ])
    .then(([historicoResponse, percentisResponse]) => {
      setHistoricoTaf(historicoResponse.data);
      setPercentisTaf(percentisResponse.data);
    })
    .catch(error => {
      console.error("Erro ao buscar dados de evolução TAF:", error);
      setErroTaf("Falha ao carregar dados de evolução TAF. Verifique seu perfil.");
    })
    .finally(() => { setCarregandoTaf(false); });
  }, []);

  // useEffect 2: Busca dados do TFM (Cards Mensais)
  useEffect(() => {
    setCarregandoTfmStats(true);
    setErroTfmStats(null);
    apiClient.get('/usuarios/me/tfm-stats', { params: { ano: selectedAno, mes: selectedMes } })
    .then(response => { setTfmStats(response.data); })
    .catch(error => {
      console.error("Erro ao buscar estatísticas TFM:", error);
      setErroTfmStats("Falha ao carregar estatísticas mensais.");
    })
    .finally(() => { setCarregandoTfmStats(false); });
  }, [selectedAno, selectedMes]);

  // Handlers dos filtros
  const handleAnoChange = (event) => { setSelectedAno(event.target.value); };
  const handleMesChange = (event) => { setSelectedMes(event.target.value); };

  // Renderização principal
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Minha Evolução
      </Typography>

      {/* --- 1. SEÇÃO RESUMO MENSAL TFM (RESTAURADA) --- */}
      <Paper elevation={3} sx={{ padding: { xs: 2, md: 3 }, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Resumo Mensal do TFM</Typography>
        {/* Filtros */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="filtro-mes-label">Mês</InputLabel>
            <Select labelId="filtro-mes-label" value={selectedMes} label="Mês" onChange={handleMesChange}>
              {MESES.map((mes) => (<MenuItem key={mes.valor} value={mes.valor}>{mes.nome}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 100 }}>
            <InputLabel id="filtro-ano-label">Ano</InputLabel>
            <Select labelId="filtro-ano-label" value={selectedAno} label="Ano" onChange={handleAnoChange}>
              {ANOS.map((ano) => (<MenuItem key={ano} value={ano}>{ano}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        {/* Cards de TFM Stats */}
        {carregandoTfmStats ? (<CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />)
        : erroTfmStats ? (<Alert severity="warning">{erroTfmStats}</Alert>)
        : tfmStats && (
          <Grid container spacing={3}>
            <Grid xs={6} sm={3}><StatCard title="Total de Treinos" value={tfmStats.totalTreinos} /></Grid>
            <Grid xs={6} sm={3}><StatCard title="Tempo Total" value={tfmStats.totalTempo} unit="horas" /></Grid>
            <Grid xs={6} sm={3}><StatCard title="Distância Total" value={tfmStats.totalDistancia} unit="km" /></Grid>
            <Grid xs={6} sm={3}><StatCard title="Média Intensidade" value={tfmStats.mediaIntensidade} unit="/ 10" /></Grid>
          </Grid>
        )}
      </Paper>
      {/* --- FIM DA SEÇÃO TFM --- */}


      {/* --- 2. SEÇÃO RANKING TAF (TROFÉUS) --- */}
      {carregandoTaf ? (<CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />)
      : erroTaf ? (<Alert severity="error">{erroTaf}</Alert>)
      : (
        <>
          {percentisTaf && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>Seu Ranking TAF (vs. Mesmo Sexo e OM)</Typography>
              <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={3}><TrophyCard title="Cooper (12 min)" percentil={percentisTaf.cooper_percentil}/></Grid>
                <Grid xs={12} sm={6} md={3}><TrophyCard title="Flexão de Braços" percentil={percentisTaf.flexao_percentil}/></Grid>
                <Grid xs={12} sm={6} md={3}><TrophyCard title="Barra Fixa" percentil={percentisTaf.barra_percentil}/></Grid>
                <Grid xs={12} sm={6} md={3}><TrophyCard title="Esforço TFM (30d)" percentil={percentisTaf.tfm_tempo_percentil}/></Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          {/* --- 3. SEÇÃO GRÁFICOS DE EVOLUÇÃO TAF --- */}
          {historicoTaf.length < 2 ? (
            <Typography variant="h6">Registre pelo menos dois TAFs com dados completos para visualizar seus gráficos de evolução.</Typography>
          ) : (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid xs={12} md={6}><GraficoEvolucao data={historicoTaf} dataKey="peso" nome="Peso Corporal" unidade="kg" cor="#8884d8" /></Grid>
              <Grid xs={12} md={6}><GraficoEvolucao data={historicoTaf} dataKey="cooper" nome="Cooper (12 min)" unidade="m" cor="#82ca9d" /></Grid>
              <Grid xs={12} md={6}><GraficoEvolucao data={historicoTaf} dataKey="flexao" nome="Flexão de Braços" unidade="reps" cor="#ffc658" /></Grid>
              <Grid xs={12} md={6}><GraficoEvolucao data={historicoTaf} dataKey="barra" nome="Barra Fixa" unidade="reps" cor="#ff7300" /></Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}