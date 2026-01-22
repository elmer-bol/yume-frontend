import api from '../api/axiosConfig';

export const contratosService = {
    // ------------------------------------------------------------------
    // 1. LECTURA (GET)
    // ------------------------------------------------------------------

    // Obtener TODO el historial (Activos e Inactivos)
    obtenerTodos: async () => {
        const response = await api.get('/relaciones/?skip=0&limit=500');
        return response.data;
    },

    // Obtener SOLO Activos (Versión Robusta importada de relacionClienteService)
    obtenerActivos: async () => {
        try {
            // Usamos el endpoint base. Si tu backend paginas por defecto, considera aumentar el limit aquí si tienes muchos inquilinos.
            const response = await api.get('/relaciones/?skip=0&limit=500');
            const datos = response.data;

            // Validación de seguridad: Si no es array, devolvemos vacío
            if (!Array.isArray(datos)) {
                console.warn("El backend no devolvió una lista en /relaciones/");
                return [];
            }

            // Filtro insensible a mayúsculas (Activo, ACTIVO, activo...)
            return datos.filter(r => {
                const estado = r.estado ? String(r.estado).toUpperCase() : "INACTIVO";
                return estado === 'ACTIVO'; 
            });

        } catch (error) {
            console.error("Error obteniendo relaciones activas:", error);
            return [];
        }
    },

    // ------------------------------------------------------------------
    // 2. ESCRITURA (POST, PATCH, DELETE)
    // ------------------------------------------------------------------

    // Crear nuevo contrato/relación
    crear: async (datos) => {
        const response = await api.post('/relaciones/', datos);
        return response.data;
    },

    // Actualizar contrato existente
    actualizar: async (id, datos) => {
        const response = await api.patch(`/relaciones/${id}`, datos);
        return response.data;
    },

    // Eliminar (Soft Delete)
    eliminar: async (id) => {
        const response = await api.delete(`/relaciones/${id}`);
        return response.data;
    }
};