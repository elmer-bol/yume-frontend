import api from '../api/axiosConfig';

export const depositosService = {
    // 1. Obtener efectivo en mano (Caja Pendiente)
    obtenerPendientes: async () => {
        const response = await api.get('/depositos/pendientes');
        return response.data; 
    },

    // 2. Registrar el Depósito (Blindaje)
    crearDeposito: async (datos) => {
        // datos debe coincidir con DepositoCreate del Schema
        const response = await api.post('/depositos/', datos);
        return response.data;
    },

    // 3. Historial
    obtenerHistorial: async () => {
        const response = await api.get('/depositos/?skip=0&limit=50');
        return response.data;
    }
};