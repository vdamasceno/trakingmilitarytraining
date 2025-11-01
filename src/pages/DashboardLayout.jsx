// src/pages/DashboardLayout.jsx
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import unifaLogo from '../assets/unifa_logo.png';

// --- INÍCIO DAS IMPORTAÇÕES DO MUI ---
import {
  AppBar,     // A barra do topo
  Toolbar,    // O container dentro da barra
  Typography, // Para textos
  Button,     // Para o botão de Sair
  Box,        // Para layout
  Tabs,       // O container das abas
  Tab,        // A aba individual
  Container   // Para centralizar o conteúdo da página
} from '@mui/material';
// --- FIM DAS IMPORTAÇÕES DO MUI ---

export default function DashboardLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation(); // Hook para saber qual rota está ativa

  // Define o valor da aba ativa baseado na URL atual
  // Isso garante que a aba correta fique "marcada"
  const getActiveTab = () => {
    if (location.pathname === '/admin') return '/admin';
    if (location.pathname.startsWith('/tfm')) return '/tfm';
    if (location.pathname.startsWith('/tacf')) return '/tacf';
    // O padrão (index e /cadastro)
    return '/cadastro';
  };

  const activeTab = getActiveTab();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. O NOVO CABEÇALHO (AppBar) */}
      <AppBar position="static">
        <Toolbar>
          {/* Logo */}
          <img 
            src={unifaLogo} 
            alt="Logo UNIFA" 
            style={{ height: '50px', marginRight: '15px' }} 
          />
          
          {/* Título */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tracking Military Physical Training
          </Typography>
          
          {/* Saudação e Botão Sair */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {usuario && (
              <Typography sx={{ mr: 2 }}>
                Olá, {usuario.nome}
              </Typography>
            )}
            <Button color="inherit" variant="outlined" onClick={logout}>
              Sair
            </Button>
          </Box>
        </Toolbar>
        
        {/* 2. A NOVA NAVEGAÇÃO (Tabs) */}
        <Box sx={{ backgroundColor: 'white', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} textColor="primary" indicatorColor="primary">
            
            {/* Aba Cadastro Pessoal */}
            <Tab 
              label="Cadastro Pessoal" 
              value="/cadastro"
              component={RouterLink} // Usa o Link do Roteador
              to="/cadastro"         // Define o destino
            />
            
            {/* Aba TACF */}
            <Tab 
              label="TACF"
              value="/tacf"
              component={RouterLink}
              to="/tacf"
            />
            
            {/* Aba TFM */}
            <Tab 
              label="TFM"
              value="/tfm"
              component={RouterLink}
              to="/tfm"
            />
            {/* --- Adicionar a nova Tab --- */}
            <Tab 
              label="Minha Evolução" 
              value="/evolucao"
              component={RouterLink} 
              to="/evolucao" 
            />

            {/* Aba Gerencial (Condicional) */}
            {usuario && usuario.nivel_acesso === 'gerencial' && (
              <Tab 
                label="Dashboard Gerencial"
                value="/admin"
                component={RouterLink}
                to="/admin"
                // Adiciona um estilo sutil para destacar
                sx={{ fontWeight: 'bold', color: 'primary.main' }}
              />
            )}
          </Tabs>
        </Box>
      </AppBar>

      {/* 3. O CONTEÚDO DA PÁGINA (Outlet) */}
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* O Outlet é onde o React vai renderizar a aba clicada */}
        <Outlet /> 
      </Container>

      {/* 4. Rodapé (Opcional, mas bom para dar acabamento) */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' Universidade da Força Aérea - Desenvolvido por Vinicius Damasceno'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}