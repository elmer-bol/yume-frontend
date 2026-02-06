import api from '../api/axiosConfig';

// 1. Estado de Cuenta (Individual por Persona)
const obtenerEstadoCuenta = async (idPersona) => {
    // Al usar 'api.get', concatenará automáticamente '/reportes/...' a tu baseURL
    const response = await api.get(`/reportes/estado-cuenta/${idPersona}`);
    return response.data;
};

// 2. Reporte de Morosidad (Lista de deudores vencidos)
const obtenerMorosidad = async () => {
    const response = await api.get(`/reportes/morosidad`);
    return response.data;
};

// 3. Cartera Global (Deuda total vencida y futura)
const obtenerCarteraGlobal = async () => {
    const response = await api.get(`/reportes/cartera-global`);
    return response.data;
};

// 4. Dashboard Principal (KPIs para la pantalla Home)
const obtenerDashboard = async () => {
    const response = await api.get(`/reportes/dashboard`);
    return response.data;
};

// 5. ESTADO DE RESULTADOS
const obtenerEstadoResultados = async (fechaInicio, fechaFin) => {
    const response = await api.get(`/reportes/estado-resultados`, {
        params: { 
            fecha_inicio: fechaInicio, 
            fecha_fin: fechaFin 
        }
    });
    return response.data;
};

// 6. DETALLE DE MOVIMIENTOS (Nuevo)
const obtenerDetalleCuenta = async (idCatalogo, fechaInicio, fechaFin) => {
    const response = await api.get(`/reportes/detalle-cuenta/${idCatalogo}`, {
        params: { 
            fecha_inicio: fechaInicio, 
            fecha_fin: fechaFin 
        }
    });
    return response.data;
};

// 7. MOVIMIENTOS DE CAJA (LIBRO DIARIO)
const obtenerMovimientosCaja = async (idMedio, fechaInicio, fechaFin) => {
    // Llama al endpoint: /reportes/caja-movimientos/{id}
    const response = await api.get(`/reportes/caja-movimientos/${idMedio}`, {
        params: { 
            fecha_inicio: fechaInicio, 
            fecha_fin: fechaFin 
        }
    });
    return response.data;
};

export const reportesService = {
    obtenerEstadoCuenta,
    obtenerMorosidad,
    obtenerCarteraGlobal,
    obtenerDashboard,
    obtenerEstadoResultados,
    obtenerDetalleCuenta,
    obtenerMovimientosCaja
};

