import api from '../api/axiosConfig';

// 1. EXPORTACIÓN NOMBRADA (Para AdminDeudas.jsx)
export const facturablesService = {
    // ------------------------------------------------------------------
    // MÉTODOS ADMINISTRATIVOS (CRUD GENERAL)
    // ------------------------------------------------------------------

    // 1. LISTAR (Paginado simple)
    obtenerTodas: async () => {
        const response = await api.get('/facturables/?skip=0&limit=100');
        return response.data;
    },

    // 2. BUSQUEDA AVANZADA (Para filtros complejos)
    buscar: async (filtros) => {
        const response = await api.post('/facturables/search?skip=0&limit=100', filtros);
        return response.data;
    },

    // 3. CREAR MANUAL (Para multas o cobros extra)
    crear: async (datos) => {
        const response = await api.post('/facturables/', datos);
        return response.data;
    },

    // 4. ACTUALIZAR (Solo campos permitidos)
    actualizar: async (id, datos) => {
        const response = await api.patch(`/facturables/${id}`, datos);
        return response.data;
    },

    // 5. CANCELAR / ANULAR (Patch)
    cancelar: async (id) => {
        const response = await api.patch(`/facturables/${id}/cancel`);
        return response.data;
    },

    // ------------------------------------------------------------------
    // MÉTODOS DE GENERACIÓN AUTOMÁTICA
    // ------------------------------------------------------------------

    // 6. GENERACIÓN GLOBAL (El Botón Maestro)
    generarGlobal: async (datos) => {
        const response = await api.post('/facturables/generar-global', datos);
        return response.data;
    },

    // 7. GENERAR HISTORIAL POR CONTRATO (Para el Modal Nuevo)
    generarPorContrato: async (datos) => {
        const response = await api.post('/facturables/generar-contrato', datos);
        return response.data;
    },

    // ------------------------------------------------------------------
    // MÉTODOS DE CAJA / COBRANZA
    // ------------------------------------------------------------------

    // 8. OBTENER DEUDA PENDIENTE (Optimizado para Caja)
    obtenerDeudaPendiente: async (idUnidad) => {
        try {
            if (!idUnidad) return [];

            const response = await api.get(`/facturables/unidad/${idUnidad}`);
            const items = Array.isArray(response.data) ? response.data : [];

            return items.filter(item => 
                parseFloat(item.saldo_pendiente) > 0.01 && 
                item.estado !== 'anulado'
            );

        } catch (error) {
            console.error(`Error obteniendo deudas para unidad ${idUnidad}:`, error);
            return [];
        }
    }
};

// 2. EXPORTACIÓN POR DEFECTO (Para componentes nuevos)
export default facturablesService;