import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControlLabel, Switch, Tooltip,
    DialogContentText, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business'; // Icono de Edificio/Unidad
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { unidadesService } from '../services/unidadesService';

const AdminUnidades = () => {
    // --- ESTADOS ---
    const [unidades, setUnidades] = useState([]);
    
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    // Borrado Seguro
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [unidadAEliminar, setUnidadAEliminar] = useState(null);

    // Formulario (Mapeado a tu JSON)
    const [formulario, setFormulario] = useState({
        identificador_unico: '',
        tipo_unidad: '',
        estado: 'Vacío', // Valor por defecto lógico
        activo: true
    });

    // --- CARGA ---
    const cargarUnidades = async () => {
        try {
            const data = await unidadesService.obtenerTodas();
            setUnidades(data);
        } catch (error) {
            console.error("Error cargando unidades", error);
        }
    };

    useEffect(() => { cargarUnidades(); }, []);

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
                await unidadesService.actualizar(idEdicion, formulario);
            } else {
                await unidadesService.crear(formulario);
            }
            setOpenModal(false);
            cargarUnidades();
        } catch (error) {
            alert("Error al guardar. Verifica que el Identificador Único no exista ya.");
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        // CLAVE: Usamos 'id_unidad' según tu modelo SQLAlchemy
        setIdEdicion(row.id_unidad); 

        setFormulario({
            identificador_unico: row.identificador_unico,
            tipo_unidad: row.tipo_unidad,
            estado: row.estado,
            activo: row.activo
        });
        setOpenModal(true);
    };

    const handleClickEliminar = (row) => {
        setUnidadAEliminar(row);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (unidadAEliminar) {
                // CLAVE: Usamos 'id_unidad'
                await unidadesService.eliminar(unidadAEliminar.id_unidad);
                cargarUnidades();
            }
            setOpenDeleteDialog(false);
            setUnidadAEliminar(null);
        } catch (error) {
            alert("No se pudo eliminar la unidad. Puede tener contratos activos.");
            setOpenDeleteDialog(false);
        }
    };

    // Helper para colores de estado
    const getEstadoColor = (estado) => {
        switch(estado) {
            case 'Ocupado': return 'error'; // Rojo
            case 'Vacío': return 'success'; // Verde
            case 'Mantenimiento': return 'warning'; // Naranja
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} /> Unidades / Inmuebles
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    setFormulario({ identificador_unico: '', tipo_unidad: '', estado: 'Vacío', activo: true });
                    setOpenModal(true);
                }}>
                    Nueva Unidad
                </Button>
            </div>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>ID / Puerta</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell align="center"><strong>Estado Ocupación</strong></TableCell>
                            <TableCell align="center"><strong>Sistema</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {unidades.map((row) => (
                            <TableRow key={row.id_unidad} hover>
                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {row.identificador_unico}
                                </TableCell>
                                <TableCell>{row.tipo_unidad}</TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.estado} 
                                        color={getEstadoColor(row.estado)}
                                        variant="outlined" 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.activo ? "Activo" : "Baja"} 
                                        size="small"
                                        color={row.activo ? "default" : "error"} 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Editar">
                                        <IconButton color="primary" onClick={() => handleAbrirEditar(row)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar / Dar de Baja">
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
                <DialogTitle>{modoEdicion ? 'Editar Unidad' : 'Registrar Nueva Unidad'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Identificador (Ej: 101, Aula-B)" 
                                name="identificador_unico" 
                                fullWidth required autoFocus
                                value={formulario.identificador_unico} 
                                onChange={handleChange} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Tipo (Ej: Departamento, Tienda)" 
                                name="tipo_unidad" 
                                fullWidth 
                                value={formulario.tipo_unidad} 
                                onChange={handleChange} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Estado Físico</InputLabel>
                                <Select
                                    name="estado"
                                    value={formulario.estado}
                                    label="Estado Físico"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Vacío">Vacío (Disponible)</MenuItem>
                                    <MenuItem value="Ocupado">Ocupado</MenuItem>
                                    <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={formulario.activo} 
                                        onChange={handleChange} 
                                        name="activo" 
                                        color="primary"
                                    />
                                }
                                label="Activo en Sistema"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO BORRADO */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Dar de baja?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Confirmar la baja de la unidad <strong>{unidadAEliminar?.identificador_unico}</strong>?
                        <br/><br/>
                        <small>La unidad dejará de estar visible para nuevos contratos.</small>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Sí, Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminUnidades;