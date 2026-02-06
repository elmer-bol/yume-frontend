// Archivo: src/services/planesService.js
import api from '../api/axiosConfig';

export const planesService = {
    // Envia la solicitud para crear un plan (Congelar viejas, crear nuevas)
    crearPlan: async (data) => {
        // data debe tener: { id_persona, items_ids, numero_cuotas, monto_cuota_mensual, fecha_inicio_pago, observaciones }
        const response = await api.post('/planes/crear', data);
        return response.data;
    }
};