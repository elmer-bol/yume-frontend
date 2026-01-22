import api from '../api/axiosConfig';

export const mediosService = {
    // 1. LISTAR
    obtenerTodos: async () => {
        const response = await api.get('/medios-ingreso/?skip=0&limit=100');
        return response.data;
    },

    // 2. CREAR
    crearMedio: async (datos) => {
        const response = await api.post('/medios-ingreso/', datos);
        return response.data;
    },

    // 3. ACTUALIZAR
    actualizarMedio: async (id, datos) => {
        const response = await api.put(`/medios-ingreso/${id}`, datos);
        return response.data;
    },

    // 4. ELIMINAR
    eliminarMedio: async (id) => {
        const response = await api.delete(`/medios-ingreso/${id}`);
        return response.data;
    }
};