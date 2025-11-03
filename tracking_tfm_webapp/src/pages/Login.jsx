// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom'; // Renomeamos o Link do Router

// --- INÍCIO DAS IMPORTAÇÕES DO MUI ---
import {
  Container, // Um container que centraliza o conteúdo
  Box,       // Uma "caixa" genérica para layout
  TextField, // O campo de input estilizado
  Button,    // O botão estilizado
  Typography, // Para textos (h1, p, etc.)
  Avatar,    // Para o círculo do ícone
  Alert      // Para exibir a mensagem de erro
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Ícone de cadeado
// --- FIM DAS IMPORTAÇÕES DO MUI ---

// --- Importe seu logo aqui ---
import unifaLogo from '../assets/unifa_logo.png'; // <<<<< Nova linha

export default function Login() {
  // A LÓGICA NÃO MUDA
  const [saram, setSaram] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const { login } = useAuth();
  // (O useNavigate não era usado aqui, então removi)

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro(null);

    try {
      await login(saram, senha);
    } catch (error) {
      console.error("Falha no login:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErro(error.response.data.message);
      } else {
        setErro("Erro ao tentar realizar o login. Tente novamente.");
      }
    }
  };

  // O HTML (JSX) AGORA É SUBSTITUÍDO POR COMPONENTES MUI
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* 1. Logo da UNIFA */}
        <img 
          src={unifaLogo} 
          alt="Logo UNIFA" 
          style={{ height: '80px', marginBottom: '16px' }} // Tamanho ajustado
        />

        {/* 2. Título do App (NOVO) */}
        <Typography 
          component="h1" 
          variant="h5"
          sx={{ 
            color: 'primary.main', // Cor azul do tema
            fontWeight: '600',    // Um pouco mais de peso
            mb: 2,                // Margem inferior
            textAlign: 'center'
          }}
        >
          Tracking Military Physical Training
        </Typography>

        {/* 3. Ícone de Cadeado */}
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        
        {/* 4. Título da Página (Login) */}
        <Typography component="h2" variant="h6"> {/* Mudado de h1/h5 para h2/h6 */}
          Login
        </Typography>

        {/* 5. Formulário */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="saram"
            label="SARAM"
            name="saram"
            autoComplete="saram"
            autoFocus
            value={saram}
            onChange={(e) => setSaram(e.target.value)}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="senha"
            label="Senha"
            type="password"
            id="senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && (
            <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
              {erro}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }} 
          >
            Entrar
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <RouterLink to="/registro" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Ainda não tem uma conta? Cadastre-se aqui
              </Typography>
            </RouterLink>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}