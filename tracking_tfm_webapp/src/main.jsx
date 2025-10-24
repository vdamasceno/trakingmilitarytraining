// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // <<<<<<< IMPORTAR
import App from './App';
import './index.css';

// --- INÍCIO DAS MUDANÇAS ---
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// --- FIM DAS MUDANÇAS ---

// --- INÍCIO DAS MUDANÇAS ---
// 1. Cria um tema básico (podemos customizar depois)
const theme = createTheme({
  palette: {
    primary: {
      main: '#005a9c', // Um tom de azul (pode ser o da FAB)
    },
    secondary: {
      main: '#f5a623', // Um tom de laranja/amarelo
    },
  },
});
// --- FIM DAS MUDANÇAS ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- INÍCIO DAS MUDANÇAS --- */}
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Aplica o "Reset" de CSS */}
      {/* --- FIM DAS MUDANÇAS --- */}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    {/* --- INÍCIO DAS MUDANÇAS --- */}
    </ThemeProvider>
    {/* --- FIM DAS MUDANÇAS --- */}
  </React.StrictMode>
);