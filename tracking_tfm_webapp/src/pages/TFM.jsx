// src/pages/TFM.jsx (Código Completo - Refatorado com validação)
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

// --- NOVAS IMPORTAÇÕES PARA VALIDAÇÃO ---
import { useForm, Controller, useWatch } from 'react-hook-form'; // useWatch para campos dinâmicos
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// --- FIM DAS NOVAS IMPORTAÇÕES ---

// --- Importações MUI ---
import {
  Box, Button, TextField, Typography, Grid, Paper, Alert,
  Select, MenuItem, InputLabel, FormControl, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Divider, FormHelperText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Labels (sem mudança)
const LABELS_CAMPOS = { /* ... (copie o objeto LABELS_CAMPOS do seu arquivo antigo) ... */ };

// --- 1. DEFINIÇÃO DO SCHEMA DE VALIDAÇÃO (ZOD) ---
const optionalNumeric = z.string().optional().transform(val => (val === "" ? undefined : val))
  .refine(val => val === undefined || !isNaN(Number(val)), "Deve ser um número");

const tfmSchema = z.object({
  // Campos Principais
  data_treino: z.string().min(1, 'Data e Hora são obrigatórios'),
  exercicio_id: z.string().min(1, 'Exercício é obrigatório'),
  percepcao_intensidade: z.coerce.number().min(0, "Mín. 0").max(10, "Máx. 10"), // coerce.number() converte string para número

  // Campos Dinâmicos (todos opcionais e numéricos ou texto)
  distancia_km: optionalNumeric,
  tempo_min: optionalNumeric,
  pace_min_km: z.string().optional(), // Pace pode ser "5:24"
  fc_media_bpm: optionalNumeric,
  distancia_m: optionalNumeric,
  ritmo_100m: z.string().optional(), // Ritmo pode ser "1:50"
  tempo_estimulo_s: optionalNumeric,
  tempo_recuperacao_s: optionalNumeric,
  numero_sessoes: optionalNumeric,
  grupo_muscular: z.string().optional(),
  duracao_min: optionalNumeric,
  nome_atividade: z.string().optional() // Para "Outra Atividade"
});
// --- FIM DO SCHEMA ---


export default function TFM() {
  // Estados que NÃO são do formulário
  const [logs, setLogs] = useState([]);
  const [exercicios, setExercicios] = useState([]); // Lista de exercícios
  const [editId, setEditId] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroApi, setErroApi] = useState(null);
  const [sucessoApi, setSucessoApi] = useState(null);

  // --- 2. CONFIGURAÇÃO DO REACT-HOOK-FORM ---
  const {
    control,
    handleSubmit,
    reset,
    watch, // Para "assistir" o campo 'exercicio_id'
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(tfmSchema),
    defaultValues: {
      data_treino: '',
      exercicio_id: '',
      percepcao_intensidade: 5,
      // Todos os campos dinâmicos
      distancia_km: '', tempo_min: '', pace_min_km: '', fc_media_bpm: '',
      distancia_m: '', ritmo_100m: '', tempo_estimulo_s: '', tempo_recuperacao_s: '',
      numero_sessoes: '', grupo_muscular: '', duracao_min: '', nome_atividade: ''
    }
  });

  // Assiste o valor do 'exercicio_id' mudar
  const exercicioIdSelecionado = watch('exercicio_id');
  // --- FIM DA CONFIGURAÇÃO ---


  // Função para BUSCAR os TFM (histórico) e os Exercícios (dropdown)
  const fetchData = async () => {
    try {
      setCarregandoDados(true);
      setErroApi(null);
      const [logsResponse, exerciciosResponse] = await Promise.all([
        apiClient.get('/tfm'),
        apiClient.get('/listas/exercicios')
      ]);
      
      setLogs(logsResponse.data);
      setExercicios(exerciciosResponse.data);

      // Se estamos criando (não editando) e o form está vazio, define um padrão
      if (!editId && exerciciosResponse.data.length > 0) {
        reset(form => ({ ...form, exercicio_id: exerciciosResponse.data[0].id.toString() }));
      }
      
    } catch (error) {
      console.error("Erro ao buscar dados do TFM:", error);
      setErroApi("Falha ao carregar dados da página.");
    } finally {
      setCarregandoDados(false);
    }
  };

  // Efeito que busca os dados quando a página carrega
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Handler para CANCELAR a edição
  const handleCancelEdit = () => {
    setEditId(null);
    reset(); // Limpa o formulário inteiro
    setErroApi(null);
    setSucessoApi(null);
    // Define o primeiro exercício como padrão de novo
    if (exercicios.length > 0) {
      reset(form => ({ ...form, exercicio_id: exercicios[0].id.toString(), percepcao_intensidade: 5 }));
    }
  };

  // --- 3. FUNÇÃO DE SUBMIT (agora 'onSubmit') ---
  const onSubmit = async (data) => {
    setErroApi(null);
    setSucessoApi(null);

    // --- Montar o objeto 'detalhes_treino' ---
    const exercicio = exercicios.find(ex => ex.id === parseInt(data.exercicio_id, 10));
    const detalhes_treino = {};
    if (exercicio && exercicio.campos_necessarios) {
      // Pega apenas os campos relevantes para esse exercício
      exercicio.campos_necessarios.forEach(campo => {
        if (data[campo]) { // Se o campo foi preenchido
          detalhes_treino[campo] = data[campo];
        }
      });
    }
    // --- Fim da montagem ---

    // Dados principais para enviar
    const dadosEnvio = {
      data_treino: data.data_treino,
      exercicio_id: parseInt(data.exercicio_id, 10),
      percepcao_intensidade: data.percepcao_intensidade,
      detalhes_treino: detalhes_treino // Envia o objeto montado
    };

    try {
      if (editId) {
        await apiClient.put(`/tfm/${editId}`, dadosEnvio);
        setSucessoApi("Treino atualizado com sucesso!");
      } else {
        await apiClient.post('/tfm', dadosEnvio);
        setSucessoApi("Treino salvo com sucesso!");
      }
      handleCancelEdit();
      await fetchData();
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      setErroApi(error.response?.data?.message || "Erro ao salvar. Verifique os dados.");
    }
  };

  // --- 4. Handler para clicar em EDITAR na lista ---
  const handleEdit = (log) => {
    setEditId(log.id);
    const dataFormatada = log.data_treino ? log.data_treino.slice(0, 16) : '';
    
    // Preenche o formulário (react-hook-form) com os dados principais
    // E "espalha" os detalhes do JSONB nos campos do formulário
    reset({
      data_treino: dataFormatada,
      percepcao_intensidade: log.percepcao_intensidade || 5,
      exercicio_id: log.exercicio_id.toString(),
      ...(log.detalhes_treino || {}) // Preenche os campos dinâmicos
    });
    
    window.scrollTo(0, 0);
  };

  // Handler para EXCLUIR (sem mudança)
  const handleDelete = async (logId) => { /* ... (código sem mudança) ... */ };


  // --- 5. A MÁGICA: Renderiza os campos dinâmicos com 'Controller' ---
  const renderCamposDinamicos = () => {
    const exercicioSelecionado = exercicios.find(
      ex => ex.id === parseInt(exercicioIdSelecionado, 10)
    );
    
    if (!exercicioSelecionado || !exercicioSelecionado.campos_necessarios) {
      return null;
    }
    
    const campos = exercicioSelecionado.campos_necessarios;
    
    return campos.map(nomeCampo => (
      <Grid item xs={12} sm={6} key={nomeCampo}>
        <Controller
          name={nomeCampo} // O nome do campo (ex: "distancia_km")
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={LABELS_CAMPOS[nomeCampo] || nomeCampo}
              // Define o tipo (text ou number)
              type={nomeCampo.includes('tempo') || nomeCampo.includes('distancia') || nomeCampo.includes('numero') ? 'number' : 'text'}
              error={!!errors[nomeCampo]}
              helperText={errors[nomeCampo]?.message}
            />
          )}
        />
      </Grid>
    ));
  };
  // --- FIM DA LÓGICA ---


  // --- 6. O JSX COM OS 'Controller's ---
  return (
    <Box>
      {/* --- Formulário --- */}
      <Paper elevation={3} sx={{ padding: { xs: 2, md: 4 }, marginBottom: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h5" component="h2" gutterBottom>
            {editId ? 'Editar Treino' : 'Registrar Novo Treino'}
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            
            {/* Data e Hora */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="data_treino"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Data e Hora do Treino"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.data_treino}
                    helperText={errors.data_treino?.message}
                  />
                )}
              />
            </Grid>

            {/* Exercício (SELECT) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="exercicio_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.exercicio_id}>
                    <InputLabel id="exercicio-label">Exercício</InputLabel>
                    <Select
                      {...field}
                      labelId="exercicio-label"
                      label="Exercício"
                    >
                      {exercicios.map(ex => (
                        <MenuItem key={ex.id} value={ex.id.toString()}>
                          {ex.nome}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.exercicio_id?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Percepção de Intensidade */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="percepcao_intensidade"
                control={control}
                render={({ field }) => (
                   <TextField
                    {...field}
                    fullWidth
                    label="Percepção de Intensidade (0-10)"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 10 } }}
                    error={!!errors.percepcao_intensidade}
                    helperText={errors.percepcao_intensidade?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }}> 
            <Typography variant="h6" component="h3">
              Detalhes do Treino
            </Typography>
          </Divider>

          <Grid container spacing={3}>
            {renderCamposDinamicos()} {/* A mágica acontece aqui */}
          </Grid>

          {/* Mensagens e Botões */}
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
      
      {/* --- Tabela (sem mudança) --- */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Histórico de Treinos</Typography>
      {carregandoDados && logs.length === 0 && <CircularProgress sx={{mt: 2}} />}
      {!carregandoDados && logs.length === 0 && !erroApi && <p>Nenhum treino registrado ainda.</p>}
      {!carregandoDados && erroApi && <Alert severity="error">{erroApi}</Alert>}

      {logs.length > 0 && (
        <TableContainer component={Paper} elevation={3}>
           {/* ... (O código da Tabela não muda) ... */}
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
                    <IconButton color="primary" onClick={() => handleEdit(log)} disabled={isSubmitting}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(log.id)} disabled={isSubmitting}><DeleteIcon /></IconButton>
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