import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Paper, Typography, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Alert, Snackbar, Box, Chip, Divider, Card, CardContent
} from '@mui/material';

import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Icono Banco
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';

import { depositosService } from '../services/depositosService';

const Depositos = () => {
    // --- ESTADOS ---
    const [pendientes, setPendientes] = useState([]); // Lista de la izquierda
    const [historial, setHistorial] = useState([]);   // Lista de abajo
    const [seleccionados, setSeleccionados] = useState([]); // IDs marcados
    const [loading, setLoading] = useState(false);

    // Formulario (Coincide con DepositoCreate)
    const [formulario, setFormulario] = useState({
        banco: '',
        cuenta_destino: '',
        num_referencia: '',
        fecha: new Date().toISOString().split('T')[0], // Hoy
        monto: 0 // Se calcula solo
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

    // --- CARGA INICIAL ---
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const dataPendientes = await depositosService.obtenerPendientes();
            setPendientes(dataPendientes);

            const dataHistorial = await depositosService.obtenerHistorial();
            setHistorial(dataHistorial);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    // --- LÓGICA DE SUMA AUTOMÁTICA (EL SECRETO) ---
    // Cada vez que marcas/desmarcas algo, recalculamos el total para evitar el Error 400
    useEffect(() => {
        const totalCalculado = pendientes
            .filter(p => seleccionados.includes(p.id_transaccion))
            .reduce((sum, item) => sum + item.monto_total, 0);
        
        setFormulario(prev => ({
            ...prev,
            monto: parseFloat(totalCalculado.toFixed(2)) // Redondeo a 2 decimales para el backend
        }));
    }, [seleccionados, pendientes]);


    // --- MANEJADORES ---
    const handleToggle = (id) => {
        const currentIndex = seleccionados.indexOf(id);
        const newChecked = [...seleccionados];

        if (currentIndex === -1) {
            newChecked.push(id);
        } else {
            newChecked.splice(currentIndex, 1);
        }
        setSeleccionados(newChecked);
    };

    const handleChange = (e) => {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    };

    const handleDepositar = async () => {
        // Validaciones Frontend
        if (seleccionados.length === 0) return alert("Seleccione al menos un recibo para depositar.");
        if (!formulario.banco) return alert("Ingrese el nombre del Banco.");
        if (!formulario.num_referencia) return alert("Ingrese el número de comprobante.");

        setLoading(true);
        try {
            // Preparamos el payload exacto para DepositoCreate (Schema)
            const payload = {
                fecha: formulario.fecha,
                monto: formulario.monto,
                num_referencia: formulario.num_referencia,
                banco: formulario.banco,
                cuenta_destino: formulario.cuenta_destino || "Principal",
                id_administrador: 1, // ⚠️ OJO: Hardcodeado por ahora (igual que en Caja)
                transacciones_ids: seleccionados // <--- La lista de IDs
            };

            console.log("📤 Enviando Depósito:", payload);

            await depositosService.crearDeposito(payload);

            setMensaje({ open: true, text: "Depósito registrado y caja cuadrada correctamente. 🔒", type: "success" });
            
            // Limpieza
            setSeleccionados([]);
            setFormulario({ ...formulario, num_referencia: '', banco: '' });
            cargarDatos(); // Recargar tablas

        } catch (error) {
            console.error(error);
            // Captura de errores del Backend (incluyendo el de Cuadre)
            let msg = "Error al registrar depósito";
            if (error.response && error.response.data && error.response.data.detail) {
                msg = error.response.data.detail;
            }
            alert("🛑 " + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#2e7d32' }}>
                Registro de Depósitos (Cierre de Caja)
            </Typography>

            <Grid container spacing={3} alignItems="flex-start">
                
                {/* -----------------------------------------------------------
                    IZQUIERDA: CAJA PENDIENTE (LO QUE QUEMA EN LAS MANOS)
                   ----------------------------------------------------------- */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                <AttachMoneyIcon sx={{ verticalAlign: 'middle', color: 'orange' }}/> Efectivo en Mano
                            </Typography>
                            <Chip 
                                label={`${seleccionados.length} recibos seleccionados`} 
                                color={seleccionados.length > 0 ? "primary" : "default"} 
                            />
                        </Box>
                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox"></TableCell>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Fecha Recibo</TableCell>
                                        <TableCell>Pagador</TableCell>
                                        <TableCell align="right">Monto</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendientes.map((row) => {
                                        const isSelected = seleccionados.indexOf(row.id_transaccion) !== -1;
                                        return (
                                            <TableRow 
                                                key={row.id_transaccion} 
                                                hover 
                                                onClick={() => handleToggle(row.id_transaccion)} 
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                selected={isSelected}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox checked={isSelected} />
                                                </TableCell>
                                                <TableCell>#{row.id_transaccion}</TableCell>
                                                <TableCell>{row.fecha}</TableCell>
                                                <TableCell>{row.nombre_pagador}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {row.monto_total}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {pendientes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                ¡Todo limpio! No tienes efectivo pendiente de depósito. ✅
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* -----------------------------------------------------------
                    DERECHA: FORMULARIO DE DEPÓSITO (VOUCHER)
                   ----------------------------------------------------------- */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #c8e6c9', position: 'sticky', top: 20 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="success.main">
                                <AccountBalanceIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> 
                                Datos del Voucher
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Selecciona los recibos de la izquierda que vas a depositar. El monto se calculará automáticamente.
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Monto Total a Depositar"
                                        value={formulario.monto}
                                        // 🔒 ESTO ES CLAVE: ReadOnly para evitar errores de cuadre manuales
                                        InputProps={{ 
                                            readOnly: true,
                                            startAdornment: <Typography sx={{ mr: 1, fontWeight: 'bold' }}>Bs</Typography>
                                        }}
                                        variant="filled"
                                        helperText="Suma automática de recibos seleccionados"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Banco Destino"
                                        name="banco"
                                        value={formulario.banco}
                                        onChange={handleChange}
                                        placeholder="Ej: Banco Bisa"
                                        margin="dense"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Nro. Cuenta"
                                        name="cuenta_destino"
                                        value={formulario.cuenta_destino}
                                        onChange={handleChange}
                                        placeholder="Opcional"
                                        margin="dense"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Nro. Comprobante / Voucher"
                                        name="num_referencia"
                                        value={formulario.num_referencia}
                                        onChange={handleChange}
                                        margin="dense"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha Depósito"
                                        name="fecha"
                                        value={formulario.fecha}
                                        onChange={handleChange}
                                        margin="dense"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        color="success" 
                                        size="large"
                                        startIcon={<SaveIcon />}
                                        onClick={handleDepositar}
                                        disabled={loading || seleccionados.length === 0}
                                        sx={{ mt: 1 }}
                                    >
                                        {loading ? "Procesando..." : "REGISTRAR DEPÓSITO"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* -----------------------------------------------------------
                    ABAJO: HISTORIAL DE DEPÓSITOS
                   ----------------------------------------------------------- */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> 
                            Historial de Cierres de Caja
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell>ID Depósito</TableCell>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Banco</TableCell>
                                        <TableCell>Referencia</TableCell>
                                        <TableCell align="right">Monto Depositado</TableCell>
                                        <TableCell align="center">Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historial.map((h) => (
                                        <TableRow key={h.id_deposito} hover>
                                            <TableCell>#{h.id_deposito}</TableCell>
                                            <TableCell>{h.fecha}</TableCell>
                                            <TableCell>{h.banco} {h.cuenta_destino ? `(${h.cuenta_destino})` : ''}</TableCell>
                                            <TableCell>{h.num_referencia}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'green' }}>
                                                Bs {h.monto}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={h.estado} size="small" color="success" variant="outlined" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {historial.length === 0 && (
                                        <TableRow><TableCell colSpan={6} align="center">No hay historial.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

            </Grid>

            <Snackbar open={mensaje.open} autoHideDuration={6000} onClose={() => setMensaje({...mensaje, open: false})}>
                <Alert severity={mensaje.type}>{mensaje.text}</Alert>
            </Snackbar>
        </Container>
    );
};

export default Depositos;