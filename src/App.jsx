import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Asegúrate de importar Navigate
import { ThemeProvider } from '@mui/material/styles';

// Servicios de Seguridad
import authService from './services/authService';

// Importamos el tema y el Layout
import theme from './theme';
import Layout from './components/Layout';

// Importamos la página de Login
import Login from './pages/Login';

// Importamos tus páginas
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

import ReporteMorosidad from './pages/ReporteMorosidad';
import ReporteEstadoCuenta from './pages/ReporteEstadoCuenta';
import ReporteCarteraGlobal from './pages/ReporteCarteraGlobal';
import ReporteDirectorio from './pages/ReporteDirectorio';
import ReporteCaja from './pages/ReporteCaja';

// --- COMPONENTE GUARDIÁN ---
const ProtectedRoute = ({ children }) => {
  const isAuth = authService.isAuthenticated();
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          {/* 1. RUTA PÚBLICA: LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* 2. RUTAS PROTEGIDAS */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* --- CORRECCIÓN AQUÍ --- */}
                    {/* A. Si entran a la raíz "/", redirigir a "/dashboard" */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* B. Definir explícitamente la ruta "/dashboard" */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    {/* ----------------------- */}

                    {/* GRUPO: ADMINISTRACIÓN */}
                    <Route path="/admin/personas" element={<AdminPersonas />} />
                    <Route path="/admin/unidades" element={<AdminUnidades />} />
                    <Route path="/admin/categorias" element={<AdminCategorias />} />
                    <Route path="/admin/medios" element={<AdminMedios />} />
                    <Route path="/admin/conceptos" element={<AdminConceptos />} />
                    <Route path="/admin/tipoegresos" element={<AdminTipoEgresos />} />
                    
                    {/* REPORTES */}
                    <Route path="/reportes/morosidad" element={<ReporteMorosidad />} />
                    <Route path="/reportes/estado-cuenta" element={<ReporteEstadoCuenta />} />
                    <Route path="/reportes/cartera" element={<ReporteCarteraGlobal />} />
                    <Route path="/reportes/directorio" element={<ReporteDirectorio />} />
                    <Route path="/reportes/caja" element={<ReporteCaja />} />

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