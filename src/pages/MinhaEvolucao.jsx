// src/pages/MinhaEvolucao.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Componente reutilizável para cada gráfico
const GraficoEvolucao = ({ data, dataKey, nome, unidade, cor }) => (
  <Paper elevation={3} sx={{ padding: 2, height: '350px', width: '100%',minWidth: '250px' }}>
    <Typography variant="h6" gutterBottom align="center">{nome}</Typography>
    <ResponsiveContainer width="100%" height="90%">
      <LineChart
        data={data.filter(item => item[dataKey] !== null)} // Filtra pontos sem dados
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="data" /> {/* Eixo X usa a data formatada */}
        <YAxis label={{ value: unidade, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={dataKey} // Chave dos dados (ex: 'peso', 'cooper')
          name={nome}      // Nome na legenda
          stroke={cor}     // Cor da linha
          activeDot={{ r: 8 }} // Bolinha maior ao passar o mouse
          connectNulls // Conecta a linha mesmo se houver dados faltando
        />
      </LineChart>
    </ResponsiveContainer>
  </Paper>
);


export default function MinhaEvolucao() {
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    // Adiciona um log para saber se a busca começou
    console.log("Buscando histórico..."); 
    apiClient.get('/usuarios/me/historico')
      .then(response => {
        // Adiciona um log para ver os dados recebidos
        console.log("Histórico recebido:", response.data); 
        setHistorico(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar histórico:", error);
        setErro("Falha ao carregar dados de evolução.");
      })
      .finally(() => {
         // Adiciona um log para saber quando a busca terminou
        console.log("Busca de histórico finalizada.");
        setCarregando(false);
      });
  }, []);

  // Log para ver o estado atual antes de renderizar
  console.log("Renderizando MinhaEvolucao:", { carregando, erro, historicoLength: historico.length });

  // 1. Renderiza "Carregando" primeiro
  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando histórico...</Typography>
      </Box>
    );
  }

  // 2. Renderiza erro, se houver
  if (erro) {
    return <Alert severity="error">{erro}</Alert>;
  }

  // 3. Renderiza mensagem se não houver dados suficientes APÓS carregar
  if (!carregando && historico.length < 2) {
    return (
        <Box sx={{mt: 4}}>
             <Typography variant="h6">
                Registre pelo menos dois TAFs com dados completos para visualizar sua evolução.
             </Typography>
        </Box>
    );
  }

  // 4. Se passou por tudo, renderiza os gráficos
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Minha Evolução no TAF
      </Typography>
      
      {/* O Grid só é renderizado DEPOIS que 'carregando' é false e temos dados */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        
        {/* Gráfico de Peso */}
        <Grid item xs={12} md={6}>
          <GraficoEvolucao 
            data={historico} 
            dataKey="peso" 
            nome="Peso Corporal" 
            unidade="kg" 
            cor="#8884d8" 
          />
        </Grid>

        {/* Gráfico de Cooper */}
        <Grid item xs={12} md={6}>
          <GraficoEvolucao 
            data={historico} 
            dataKey="cooper" 
            nome="Cooper (12 min)" 
            unidade="m" 
            cor="#82ca9d" 
          />
        </Grid>

        {/* Gráfico de Flexão */}
        <Grid item xs={12} md={6}>
          <GraficoEvolucao 
            data={historico} 
            dataKey="flexao" 
            nome="Flexão de Braços" 
            unidade="reps" 
            cor="#ffc658" 
          />
        </Grid>

        {/* Gráfico de Barra */}
        <Grid item xs={12} md={6}>
          <GraficoEvolucao 
            data={historico} 
            dataKey="barra" 
            nome="Barra Fixa" 
            unidade="reps" 
            cor="#ff7300" 
          />
        </Grid>

      </Grid>
    </Box>
  );
}