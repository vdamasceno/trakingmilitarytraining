// src/pages/DashboardAdmin.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
  // Não precisamos mais dos componentes de Tabela aqui
} from '@mui/material';

// --- INÍCIO DAS IMPORTAÇÕES DO RECHARTS ---
import {
  ResponsiveContainer, // Torna o gráfico responsivo
  BarChart,            // O gráfico de barras
  Bar,                 // As barras
  PieChart,            // O gráfico de pizza
  Pie,                 // A fatia da pizza
  Cell,                // Para colorir as fatias
  XAxis,               // Eixo X
  YAxis,               // Eixo Y
  CartesianGrid,       // As linhas de grade
  Tooltip,             // A "dica" que aparece ao passar o mouse
  Legend               // A legenda
} from 'recharts';
// --- FIM DAS IMPORTAÇÕES DO RECHARTS ---


// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [organizacoes, setOrganizacoes] = useState([]);
  const [selectedOmId, setSelectedOmId] = useState('todos');
  const [selectedSexo, setSelectedSexo] = useState('todos');

  // useEffect para buscar OMs (sem mudança)
  
  // --- useEffect para buscar OMs ---
  useEffect(() => {
    apiClient.get('/listas/organizacoes') // Rota pública
      .then(response => {
        setOrganizacoes(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar OMs para filtro:", error);
        // Não definimos erro aqui para não travar o dashboard se só o filtro falhar
      });
  }, []); // Roda só uma vez

  // --- useEffect para buscar ESTATÍSTICAS (agora depende do filtro) ---
  useEffect(() => {
    setCarregando(true);
    setErro(null);

    // Define os parâmetros da query
    const params = {};
    if (selectedOmId && selectedOmId !== 'todos') {
      params.om_id = selectedOmId;
    }
    
    if (selectedSexo && selectedSexo !== 'todos') { // <<<<< ADICIONA PARÂMETRO SEXO
      params.sexo = selectedSexo;
    }

    apiClient.get('/admin/stats', { params }) // Passa os parâmetros aqui
      .then(response => {
        setStats(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar estatísticas:", error);
        setErro("Falha ao carregar dados do dashboard.");
      })
      .finally(() => {
        setCarregando(false);
      });
  // Roda de novo QUANDO selectedOmId mudar
  }, [selectedOmId], selectedSexo); 
  // --- Fim useEffect Estatísticas ---


  const handleOmChange = (event) => { setSelectedOmId(event.target.value); };
  const handleSexoChange = (event) => { setSelectedSexo(event.target.value); };
  

  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando Dashboard Gerencial...
        </Typography>
      </Box>
    );
  }
  if (erro) { return <Alert severity="error">{erro}</Alert>; }
  if (!stats) { return <Typography variant="h5">Não foi possível carregar as estatísticas.</Typography>; }

  
  // O StatCard permanece o mesmo
  const StatCard = ({ title, value, unit = '' }) => (
    <Paper elevation={3} sx={{ padding: 3, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="p" color="primary.main" sx={{ fontWeight: 'bold' }}>
        {value}
        {unit && <Typography variant="h6" component="span" color="text.secondary"> {unit}</Typography>}
      </Typography>
    </Paper>
  );

  // --- ADICIONE A FUNÇÃO formatStat AQUI ---
  // Função auxiliar para formatar números ou mostrar '-'
  const formatStat = (value, decimals = 0) => {
    const num = parseFloat(value);
    return !isNaN(num) ? num.toFixed(decimals) : '-';
  };
  // --- FIM DA ADIÇÃO ---

  return (
    <Box>
      {/* --- Cabeçalho com Filtros --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, md: 0 } }}>
          Dashboard Gerencial
        </Typography>
        
        {/* Container para os filtros */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Filtro OM */}
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="om-filter-label">Filtrar por OM</InputLabel>
            <Select labelId="om-filter-label" value={selectedOmId} label="Filtrar por OM" onChange={handleOmChange}>
              <MenuItem value="todos"><em>Todas as OMs</em></MenuItem>
              {organizacoes.map((om) => (<MenuItem key={om.id} value={om.id}>{om.sigla}</MenuItem>))}
            </Select>
          </FormControl>

          {/* --- Filtro Sexo --- */}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="sexo-filter-label">Filtrar por Sexo</InputLabel>
            <Select labelId="sexo-filter-label" value={selectedSexo} label="Filtrar por Sexo" onChange={handleSexoChange}>
              <MenuItem value="todos"><em>Ambos</em></MenuItem>
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Feminino">Feminino</MenuItem>
            </Select>
          </FormControl>
          {/* --- Fim Filtro Sexo --- */}
        </Box>
      </Box>
      
      {/* --- Cards de Resumo Rápido --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Total de Usuários" value={stats.totalUsuarios} /></Grid>
        {/* Médias TAF */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Cooper" value={formatStat(stats.mediasTACF?.media_cooper)} unit="m"/></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Abdominal" value={formatStat(stats.mediasTACF?.media_abdominal, 1)} unit="reps"/></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Flexão" value={formatStat(stats.mediasTACF?.media_flexao, 1)} unit="reps"/></Grid>
        {/* --- Card Média Barra --- */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Barra" value={formatStat(stats.mediasTACF?.media_barra, 1)} unit="reps"/></Grid>
        {/* --- Card Total TFM --- */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Total Treinos TFM" value={stats.totalTFM} /></Grid>
        {/* --- Card Média Intensidade --- */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Intensid. TFM" value={formatStat(stats.mediaIntensidade, 1)} unit="/ 10"/></Grid>
        {/* --- Card Média Peso --- */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Peso" value={formatStat(stats.mediasTACF?.media_peso, 1)} unit="kg"/></Grid>
        {/* --- Card Média IMC --- */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média IMC" value={formatStat(stats.mediasTACF?.media_imc, 1)} unit="kg/m²"/></Grid>
        {/* --- Card Média Cintura --- */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Média Cintura" value={formatStat(stats.mediasTACF?.media_cintura, 1)} unit="cm"/></Grid>
      </Grid>

      {/* --- Gráficos --- */}
      <Grid container spacing={3}>
        {/* Gráfico de Barras por OM (sempre mostra todas) */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Treinos (TFM) por OM</Typography>
          <Paper elevation={3} sx={{ padding: 2, height: '400px', /* ... */ }}>
            {/* ... (Código BarChart sem mudança) ... */}
          </Paper>
        </Grid>

        {/* Gráfico de Pizza por Exercício (reflete filtros OM e Sexo) */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Treinos (TFM) por Exercício {selectedOmId !== 'todos' ? `(${organizacoes.find(o => o.id === selectedOmId)?.sigla || ''})` : '(Geral OM)'} {selectedSexo !== 'todos' ? `(${selectedSexo})` : '(Geral Sexo)'}
          </Typography>
           <Paper elevation={3} sx={{ padding: 2, height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {stats.treinosPorExercicio && stats.treinosPorExercicio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={stats.treinosPorExercicio} dataKey="total" nameKey="nome" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label>
                    {stats.treinosPorExercicio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Nenhum treino TFM registrado para os filtros selecionados.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}