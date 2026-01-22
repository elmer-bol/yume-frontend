import api from '../api/axiosConfig';

const ENDPOINT = '/tipos-egreso'; // Asegúrate de que tu router tenga este prefix

export const tipoEgresoService = {
    // 1. Listar (Activos e Inactivos para administración)
    obtenerTodos: async () => {
        // include_inactive=true para ver los que borramos lógicamente
        const response = await api.get(`${ENDPOINT}/?limit=100&include_inactive=true`);
        return response.data;
    },

    // 2. Crear
    crear: async (datos) => {
        const response = await api.post(`${ENDPOINT}/`, datos);
        return response.data;
    },

    // 3. Actualizar
    actualizar: async (id, datos) => {
        const response = await api.put(`${ENDPOINT}/${id}`, datos);
        return response.data;
    },

    // 4. Eliminar (Soft Delete)
    eliminar: async (id) => {
        const response = await api.delete(`${ENDPOINT}/${id}`);
        return response.data;
    },

    // 5. Activar (Recuperar)
    activar: async (id) => {
        const response = await api.put(`${ENDPOINT}/${id}/activar`);
        return response.data;
    }
};