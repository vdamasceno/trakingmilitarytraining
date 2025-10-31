// src/pages/Registro.jsx (Código Completo - Refatorado com react-hook-form e zod)
import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

// --- NOVAS IMPORTAÇÕES PARA VALIDAÇÃO ---
import { useForm, Controller } from 'react-hook-form'; // Gerenciador de formulário
import { z } from 'zod'; // Biblioteca de Schema e validação
import { zodResolver } from '@hookform/resolvers/zod'; // Ponte entre hook-form e zod
// --- FIM DAS NOVAS IMPORTAÇÕES ---

// --- Importações MUI (algumas novas) ---
import {
  Container, Box, TextField, Button, Typography, Avatar, Alert,
  Select, MenuItem, InputLabel, FormControl, Grid, FormHelperText
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import unifaLogo from '../assets/unifa_logo.png'; 

// --- LISTA DE POSTOS (sem mudança) ---
const LISTA_POSTOS = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  'SO', '1S', '2S', '3S', 'Cb', 'S1', 'S2',
  'Cad', 'Aluno'
];

// --- 1. DEFINIÇÃO DO SCHEMA DE VALIDAÇÃO COM ZOD ---
const registroSchema = z.object({
  saram: z.string().min(1, 'SARAM é obrigatório'),
  email: z.string().min(1, 'Email é obrigatório').email('Email em formato inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmaSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  nome: z.string().min(1, 'Nome completo é obrigatório'),
  posto: z.string().min(1, 'Posto é obrigatório'),
  data_nascimento: z.string().optional().nullable(), // Opcional, mas deve ser string se existir
  sexo: z.string(),
  organizacao_id: z.string().min(1, 'Organização Militar é obrigatória'), // Zod trata IDs de select como string
}).refine((data) => data.senha === data.confirmaSenha, {
  // Regra customizada para verificar se as senhas batem
  message: "As senhas não conferem",
  path: ["confirmaSenha"], // Onde o erro deve aparecer
});


export default function Registro() {
  // --- Estados que NÃO são do formulário ---
  const [organizacoes, setOrganizacoes] = useState([]);
  const [erroApi, setErroApi] = useState(null); // Para erros que vêm do backend
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  // --- 2. CONFIGURAÇÃO DO REACT-HOOK-FORM ---
  const { 
    control, // O "cérebro" que conecta os inputs
    handleSubmit, // Função que "envelopa" nosso submit
    formState: { errors } // Objeto que contém todas as mensagens de erro
  } = useForm({
    resolver: zodResolver(registroSchema), // Conecta o form ao schema do zod
    defaultValues: { // Valores iniciais
      saram: '',
      email: '',
      senha: '',
      confirmaSenha: '',
      nome: '',
      posto: LISTA_POSTOS[0],
      data_nascimento: '',
      sexo: 'Masculino',
      organizacao_id: '',
    }
  });
  // --- FIM DA CONFIGURAÇÃO DO HOOK-FORM ---


  // useEffect para buscar OMs (sem mudança)
  useEffect(() => {
    apiClient.get('/listas/organizacoes') 
      .then(response => {
        setOrganizacoes(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar organizações:", error);
        setErroApi("Não foi possível carregar a lista de OMs.");
      });
  }, []); // Roda só uma vez

  
  // --- 3. FUNÇÃO DE SUBMIT (agora recebe 'data' do hook-form) ---
  // Esta função SÓ é chamada se a validação do Zod passar
  const onSubmit = async (data) => {
    setCarregando(true);
    setErroApi(null);
    setSucesso(null);

    try {
      // 'data' já contém todos os valores validados
      const response = await apiClient.post('/auth/register', {
        saram: data.saram,
        email: data.email,
        senha: data.senha,
        nome: data.nome,
        posto: data.posto,
        data_nascimento: data.data_nascimento || null, // Envia null se estiver vazio
        sexo: data.sexo,
        organizacao_id: data.organizacao_id,
      });

      setSucesso("Cadastro realizado com sucesso! Você será redirecionado para o Login.");
      setCarregando(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error("Erro no registro:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErroApi(error.response.data.message); // Ex: "SARAM ou Email já cadastrado."
      } else {
        setErroApi("Erro ao tentar realizar o cadastro. Tente novamente.");
      }
      setCarregando(false);
    }
  };
  // --- FIM DA FUNÇÃO DE SUBMIT ---


  // --- 4. O JSX COM OS COMPONENTES 'Controller' ---
  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
        <img src={unifaLogo} alt="Logo UNIFA" style={{ height: '100px', marginBottom: '20px' }} />
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><PersonAddOutlinedIcon /></Avatar>
        <Typography component="h1" variant="h5">Cadastro de Novo Militar</Typography>

        {/* handleSubmit(onSubmit) chama nossa função 'onSubmit' APÓS validar */}
        <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            
            {/* SARAM */}
            <Grid item xs={12} sm={6}>
              {/* O Controller conecta o MUI ao react-hook-form */}
              <Controller
                name="saram"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field} // Passa props como value, onChange, onBlur
                    required
                    fullWidth
                    label="SARAM"
                    autoFocus
                    // Mostra o erro se existir
                    error={!!errors.saram} 
                    helperText={errors.saram?.message} 
                  />
                )}
              />
            </Grid>
            
            {/* NOME COMPLETO */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Nome Completo"
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                  />
                )}
              />
            </Grid>

            {/* EMAIL */}
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* SENHA */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="senha"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Senha (mín. 8 caracteres)"
                    type="password"
                    error={!!errors.senha}
                    helperText={errors.senha?.message}
                  />
                )}
              />
            </Grid>

            {/* CONFIRMA SENHA */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="confirmaSenha"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Confirme a Senha"
                    type="password"
                    error={!!errors.confirmaSenha}
                    helperText={errors.confirmaSenha?.message}
                  />
                )}
              />
            </Grid>
            
            {/* POSTO/GRADUAÇÃO (SELECT) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="posto"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.posto}>
                    <InputLabel id="posto-label">Posto/Graduação</InputLabel>
                    <Select
                      {...field}
                      labelId="posto-label"
                      label="Posto/Graduação"
                    >
                      {LISTA_POSTOS.map(posto => (
                        <MenuItem key={posto} value={posto}>
                          {posto}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.posto?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* DATA DE NASCIMENTO (DATE) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="data_nascimento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data de Nascimento"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.data_nascimento}
                    helperText={errors.data_nascimento?.message}
                  />
                )}
              />
            </Grid>
            
            {/* SEXO (SELECT) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="sexo"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.sexo}>
                    <InputLabel id="sexo-label">Sexo</InputLabel>
                    <Select
                      {...field}
                      labelId="sexo-label"
                      label="Sexo"
                    >
                      <MenuItem value="Masculino">Masculino</MenuItem>
                      <MenuItem value="Feminino">Feminino</MenuItem>
                    </Select>
                    <FormHelperText>{errors.sexo?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* ORGANIZAÇÃO MILITAR (SELECT) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="organizacao_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.organizacao_id}>
                    <InputLabel id="om-label">Organização Militar (OM)</InputLabel>
                    <Select
                      {...field}
                      labelId="om-label"
                      label="Organização Militar (OM)"
                    >
                      {organizacoes.map(om => (
                        <MenuItem key={om.id} value={om.id.toString()}>
                          {om.sigla} - {om.nome}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.organizacao_id?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          {/* Mensagens de Erro (da API) ou Sucesso */}
          {erroApi && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {erroApi}
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
}