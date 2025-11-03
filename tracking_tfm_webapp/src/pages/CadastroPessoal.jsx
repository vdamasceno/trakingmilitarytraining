// src/pages/CadastroPessoal.jsx (Código Completo - Refatorado com validação)
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';

// --- NOVAS IMPORTAÇÕES PARA VALIDAÇÃO ---
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// --- FIM DAS NOVAS IMPORTAÇÕES ---

// --- Importações MUI (algumas novas) ---
import {
  Box, Button, Select, MenuItem, InputLabel, FormControl,
  TextField, Typography, Grid, Paper, Alert, FormHelperText, CircularProgress, Divider
} from '@mui/material';

// Lista de postos
const LISTA_POSTOS = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  'SO', '1S', '2S', '3S', 'Cb', 'S1', 'S2',
  'Cad', 'Aluno'
];

// --- 1. DEFINIÇÃO DO SCHEMA DE VALIDAÇÃO (ZOD) ---
const perfilSchema = z.object({
  nome: z.string().min(1, 'Nome completo é obrigatório'),
  posto: z.string().min(1, 'Posto é obrigatório'),
  data_nascimento: z.string().optional().nullable(),
  sexo: z.string(),
  organizacao_id: z.string().min(1, 'Organização Militar é obrigatória'),
});
// --- FIM DO SCHEMA ---


export default function CadastroPessoal() {
  const { logout }  = useAuth(); 

  // --- 2. CONFIGURAÇÃO DO REACT-HOOK-FORM ---
  const { 
    control, 
    handleSubmit, 
    reset, // Função para carregar dados no formulário
    formState: { errors, isSubmitting } // Pega o estado de 'enviando'
  } = useForm({
    resolver: zodResolver(perfilSchema),
    defaultValues: { // Valores padrão iniciais (vazios)
      nome: '',
      posto: '',
      data_nascimento: '',
      sexo: 'Masculino',
      organizacao_id: '',
    }
  });
  // --- FIM DA CONFIGURAÇÃO ---
  
  // Estados que NÃO são do formulário
  const [organizacoes, setOrganizacoes] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true); // Para o "Carregando..." inicial
  const [erroApi, setErroApi] = useState(null);
  const [sucessoApi, setSucessoApi] = useState(null);

  // --- 3. useEffect PARA CARREGAR OS DADOS ---
  useEffect(() => {
    setCarregandoDados(true);
    setErroApi(null);
    Promise.all([
      apiClient.get('/usuarios/me'),      
      apiClient.get('/listas/organizacoes') 
    ])
    .then(([usuarioResponse, omResponse]) => {
      
      const { nome, posto, data_nascimento, sexo, organizacao_id } = usuarioResponse.data;
      const dataFormatada = data_nascimento ? data_nascimento.split('T')[0] : '';

      // --- 4. POPULANDO O FORMULÁRIO COM reset() ---
      // Esta é a forma correta de preencher o react-hook-form com dados da API
      reset({
        nome: nome || '',
        posto: posto || LISTA_POSTOS[0], 
        data_nascimento: dataFormatada,
        sexo: sexo || 'Masculino',
        organizacao_id: organizacao_id ? organizacao_id.toString() : '' // Zod/Select esperam string
      });

      setOrganizacoes(omResponse.data);
    })
    .catch(error => {
      console.error("Erro ao buscar dados:", error);
      setErroApi("Falha ao carregar dados do usuário ou OMs.");
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        logout(); 
      }
    })
    .finally(() => {
      setCarregandoDados(false);
    });
  }, [logout, reset]); // 'reset' é uma dependência estável

  
  // --- 5. FUNÇÃO DE SUBMIT (agora 'onSubmit') ---
  const onSubmit = async (data) => {
    setErroApi(null);
    setSucessoApi(null);

    try {
      // 'data' já contém os dados validados
      const response = await apiClient.put('/usuarios/me', {
        ...data,
        data_nascimento: data.data_nascimento || null // Envia null se vazio
      });
      setSucessoApi("Dados atualizados com sucesso!");
      
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErroApi(error.response.data.message);
      } else {
        setErroApi("Falha ao salvar as alterações.");
      }
    }
  };
  // --- FIM DA FUNÇÃO SUBMIT ---

  // --- ADICIONE ESTA NOVA FUNÇÃO ---
  const handleConnectStrava = async () => {
    try {
      // 1. Chama o backend (com o token via axios)
      const response = await apiClient.get('/strava/auth');

      // 2. Pega a URL de autorização que o backend montou
      const { authUrl } = response.data;

      // 3. Redireciona o navegador do usuário para o Strava
      window.location.href = authUrl;

    } catch (error) {
      console.error("Erro ao iniciar conexão com Strava:", error);
      // (Poderíamos usar o 'setErroApi' aqui para mostrar um Alert)
      alert("Erro ao tentar conectar com o Strava. Tente novamente.");
    }
  };
  // --- FIM DA ADIÇÃO ---

  // Tela de "Carregando..."
  if (carregandoDados) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando dados do usuário...</Typography>
      </Box>
    );
  }

  // --- 6. O JSX COM OS 'Controller's ---
  return (
    <Paper 
      elevation={3} 
      sx={{ padding: { xs: 2, md: 4 }, maxWidth: '700px', margin: 'auto' }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h5" component="h2" gutterBottom>
          Cadastro Pessoal
        </Typography>
        <Typography variant="body1" gutterBottom>
          Edite seus dados cadastrais. (SARAM e Email não podem ser alterados).
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          
          {/* NOME */}
          <Grid item xs={12}>
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

          {/* POSTO (SELECT) */}
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

          {/* DATA NASCIMENTO */}
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

          {/* Mensagens de Erro/Sucesso da API */}
          <Grid item xs={12}>
            {erroApi && <Alert severity="error" sx={{ width: '100%', mt: 1 }}>{erroApi}</Alert>}
            {sucessoApi && <Alert severity="success" sx={{ width: '100%', mt: 1 }}>{sucessoApi}</Alert>}
          </Grid>
          
          {/* Botão Salvar */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting} // Desabilita enquanto envia
              size="large"
              sx={{ padding: '10px 15px' }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </Grid>

        </Grid>
      </Box>

      {/* --- INÍCIO DA ADIÇÃO DO BOTÃO STRAVA --- */}
      <Divider sx={{ my: 4 }}>
        <Typography>Conexões de Aplicativos</Typography>
      </Divider>

      <Box>
        <Typography variant="body1" gutterBottom>
          Conecte sua conta do Strava para importar seus treinos (corridas, pedaladas, natação) automaticamente para a aba TFM.
        </Typography>
        <Button
          variant="contained"
          onClick={handleConnectStrava}
          rel="noopener noreferrer"
          sx={{ 
            mt: 1, 
            backgroundColor: '#FC4C02', // Cor laranja do Strava
            color: 'white',
            '&:hover': {
              backgroundColor: '#e94501' // Cor mais escura no hover
            } 
          }}
        >
          Conectar com o Strava
        </Button>
      </Box>
      {/* --- FIM DA ADIÇÃO DO BOTÃO STRAVA --- */}          

    </Paper>
  );
}