import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Grid, Alert, InputAdornment,
    CircularProgress, Box, Typography
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

// CORRECCIÓN 1: Importamos el servicio que ya funciona en otras pantallas
import { mediosService } from '../services/mediosService'; 
import { cajaService } from '../services/cajaService';

const ModalTransferencia = ({ open, onClose, onSuccess }) => {
    // Estado del formulario
    const [form, setForm] = useState({
        monto: '',
        id_medio_origen: '',
        id_medio_destino: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: ''
    });

    // Estados de UI
    const [medios, setMedios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Cargar la lista de Billeteras (Medios) usando el servicio correcto
    useEffect(() => {
        if (open) {
            const fetchMedios = async () => {
                try {
                    // CORRECCIÓN 2: Usamos el servicio en lugar de la URL "dura"
                    // Esto asegura que use la misma ruta que el resto del sistema
                    const data = await mediosService.obtenerTodos();
                    
                    // Filtramos solo los activos
                    const activos = data.filter(m => m.activo);
                    setMedios(activos);
                } catch (err) {
                    console.error("Error cargando medios", err);
                    setError("No se pudo cargar la lista de cuentas/cajas. Verifique su conexión.");
                }
            };
            fetchMedios();
            
            // Resetear formulario
            setForm({
                monto: '',
                id_medio_origen: '',
                id_medio_destino: '',
                fecha: new Date().toISOString().split('T')[0],
                descripcion: ''
            });
            setError(null);
        }
    }, [open]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        // Validaciones Frontend
        if (Number(form.monto) <= 0) {
            setError("El monto debe ser mayor a 0.");
            return;
        }
        if (form.id_medio_origen === form.id_medio_destino) {
            setError("El origen y el destino no pueden ser la misma cuenta.");
            return;
        }
        if (!form.id_medio_origen || !form.id_medio_destino) {
            setError("Seleccione ambas cuentas.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await cajaService.realizarTransferencia({
                ...form,
                monto: Number(form.monto)
            });
            // Todo salió bien
            if (onSuccess) onSuccess(); // Avisar al padre para recargar datos
            onClose(); // Cerrar modal
        } catch (err) {
            console.error(err);
            // Mostrar error detallado si viene del backend
            let msg = "Error al realizar la transferencia.";
            if (err.response && err.response.data && err.response.data.detail) {
                msg = err.response.data.detail;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f3e5f5', color: '#7b1fa2' }}>
                <SwapHorizIcon />
                <Typography variant="h6" fontWeight="bold">Transferencia de Fondos</Typography>
            </DialogTitle>
            
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    {/* ORIGEN */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Desde (Origen)"
                            name="id_medio_origen"
                            value={form.id_medio_origen}
                            onChange={handleChange}
                            fullWidth
                            helperText="¿De dónde sale el dinero?"
                        >
                            {medios.map((m) => (
                                <MenuItem key={m.id_medio_ingreso} value={m.id_medio_ingreso}>
                                    {m.nombre} ({m.tipo})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* DESTINO */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Hacia (Destino)"
                            name="id_medio_destino"
                            value={form.id_medio_destino}
                            onChange={handleChange}
                            fullWidth
                            helperText="¿Dónde entra el dinero?"
                        >
                            {medios.map((m) => (
                                <MenuItem 
                                    key={m.id_medio_ingreso} 
                                    value={m.id_medio_ingreso}
                                    disabled={m.id_medio_ingreso === form.id_medio_origen} // Deshabilitar si es el mismo
                                >
                                    {m.nombre}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* MONTO */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Monto a Transferir"
                            name="monto"
                            type="number"
                            value={form.monto}
                            onChange={handleChange}
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><AttachMoneyIcon/></InputAdornment>,
                            }}
                        />
                    </Grid>

                    {/* FECHA */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Fecha"
                            name="fecha"
                            type="date"
                            value={form.fecha}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* DESCRIPCIÓN */}
                    <Grid item xs={12}>
                        <TextField
                            label="Descripción / Motivo"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Ej: Reposición de caja chica para gastos de limpieza"
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="secondary" // Color morado para distinguir de cobros
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SwapHorizIcon />}
                >
                    {loading ? "Procesando..." : "Transferir"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalTransferencia;