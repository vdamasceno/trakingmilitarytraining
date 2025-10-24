// src/pages/CadastroPessoal.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';

// --- INÍCIO DAS IMPORTAÇÕES DO MUI ---
import {
  Box,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Typography,
  Grid,
  Paper,     // Um "papel" para dar fundo ao formulário
  Alert
} from '@mui/material';
// --- FIM DAS IMPORTAÇÕES DO MUI ---

// A lista de postos permanece
const LISTA_POSTOS = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  'SO', '1S', '2S', '3S', 'Cb', 'S1', 'S2',
  'Cad', 'Aluno'
];

export default function CadastroPessoal() {
  // --- A LÓGICA PERMANECE A MESMA ---
  const { usuario, logout }  = useAuth(); 
  const [formData, setFormData] = useState({
    nome: '',
    posto: '',
    data_nascimento: '',
    sexo: 'Masculino',
    organizacao_id: '',
  });
  const [organizacoes, setOrganizacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      apiClient.get('/usuarios/me'),      
      apiClient.get('/listas/organizacoes') 
    ])
    .then(([usuarioResponse, omResponse]) => {
      const { nome, posto, data_nascimento, sexo, organizacao_id } = usuarioResponse.data;
      const dataFormatada = data_nascimento ? data_nascimento.split('T')[0] : '';

      setFormData({
        nome: nome || '',
        posto: posto || LISTA_POSTOS[0], 
        data_nascimento: dataFormatada,
        sexo: sexo || 'Masculino',
        organizacao_id: organizacao_id || ''
      });
      setOrganizacoes(omResponse.data);
    })
    .catch(error => {
      console.error("Erro ao buscar dados:", error);
      setErro("Falha ao carregar dados do usuário ou OMs.");
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        logout(); 
      }
    })
    .finally(() => {
      setCarregando(false);
    });
  }, [logout]); // Adicionamos 'logout' como dependência do useEffect

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    try {
      const response = await apiClient.put('/usuarios/me', formData);
      setSucesso("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErro(error.response.data.message);
      } else {
        setErro("Falha ao salvar as alterações.");
      }
    } finally {
      setCarregando(false);
    }
  };

  if (carregando && !formData.nome) {
    return <Typography variant="h5">Carregando dados do usuário...</Typography>;
  }
  // --- FIM DA LÓGICA ---


  // --- INÍCIO DO NOVO JSX COM MUI ---
  return (
    // O Paper cria o "card" do formulário
    <Paper 
      elevation={3} // Sombra nível 3
      sx={{ 
        padding: { xs: 2, md: 4 }, // Mais padding em telas maiores
        maxWidth: '700px', // Limita a largura
        margin: 'auto' // Centraliza
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" component="h2" gutterBottom>
          Cadastro Pessoal
        </Typography>
        <Typography variant="body1" gutterBottom>
          Edite seus dados cadastrais. (SARAM e Email não podem ser alterados).
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          
          {/* NOME */}
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="nome"
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
            />
          </Grid>

          {/* POSTO (SELECT) */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="posto-label">Posto/Graduação</InputLabel>
              <Select
                labelId="posto-label"
                id="posto"
                name="posto"
                value={formData.posto}
                label="Posto/Graduação"
                onChange={handleChange}
              >
                {LISTA_POSTOS.map(posto => (
                  <MenuItem key={posto} value={posto}>
                    {posto}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* DATA NASCIMENTO */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="data_nascimento"
              label="Data de Nascimento"
              name="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* SEXO (SELECT) */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="sexo-label">Sexo</InputLabel>
              <Select
                labelId="sexo-label"
                id="sexo"
                name="sexo"
                value={formData.sexo}
                label="Sexo"
                onChange={handleChange}
              >
                <MenuItem value="Masculino">Masculino</MenuItem>
                <MenuItem value="Feminino">Feminino</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* ORGANIZAÇÃO MILITAR (SELECT) */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="om-label">Organização Militar (OM)</InputLabel>
              <Select
                labelId="om-label"
                id="organizacao_id"
                name="organizacao_id"
                value={formData.organizacao_id}
                label="Organização Militar (OM)"
                onChange={handleChange}
              >
                {organizacoes.map(om => (
                  <MenuItem key={om.id} value={om.id}>
                    {om.sigla} - {om.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Mensagens de Erro ou Sucesso */}
          <Grid item xs={12}>
            {erro && (
              <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
                {erro}
              </Alert>
            )}
            {sucesso && (
              <Alert severity="success" sx={{ width: '100%', mt: 1 }}>
                {sucesso}
              </Alert>
            )}
          </Grid>
          
          {/* Botão Salvar */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={carregando}
              size="large"
              sx={{ padding: '10px 15px' }}
            >
              {carregando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </Grid>

        </Grid>
      </Box>
    </Paper>
  );
  // --- FIM DO NOVO JSX COM MUI ---
}