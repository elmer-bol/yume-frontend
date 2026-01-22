import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    FormControlLabel, Switch, Chip, Snackbar, Alert, Box
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';

import { tipoEgresoService } from '../services/tipoEgresoService';

const AdminTipoEgreso = () => {
    // --- ESTADOS ---
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    
    // Estado del Formulario
    const [form, setForm] = useState({
        id_tipo_egreso: null,
        nombre: '',
        requiere_num_doc: false,
        activo: true
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

    // --- CARGA DE DATOS ---
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await tipoEgresoService.obtenerTodos();
            // Ordenamos: Activos primero
            setLista(data.sort((a, b) => Number(b.activo) - Number(a.activo)));
        } catch (error) {
            console.error("Error cargando tipos:", error);
            mostrarMensaje("Error al cargar la lista", "error");
        } finally {
            setLoading(false);
        }
    };

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ open: true, text: texto, type: tipo });
    };

    // --- MANEJO DEL MODAL ---
    const handleOpen = (item = null) => {
        if (item) {
            setForm(item); // Modo Edición
        } else {
            setForm({ id_tipo_egreso: null, nombre: '', requiere_num_doc: false, activo: true }); // Modo Creación
        }
        setOpenModal(true);
    };

    const handleClose = () => setOpenModal(false);

    // --- GUARDAR ---
    const handleGuardar = async () => {
        if (!form.nombre.trim()) return mostrarMensaje("El nombre es obligatorio", "warning");

        try {
            if (form.id_tipo_egreso) {
                // Actualizar
                await tipoEgresoService.actualizar(form.id_tipo_egreso, {
                    nombre: form.nombre,
                    requiere_num_doc: form.requiere_num_doc
                });
                mostrarMensaje("Actualizado correctamente", "success");
            } else {
                // Crear
                await tipoEgresoService.crear({
                    nombre: form.nombre,
                    requiere_num_doc: form.requiere_num_doc
                });
                mostrarMensaje("Creado correctamente", "success");
            }
            handleClose();
            cargarDatos();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || "Error al guardar";
            mostrarMensaje(msg, "error");
        }
    };

    // --- ELIMINAR / ACTIVAR ---
    const handleToggleEstado = async (item) => {
        try {
            if (item.activo) {
                if (!window.confirm(`¿Desactivar "${item.nombre}"?`)) return;
                await tipoEgresoService.eliminar(item.id_tipo_egreso);
                mostrarMensaje("Desactivado correctamente", "warning");
            } else {
                await tipoEgresoService.activar(item.id_tipo_egreso);
                mostrarMensaje("Reactivado correctamente", "success");
            }
            cargarDatos();
        } catch (error) {
            mostrarMensaje("Error al cambiar estado", "error");
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* ENCABEZADO */}
            <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff3e0' }}>
                <Box display="flex" alignItems="center">
                    <CategoryIcon sx={{ fontSize: 40, mr: 2, color: '#ed6c02' }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="#e65100">
                            Tipos de Egreso
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Clasificación de gastos (Ej: Caja Chica, Cheques)
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="contained" 
                    color="warning" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleOpen()}
                >
                    Nuevo Tipo
                </Button>
            </Paper>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#eeeeee' }}>
                            <TableCell>ID</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell align="center">Regla de Negocio</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lista.map((row) => (
                            <TableRow key={row.id_tipo_egreso} hover sx={{ opacity: row.activo ? 1 : 0.5 }}>
                                <TableCell>{row.id_tipo_egreso}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre}</TableCell>
                                <TableCell align="center">
                                    {row.requiere_num_doc ? (
                                        <Chip 
                                            icon={<ReceiptLongIcon />} 
                                            label="Exige Nro. Recibo" 
                                            size="small" 
                                            color="primary" 
                                            variant="outlined" 
                                        />
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">Opcional</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.activo ? "Activo" : "Inactivo"} 
                                        color={row.activo ? "success" : "default"} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton color="primary" onClick={() => handleOpen(row)} disabled={!row.activo}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton 
                                        color={row.activo ? "error" : "success"} 
                                        onClick={() => handleToggleEstado(row)}
                                    >
                                        {row.activo ? <DeleteIcon /> : <RestoreFromTrashIcon />}
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {lista.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No hay tipos registrados.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL CREAR / EDITAR */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{form.id_tipo_egreso ? "Editar Tipo" : "Nuevo Tipo de Egreso"}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            autoFocus
                            label="Nombre del Tipo"
                            fullWidth
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej: Transferencia Bancaria"
                        />
                        
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.requiere_num_doc}
                                        onChange={(e) => setForm({ ...form, requiere_num_doc: e.target.checked })}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body1" fontWeight="bold">¿Exige Nro. Documento?</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Si se activa, no se podrá guardar un gasto de este tipo sin escribir un número de cheque o voucher.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="warning">Guardar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={mensaje.open} autoHideDuration={4000} onClose={() => setMensaje({ ...mensaje, open: false })}>
                <Alert severity={mensaje.type}>{mensaje.text}</Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminTipoEgreso;