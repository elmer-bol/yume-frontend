import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Paper, Typography, TextField, Button,
    MenuItem, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Chip, Alert, Snackbar, Box, IconButton,
    InputAdornment
} from '@mui/material';

import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';

import { egresosService } from '../services/egresosService';

const Egresos = () => {
    // --- ESTADOS ---
    const [lista, setLista] = useState([]);
    const [cuentas, setCuentas] = useState([]);     // Datos de tabla 'catalogo'
    const [tiposDoc, setTiposDoc] = useState([]);   // Datos de tabla 'tipo_egreso'
    const [loading, setLoading] = useState(false);

    // Formulario
    const [form, setForm] = useState({
        id_tipo_egreso: '',
        id_catalogo: '',
        beneficiario: '',
        num_comprobante: '',
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

    // --- CARGA INICIAL ---
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            const [dataEgresos, dataCuentas, dataTipos] = await Promise.all([
                egresosService.obtenerTodos(),
                egresosService.obtenerCuentasGasto(),
                egresosService.obtenerTiposDocumento()
            ]);

            setLista(dataEgresos);
            setCuentas(dataCuentas);   // Solo vendrán los de tipo 'Egreso'
            setTiposDoc(dataTipos);    // Vendrán 'Cheque', 'Transferencia', etc.

        } catch (error) {
            console.error("Error inicializando:", error);
            mostrarMensaje("Error al cargar listados", "error");
        }
    };

    const recargarLista = async () => {
        const data = await egresosService.obtenerTodos();
        setLista(data);
    };

    const mostrarMensaje = (texto, type = 'success') => {
        setMensaje({ open: true, text: texto, type });
    };

    // --- MANEJADORES ---
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        // Validaciones
        if (!form.id_catalogo) return mostrarMensaje("Seleccione una Cuenta Contable", "warning");
        if (!form.id_tipo_egreso) return mostrarMensaje("Seleccione el Tipo de Egreso", "warning");
        if (!form.beneficiario) return mostrarMensaje("Falta el Beneficiario", "warning");
        if (!form.monto || parseFloat(form.monto) <= 0) return mostrarMensaje("El monto debe ser positivo", "warning");

        setLoading(true);
        try {
            const payload = {
                ...form,
                monto: parseFloat(form.monto),
                id_administrador: 1 
            };

            await egresosService.crear(payload);
            
            mostrarMensaje("Gasto registrado correctamente", "success");
            
            // Limpiar formulario
            setForm({
                ...form,
                beneficiario: '',
                num_comprobante: '',
                descripcion: '',
                monto: ''
            });
            
            recargarLista();

        } catch (error) {
            console.error(error);
            let msg = "Error al guardar";
            if (error.response?.data?.detail) {
                msg = error.response.data.detail;
            }
            mostrarMensaje(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async (id) => {
        if (!window.confirm("¿Seguro de anular este gasto?")) return;
        try {
            await egresosService.anular(id);
            mostrarMensaje("Gasto anulado", "success");
            recargarLista();
        } catch (error) {
            mostrarMensaje("No se pudo anular", "error");
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#d32f2f' }}>
                Registro de Gastos
            </Typography>

            <Grid container spacing={3} alignItems="flex-start">
                
                {/* 1. FORMULARIO */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}> 
                        <Typography variant="h6" gutterBottom color="error">
                            <MoneyOffIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> 
                            Nueva Salida
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {/* --- COMBO CUENTA CONTABLE --- */}
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Cuenta Contable (Rubro)"
                                    name="id_catalogo"
                                    value={form.id_catalogo}
                                    onChange={handleChange}
                                    helperText="Seleccione el concepto del gasto"
                                >
                                    {cuentas.map((c) => (
                                        <MenuItem key={c.id_catalogo} value={c.id_catalogo}>
                                            {/* Aquí usamos el nombre exacto de tu tabla Catalogo */}
                                            {c.nombre_cuenta} 
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* --- COMBO TIPO EGRESO --- */}
                            <Grid item xs={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Forma de Pago"
                                    name="id_tipo_egreso"
                                    value={form.id_tipo_egreso}
                                    onChange={handleChange}
                                >
                                    {tiposDoc.map((t) => (
                                        <MenuItem key={t.id_tipo_egreso} value={t.id_tipo_egreso}>
                                            {/* Aquí usamos el nombre exacto de tu tabla TipoEgreso */}
                                            {t.nombre}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Fecha"
                                    name="fecha"
                                    value={form.fecha}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Beneficiario"
                                    name="beneficiario"
                                    value={form.beneficiario}
                                    onChange={handleChange}
                                    placeholder="Ej: EPSAS, Ferretería Juan"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nro. Factura / Recibo / Cheque"
                                    name="num_comprobante"
                                    value={form.num_comprobante}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Monto Total"
                                    name="monto"
                                    value={form.monto}
                                    onChange={handleChange}
                                    InputProps={{ 
                                        startAdornment: <InputAdornment position="start">Bs</InputAdornment>,
                                        style: { fontSize: '1.2rem', fontWeight: 'bold', color: '#d32f2f' }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Descripción / Detalle"
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    color="error" 
                                    size="large"
                                    startIcon={<SaveIcon />}
                                    onClick={handleGuardar}
                                    disabled={loading}
                                >
                                    {loading ? "Registrando..." : "REGISTRAR GASTO"}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* 2. HISTORIAL */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> 
                            Historial de Egresos
                        </Typography>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Cuenta / Tipo</TableCell>
                                        <TableCell>Beneficiario</TableCell>
                                        <TableCell>Doc.</TableCell>
                                        <TableCell align="right">Monto</TableCell>
                                        <TableCell align="center">Estado</TableCell>
                                        <TableCell align="center">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lista.map((row) => {
                                        const isAnulado = row.estado === 'cancelado';
                                        return (
                                            <TableRow 
                                                key={row.id_egreso} 
                                                hover
                                                sx={{ opacity: isAnulado ? 0.5 : 1, bgcolor: isAnulado ? '#f5f5f5' : 'inherit' }}
                                            >
                                                <TableCell>{row.fecha}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {row.nombre_cuenta}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {row.tipo_egreso}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{row.beneficiario}</TableCell>
                                                <TableCell>{row.num_comprobante || '-'}</TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold', textDecoration: isAnulado ? 'line-through' : 'none' }}>
                                                    Bs {parseFloat(row.monto).toFixed(2)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={row.estado} 
                                                        size="small" 
                                                        color={isAnulado ? "default" : "success"} 
                                                        variant="outlined" 
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {!isAnulado && (
                                                        <IconButton 
                                                            size="small" 
                                                            color="error" 
                                                            onClick={() => handleAnular(row.id_egreso)}
                                                            title="Anular Gasto"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {lista.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No hay gastos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

            </Grid>

            <Snackbar open={mensaje.open} autoHideDuration={4000} onClose={() => setMensaje({...mensaje, open: false})}>
                <Alert severity={mensaje.type}>{mensaje.text}</Alert>
            </Snackbar>
        </Container>
    );
};

export default Egresos;