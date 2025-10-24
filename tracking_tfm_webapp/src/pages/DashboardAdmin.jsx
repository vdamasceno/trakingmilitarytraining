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
  // --- A LÓGICA DE BUSCA DE DADOS PERMANECE A MESMA ---
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // --- Estados para o filtro ---
  const [organizacoes, setOrganizacoes] = useState([]);
  const [selectedOmId, setSelectedOmId] = useState('todos'); // 'todos' como valor inicial
  // --- Fim Estados Filtro ---

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
  }, [selectedOmId]); 
  // --- Fim useEffect Estatísticas ---


  const handleOmChange = (event) => {
    setSelectedOmId(event.target.value);
    // O useEffect acima vai re-buscar os dados automaticamente
  };


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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard Gerencial
      </Typography>
      
      {/* --- O Dropdown de Filtro --- */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="om-filter-label">Filtrar por OM</InputLabel>
          <Select
            labelId="om-filter-label"
            id="om-filter"
            value={selectedOmId}
            label="Filtrar por OM"
            onChange={handleOmChange}
          >
            {/* Opção "Todas" */}
            <MenuItem value="todos"><em>Todas as OMs</em></MenuItem> 
            {/* Lista de OMs */}
            {organizacoes.map((om) => (
              <MenuItem key={om.id} value={om.id}>
                {om.sigla}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      {/* --- Fim Dropdown Filtro --- */}    

      {/* Os Cards de Resumo Rápido permanecem os mesmos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* ... (Os 4 Grids com StatCard não mudam) ... */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total de Usuários" value={stats.totalUsuarios} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Média Cooper" 
            value={parseFloat(stats.mediasTACF.media_cooper || 0).toFixed(0)} 
            unit="m"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Média Abdominal" 
            value={parseFloat(stats.mediasTACF.media_abdominal || 0).toFixed(1)}
            unit="reps"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Média Flexão" 
            value={parseFloat(stats.mediasTACF.media_flexao || 0).toFixed(1)}
            unit="reps"
          />
        </Grid>
      </Grid>

      {/* --- INÍCIO DA SUBSTITUIÇÃO DAS TABELAS --- */}
      <Grid container spacing={3}>
        
        {/* Tabela 1 vira GRÁFICO DE BARRAS */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Treinos (TFM) por OM</Typography>
          <Paper elevation={3} sx={{ padding: 2, height: '400px' }}>
            {/* O ResponsiveContainer faz o gráfico ocupar o espaço do Paper */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.treinosPorOM} // Nossos dados da API
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sigla" /> {/* O que vai no eixo X (BASC, BAAF) */}
                <YAxis allowDecimals={false} /> {/* Não permite "2.5" treinos */}
                <Tooltip /> {/* A "dica" ao passar o mouse */}
                <Legend />
                <Bar dataKey="total" fill="#005a9c" /> {/* O que vai no eixo Y (o total) */}
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Tabela 2 vira GRÁFICO DE PIZZA */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Treinos (TFM) por Exercício</Typography>
          <Paper elevation={3} sx={{ padding: 2, height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.treinosPorExercicio} // Nossos dados da API
                  dataKey="total"     // O valor (o total)
                  nameKey="nome"      // O nome (Corrida, HIT)
                  cx="50%"            // Posição X (centro)
                  cy="50%"            // Posição Y (centro)
                  outerRadius={120}   // Tamanho
                  fill="#8884d8"
                  label // Mostra o label na fatia
                >
                  {/* Pinta cada fatia com uma cor da nossa lista */}
                  {stats.treinosPorExercicio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
  // --- FIM DO NOVO JSX COM MUI ---
}