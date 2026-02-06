import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControlLabel, Switch, Tooltip,
    DialogContentText, MenuItem, Select, FormControl, InputLabel,
    InputAdornment
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';      // Icono para Rubros
import ReceiptIcon from '@mui/icons-material/Receipt';    // Icono para Cuentas

import { categoriasService } from '../services/categoriasService';

const AdminCategorias = () => {
    // --- ESTADOS ---
    const [categorias, setCategorias] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    // Confirmación Borrado
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

    // Formulario (Estructura Contable Completa)
    const [formulario, setFormulario] = useState({
        codigo: '',          // Ej: 1.1.01
        nombre_cuenta: '',
        tipo: 'INGRESO',     // ACTIVO, INGRESO, EGRESO
        es_rubro: false,     // Título vs Cuenta
        activo: true
    });

    // --- CARGA DE DATOS ---
    const cargarCategorias = async () => {
        try {
            const data = await categoriasService.obtenerTodas();
            // Ordenamos por código para que se vea jerárquico (1.1 antes de 1.2)
            const ordenada = data.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
            setCategorias(ordenada);
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
            // Normalizar a mayúsculas
            const payload = {
                ...formulario,
                tipo: formulario.tipo.toUpperCase()
            };

            if (modoEdicion) {
                await categoriasService.actualizarCategoria(idEdicion, payload);
            } else {
                await categoriasService.crearCategoria(payload);
            }
            setOpenModal(false);
            cargarCategorias();
        } catch (error) {
            console.error(error);
            alert("Error al guardar. Verifique que el código no esté duplicado.");
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        setIdEdicion(row.id_catalogo); 
        setFormulario({
            codigo: row.codigo || '',
            nombre_cuenta: row.nombre_cuenta,
            tipo: row.tipo,
            es_rubro: row.es_rubro,
            activo: row.activo
        });
        setOpenModal(true);
    };

    const handleClickEliminar = (row) => {
        setCategoriaAEliminar(row);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (categoriaAEliminar) {
                await categoriasService.eliminarCategoria(categoriaAEliminar.id_catalogo);
                cargarCategorias();
            }
            setOpenDeleteDialog(false);
            setCategoriaAEliminar(null);
        } catch (error) {
            alert("No se pudo eliminar. Puede tener movimientos asociados.");
            setOpenDeleteDialog(false);
        }
    };

    // Helper para pintar el tipo
    const getColorTipo = (tipo) => {
        switch(tipo) {
            case 'ACTIVO': return 'info';    // Azul
            case 'INGRESO': return 'success'; // Verde
            case 'EGRESO': return 'warning';  // Naranja
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#1565c0' }}>
                    <AccountTreeIcon sx={{ mr: 1 }} /> Plan de Cuentas Contable
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    setFormulario({ codigo: '', nombre_cuenta: '', tipo: 'EGRESO', es_rubro: false, activo: true });
                    setOpenModal(true);
                }}>
                    Nueva Cuenta
                </Button>
            </div>

            {/* TABLA JERÁRQUICA */}
            <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
                        <TableRow>
                            <TableCell><strong>Código</strong></TableCell>
                            <TableCell><strong>Nombre de la Cuenta</strong></TableCell>
                            <TableCell align="center"><strong>Tipo</strong></TableCell>
                            <TableCell align="center"><strong>Nivel</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categorias.map((row) => (
                            <TableRow 
                                key={row.id_catalogo} 
                                hover
                                sx={{ backgroundColor: row.es_rubro ? '#f8f9fa' : 'inherit' }}
                            >
                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {row.codigo}
                                </TableCell>
                                <TableCell>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {/* Indentación visual simple basada en puntos del código */}
                                        {row.es_rubro ? <FolderIcon color="action" sx={{ mr: 1, fontSize: 20 }} /> : <ReceiptIcon color="disabled" sx={{ mr: 1, fontSize: 20 }} />}
                                        <Typography variant="body2" sx={{ fontWeight: row.es_rubro ? 'bold' : 'normal' }}>
                                            {row.nombre_cuenta}
                                        </Typography>
                                    </div>
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.tipo} 
                                        color={getColorTipo(row.tipo)} 
                                        variant="outlined"
                                        size="small"
                                        sx={{ minWidth: 80 }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    {row.es_rubro ? (
                                        <Chip label="RUBRO" size="small" sx={{ bgcolor: '#e0e0e0', color: '#424242', fontWeight: 'bold' }} />
                                    ) : (
                                        <Chip label="Imputable" size="small" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Switch checked={row.activo} size="small" disabled />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Editar">
                                        <IconButton color="primary" size="small" onClick={() => handleAbrirEditar(row)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <IconButton color="error" size="small" onClick={() => handleClickEliminar(row)}>
                                            <DeleteIcon fontSize="small" />
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
                <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', mb: 2 }}>
                    {modoEdicion ? 'Editar Cuenta Contable' : 'Nueva Cuenta Contable'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        
                        {/* 1. TIPO Y RUBRO */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Cuenta</InputLabel>
                                <Select
                                    name="tipo"
                                    value={formulario.tipo}
                                    label="Tipo de Cuenta"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="ACTIVO">ACTIVO (Caja/Bancos)</MenuItem>
                                    <MenuItem value="INGRESO">INGRESO (Cobros)</MenuItem>
                                    <MenuItem value="EGRESO">EGRESO (Gastos)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={formulario.es_rubro} 
                                        onChange={handleChange} 
                                        name="es_rubro" 
                                        color="warning" 
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="textSecondary">
                                        ¿Es Título/Grupo? <br/> (No recibe dinero)
                                    </Typography>
                                }
                            />
                        </Grid>

                        {/* 2. CÓDIGO */}
                        <Grid item xs={12}>
                            <TextField 
                                label="Código Jerárquico" 
                                name="codigo" 
                                placeholder="Ej: 5.1.01"
                                fullWidth required
                                value={formulario.codigo} 
                                onChange={handleChange} 
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">#</InputAdornment>,
                                }}
                                helperText="Use puntos para niveles (Ej: 1.1, 1.1.01)"
                            />
                        </Grid>

                        {/* 3. NOMBRE */}
                        <Grid item xs={12}>
                            <TextField 
                                label="Nombre de la Cuenta" 
                                name="nombre_cuenta" 
                                fullWidth required
                                value={formulario.nombre_cuenta} 
                                onChange={handleChange} 
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Switch checked={formulario.activo} onChange={handleChange} name="activo" color="success" />}
                                label="Cuenta Activa"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">
                        {modoEdicion ? 'Actualizar' : 'Guardar Cuenta'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOG BORRAR */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Confirmar eliminación?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Borrar la cuenta <strong>{categoriaAEliminar?.nombre_cuenta}</strong> ({categoriaAEliminar?.codigo})?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminCategorias;