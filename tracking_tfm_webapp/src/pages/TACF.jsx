// src/pages/TACF.jsx (Código Completo - Refatorado com validação)
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

// --- NOVAS IMPORTAÇÕES PARA VALIDAÇÃO ---
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// --- FIM DAS NOVAS IMPORTAÇÕES ---

// --- Importações MUI ---
import {
  Box, Button, TextField, Typography, Grid, Paper, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// --- 1. DEFINIÇÃO DO SCHEMA DE VALIDAÇÃO (ZOD) ---
// Função auxiliar para transformar string vazia em 'undefined' para números opcionais
const optionalNumeric = z.string().optional().transform(val => (val === "" ? undefined : val))
  .refine(val => val === undefined || !isNaN(Number(val)), "Deve ser um número");

const tacfSchema = z.object({
  data_teste: z.string().min(1, 'Data do Teste é obrigatória'),
  
  // Campos numéricos opcionais
  peso: optionalNumeric,
  altura: optionalNumeric,
  cintura: optionalNumeric,
  cooper_distancia: optionalNumeric,
  abdominal_reps: optionalNumeric,
  flexao_reps: optionalNumeric,
  barra_reps: optionalNumeric,
});
// --- FIM DO SCHEMA ---


export default function TACF() {
  // Estados que NÃO são do formulário
  const [logs, setLogs] = useState([]);
  const [editId, setEditId] = useState(null); // Guarda o ID do log que estamos editando
  const [carregandoDados, setCarregandoDados] = useState(true); // Para o load inicial da tabela
  const [erroApi, setErroApi] = useState(null);
  const [sucessoApi, setSucessoApi] = useState(null);

  // --- 2. CONFIGURAÇÃO DO REACT-HOOK-FORM ---
  const {
    control,
    handleSubmit,
    reset, // Para carregar dados na edição e limpar
    formState: { errors, isSubmitting } // isSubmitting controla o estado de "Salvando..."
  } = useForm({
    resolver: zodResolver(tacfSchema),
    defaultValues: {
      data_teste: '',
      peso: '',
      altura: '',
      cintura: '',
      cooper_distancia: '',
      abdominal_reps: '',
      flexao_reps: '',
      barra_reps: ''
    }
  });
  // --- FIM DA CONFIGURAÇÃO ---


  // Função para BUSCAR os TAFs
  const fetchTAFs = async () => {
    try {
      setCarregandoDados(true);
      setErroApi(null);
      const response = await apiClient.get('/tacf');
      setLogs(response.data);
    } catch (error) {
      console.error("Erro ao buscar TAFs:", error);
      setErroApi("Falha ao carregar histórico de TCAFs.");
    } finally {
      setCarregandoDados(false);
    }
  };

  // Efeito que busca os TAFs quando a página carrega
  useEffect(() => {
    fetchTAFs();
  }, []);

  
  // Handler para CANCELAR a edição
  const handleCancelEdit = () => {
    setEditId(null);
    reset(); // Limpa o formulário para os valores padrão
    setErroApi(null);
    setSucessoApi(null);
  };

  // --- 3. FUNÇÃO DE SUBMIT (agora 'onSubmit') ---
  // Chamada apenas se a validação do Zod passar
  const onSubmit = async (data) => {
    setErroApi(null);
    setSucessoApi(null);

    // Os dados já vêm do 'data' validados
    const dadosEnvio = {
      data_teste: data.data_teste,
      // Converte para número ou null (Zod já garantiu que é numérico ou undefined)
      peso: data.peso ? parseFloat(data.peso) : null,
      altura: data.altura ? parseFloat(data.altura) : null,
      cintura: data.cintura ? parseFloat(data.cintura) : null,
      cooper_distancia: data.cooper_distancia ? parseInt(data.cooper_distancia, 10) : null,
      abdominal_reps: data.abdominal_reps ? parseInt(data.abdominal_reps, 10) : null,
      flexao_reps: data.flexao_reps ? parseInt(data.flexao_reps, 10) : null,
      barra_reps: data.barra_reps ? parseInt(data.barra_reps, 10) : null,
    };

    try {
      if (editId) {
        // --- MODO EDIÇÃO ---
        await apiClient.put(`/tacf/${editId}`, dadosEnvio);
        setSucessoApi("TAF atualizado com sucesso!");
      } else {
        // --- MODO CRIAÇÃO ---
        await apiClient.post('/tacf', dadosEnvio);
        setSucessoApi("TAF salvo com sucesso!");
      }
      
      handleCancelEdit(); // Limpa o formulário e o ID de edição
      await fetchTAFs();  // Recarrega a lista da tabela

    } catch (error) {
      console.error("Erro ao salvar TAF:", error);
      let errorMsg = "Erro ao salvar. Verifique os dados.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setErroApi(errorMsg);
    }
  };

  // --- 4. Handler para clicar em EDITAR na lista ---
  const handleEdit = (log) => {
    setEditId(log.id); // Define o ID que estamos editando
    const dataFormatada = log.data_teste ? log.data_teste.split('T')[0] : '';
    
    // Preenche o formulário (react-hook-form) com os dados do log
    reset({
      data_teste: dataFormatada,
      peso: log.peso || '',
      altura: log.altura ? (parseFloat(log.altura) * 100).toString() : '', // Converte m -> cm
      cintura: log.cintura || '',
      cooper_distancia: log.cooper_distancia || '',
      abdominal_reps: log.abdominal_reps || '',
      flexao_reps: log.flexao_reps || '',
      barra_reps: log.barra_reps || '',
    });
    
    window.scrollTo(0, 0); // Rola a página para o topo (onde está o formulário)
  };

  // Handler para EXCLUIR (sem mudança na lógica, mas adiciona 'isSubmitting')
  const handleDelete = async (logId) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de TAF?")) {
      setErroApi(null);
      try {
        await apiClient.delete(`/tacf/${logId}`);
        await fetchTAFs(); // Recarrega a lista
      } catch (error) {
        console.error("Erro ao excluir TAF:", error);
        setErroApi("Erro ao excluir o registro.");
      }
    }
  };

  // Função para Calcular IMC (sem mudança)
  const calcularIMC = (peso, alturaMetros) => {
    if (!peso || !alturaMetros || parseFloat(alturaMetros) <= 0) return '-';
    try {
        const imc = parseFloat(peso) / (parseFloat(alturaMetros) * parseFloat(alturaMetros));
        return imc.toFixed(2);
    } catch { return '-'; }
  };
  // --- FIM DA LÓGICA ---


  // --- 5. O JSX COM OS 'Controller's ---
  return (
    <Box>
      {/* --- Formulário --- */}
      <Paper elevation={3} sx={{ padding: { xs: 2, md: 4 }, marginBottom: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h5" component="h2" gutterBottom>
            {editId ? 'Editar Registro de TCAF' : 'Inserir Novo TCAF'}
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            
            {/* Data */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="data_teste"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Data do Teste"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.data_teste}
                    helperText={errors.data_teste?.message}
                  />
                )}
              />
            </Grid>

            {/* Peso */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="peso"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Peso (kg)"
                    type="number"
                    inputProps={{ step: "0.1", min: "0" }}
                    error={!!errors.peso}
                    helperText={errors.peso?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Altura */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="altura"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Altura (cm)"
                    type="number"
                    inputProps={{ min: "0" }}
                    error={!!errors.altura}
                    helperText={errors.altura?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Cintura */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="cintura"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cintura (cm)"
                    type="number"
                    inputProps={{ step: "0.1", min: "0" }}
                    error={!!errors.cintura}
                    helperText={errors.cintura?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Cooper */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="cooper_distancia"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cooper - Distância (m)"
                    type="number"
                    inputProps={{ min: "0" }}
                    error={!!errors.cooper_distancia}
                    helperText={errors.cooper_distancia?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Abdominal */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="abdominal_reps"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Abdominal (reps)"
                    type="number"
                    inputProps={{ min: "0" }}
                    error={!!errors.abdominal_reps}
                    helperText={errors.abdominal_reps?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Flexão */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="flexao_reps"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Flexão de Braços (reps)"
                    type="number"
                    inputProps={{ min: "0" }}
                    error={!!errors.flexao_reps}
                    helperText={errors.flexao_reps?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Barra */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="barra_reps"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Barra (reps)"
                    type="number"
                    inputProps={{ min: "0" }}
                    error={!!errors.barra_reps}
                    helperText={errors.barra_reps?.message}
                  />
                )}
              />
            </Grid>

            {/* Mensagens e Botões */}
            <Grid item xs={12}>
              {erroApi && <Alert severity="error" sx={{ mb: 2 }}>{erroApi}</Alert>}
              {sucessoApi && <Alert severity="success" sx={{ mb: 2 }}>{sucessoApi}</Alert>}
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting} // Desabilita no envio
                size="large"
              >
                {isSubmitting ? 'Salvando...' : (editId ? 'Salvar Edição' : 'Salvar Novo TCAF')}
              </Button>
              {editId && (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  size="large"
                  sx={{ ml: 2 }}
                >
                  Cancelar Edição
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* --- Tabela (sem mudança estrutural, mas agora é mais segura) --- */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Histórico de TACFs</Typography>
      
      {carregandoDados && logs.length === 0 && <CircularProgress sx={{mt: 2}} />}
      {!carregandoDados && logs.length === 0 && !erroApi && <p>Nenhum TAF registrado ainda.</p>}
      {!carregandoDados && erroApi && <Alert severity="error">{erroApi}</Alert>}

      {logs.length > 0 && (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 1000 }} aria-label="histórico de tafs">
            <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
              <TableRow>
                 {/* ... (Cabeçalhos da Tabela: Data, Peso, Altura, IMC, etc... sem mudança) ... */}
                 <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Peso (kg)</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Altura (m)</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>IMC</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cintura (cm)</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cooper (m)</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Menção</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Abdominal</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Menção</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Flexão</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Menção</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Barra</TableCell>
                 <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                   {/* ... (Células da Tabela: log.data_teste, calcularIMC, etc... sem mudança) ... */}
                   <TableCell component="th" scope="row">{new Date(log.data_teste).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                   <TableCell align="center">{log.peso ?? '-'}</TableCell>
                   <TableCell align="center">{log.altura ? parseFloat(log.altura).toFixed(2) : '-'}</TableCell>
                   <TableCell align="center">{calcularIMC(log.peso, log.altura)}</TableCell>
                   <TableCell align="center">{log.cintura ?? '-'}</TableCell>
                   <TableCell align="center">{log.cooper_distancia ?? '-'}</TableCell>
                   <TableCell align="center">{log.mencao_cooper || '-'}</TableCell>
                   <TableCell align="center">{log.abdominal_reps ?? '-'}</TableCell>
                   <TableCell align="center">{log.mencao_abdominal || '-'}</TableCell>
                   <TableCell align="center">{log.flexao_reps ?? '-'}</TableCell>
                   <TableCell align="center">{log.mencao_flexao || '-'}</TableCell>
                   <TableCell align="center">{log.barra_reps ?? '-'}</TableCell>
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