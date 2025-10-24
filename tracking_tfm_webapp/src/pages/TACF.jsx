// src/pages/TACF.jsx (Código Completo - Atualizado)
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


// --- Atualizar formInicial ---
const formInicial = {
  data_teste: '',
  peso: '', // <<<<< NOVO
  altura: '', // <<<<< NOVO (em cm no form)
  cintura: '', // <<<<< NOVO
  cooper_distancia: '',
  abdominal_reps: '',
  flexao_reps: '',
  barra_reps: ''
};

export default function TACF() {
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState(formInicial);
  const [editId, setEditId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroForm, setErroForm] = useState(null);
  const [sucessoForm, setSucessoForm] = useState(null);

  const fetchTAFs = async () => {
    try {
      setCarregando(true);
      setErroForm(null); // Limpa erro ao recarregar
      const response = await apiClient.get('/tacf');
      setLogs(response.data);
    } catch (error) {
      console.error("Erro ao buscar TAFs:", error);
      setErroForm("Falha ao carregar histórico de TAFs.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchTAFs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData(formInicial);
    setErroForm(null);
    setSucessoForm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErroForm(null);
    setSucessoForm(null);

    // --- Pegar os novos dados para envio ---
    const dadosEnvio = {
      data_teste: formData.data_teste,
      peso: parseFloat(formData.peso) || null, // <<<<< NOVO
      altura: parseFloat(formData.altura) || null, // <<<<< NOVO (enviar cm)
      cintura: parseFloat(formData.cintura) || null, // <<<<< NOVO
      cooper_distancia: parseInt(formData.cooper_distancia, 10) || null,
      abdominal_reps: parseInt(formData.abdominal_reps, 10) || null,
      flexao_reps: parseInt(formData.flexao_reps, 10) || null,
      barra_reps: parseInt(formData.barra_reps, 10) || null,
    };

    try {
      if (editId) {
        await apiClient.put(`/tacf/${editId}`, dadosEnvio); // API recebe os novos dados
        setSucessoForm("TAF atualizado com sucesso!");
      } else {
        await apiClient.post('/tacf', dadosEnvio); // API recebe os novos dados
        setSucessoForm("TAF salvo com sucesso!");
      }
      handleCancelEdit();
      await fetchTAFs();
    } catch (error) {
      console.error("Erro ao salvar TAF:", error);
      let errorMsg = "Erro ao salvar. Verifique os dados.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setErroForm(errorMsg);
    } finally {
      setCarregando(false);
    }
  };

  const handleEdit = (log) => {
    setEditId(log.id);
    const dataFormatada = log.data_teste ? log.data_teste.split('T')[0] : '';

    // --- Preencher novos campos no formulário ---
    setFormData({
      data_teste: dataFormatada,
      peso: log.peso || '', // <<<<< NOVO
      // Converte altura de metros (do banco) para cm (para o form)
      altura: log.altura ? (parseFloat(log.altura) * 100).toString() : '', // <<<<< NOVO
      cintura: log.cintura || '', // <<<<< NOVO
      cooper_distancia: log.cooper_distancia || '',
      abdominal_reps: log.abdominal_reps || '',
      flexao_reps: log.flexao_reps || '',
      barra_reps: log.barra_reps || '',
    });

    window.scrollTo(0, 0);
  };

  const handleDelete = async (logId) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de TAF?")) {
      setCarregando(true); // Bloqueia botões durante a exclusão
      setErroForm(null);
      try {
        await apiClient.delete(`/tacf/${logId}`);
        await fetchTAFs(); // Recarrega a lista
      } catch (error) {
        console.error("Erro ao excluir TAF:", error);
        setErroForm("Erro ao excluir o registro.");
      } finally {
        setCarregando(false);
      }
    }
  };

  // --- Função para Calcular IMC ---
  const calcularIMC = (peso, alturaMetros) => {
    if (!peso || !alturaMetros || parseFloat(alturaMetros) <= 0) return '-';
    try {
        const imc = parseFloat(peso) / (parseFloat(alturaMetros) * parseFloat(alturaMetros));
        return imc.toFixed(2); // Retorna com 2 casas decimais
    } catch {
        return '-'; // Retorna '-' se houver erro no cálculo
    }
  };


  // --- Início do JSX ---
  return (
    <Box>
      {/* --- Formulário --- */}
      <Paper elevation={3} sx={{ padding: { xs: 2, md: 4 }, marginBottom: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" component="h2" gutterBottom>
            {editId ? 'Editar Registro de TAF' : 'Inserir Novo TAF'}
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>

            {/* Data */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField required fullWidth label="Data do Teste" name="data_teste" type="date" value={formData.data_teste} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>

            {/* --- Novos Campos: Peso, Altura, Cintura --- */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Peso (kg)" name="peso" type="number" inputProps={{ step: "0.1", min: "0" }} value={formData.peso} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Altura (cm)" name="altura" type="number" inputProps={{ min: "0" }} value={formData.altura} onChange={handleChange} />
            </Grid>
             <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Cintura (cm)" name="cintura" type="number" inputProps={{ step: "0.1", min: "0" }} value={formData.cintura} onChange={handleChange} />
            </Grid>
            {/* --- Fim Novos Campos --- */}

            {/* Campos Antigos (Cooper, Abdominal, etc.) */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Cooper - Distância (m)" name="cooper_distancia" type="number" inputProps={{ min: "0" }} value={formData.cooper_distancia} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Abdominal (reps)" name="abdominal_reps" type="number" inputProps={{ min: "0" }} value={formData.abdominal_reps} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Flexão de Braços (reps)" name="flexao_reps" type="number" inputProps={{ min: "0" }} value={formData.flexao_reps} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Barra (reps)" name="barra_reps" type="number" inputProps={{ min: "0" }} value={formData.barra_reps} onChange={handleChange} />
            </Grid>

            {/* Mensagens e Botões */}
            <Grid item xs={12}>{erroForm && <Alert severity="error" sx={{ mb: 2 }}>{erroForm}</Alert>}{sucessoForm && <Alert severity="success" sx={{ mb: 2 }}>{sucessoForm}</Alert>}</Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={carregando} size="large">{carregando ? 'Salvando...' : (editId ? 'Salvar Edição' : 'Salvar Novo TAF')}</Button>
              {editId && <Button type="button" variant="outlined" onClick={handleCancelEdit} disabled={carregando} size="large" sx={{ ml: 2 }}>Cancelar Edição</Button>}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* --- Tabela --- */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Histórico de TAFs</Typography>
      {carregando && logs.length === 0 && <p>Carregando histórico...</p>}
      {!carregando && logs.length === 0 && !erroForm && <p>Nenhum TAF registrado ainda.</p>}
      {!carregando && erroForm && <Alert severity="error">{erroForm}</Alert>} {/* Mostra erro ao carregar */}

      {logs.length > 0 && (
        <TableContainer component={Paper} elevation={3}>
          {/* Ajustar largura mínima para caber tudo */}
          <Table sx={{ minWidth: 1000 }} aria-label="histórico de tafs">
            <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                {/* --- Novas Colunas Cabeçalho --- */}
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Peso (kg)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Altura (m)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>IMC</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cintura (cm)</TableCell>
                {/* --- Fim Novas Colunas Cabeçalho --- */}
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
                <TableRow key={log.id} hover> {/* Adiciona hover para destacar linha */}
                  <TableCell component="th" scope="row">{new Date(log.data_teste).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                  {/* --- Novas Colunas Dados --- */}
                  <TableCell align="center">{log.peso ?? '-'}</TableCell>
                  <TableCell align="center">{log.altura ? parseFloat(log.altura).toFixed(2) : '-'}</TableCell> {/* Exibe altura em metros formatada */}
                  <TableCell align="center">{calcularIMC(log.peso, log.altura)}</TableCell> {/* Calcula IMC */}
                  <TableCell align="center">{log.cintura ?? '-'}</TableCell>
                  {/* --- Fim Novas Colunas Dados --- */}
                  <TableCell align="center">{log.cooper_distancia ?? '-'}</TableCell>
                  <TableCell align="center">{log.mencao_cooper || '-'}</TableCell>
                  <TableCell align="center">{log.abdominal_reps ?? '-'}</TableCell>
                  <TableCell align="center">{log.mencao_abdominal || '-'}</TableCell>
                  <TableCell align="center">{log.flexao_reps ?? '-'}</TableCell>
                  <TableCell align="center">{log.mencao_flexao || '-'}</TableCell>
                  <TableCell align="center">{log.barra_reps ?? '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEdit(log)} aria-label="editar" disabled={carregando}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(log.id)} aria-label="excluir" disabled={carregando}>
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