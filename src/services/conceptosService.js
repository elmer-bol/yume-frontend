import api from '../api/axiosConfig';

// 1. Exportación Nombrada
export const conceptosService = {
    // Método original
    obtenerTodos: async () => {
        const response = await api.get('/conceptos/?skip=0&limit=100');
        return response.data;
    },

    // ALIAS (Para el Modal nuevo)
    getAll: async () => {
        const response = await api.get('/conceptos/?skip=0&limit=100');
        return response.data;
    },

    crear: async (datos) => {
        const response = await api.post('/conceptos/', datos);
        return response.data;
    },

    actualizar: async (id, datos) => {
        const response = await api.patch(`/conceptos/${id}`, datos);
        return response.data;
    },
    
    // Método para obtener solo los activos (útil para dropdowns)
    obtenerActivos: async () => {
        const response = await api.get('/conceptos/?skip=0&limit=100');
        // Filtramos en el cliente por seguridad
        return response.data.filter(c => c.activo);
    }
};

// 2. Exportación por Defecto
export default conceptosService;