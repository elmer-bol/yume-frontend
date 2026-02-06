import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    FormControlLabel, Switch, Chip, Snackbar, Alert, Box, Tooltip, Autocomplete,
    CircularProgress
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // Icono de estructura

// Servicios
import { tipoEgresoService } from '../services/tipoEgresoService';
import { categoriasService } from '../services/categoriasService'; 

const AdminTipoEgreso = () => {
    // --- ESTADOS ---
    const [lista, setLista] = useState([]);
    const [rubros, setRubros] = useState([]); // Lista para el Dropdown
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    
    // Formulario
    const [form, setForm] = useState({
        id_tipo_egreso: null,
        nombre: '',
        requiere_num_doc: false,
        id_catalogo: null, // VINCULACIÓN CONTABLE
        activo: true
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

    // --- CARGA INICIAL ---
    useEffect(() => {
        cargarDatos();
        cargarRubros(); // Carga las opciones del combo
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await tipoEgresoService.obtenerTodos();
            // Ordenamos: Activos primero, luego por nombre
            const ordenada = data.sort((a, b) => {
                if (a.activo === b.activo) return a.nombre.localeCompare(b.nombre);
                return b.activo - a.activo;
            });
            setLista(ordenada);
        } catch (error) {
            console.error("Error cargando tipos:", error);
            mostrarMensaje("Error al cargar la lista de grupos", "error");
        } finally {
            setLoading(false);
        }
    };

    const cargarRubros = async () => {
        try {
            // Llama al endpoint filtrado: ?tipo=EGRESO&es_rubro=true
            const data = await categoriasService.obtenerRubrosEgresos();
            // Ordenar por código (5.1, 5.2...)
            setRubros(data.sort((a, b) => a.codigo.localeCompare(b.codigo)));
        } catch (error) {
            console.error("Error cargando rubros contables:", error);
            mostrarMensaje("No se pudo cargar el catálogo contable", "warning");
        }
    };

    const mostrarMensaje = (texto, tipo) => setMensaje({ open: true, text: texto, type: tipo });

    // --- MODAL ---
    const handleOpen = (item = null) => {
        if (item) {
            // Edición: Recuperamos datos. 
            // OJO: item.rubro_contable viene del backend gracias al Schema nuevo
            const idCat = item.id_catalogo || (item.rubro_contable ? item.rubro_contable.id_catalogo : null);
            
            setForm({
                id_tipo_egreso: item.id_tipo_egreso,
                nombre: item.nombre,
                requiere_num_doc: item.requiere_num_doc,
                id_catalogo: idCat,
                activo: item.activo
            }); 
        } else {
            // Creación
            setForm({ 
                id_tipo_egreso: null, 
                nombre: '', 
                requiere_num_doc: false, 
                id_catalogo: null, 
                activo: true 
            }); 
        }
        setOpenModal(true);
    };

    const handleClose = () => setOpenModal(false);

    // --- GUARDAR ---
    const handleGuardar = async () => {
        // Validaciones Frontend
        if (!form.nombre.trim()) return mostrarMensaje("El nombre del grupo es obligatorio", "warning");
        if (!form.id_catalogo) return mostrarMensaje("Debes seleccionar un Rubro Contable", "warning");

        try {
            const datosParaEnviar = {
                nombre: form.nombre,
                requiere_num_doc: form.requiere_num_doc,
                id_catalogo: form.id_catalogo, // Enviamos el ID del rubro
                activo: form.activo
            };

            if (form.id_tipo_egreso) {
                await tipoEgresoService.actualizar(form.id_tipo_egreso, datosParaEnviar);
                mostrarMensaje("Grupo actualizado correctamente", "success");
            } else {
                await tipoEgresoService.crear(datosParaEnviar);
                mostrarMensaje("Grupo creado correctamente", "success");
            }
            handleClose();
            cargarDatos();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail 
                        ? JSON.stringify(error.response.data.detail) 
                        : "Error al guardar";
            mostrarMensaje(msg, "error");
        }
    };

    // --- CAMBIAR ESTADO ---
    const handleToggleEstado = async (item) => {
        try {
            if (item.activo) {
                if (!window.confirm(`¿Desactivar grupo "${item.nombre}"?`)) return;
                await tipoEgresoService.eliminar(item.id_tipo_egreso); 
                mostrarMensaje("Grupo desactivado", "info");
            } else {
                await tipoEgresoService.activar(item.id_tipo_egreso);
                mostrarMensaje("Grupo reactivado", "success");
            }
            cargarDatos();
        } catch (error) {
            mostrarMensaje("Error al cambiar estado", "error");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* TITULO */}
            <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff3e0' }}>
                <Box display="flex" alignItems="center">
                    <FolderOpenIcon sx={{ fontSize: 40, mr: 2, color: '#ed6c02' }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="#e65100">
                            Grupos de Gasto
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Clasificación visual vinculada a la Contabilidad
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="contained" 
                    color="warning" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleOpen()}
                >
                    Nuevo Grupo
                </Button>
            </Paper>

            {/* TABLA DE DATOS */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#eeeeee' }}>
                            <TableCell>Nombre Visual (Carpeta)</TableCell>
                            <TableCell>Rubro Contable (Vinculado)</TableCell>
                            <TableCell align="center">Reglas</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <CircularProgress color="warning" />
                                </TableCell>
                            </TableRow>
                        ) : lista.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No hay grupos registrados.</TableCell>
                            </TableRow>
                        ) : (
                            lista.map((row) => (
                                <TableRow key={row.id_tipo_egreso} hover sx={{ opacity: row.activo ? 1 : 0.6 }}>
                                    {/* COLUMNA 1: Nombre Visual */}
                                    <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre}</TableCell>
                                    
                                    {/* COLUMNA 2: Rubro Contable (Chip Inteligente) */}
                                    <TableCell>
                                        {row.rubro_contable ? (
                                            <Chip 
                                                icon={<AccountTreeIcon />}
                                                label={`${row.rubro_contable.codigo} - ${row.rubro_contable.nombre_cuenta}`} 
                                                size="small" 
                                                variant="outlined"
                                                color="default"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        ) : (
                                            <Chip label="Sin Vínculo" color="error" size="small" />
                                        )}
                                    </TableCell>

                                    {/* COLUMNA 3: Reglas de Negocio */}
                                    <TableCell align="center">
                                        {row.requiere_num_doc && (
                                            <Tooltip title="Exige Nro. de Factura/Recibo obligatoriamente">
                                                <Chip label="Doc. Obligatorio" size="small" color="info" />
                                            </Tooltip>
                                        )}
                                        {!row.requiere_num_doc && <Typography variant="caption" color="text.secondary">Opcional</Typography>}
                                    </TableCell>

                                    {/* COLUMNA 4: Botones */}
                                    <TableCell align="center">
                                        <Tooltip title="Editar">
                                            <IconButton color="primary" onClick={() => handleOpen(row)} disabled={!row.activo}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={row.activo ? "Desactivar" : "Reactivar"}>
                                            <IconButton 
                                                color={row.activo ? "error" : "success"} 
                                                onClick={() => handleToggleEstado(row)}
                                            >
                                                {row.activo ? <DeleteIcon /> : <RestoreFromTrashIcon />}
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL DE EDICIÓN/CREACIÓN */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#ed6c02', color: 'white' }}>
                    {form.id_tipo_egreso ? "Editar Grupo" : "Nuevo Grupo"}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        {/* 1. Nombre Visual */}
                        <TextField
                            autoFocus
                            label="Nombre del Grupo (Visual)"
                            fullWidth
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej: Gastos de Mantenimiento"
                            helperText="Así lo verá el cajero en la pantalla de gastos."
                        />

                        {/* 2. Selector de Rubro Contable (AUTOCOMPLETE) */}
                        <Autocomplete
                            options={rubros}
                            // Qué mostramos en la lista: "5.2.1.00 - Servicios Básicos"
                            getOptionLabel={(option) => `${option.codigo} - ${option.nombre_cuenta}`}
                            // Cómo sabemos cuál está seleccionado comparando IDs
                            isOptionEqualToValue={(option, value) => option.id_catalogo === value.id_catalogo}
                            
                            // Valor actual (buscamos el objeto completo en la lista 'rubros' usando el ID del form)
                            value={rubros.find(r => r.id_catalogo === form.id_catalogo) || null}
                            
                            onChange={(event, newValue) => {
                                setForm({ ...form, id_catalogo: newValue ? newValue.id_catalogo : null });
                            }}
                            
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Vincular a Rubro Contable" 
                                    helperText="Selecciona la carpeta contable (5.X) donde se imputarán estos gastos."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <AccountTreeIcon color="action" sx={{ mr: 1 }} />
                                                {params.InputProps.startAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                        />

                        {/* 3. Switch de Regla de Negocio */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffde7', borderColor: '#ffcc80' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.requiere_num_doc}
                                        onChange={(e) => setForm({ ...form, requiere_num_doc: e.target.checked })}
                                        color="warning"
                                    />
                                }
                                label={<Typography fontWeight="bold">Exige Documento Físico</Typography>}
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                Si activas esto, el sistema no dejará guardar el gasto sin un número de factura o recibo.
                            </Typography>
                        </Paper>

                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="warning">
                        Guardar Configuración
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={mensaje.open} autoHideDuration={3000} onClose={() => setMensaje({ ...mensaje, open: false })}>
                <Alert severity={mensaje.type} sx={{ width: '100%' }}>{mensaje.text}</Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminTipoEgreso;