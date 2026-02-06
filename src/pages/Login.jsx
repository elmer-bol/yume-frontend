// Archivo: src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../App.css'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // <--- NUEVO ESTADO
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // <--- ACTIVAMOS CARGA
    
    try {
      await authService.login(username, password);
      // Si el login es exitoso, vamos al Dashboard
      navigate('/dashboard'); 
    } catch (err) {
      setError('Credenciales incorrectas. Verifique usuario y contraseña.');
      setLoading(false); // <--- DESACTIVAMOS CARGA SOLO SI FALLA
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ padding: '2.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '380px' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#333' }}>YUME ERP</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Gestión Inteligente de Condominios</p>
        
        {/* --- NUEVO MENSAJE DE ALERTA (VERSIÓN LITE) --- */}
        <div style={{ 
            backgroundColor: '#e3f2fd', 
            border: '1px solid #90caf9', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#0d47a1'
        }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>⏳ Servidor en Modo Reposo</strong>
            Está utilizando la versión <strong>Lite (Gratuita)</strong>. El sistema puede tardar hasta <strong>50 segundos</strong> en despertar.
            
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #90caf9', color: '#1565c0' }}>
                🚀 <strong>¿Quiere velocidad instantánea?</strong><br/>
                Suscríbase a la versión <strong>PRO</strong> para eliminar esta espera.
            </div>
        </div>
        {/* ----------------------------------------------- */}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: '500' }}>Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required 
              disabled={loading} // Bloquear mientras carga
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: '500' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required 
              disabled={loading} // Bloquear mientras carga
            />
          </div>

          {error && <div style={{ 
              backgroundColor: '#ffebee', color: '#c62828', 
              padding: '10px', borderRadius: '4px', 
              marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' 
          }}>
              {error}
          </div>}

          <button 
            type="submit" 
            disabled={loading} // Evita doble clic
            style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: loading ? '#ccc' : '#007bff', // Gris si carga, Azul si no
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
            }}
          >
            {loading ? "DESPERTANDO SISTEMA..." : "INGRESAR"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;