import React, { useState, useEffect } from 'react';
import { 
    Container, Grid, Paper, Typography, TextField, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    IconButton, Switch, FormControlLabel, Chip, Alert, Snackbar, MenuItem,
    InputAdornment
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Icono de Ingreso

import { conceptosService } from '../services/conceptosService';
import { categoriasService } from '../services/categoriasService'; // <--- USAMOS EL SERVICIO DEL CATÁLOGO

const AdminConceptos = () => {
    const [lista, setLista] = useState([]);
    const [cuentasIngreso, setCuentasIngreso] = useState([]); // Lista de cuentas 4.x.x
    const [loading, setLoading] = useState(false);
    
    // Estado del formulario
    const [form, setForm] = useState({
        id_concepto: null,
        nombre: '',
        descripcion: '',
        id_catalogo: '', // <--- CAMPO OBLIGATORIO
        activo: true
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });
    const [modoEdicion, setModoEdicion] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Cargar Conceptos y Catálogo en paralelo
            const [dataConceptos, dataCuentas] = await Promise.all([
                conceptosService.obtenerTodos(),
                categoriasService.obtenerTodas()
            ]);

            // --- FILTRO CONTABLE CLAVE ---
            // Buscamos cuentas de INGRESO (Grupo 4)
            const soloIngresos = dataCuentas.filter(c => 
                c.tipo === 'INGRESO' || c.tipo === 'Ingreso' || c.codigo.startsWith('4.')
            );
            
            // Ordenamos por código para que se vea ordenado en el dropdown
            soloIngresos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

            setLista(dataConceptos);
            setCuentasIngreso(soloIngresos); 

        } catch (error) {
            console.error("Error cargando:", error);
            mostrarMensaje("Error al cargar datos", "error");
        }
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleGuardar = async () => {
        // VALIDACIÓN
        if (!form.nombre.trim()) return mostrarMensaje("El nombre es obligatorio", "warning");
        if (!form.id_catalogo) return mostrarMensaje("⚠️ Debe asociar una Cuenta Contable de Ingreso", "warning");

        setLoading(true);
        try {
            if (modoEdicion) {
                await conceptosService.actualizar(form.id_concepto, form);
                mostrarMensaje("Concepto actualizado correctamente", "success");
            } else {
                await conceptosService.crear(form);
                mostrarMensaje("Concepto creado correctamente", "success");
            }
            limpiarForm();
            cargarDatos();
        } catch (error) {
            console.error(error);
            // Mostrar mensaje del backend si existe
            const msg = error.response?.data?.detail || "Error al guardar. Verifique si el nombre ya existe.";
            mostrarMensaje(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (item) => {
        setForm({
            id_concepto: item.id_concepto,
            nombre: item.nombre,
            descripcion: item.descripcion || '',
            id_catalogo: item.id_catalogo || '', // Cargar el valor guardado
            activo: item.activo
        });
        setModoEdicion(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Desactivar este concepto?")) return;
        try {
            await conceptosService.eliminar(id);
            mostrarMensaje("Concepto desactivado", "info");
            cargarDatos();
        } catch (error) {
            mostrarMensaje("No se pudo desactivar", "error");
        }
    };

    const limpiarForm = () => {
        setForm({ id_concepto: null, nombre: '', descripcion: '', id_catalogo: '', activo: true });
        setModoEdicion(false);
    };

    const mostrarMensaje = (text, type) => setMensaje({ open: true, text, type });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Conceptos de Cobro
            </Typography>

            <Grid container spacing={3}>
                {/* FORMULARIO */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, bgcolor: '#f5faff' }}>
                        <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <CategoryIcon sx={{ mr: 1 }} />
                            {modoEdicion ? "Editar Concepto" : "Nuevo Concepto"}
                        </Typography>
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre del Concepto"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Expensas, Multas"
                                    autoFocus
                                />
                            </Grid>
                            
                            {/* --- SELECTOR DE CUENTA CONTABLE (INGRESO) --- */}
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Cuenta Contable (Ingreso)"
                                    name="id_catalogo"
                                    value={form.id_catalogo}
                                    onChange={handleChange}
                                    helperText="¿A qué cuenta contable suma este cobro?"
                                    InputProps={{
                                        startAdornment: <MonetizationOnIcon color="action" sx={{ mr: 1 }} />,
                                    }}
                                >
                                    {cuentasIngreso.length > 0 ? (
                                        cuentasIngreso.map((c) => (
                                            <MenuItem key={c.id_catalogo} value={c.id_catalogo}>
                                                <strong>{c.codigo}</strong> - {c.nombre_cuenta}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No hay cuentas de Ingreso (Grupo 4)</MenuItem>
                                    )}
                                </TextField>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Descripción"
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={<Switch checked={form.activo} onChange={handleChange} name="activo" color="primary" />}
                                    label={form.activo ? "Activo" : "Inactivo"}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    startIcon={<SaveIcon />}
                                    onClick={handleGuardar}
                                    disabled={loading}
                                >
                                    {loading ? "Guardando..." : "Guardar"}
                                </Button>
                                {modoEdicion && (
                                    <Button variant="outlined" color="secondary" onClick={limpiarForm}>
                                        Cancelar
                                    </Button>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* LISTA */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#eeeeee' }}>
                                        <TableCell>Nombre</TableCell>
                                        <TableCell>Cuenta Contable</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lista.map((item) => (
                                        <TableRow key={item.id_concepto}>
                                            <TableCell>
                                                <Typography fontWeight="bold">{item.nombre}</Typography>
                                                <Typography variant="caption" color="textSecondary">{item.descripcion}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.nombre_cuenta ? (
                                                    <Chip 
                                                        icon={<MonetizationOnIcon />}
                                                        label={item.nombre_cuenta} 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="success"
                                                    />
                                                ) : (
                                                    <Chip label="Sin Asignar" size="small" color="warning"/>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={item.activo ? "Activo" : "Inactivo"} 
                                                    color={item.activo ? "success" : "default"} 
                                                    size="small" 
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton color="primary" size="small" onClick={() => handleEditar(item)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton color="error" size="small" onClick={() => handleEliminar(item.id_concepto)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {lista.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">No hay conceptos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar open={mensaje.open} autoHideDuration={4000} onClose={() => setMensaje({ ...mensaje, open: false })}>
                <Alert severity={mensaje.type} sx={{ width: '100%' }}>
                    {mensaje.text}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminConceptos;