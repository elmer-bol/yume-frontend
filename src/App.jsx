import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

// Servicios de Seguridad
import authService from './services/authService';

// Importamos el tema y el Layout
import theme from './theme';
import Layout from './components/Layout';

// Importamos la NUEVA página de Login
import Login from './pages/Login';

// Importamos tus páginas (Mismos nombres)
import Dashboard from './pages/Dashboard';
import AdminPersonas from './pages/AdminPersonas';
import AdminMedios from './pages/AdminMedios';
import AdminCategorias from './pages/AdminCategorias';
import AdminConceptos from './pages/AdminConceptos';
import AdminUnidades from './pages/AdminUnidades';
import AdminContratos from './pages/AdminContratos';
import AdminDeudas from './pages/AdminDeudas';
import AdminCajas from './pages/AdminCaja';
import AdminDepositos from './pages/AdminDepositos';
import AdminTipoEgresos from './pages/AdminTipoEgresos';
import AdminEgresos from './pages/AdminEgresos';

import ReporteMorosidad from './pages/ReporteMorosidad';       // <--- NUEVO
import ReporteEstadoCuenta from './pages/ReporteEstadoCuenta'; // <--- NUEVO

// --- COMPONENTE GUARDIÁN ---
// Si hay token, muestra el contenido (children). Si no, manda al Login.
const ProtectedRoute = ({ children }) => {
  const isAuth = authService.isAuthenticated(); // Usamos la función que creamos en authService.js
  
  if (!isAuth) {
    // replace evita que el usuario pueda volver atrás con el botón del navegador
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          {/* 1. RUTA PÚBLICA: LOGIN (Sin Layout, Sin Protección) */}
          <Route path="/login" element={<Login />} />

          {/* 2. RUTAS PROTEGIDAS (Todas agrupadas) */}
          {/* Usamos "/*" para que coincida con cualquier ruta que no sea /login */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                {/* El Layout solo aparece si estás logueado */}
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />

                    {/* GRUPO: ADMINISTRACIÓN */}
                    <Route path="/admin/personas" element={<AdminPersonas />} />
                    <Route path="/admin/unidades" element={<AdminUnidades />} />
                    <Route path="/admin/categorias" element={<AdminCategorias />} />
                    <Route path="/admin/medios" element={<AdminMedios />} />
                    <Route path="/admin/conceptos" element={<AdminConceptos />} />
                    <Route path="/admin/tipoegresos" element={<AdminTipoEgresos />} />
                    <Route path="/reportes/morosidad" element={<ReporteMorosidad />} />
                    <Route path="/reportes/estado-cuenta" element={<ReporteEstadoCuenta />} />

                    {/* GRUPO: PROCESOS */}
                    <Route path="/admin/contratos" element={<AdminContratos />} />
                    <Route path="/admin/deudas" element={<AdminDeudas />} />
                    <Route path="/admin/cajas" element={<AdminCajas />} />
                    <Route path="/admin/depositos" element={<AdminDepositos />} />
                    <Route path="/admin/egresos" element={<AdminEgresos />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;