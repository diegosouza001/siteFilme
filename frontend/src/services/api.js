// Arquivo: ../services/api.js CORRIGIDO

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "https://sitefilme-1.onrender.com",
});

// --- NOVO: INTERCEPTOR PARA INJETAR O TOKEN ---
api.interceptors.request.use(async (config) => {
  // 1. Tenta obter o token do armazenamento local
  const token = localStorage.getItem('token');
  
  if (token) {
    // 2. Se o token existir, adiciona o cabeçalho Authorization
    // O formato "Bearer <token>" é o padrão para JWT
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
// ----------------------------------------------------

export default api;