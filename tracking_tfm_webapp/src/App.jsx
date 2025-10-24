// src/App.jsx
import { Routes, Route } from 'react-router-dom';

// Importe as páginas
import Login from './pages/Login';
import Registro from './pages/Registro';
import DashboardLayout from './pages/DashboardLayout';
import CadastroPessoal from './pages/CadastroPessoal';
import TACF from './pages/TACF';
import TFM from './pages/TFM';

// Importe os componentes de Rota
import RotaProtegida from './components/RotaProtegida';
import AdminRota from './components/AdminRota';
import DashboardAdmin from './pages/DashboardAdmin';
import MinhaEvolucao from './pages/MinhaEvolucao'; // <<<<< NOVA LINHA

function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* --- INÍCIO DA MUDANÇA --- */}
      
      {/* Rotas Privadas (Protegidas pelo Login) */}
      <Route path="/" element={<RotaProtegida />}> 
        
        {/* O DashboardLayout agora envolve TODAS as rotas logadas */}
        <Route element={<DashboardLayout />}>
          
          {/* Rotas Normais */}
          <Route index element={<CadastroPessoal />} />
          <Route path="cadastro" element={<CadastroPessoal />} />
          <Route path="tacf" element={<TACF />} />
          <Route path="tfm" element={<TFM />} />
          <Route path="evolucao" element={<MinhaEvolucao />} /> {/* <<<<< NOVA LINHA */}
          {/* Rota de Admin (agora aqui dentro) */}
          {/* Ela ainda é protegida pelo "super-segurança" AdminRota */}
          <Route path="admin" element={<AdminRota />}>
            <Route index element={<DashboardAdmin />} />
          </Route>

        </Route>
      </Route>

      {/* --- VERIFIQUE ESTE BLOCO --- */}
      {/* Rota Privada de Admin */}
      <Route path="/admin" element={<AdminRota />}>
        <Route index element={<DashboardAdmin />} />
        {/* (path="/admin" e "index" são o mesmo que path="/admin") */}
      </Route>
      {/* --- FIM DA VERIFICAÇÃO --- */}

    </Routes>
  );
}

export default App;