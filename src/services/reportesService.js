import api from '../api/axiosConfig';

export const reportesService = {
    /**
     * Obtiene la lista de inquilinos con deuda vencida.
     * Endpoint: GET /reportes/morosidad
     */
    obtenerMorosos: async () => {
        try {
            const response = await api.get('/reportes/morosidad');
            return response.data;
        } catch (error) {
            console.error("Error en servicio de morosidad:", error);
            throw error;
        }
    },

    // 2. ESTADO DE CUENTA (Detalle individual)
    obtenerEstadoCuenta: async (idPersona) => {
        // Llama a /v1/reportes/estado-cuenta/{id}
        const response = await api.get(`/reportes/estado-cuenta/${idPersona}`);
        return response.data;
    }
    
};