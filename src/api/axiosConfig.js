// src/api/axiosConfig.js
import axios from 'axios';

// 1. Cria a "instância" do Axios
const apiClient = axios.create({
  // Define a URL base para todas as chamadas
  baseURL: 'http://localhost:3001', 
});

// 2. Interceptor (O "Porteiro" do Frontend)
// Isso é muito importante. É uma função que roda ANTES de QUALQUER requisição.
apiClient.interceptors.request.use(
  (config) => {
    // Pega o token que guardamos no navegador (localStorage)
    const token = localStorage.getItem('authToken'); 

    if (token) {
      // Se o token existir, anexa ele no cabeçalho Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Deixa a requisição continuar
  },
  (error) => {
    // Se der erro antes de enviar, rejeita
    return Promise.reject(error);
  }
);

export default apiClient;