import api from '../api/axiosConfig';

export const itemFacturableService = {
    // Obtener deuda pendiente por Unidad
    // (Actualizado para usar el endpoint directo GET /facturables/{id_unidad})
    obtenerDeudaPendiente: async (idUnidad) => {
        try {
            if (!idUnidad) return [];

            // 1. Llamada directa al Backend con el ID de la Unidad
            // El backend ahora filtra y nos da solo lo que corresponde a este inquilino.
            const response = await api.get(`/facturables/${idUnidad}`);
            
            // Verificamos que sea un array (por seguridad, si el backend devuelve un solo objeto o null)
            const items = Array.isArray(response.data) ? response.data : [];

            // 2. Filtro final de seguridad en Cliente:
            // Aunque el backend filtre por unidad, nos aseguramos visualmente de:
            // - Que tenga saldo pendiente real (> 0.01)
            // - Que no sea una deuda anulada (si es que el backend te las manda)
            return items.filter(item => 
                parseFloat(item.saldo_pendiente) > 0.01 && 
                item.estado !== 'anulado'
            );

        } catch (error) {
            console.error(`Error obteniendo deudas para unidad ${idUnidad}:`, error);
            
            // Si es un error 404, significa "No se encontraron deudas", devolvemos array vacío
            if (error.response && error.response.status === 404) {
                return [];
            }
            
            return [];
        }
    }
};