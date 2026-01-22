import api from '../api/axiosConfig';

export const ingresoService = {
    // 1. Cobrar (Ya lo tienes)
    crearIngreso: async (payload) => {
        const response = await api.post('/transacciones-ingreso/', payload);
        return response.data;
    },

    // 2. Simular (Ya lo tienes - opcional)
    simularIngreso: async (idPersona, idUnidad, monto) => {
        const response = await api.get(`/transacciones-ingreso/simular`, {
            params: { id_persona: idPersona, id_unidad: idUnidad, monto_total: monto }
        });
        return response.data;
    },

    // 👇 3. NUEVO: Obtener los últimos pagos (Historial)
    obtenerHistorial: async () => {
        // Pedimos los últimos 10 para no saturar la pantalla
        const response = await api.get('/transacciones-ingreso/?skip=0&limit=10');
        // Ordenamos por ID descendente (el más nuevo primero) en el cliente por si acaso
        return response.data.sort((a, b) => b.id_transaccion_ingreso - a.id_transaccion_ingreso);
    },

    // 🔴 NUEVO: ANULAR (PATCH)
    anularIngreso: async (idTransaccion, idUsuario) => {
        // Tu endpoint es: PATCH /transacciones-ingreso/anular/{id}?id_usuario=...
        const response = await api.patch(`/transacciones-ingreso/anular/${idTransaccion}`, null, {
            params: { id_usuario: idUsuario }
        });
        return response.data;
    },

    // 🔵 NUEVO: SIMULAR (GET) - Lo dejamos listo por si acaso
    simularIngreso: async (idPersona, idUnidad, monto) => {
        const response = await api.get(`/transacciones-ingreso/simular`, {
            params: { 
                id_persona: idPersona, 
                id_unidad: idUnidad, 
                monto: monto // Ojo: tu backend pide 'monto', no 'monto_total'
            }
        });
        return response.data;
    }
};