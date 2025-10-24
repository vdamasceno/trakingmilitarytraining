// src/pages/Registro.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Renomeado
import apiClient from '../api/axiosConfig';

// --- INÍCIO DAS IMPORTAÇÕES DO MUI ---
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Alert,
  Select,      // Para os dropdowns
  MenuItem,    // Para os itens do dropdown
  InputLabel,  // A label do dropdown
  FormControl, // O "container" do dropdown
  Grid         // Para organizar campos (ex: senha e confirma senha)
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'; // Ícone de adicionar pessoa
// --- FIM DAS IMPORTAÇÕES DO MUI ---

// --- Importe seu logo aqui ---
import unifaLogo from '../assets/unifa_logo.png'; 

// A lista de postos permanece a mesma
const LISTA_POSTOS = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  'SO', '1S', '2S', '3S', 'Cb', 'S1', 'S2',
  'Cad', 'Aluno'
];

export default function Registro() {
  // --- TODA A LÓGICA (useState, useEffect, handleChange, handleSubmit) ---
  // --- PERMANECE EXATAMENTE IGUAL ---
  const [organizacoes, setOrganizacoes] = useState([]);
  const [formData, setFormData] = useState({
    saram: '',
    email: '',
    senha: '',
    confirmaSenha: '',
    nome: '',
    posto: LISTA_POSTOS[0],
    data_nascimento: '',
    sexo: 'Masculino',
    organizacao_id: '',
  });
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/listas/organizacoes') 
      .then(response => {
        setOrganizacoes(response.data);
        if (response.data.length > 0 && !formData.organizacao_id) {
          setFormData(f => ({ ...f, organizacao_id: response.data[0].id }));
        }
      })
      .catch(error => {
        console.error("Erro ao buscar organizações:", error);
        setErro("Não foi possível carregar a lista de OMs.");
      });
  }, [formData.organizacao_id]);

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

    if (formData.senha !== formData.confirmaSenha) {
      setErro("As senhas não conferem.");
      setCarregando(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/register', {
        saram: formData.saram,
        email: formData.email,
        senha: formData.senha,
        nome: formData.nome,
        posto: formData.posto,
        data_nascimento: formData.data_nascimento,
        sexo: formData.sexo,
        organizacao_id: formData.organizacao_id,
      });

      setSucesso("Cadastro realizado com sucesso! Você será redirecionado para o Login.");
      setCarregando(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error("Erro no registro:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErro(error.response.data.message);
      } else {
        setErro("Erro ao tentar realizar o cadastro. Tente novamente.");
      }
      setCarregando(false);
    }
  };
  // --- FIM DA LÓGICA ---


  // --- INÍCIO DO NOVO JSX COM MUI ---
  return (
    <Container component="main" maxWidth="sm"> {/* "sm" = small, um pouco maior que "xs" */}
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 8, // Margem no final
        }}
      >
        <img 
          src={unifaLogo} 
          alt="Logo UNIFA" 
          style={{ height: '100px', marginBottom: '20px' }} 
        />
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Cadastro de Novo Militar
        </Typography>

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* O Grid ajuda a organizar o formulário em colunas */}
          <Grid container spacing={2}>
            
            {/* SARAM */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="saram"
                required
                fullWidth
                id="saram"
                label="SARAM"
                autoFocus
                value={formData.saram}
                onChange={handleChange}
              />
            </Grid>
            
            {/* NOME COMPLETO */}
            <Grid item xs={12} sm={6}>
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

            {/* EMAIL */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>

            {/* SENHA */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="senha"
                label="Senha"
                type="password"
                id="senha"
                value={formData.senha}
                onChange={handleChange}
              />
            </Grid>

            {/* CONFIRMA SENHA */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmaSenha"
                label="Confirme a Senha"
                type="password"
                id="confirmaSenha"
                value={formData.confirmaSenha}
                onChange={handleChange}
              />
            </Grid>
            
            {/* POSTO/GRADUAÇÃO (SELECT) */}
            <Grid item xs={12} sm={6}>
              {/* O <FormControl> é o wrapper para dropdowns */}
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

            {/* DATA DE NASCIMENTO (DATE) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="data_nascimento"
                label="Data de Nascimento"
                name="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true, // Faz a label encolher (necessário para o tipo 'date')
                }}
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
                  {/* <MenuItem value="">Selecione sua OM</MenuItem> */}
                  {organizacoes.map(om => (
                    <MenuItem key={om.id} value={om.id}>
                      {om.sigla} - {om.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Mensagens de Erro ou Sucesso */}
          {erro && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {erro}
            </Alert>
          )}
          {sucesso && (
            <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
              {sucesso}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={carregando}
            sx={{ mt: 3, mb: 2 }}
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <RouterLink to="/login" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Já tem uma conta? Faça o login aqui
              </Typography>
            </RouterLink>
          </Box>

        </Box>
      </Box>
    </Container>
  );
  // --- FIM DO NOVO JSX COM MUI ---
}