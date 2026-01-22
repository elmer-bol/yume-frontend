import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControlLabel, Switch, Tooltip,
    DialogContentText, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // Icono de Estructura/Cuentas
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { categoriasService } from '../services/categoriasService';

const AdminCategorias = () => {
    // --- ESTADOS ---
    const [categorias, setCategorias] = useState([]);
    
    // Modal Crear/Editar
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    // Modal Confirmación Borrado
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

    // Formulario (Mapeado a tu JSON)
    const [formulario, setFormulario] = useState({
        nombre_cuenta: '',
        tipo: 'Ingreso', // Valor por defecto
        activo: true
    });

    // --- CARGA DE DATOS ---
    const cargarCategorias = async () => {
        try {
            const data = await categoriasService.obtenerTodas();
            setCategorias(data);
        } catch (error) {
            console.error("Error cargando categorías", error);
        }
    };

    useEffect(() => { cargarCategorias(); }, []);

    // --- MANEJADORES ---
    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormulario({ 
            ...formulario, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleGuardar = async () => {
        try {
            if (modoEdicion) {
                await categoriasService.actualizarCategoria(idEdicion, formulario);
            } else {
                await categoriasService.crearCategoria(formulario);
            }
            setOpenModal(false);
            cargarCategorias();
        } catch (error) {
            alert("Error al guardar la cuenta contable.");
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        // Asumimos que el ID viene como 'id_categoria' o similar. Ajusta si es diferente.
        setIdEdicion(row.id_catalogo || row.id); 
        setFormulario({
            nombre_cuenta: row.nombre_cuenta,
            tipo: row.tipo,
            activo: row.activo
        });
        setOpenModal(true);
    };

    // Lógica de Borrado Seguro
    const handleClickEliminar = (row) => {
        setCategoriaAEliminar(row);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (categoriaAEliminar) {
                // Usamos el ID correcto
                const id = categoriaAEliminar.id_catalogo || categoriaAEliminar.id;
                await categoriasService.eliminarCategoria(id);
                cargarCategorias();
            }
            setOpenDeleteDialog(false);
            setCategoriaAEliminar(null);
        } catch (error) {
            alert("No se pudo eliminar. Probablemente tiene movimientos contables asociados.");
            setOpenDeleteDialog(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountTreeIcon sx={{ mr: 1 }} /> Catálogo de Cuentas
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    setFormulario({ nombre_cuenta: '', tipo: 'Ingreso', activo: true });
                    setOpenModal(true);
                }}>
                    Nueva Cuenta
                </Button>
            </div>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Nombre Cuenta</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categorias.map((row) => (
                            <TableRow key={row.id_catalogo || row.id} hover>
                                <TableCell>{row.nombre_cuenta}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={row.tipo} 
                                        color={row.tipo === 'Ingreso' ? 'success' : 'warning'} 
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.activo ? "Activo" : "Inactivo"} 
                                        color={row.activo ? "success" : "default"} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Editar">
                                        <IconButton color="primary" onClick={() => handleAbrirEditar(row)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar / Desactivar">
                                        <IconButton color="error" onClick={() => handleClickEliminar(row)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL FORMULARIO */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{modoEdicion ? 'Editar Cuenta' : 'Nueva Cuenta Contable'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={8}>
                            <TextField 
                                label="Nombre de la Cuenta (Ej: Alquileres, Multas)" 
                                name="nombre_cuenta" 
                                fullWidth required autoFocus
                                value={formulario.nombre_cuenta} 
                                onChange={handleChange} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    name="tipo"
                                    value={formulario.tipo}
                                    label="Tipo"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Ingreso">Ingreso</MenuItem>
                                    <MenuItem value="Egreso">Egreso</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={formulario.activo} 
                                        onChange={handleChange} 
                                        name="activo" 
                                        color="success"
                                    />
                                }
                                label="Cuenta Activa"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE CONFIRMACIÓN */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Confirmar acción?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Deseas desactivar la cuenta <strong>{categoriaAEliminar?.nombre_cuenta}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Sí, Desactivar</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminCategorias;