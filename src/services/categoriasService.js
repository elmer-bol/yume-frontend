import api from '../api/axiosConfig';

// ------------------------------------------------------------------
// 1. DEFINICIÓN DE LA CONSTANTE (Esto faltaba y causaba el ReferenceError)
// ------------------------------------------------------------------
const ENDPOINT = '/categorias';

export const categoriasService = {
    // 1. LISTAR (General)
    obtenerTodas: async () => {
        // Usamos la constante ENDPOINT para mantener consistencia
        const response = await api.get(`${ENDPOINT}/?skip=0&limit=100`);
        return response.data;
    },
    
    // 1.2. NUEVO: Obtener solo RUBROS DE EGRESO (Carpetas 5.X)
    obtenerRubrosEgresos: async () => {
        const params = new URLSearchParams({
            tipo: 'EGRESO',
            es_rubro: true,
            activo: true,
            limit: 1000
        });
        
        // Ahora sí funcionará porque ENDPOINT está definido arriba
        const response = await api.get(`${ENDPOINT}/?${params.toString()}`);
        return response.data;
    },

    // 2. CREAR
    // Unifiqué tus funciones 'crear' y 'crearCategoria' en una sola para no tener duplicados
    crear: async (datos) => {
        const response = await api.post(`${ENDPOINT}/`, datos);
        return response.data;
    },

    // 3. ACTUALIZAR
    actualizarCategoria: async (id, datos) => {
        // OJO: Cambié 'put' por 'patch' porque así lo definimos en el Backend (categorias.py)
        const response = await api.patch(`${ENDPOINT}/${id}`, datos);
        return response.data;
    },

    // 4. ELIMINAR
    eliminarCategoria: async (id) => {
        const response = await api.delete(`${ENDPOINT}/${id}`);
        return response.data;
    }
};