import api from '../api/axiosConfig';

// 1. EXPORTACIÓN NOMBRADA (Para AdminUnidades.jsx)
// Fíjate que le agregué la palabra 'export' antes de 'const'
export const unidadesService = {
    // ---------------------------------------------------------------
    // 1. LISTAR (GET)
    // ---------------------------------------------------------------
    obtenerTodas: async () => {
        const response = await api.get('/unidades/?skip=0&limit=500');
        return response.data;
    },
    
    // Alias (Para compatibilidad)
    getAll: async () => {
        const response = await api.get('/unidades/?skip=0&limit=500');
        return response.data;
    },

    // ---------------------------------------------------------------
    // 2. CREAR (POST)
    // ---------------------------------------------------------------
    crear: async (datos) => {
        const response = await api.post('/unidades/', datos);
        return response.data;
    },

    // ---------------------------------------------------------------
    // 3. ACTUALIZAR (PUT/PATCH)
    // ---------------------------------------------------------------
    actualizar: async (id, datos) => {
        const response = await api.put(`/unidades/${id}`, datos);
        return response.data;
    },

    // ---------------------------------------------------------------
    // 4. ELIMINAR / DESACTIVAR
    // ---------------------------------------------------------------
    eliminar: async (id) => {
        const response = await api.delete(`/unidades/${id}`);
        return response.data;
    }
};

// 2. EXPORTACIÓN POR DEFECTO (Para ModalGenerarHistorial.jsx)
export default unidadesService;