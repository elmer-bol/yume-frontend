import api from '../api/axiosConfig';

// 1. Exportación Nombrada (Para las pantallas viejas)
export const personasService = {
    // Método original
    obtenerTodas: async () => {
        const response = await api.get('/personas/?skip=0&limit=500');
        return response.data;
    },

    // ALIAS (Para el Modal nuevo que busca .getAll)
    getAll: async () => {
        const response = await api.get('/personas/?skip=0&limit=500');
        return response.data;
    },

    crear: async (datos) => {
        const response = await api.post('/personas/', datos);
        return response.data;
    },

    actualizar: async (id, datos) => {
        const response = await api.put(`/personas/${id}`, datos);
        return response.data;
    },

    eliminar: async (id) => {
        const response = await api.delete(`/personas/${id}`);
        return response.data;
    }
};

// 2. Exportación por Defecto (Para el Modal nuevo)
export default personasService;