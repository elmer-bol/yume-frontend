import api from '../api/axiosConfig';

export const categoriasService = {
    // 1. LISTAR
    obtenerTodas: async () => {
        // Asumimos paginación estándar
        const response = await api.get('/categorias/?skip=0&limit=100');
        return response.data;
    },

    // 2. CREAR
    crearCategoria: async (datos) => {
        const response = await api.post('/categorias/', datos);
        return response.data;
    },

    // 3. ACTUALIZAR (PUT COMPLETO)
    actualizarCategoria: async (id, datos) => {
        const response = await api.put(`/categorias/${id}`, datos);
        return response.data;
    },

    // 4. ELIMINAR (El Backend se encarga del Soft Delete)
    eliminarCategoria: async (id) => {
        const response = await api.delete(`/categorias/${id}`);
        return response.data;
    }
};