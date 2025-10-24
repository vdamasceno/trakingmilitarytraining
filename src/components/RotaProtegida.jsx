// src/components/RotaProtegida.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Nosso hook

export default function RotaProtegida() {
  const { isAuthenticated } = useAuth(); // Pega o status de login

  if (!isAuthenticated) {
    // Se NÃO está autenticado...
    // ...redireciona para a página de login.
    return <Navigate to="/login" replace />; 
  }

  // Se está autenticado, deixa o React renderizar o "filho"
  // (No nosso caso, o DashboardLayout)
  return <Outlet />;
}