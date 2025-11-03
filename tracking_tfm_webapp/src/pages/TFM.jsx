// src/pages/TFM.jsx (Código Completo, Integral e Corrigido)
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

// --- Importações de Validação ---
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// --- Importações MUI ---
import {
  Box, Button, TextField, Typography, Grid, Paper, Alert,
  Select, MenuItem, InputLabel, FormControl, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Divider, FormHelperText,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

// --- Importações Recharts ---
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';


// --- Constantes ---
const LABELS_CAMPOS = {
  distancia_km: 'Distância (km)',
  tempo_min: 'Tempo (min)',
  pace_min_km: 'Pace (min/km)',
  fc_media_bpm: 'FC Média (bpm)',
  distancia_m: 'Distância (m)',
  ritmo_100m: 'Ritmo (/100m)',
  tempo_estimulo_s: 'Tempo Estímulo (s)',
  tempo_recuperacao_s: 'Tempo Recuperação (s)',
  numero_sessoes: 'Número de Sessões',
  grupo_muscular: 'Grupo Muscular',
  duracao_min: 'Duração (min)',
  nome_atividade: 'Nome da Atividade (ex: Futebol)'
};

// Schema de validação Zod
const optionalNumeric = z.coerce.string() // Força para string
  .optional()
  .transform(val => (val === "" ? undefined : val))
  .refine(val => val === undefined || !isNaN(Number(val)), "Deve ser um número");

const tfmSchema = z.object({
  data_treino: z.string().min(1, 'Data e Hora são obrigatórios'),
  exercicio_id: z.string().min(1, 'Exercício é obrigatório'),
  percepcao_intensidade: z.coerce.number().min(0, "Mín. 0").max(10, "Máx. 10"),
  distancia_km: optionalNumeric,
  tempo_min: optionalNumeric,
  pace_min_km: z.string().optional(),
  fc_media_bpm: optionalNumeric,
  distancia_m: optionalNumeric,
  ritmo_100m: z.string().optional(),
  tempo_estimulo_s: optionalNumeric,
  tempo_recuperacao_s: optionalNumeric,
  numero_sessoes: optionalNumeric,
  grupo_muscular: z.string().optional(),
  duracao_min: optionalNumeric,
  nome_atividade: z.string().optional()
});
// --- Fim das Constantes ---


export default function TFM() {
  // --- Estados ---
  const [logs, setLogs] = useState([]);
  const [exercicios, setExercicios] = useState([]);
  const [editId, setEditId] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroApi, setErroApi] = useState(null);
  const [sucessoApi, setSucessoApi] = useState(null);
  const [stravaActivities, setStravaActivities] = useState([]);
  const [carregandoStrava, setCarregandoStrava] = useState(false);
  const [erroStrava, setErroStrava] = useState(null);

  // --- Configuração do react-hook-form ---
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(tfmSchema),
    defaultValues: {
      data_treino: '',
      exercicio_id: '',
      percepcao_intensidade: 5,
      distancia_km: '', tempo_min: '', pace_min_km: '', fc_media_bpm: '',
      distancia_m: '', ritmo_100m: '', tempo_estimulo_s: '', tempo_recuperacao_s: '',
      numero_sessoes: '', grupo_muscular: '', duracao_min: '', nome_atividade: ''
    }
  });

  const exercicioIdSelecionado = watch('exercicio_id');
  const watchedDistKm = watch('distancia_km');
  const watchedDistM = watch('distancia_m');
  const watchedTempoMin = watch('tempo_min');

  // --- useEffect para Cálculo Automático de Pace/Ritmo ---
  useEffect(() => {
    const distKm = parseFloat(watchedDistKm);
    const distM = parseFloat(watchedDistM);
    const tempoMin = parseFloat(watchedTempoMin);

    const formatarParaMinSeg = (valorDecimal) => {
      if (isNaN(valorDecimal) || !isFinite(valorDecimal) || valorDecimal < 0) return "";
      const minutos = Math.floor(valorDecimal);
      const segundos = Math.round((valorDecimal - minutos) * 60);
      return `${minutos}:${segundos.toString().padStart(2, '0')}`;
    };

    if (distKm > 0 && tempoMin > 0) {
      const paceDecimal = tempoMin / distKm;
      const paceFormatado = formatarParaMinSeg(paceDecimal);
      setValue('pace_min_km', paceFormatado, { shouldValidate: true });
    } else {
      setValue('pace_min_km', '', { shouldValidate: true });
    }

    if (distM > 0 && tempoMin > 0) {
      const ritmoDecimal = (tempoMin / distM) * 100;
      const ritmoFormatado = formatarParaMinSeg(ritmoDecimal);
      setValue('ritmo_100m', ritmoFormatado, { shouldValidate: true });
    } else {
      setValue('ritmo_100m', '', { shouldValidate: true });
    }

  }, [watchedDistKm, watchedTempoMin, watchedDistM, setValue]);


  // --- Funções de API e Handlers ---
  const fetchData = async () => {
    try {
      setCarregandoDados(true);
      setErroApi(null); // Limpa erros antigos ao recarregar
      const [logsResponse, exerciciosResponse] = await Promise.all([
        apiClient.get('/tfm'),
        apiClient.get('/listas/exercicios')
      ]);
      setLogs(logsResponse.data);
      setExercicios(exerciciosResponse.data);
      if (!editId && exerciciosResponse.data.length > 0 && !watch('exercicio_id')) {
        reset(form => ({ ...form, exercicio_id: exerciciosResponse.data[0].id.toString() }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados do TFM:", error);
      setErroApi("Falha ao carregar dados da página.");
    } finally {
      setCarregandoDados(false);
    }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelEdit = () => {
    setEditId(null);
    reset();
    setErroApi(null);
    setSucessoApi(null);
    if (exercicios.length > 0) {
      reset(form => ({ ...form, exercicio_id: exercicios[0].id.toString(), percepcao_intensidade: 5 }));
    }
  };

  // onSubmit com a correção da mensagem de sucesso
  const onSubmit = async (data) => {
    setErroApi(null);
    setSucessoApi(null);

    const exercicio = exercicios.find(ex => ex.id === parseInt(data.exercicio_id, 10));
    const detalhes_treino = {};
    if (exercicio && exercicio.campos_necessarios) {
      exercicio.campos_necessarios.forEach(campo => {
        if (data[campo] !== undefined && data[campo] !== null && data[campo] !== "") {
          detalhes_treino[campo] = data[campo];
        }
      });
    }

    const dadosEnvio = {
      data_treino: data.data_treino,
      exercicio_id: parseInt(data.exercicio_id, 10),
      percepcao_intensidade: data.percepcao_intensidade,
      detalhes_treino: detalhes_treino
    };

    try {
      if (editId) {
        await apiClient.put(`/tfm/${editId}`, dadosEnvio);
        setSucessoApi("Treino atualizado com sucesso!");
      } else {
        await apiClient.post('/tfm', dadosEnvio);
        setSucessoApi("Treino salvo com sucesso!");
      }
      
      // Limpa o formulário manualmente (sem chamar handleCancelEdit)
      setEditId(null); 
      reset();
      if (exercicios.length > 0) {
        reset(form => ({ ...form, exercicio_id: exercicios[0].id.toString(), percepcao_intensidade: 5 }));
      }
      
      await fetchData(); // Recarrega a tabela

    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      let errorMsg = "Erro ao salvar. Verifique os dados.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setErroApi(errorMsg);
    }
  };

  const handleEdit = (log) => {
    setEditId(log.id);
    const dataFormatada = log.data_treino ? log.data_treino.slice(0, 16) : '';
    
    // Limpa todos os campos antes de preencher
    const defaultValues = {
      data_treino: dataFormatada,
      percepcao_intensidade: log.percepcao_intensidade || 5,
      exercicio_id: log.exercicio_id.toString(),
    };

    reset({
      ...defaultValues,
      ...(log.detalhes_treino || {})
    });
    
    window.scrollTo(0, 0);
  };

  // handleDelete com alerta de erro
  const handleDelete = async (logId) => {
    if (window.confirm("Tem certeza que deseja excluir este treino?")) {
      setCarregandoDados(true); 
      setErroApi(null);
      try {
        await apiClient.delete(`/tfm/${logId}`);
        await fetchData(); 
      } catch (error) {
        console.error("Erro ao excluir treino:", error);
        const errorMsg = error.response?.data?.message || "Erro ao excluir o registro.";
        setErroApi(errorMsg);
        alert(errorMsg); 
        setCarregandoDados(false); 
      }
    }
  };
  
  // renderCamposDinamicos (com campos desabilitados)
  const renderCamposDinamicos = () => {
    const exercicioSelecionado = exercicios.find(
      ex => ex.id === parseInt(exercicioIdSelecionado, 10)
    );
    if (!exercicioSelecionado || !exercicioSelecionado.campos_necessarios) { return null; }
    const campos = exercicioSelecionado.campos_necessarios;
    
    return campos.map(nomeCampo => {
      const isNumeric = (nomeCampo.includes('tempo') || nomeCampo.includes('distancia') || nomeCampo.includes('numero') || nomeCampo.includes('bpm') || nomeCampo.includes('min') || nomeCampo.includes('km')) 
                      && !nomeCampo.includes('pace') && !nomeCampo.includes('ritmo');
      
      const isCalculado = (nomeCampo === 'pace_min_km' || nomeCampo === 'ritmo_100m');

      return (
        <Grid item xs={12} sm={6} key={nomeCampo}>
          <Controller
            name={nomeCampo}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={LABELS_CAMPOS[nomeCampo] || nomeCampo}
                type={isNumeric ? 'number' : 'text'}
                error={!!errors[nomeCampo]}
                helperText={errors[nomeCampo]?.message}
                disabled={isCalculado} 
                InputProps={{
                  readOnly: isCalculado,
                }}
              />
            )}
          />
        </Grid>
      );
    });
  };

  // --- Funções Strava ---
  const handleFetchStrava = async () => {
    setCarregandoStrava(true);
    setErroStrava(null);
    setStravaActivities([]);
    try {
      const response = await apiClient.get('/strava/activities');
      setStravaActivities(response.data);
      if (response.data.length === 0) {
        setErroStrava("Nenhuma atividade nova encontrada no Strava nos últimos 7 dias.");
      }
    } catch (error) {
      console.error("Erro ao buscar atividades Strava:", error);
      const msg = error.response?.data?.message.includes("conectado") 
                  ? "Você precisa conectar sua conta Strava primeiro (na aba Cadastro Pessoal)."
                  : "Erro ao buscar dados do Strava.";
      setErroStrava(msg);
    } finally {
      setCarregandoStrava(false);
    }
  };

  const handleSelectStravaActivity = (activity) => {
    console.log("Preenchendo formulário com:", activity);
    
    reset({
      data_treino: activity.data_treino,
      exercicio_id: activity.exercicio_id.toString(),
      percepcao_intensidade: activity.percepcao_intensidade || 5,
      ...(activity.detalhes_treino || {}) 
    });

    setStravaActivities([]);
    setErroStrava(null);
    window.scrollTo(0, 0); 
  };
  // --- Fim Funções Strava ---

  // --- JSX (Layout Completo) ---
  return (
    <Box>
      {/* --- Formulário --- */}
      <Paper elevation={3} sx={{ padding: { xs: 2, md: 4 }, marginBottom: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>

          {/* Botão de Importar Strava */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleFetchStrava}
              disabled={carregandoStrava || isSubmitting}
              startIcon={carregandoStrava ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              sx={{ 
                backgroundColor: '#FC4C02', // Laranja Strava
                color: 'white',
                '&:hover': { backgroundColor: '#e94501' } 
              }}
            >
              {carregandoStrava ? 'Buscando...' : 'Importar do Strava'}
            </Button>
          </Box>
          
          {/* Lista de Atividades Strava */}
          {erroStrava && (
            <Alert severity="info" sx={{ mb: 2 }}>{erroStrava}</Alert>
          )}
          {stravaActivities.length > 0 && (
            <Paper variant="outlined" sx={{ mb: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemText primary="Selecione a atividade do Strava para importar:" sx={{fontWeight: 'bold'}} />
                </ListItem>
                {stravaActivities.map(act => {
                  const exNome = exercicios.find(e => e.id === act.exercicio_id)?.nome || 'Treino';
                  const detalhes = act.detalhes_treino;
                  const desc = detalhes.distancia_km ? `${detalhes.distancia_km} km em ${detalhes.tempo_min} min`
                             : detalhes.distancia_m ? `${detalhes.distancia_m} m em ${detalhes.tempo_min} min`
                             : `${detalhes.duracao_min || detalhes.tempo_min} min`;

                  return (
                    <ListItemButton key={act.id} onClick={() => handleSelectStravaActivity(act)}>
                      <ListItemText 
                        primary={`${exNome} - ${new Date(act.data_treino).toLocaleString('pt-BR')}`}
                        secondary={desc}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>
          )}

          {/* Título do Formulário */}
          <Typography variant="h5" component="h2" gutterBottom>
            {editId ? 'Editar Treino' : 'Registrar Novo Treino'}
          </Typography>

          {/* Campos Principais */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="data_treino"
                control={control}
                render={({ field }) => (
                  <TextField {...field} required fullWidth label="Data e Hora do Treino" type="datetime-local" InputLabelProps={{ shrink: true }} error={!!errors.data_treino} helperText={errors.data_treino?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="exercicio_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.exercicio_id}>
                    <InputLabel id="exercicio-label">Exercício</InputLabel>
                    <Select {...field} labelId="exercicio-label" label="Exercício">
                      {exercicios.map(ex => ( <MenuItem key={ex.id} value={ex.id.toString()}>{ex.nome}</MenuItem> ))}
                    </Select>
                    <FormHelperText>{errors.exercicio_id?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }}> 
            <Typography variant="h6" component="h3">
              Detalhes do Treino
            </Typography>
          </Divider>

          {/* Campos Dinâmicos + Percepção */}
          <Grid container spacing={3}>
            {renderCamposDinamicos()} 
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Controller
                  name="percepcao_intensidade"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Percepção de Intensidade (0-10)" type="number" InputProps={{ inputProps: { min: 0, max: 10 } }} error={!!errors.percepcao_intensidade} helperText={errors.percepcao_intensidade?.message} />
                  )}
                />
                <Tooltip title="Informe seu nível de esforço percebido, onde 0 = Repouso e 10 = Esforço Máximo/Exaustão." arrow placement="top">
                  <InfoOutlinedIcon color="action" />
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          {/* Botões e Mensagens */}
          <Box sx={{ mt: 4 }}>
            {erroApi && <Alert severity="error" sx={{ mb: 2 }}>{erroApi}</Alert>}
            {sucessoApi && <Alert severity="success" sx={{ mb: 2 }}>{sucessoApi}</Alert>}
            
            <Button type="submit" variant="contained" disabled={isSubmitting} size="large">
              {isSubmitting ? 'Salvando...' : (editId ? 'Salvar Edição' : 'Salvar Treino')}
            </Button>
            {editId && (
              <Button type="button" variant="outlined" onClick={handleCancelEdit} disabled={isSubmitting} size="large" sx={{ ml: 2 }}>
                Cancelar Edição
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* --- Tabela de Histórico --- */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Histórico de Treinos</Typography>
      
      {carregandoDados && <CircularProgress sx={{mt: 2}} />}
      {!carregandoDados && logs.length === 0 && !erroApi && <p>Nenhum treino registrado ainda.</p>}
      {!carregandoDados && erroApi && <Alert severity="error">{erroApi}</Alert>}

      {logs.length > 0 && (
        <TableContainer component={Paper} elevation={3}>
           <Table sx={{ minWidth: 650 }} aria-label="histórico de treinos">
            <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Exercício</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Detalhes</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Intensidade</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{new Date(log.data_treino).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{log.exercicio_nome}</TableCell>
                  <TableCell>
                    <Box>
                      {Object.entries(log.detalhes_treino || {}).map(([key, value]) => (
                        <Typography variant="body2" key={key} noWrap>
                          <strong>{LABELS_CAMPOS[key] || key}:</strong> {value}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">{log.percepcao_intensidade}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEdit(log)} disabled={isSubmitting || carregandoDados}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(log.id)} disabled={isSubmitting || carregandoDados}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}