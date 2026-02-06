import api from '../api/axiosConfig';

export const cajaService = {
    // 1. Obtener Balance (Para el arqueo)
    obtenerBalance: async () => {
        const response = await api.get('/caja/balance');
        return response.data;
    },

    // 2. Obtener Libro Diario (Historial)
    obtenerLibroDiario: async () => {
        const response = await api.get('/caja/libro-diario');
        return response.data;
    },

    // 3. REALIZAR TRANSFERENCIA (La nueva función)
    realizarTransferencia: async (datos) => {
        // datos: { monto, id_medio_origen, id_medio_destino, fecha, descripcion }
        const response = await api.post('/caja/transferencia', datos);
        return response.data;
    }
};