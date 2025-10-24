// src/components/AdminRota.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Nosso hook

export default function AdminRota() {
  // Usamos o 'isAuthenticated' E o 'usuario'
  const { isAuthenticated, usuario } = useAuth(); 

  if (!isAuthenticated) {
    // 1. Se não está logado, vai para o login
    return <Navigate to="/login" replace />; 
  }

  if (usuario.nivel_acesso !== 'gerencial') {
    // 2. Se está logado, MAS NÃO É gerente...
    // ...manda de volta para a página principal (cadastro)
    return <Navigate to="/cadastro" replace />;
  }

  // 3. Se está logado E É gerente, renderiza a página de admin
  return <Outlet />;
}