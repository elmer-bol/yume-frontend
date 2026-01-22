// Archivo: src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  // Asegúrate de que este puerto coincida con tu FastAPI
  baseURL: 'http://localhost:8000/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE SALIDA (REQUEST) ---
// Antes de que la petición salga, le pegamos el Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE LLEGADA (RESPONSE) ---
// Si el backend nos grita "401" (Token vencido/falso), nos salimos.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Sesión expirada o no autorizada.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Forzar recarga para que el Router nos mande al Login
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;