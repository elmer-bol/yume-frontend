import api from '../api/axiosConfig';

export const egresosService = {
    // ... (Métodos listar, crear, anular se mantienen igual) ...
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

    // --- AQUÍ ESTÁ LA CORRECCIÓN CLAVE ---

    // 1. Cuentas Contables (Filtradas por Tipo: 'Egreso')
    obtenerCuentasGasto: async () => {
        try {
            const response = await api.get('/categorias/?limit=100'); // Asumiendo que trae todo
            const lista = Array.isArray(response.data) ? response.data : [];
            
            // Filtramos usando el dato real que me diste
            // Solo pasan: 'Servicios Básicos', 'Mantenimiento', 'Sueldos'
            return lista.filter(c => 
                c.activo === true && 
                c.tipo === 'Egreso' // Coincide con tu CSV: "Egreso"
            );
        } catch (error) {
            console.error("Error cargando catálogo:", error);
            return [];
        }
    },

    // 2. Tipos de Egreso (Cheque, Transferencia, etc.)
    obtenerTiposDocumento: async () => {
        try {
            const response = await api.get('/tipos-egreso/?limit=100');
            const lista = Array.isArray(response.data) ? response.data : [];
            
            // Solo activos
            return lista.filter(t => t.activo === true);
        } catch (error) {
            console.error("Error cargando tipos egreso:", error);
            return [];
        }
    }
};