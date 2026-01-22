import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Grid, Alert 
} from '@mui/material';

// Servicios
import facturablesService from '../services/facturablesService';
import unidadesService from '../services/unidadesService';
import personasService from '../services/personasService';
import conceptosService from '../services/conceptosService';

const ModalGenerarHistorial = ({ open, onClose, onSuccess }) => {
    // Estados para los dropdowns
    const [unidades, setUnidades] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [conceptos, setConceptos] = useState([]);

    // Estado del Formulario
    const [form, setForm] = useState({
        id_unidad: '',
        id_persona: '',
        id_concepto: '',
        periodo_inicio: '2025-01', // Valor por defecto útil para tu migración
        cantidad_meses: 1
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Cargar listas al abrir
    useEffect(() => {
        if (open) {
            const cargarDatos = async () => {
                try {
                    const u = await unidadesService.getAll();
                    const p = await personasService.getAll();
                    const c = await conceptosService.getAll();
                    setUnidades(u);
                    setPersonas(p);
                    setConceptos(c);
                } catch (error) {
                    console.error("Error cargando listas", error);
                }
            };
            cargarDatos();
        }
    }, [open]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const resultado = await facturablesService.generarPorContrato(form);
            setMsg({ type: 'success', text: resultado.mensaje });
            // Esperar 2 segundos y cerrar
            setTimeout(() => {
                onSuccess(); // Recargar la tabla padre
                onClose();
                setMsg(null);
            }, 1500);
        } catch (error) {
            setMsg({ type: 'error', text: 'Error al generar. Verifique que exista contrato activo.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>⏳ Generar Historial / Retroactivo</DialogTitle>
            <DialogContent>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Utilice esta herramienta para cargar deudas pasadas (Ene, Feb, Mar) 
                    de un solo golpe para un inquilino específico.
                </p>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

                <Grid container spacing={2}>
                    {/* UNIDAD */}
                    <Grid item xs={6}>
                        <TextField
                            select label="Unidad" fullWidth
                            name="id_unidad" value={form.id_unidad} onChange={handleChange}
                        >
                            {unidades.map((u) => (
                                <MenuItem key={u.id_unidad} value={u.id_unidad}>
                                    {u.identificador_unico}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* PERSONA */}
                    <Grid item xs={6}>
                        <TextField
                            select label="Responsable" fullWidth
                            name="id_persona" value={form.id_persona} onChange={handleChange}
                        >
                            {personas.map((p) => (
                                <MenuItem key={p.id_persona} value={p.id_persona}>
                                    {p.nombres} {p.apellidos}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* CONCEPTO */}
                    <Grid item xs={12}>
                        <TextField
                            select label="Concepto (Ej: Expensa)" fullWidth
                            name="id_concepto" value={form.id_concepto} onChange={handleChange}
                        >
                            {conceptos.map((c) => (
                                <MenuItem key={c.id_concepto} value={c.id_concepto}>
                                    {c.nombre}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* FECHA INICIO */}
                    <Grid item xs={6}>
                        <TextField
                            label="Periodo Inicio (YYYY-MM)" fullWidth
                            name="periodo_inicio" value={form.periodo_inicio} onChange={handleChange}
                            helperText="Ej: 2025-01 para Enero"
                        />
                    </Grid>

                    {/* CANTIDAD MESES */}
                    <Grid item xs={6}>
                        <TextField
                            type="number" label="Cant. Meses" fullWidth
                            name="cantidad_meses" value={form.cantidad_meses} onChange={handleChange}
                            inputProps={{ min: 1, max: 24 }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? "Procesando..." : "Generar Bloque"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalGenerarHistorial;