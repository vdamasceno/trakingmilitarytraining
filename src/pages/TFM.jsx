// src/pages/TFM.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

// --- INÍCIO DAS IMPORTAÇÕES DO MUI ---
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider // Para separar o form principal dos detalhes
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// --- FIM DAS IMPORTAÇÕES DO MUI ---

// A lógica dos LABELS permanece a mesma
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

const formInicial = {
  data_treino: '',
  percepcao_intensidade: 5,
  exercicio_id: '',
};
const detalhesIniciais = {};

export default function TFM() {
  // --- TODA A LÓGICA (useState, useEffects, Handlers) ---
  // --- PERMANECE EXATAMENTE IGUAL ---
  const [logs, setLogs] = useState([]);
  const [exercicios, setExercicios] = useState([]);
  const [formData, setFormData] = useState(formInicial);
  const [detalhesTreino, setDetalhesTreino] = useState(detalhesIniciais);
  const [editId, setEditId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroForm, setErroForm] = useState(null);
  const [sucessoForm, setSucessoForm] = useState(null);

  const fetchData = async () => {
    try {
      setCarregando(true);
      const [logsResponse, exerciciosResponse] = await Promise.all([
        apiClient.get('/tfm'),
        apiClient.get('/listas/exercicios')
      ]);
      setLogs(logsResponse.data);
      setExercicios(exerciciosResponse.data);
      if (exerciciosResponse.data.length > 0 && !formData.exercicio_id) {
        setFormData(f => ({ ...f, exercicio_id: exerciciosResponse.data[0].id }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados do TFM:", error);
      setErroForm("Falha ao carregar dados da página.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // (Adicionei o comentário acima para desabilitar um aviso comum do linter)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'exercicio_id') {
      setDetalhesTreino(detalhesIniciais);
    }
  };

  const handleDetalhesChange = (e) => {
    const { name, value } = e.target;
    setDetalhesTreino(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData(formInicial);
    setDetalhesTreino(detalhesIniciais);
    setErroForm(null);
    setSucessoForm(null);
    if (exercicios.length > 0) {
      setFormData(f => ({ ...f, exercicio_id: exercicios[0].id }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErroForm(null);
    setSucessoForm(null);
    const dadosEnvio = { ...formData, detalhes_treino: detalhesTreino };
    try {
      if (editId) {
        await apiClient.put(`/tfm/${editId}`, dadosEnvio);
        setSucessoForm("Treino atualizado com sucesso!");
      } else {
        await apiClient.post('/tfm', dadosEnvio);
        setSucessoForm("Treino salvo com sucesso!");
      }
      handleCancelEdit();
      await fetchData();
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      setErroForm("Erro ao salvar. Verifique os dados.");
    } finally {
      setCarregando(false);
    }
  };

  const handleEdit = (log) => {
    setEditId(log.id);
    const dataFormatada = log.data_treino ? log.data_treino.slice(0, 16) : '';
    setFormData({
      data_treino: dataFormatada,
      percepcao_intensidade: log.percepcao_intensidade || 5,
      exercicio_id: log.exercicio_id,
    });
    setDetalhesTreino(log.detalhes_treino || detalhesIniciais);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (logId) => {
    if (window.confirm("Tem certeza que deseja excluir este treino?")) {
      try {
        await apiClient.delete(`/tfm/${logId}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir treino:", error);
        setErroForm("Erro ao excluir o registro.");
      }
    }
  };
  
  // A lógica de renderização dinâmica (mágica) permanece a mesma
  const renderCamposDinamicos = () => {
    const exercicioSelecionado = exercicios.find(
      ex => ex.id === parseInt(formData.exercicio_id, 10)
    );
    if (!exercicioSelecionado || !exercicioSelecionado.campos_necessarios) {
      return null;
    }
    const campos = exercicioSelecionado.campos_necessarios;
    
    // Agora renderiza <TextField> em vez de <input>
    return campos.map(nomeCampo => (
      <Grid item xs={12} sm={6} key={nomeCampo}>
        <TextField
          fullWidth
          label={LABELS_CAMPOS[nomeCampo] || nomeCampo}
          name={nomeCampo}
          value={detalhesTreino[nomeCampo] || ''}
          onChange={handleDetalhesChange}
          type={nomeCampo.includes('tempo') || nomeCampo.includes('distancia') || nomeCampo.includes('numero') ? 'number' : 'text'}
        />
      </Grid>
    ));
  };
  // --- FIM DA LÓGICA ---


  // --- INÍCIO DO NOVO JSX COM MUI ---
  return (
    <Box>
      {/* --- O Formulário --- */}
      <Paper 
        elevation={3}
        sx={{ 
          padding: { xs: 2, md: 4 },
          marginBottom: 4
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" component="h2" gutterBottom>
            {editId ? 'Editar Treino' : 'Registrar Novo Treino'}
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            
            {/* Data e Hora */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="data_treino"
                label="Data e Hora do Treino"
                name="data_treino"
                type="datetime-local"
                value={formData.data_treino}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Exercício (SELECT) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="exercicio-label">Exercício</InputLabel>
                <Select
                  labelId="exercicio-label"
                  id="exercicio_id"
                  name="exercicio_id"
                  value={formData.exercicio_id}
                  label="Exercício"
                  onChange={handleChange}
                >
                  {exercicios.map(ex => (
                    <MenuItem key={ex.id} value={ex.id}>
                      {ex.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Percepção de Intensidade */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="percepcao_intensidade"
                label="Percepção de Intensidade (0-10)"
                name="percepcao_intensidade"
                type="number"
                value={formData.percepcao_intensidade}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, max: 10 } }} // Validação HTML
              />
            </Grid>
          </Grid>
          
          {/* Divisor para os campos dinâmicos */}
          <Divider sx={{ my: 4 }}> 
            <Typography variant="h6" component="h3">
              Detalhes do Treino
            </Typography>
          </Divider>

          {/* Grid para os campos dinâmicos */}
          <Grid container spacing={3}>
            {renderCamposDinamicos()} {/* A mágica acontece aqui */}
          </Grid>

          {/* Mensagens e Botões */}
          <Box sx={{ mt: 4 }}>
            {erroForm && <Alert severity="error" sx={{ mb: 2 }}>{erroForm}</Alert>}
            {sucessoForm && <Alert severity="success" sx={{ mb: 2 }}>{sucessoForm}</Alert>}
            
            <Button
              type="submit"
              variant="contained"
              disabled={carregando}
              size="large"
            >
              {carregando ? 'Salvando...' : (editId ? 'Salvar Edição' : 'Salvar Treino')}
            </Button>
            {editId && (
              <Button
                type="button"
                variant="outlined"
                onClick={handleCancelEdit}
                size="large"
                sx={{ ml: 2 }}
              >
                Cancelar Edição
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* --- A Tabela de Histórico --- */}
      <Typography variant="h5" component="h2" gutterBottom>
        Histórico de Treinos
      </Typography>
      
      {carregando && logs.length === 0 && <p>Carregando histórico...</p>}
      {!carregando && logs.length === 0 && <p>Nenhum treino registrado ainda.</p>}

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
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.data_treino).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{log.exercicio_nome}</TableCell>
                  <TableCell>
                    {/* Renderiza o JSON de detalhes */}
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
                    <IconButton color="primary" onClick={() => handleEdit(log)} aria-label="editar">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(log.id)} aria-label="excluir">
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
  // --- FIM DO NOVO JSX COM MUI ---
}