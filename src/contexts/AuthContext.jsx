// src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig'; // Nosso "mensageiro" Axios
import { useNavigate } from 'react-router-dom';

// 1. Cria o Contexto (a "caixa" vazia)
const AuthContext = createContext(null);

// 2. Cria o "Provedor" (quem vai gerenciar e fornecer os dados)
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null); // Guarda os dados do usuário (id, nome)
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true); // Para sabermos se ainda estamos checando o login
  const navigate = useNavigate(); // Para redirecionar o usuário

  // Efeito que roda UMA VEZ quando o app carrega
  useEffect(() => {
    // Se encontramos um token no localStorage, precisamos verificar se ele é válido
    const tokenNoStorage = localStorage.getItem('authToken');
    
    if (tokenNoStorage) {
      // (axiosConfig.js já coloca o token no header automaticamente)
      
      // Vamos na API (backend) buscar os dados do usuário
      apiClient.get('/usuarios/me')
        .then(response => {
          // Se deu certo, o token é válido!
          setUsuario(response.data); // Guarda os dados do usuário
          setToken(tokenNoStorage);
        })
        .catch(() => {
          // Se deu erro (token expirado/inválido), limpamos tudo
          localStorage.removeItem('authToken');
          setToken(null);
          setUsuario(null);
        })
        .finally(() => {
          // Terminamos de checar
          setLoading(false);
        });
    } else {
      // Não tem token, não estamos logados.
      setLoading(false);
    }
  }, []); // O [] vazio faz rodar só uma vez

  // Função de LOGIN (será chamada pela página de Login)
  const login = async (saram, senha) => {
    try {
      // 1. Chama a API de login
      const response = await apiClient.post('/auth/login', { saram, senha });
      
      // 2. Pega o token e os dados da resposta
      const { token: novoToken, usuario: dadosUsuario } = response.data;

      // 3. Guarda tudo
      localStorage.setItem('authToken', novoToken); // Guarda no navegador
      setToken(novoToken); // Guarda no estado
      setUsuario(dadosUsuario); // Guarda no estado

      // 4. Redireciona para o dashboard
      navigate('/'); // Vai para a página principal (Cadastro Pessoal)
      
    } catch (error) {
      console.error("Erro no login:", error);
      // Aqui poderíamos guardar uma mensagem de erro para exibir na tela
      throw error; // Joga o erro para a página de Login tratar (ex: "SARAM ou senha inválidos")
    }
  };

  // Função de LOGOUT
  const logout = () => {
    // Limpa tudo
    localStorage.removeItem('authToken');
    setToken(null);
    setUsuario(null);
    
    // Redireciona para a página de login
    navigate('/login');
  };

  // O valor que o "Provedor" vai fornecer para o resto do app
  const value = {
    usuario,
    token,
    login,
    logout,
    loading, // Importante para não mostrar o login antes de checar
    isAuthenticated: !!token // !! transforma a string do token em um booleano (true/false)
  };

  // Retorna o "Provedor" com os valores, envolvendo os "filhos" (o resto do app)
  return (
    <AuthContext.Provider value={value}>
      {/* Só renderiza o app depois que terminamos a checagem inicial */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 3. Cria o "Hook" (o atalho para usar o contexto)
// Em vez de importar AuthContext e useContext toda vez, só importamos useAuth()
export const useAuth = () => {
  return useContext(AuthContext);
};
