import api from '../api/axiosConfig';

export const egresosService = {
    // ----------------------------------------------------------------
    // CRUD BÁSICO
    // ----------------------------------------------------------------
    obtenerTodos: async () => {
        const response = await api.get('/egresos/?skip=0&limit=100');
        return response.data;
    },
    crear: async (datos) => {
        const response = await api.post('/egresos/', datos);
        return response.data;
    },
    anular: async (id) => {
        const response = await api.delete(`/egresos/${id}`);
        return response.data;
    },

    // ----------------------------------------------------------------
    // FUNCIONES AUXILIARES (Listas Desplegables)
    // ----------------------------------------------------------------

    // 1. Cuentas Contables (Solo Cuentas finales de GASTO)
    obtenerCuentasGasto: async () => {
        try {
            // Traemos todo el catálogo
            const response = await api.get('/categorias/?limit=200'); // Aumenté el límite por si acaso
            const lista = Array.isArray(response.data) ? response.data : [];
            
            // --- FILTRO CORREGIDO ---
            return lista.filter(c => {
                // 1. Normalizamos a mayúsculas para evitar errores ('Egreso' vs 'EGRESO')
                const tipoNormalizado = (c.tipo || '').toUpperCase();
                const codigoStr = String(c.codigo || '');

                // 2. Condición: 
                //    - Que sea tipo EGRESO  O  que el código empiece con '5'
                //    - Y MUY IMPORTANTE: Que NO sea un Rubro (Carpeta)
                const esGasto = tipoNormalizado === 'EGRESO' || codigoStr.startsWith('5');
                const esImputable = !c.es_rubro || c.es_rubro === false || c.es_rubro === 'false';

                return c.activo && esGasto && esImputable;
            });

        } catch (error) {
            console.error("Error cargando cuentas contables:", error);
            return [];
        }
    },

    // 2. Tipos de Egreso / Grupos (Facturas, Recibos)
    obtenerTiposDocumento: async () => {
        try {
            const response = await api.get('/tipos-egreso/?limit=100');
            const lista = Array.isArray(response.data) ? response.data : [];
            
            return lista.filter(t => t.activo === true);
        } catch (error) {
            console.error("Error cargando tipos de documento:", error);
            return [];
        }
    }
};