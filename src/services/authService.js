// Archivo: src/services/authService.js
import api from '../api/axiosConfig'; // Importamos tu configuración

const login = async (username, password) => {
  // Truco para FastAPI OAuth2: Usar URLSearchParams
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    // Apuntamos al endpoint estándar de FastAPI para tokens
    const response = await api.post('/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Si llegamos aquí, las credenciales son buenas
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      // Opcional: Si tu backend devuelve datos del usuario, guárdalos
      // localStorage.setItem('user', JSON.stringify(response.data.user)); 
    }
    
    return response.data;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login'; // Redirección dura al login
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token; // Devuelve true si hay token
};

export default {
  login,
  logout,
  isAuthenticated
};