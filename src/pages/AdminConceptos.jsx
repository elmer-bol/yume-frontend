import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControlLabel, Switch, Tooltip,
    DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'; // Icono de Cobro/Concepto
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { conceptosService } from '../services/conceptosService';

const AdminConceptos = () => {
    // --- ESTADOS ---
    const [conceptos, setConceptos] = useState([]);
    
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    // Estado para Borrado Seguro
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [conceptoAEliminar, setConceptoAEliminar] = useState(null);

    // Formulario (Mapeado a tu Modelo Python)
    const [formulario, setFormulario] = useState({
        nombre: '',
        descripcion: '',
        activo: true
    });

    // --- LOGICA ---
    const cargarConceptos = async () => {
        try {
            const data = await conceptosService.obtenerTodos();
            setConceptos(data);
        } catch (error) {
            console.error("Error cargando conceptos", error);
        }
    };

    useEffect(() => { cargarConceptos(); }, []);

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
                await conceptosService.actualizar(idEdicion, formulario);
            } else {
                await conceptosService.crear(formulario);
            }
            setOpenModal(false);
            cargarConceptos();
        } catch (error) {
            alert("Error al guardar. Verifica que el nombre no esté duplicado.");
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        // CLAVE: Usamos id_concepto
        setIdEdicion(row.id_concepto); 
        
        setFormulario({
            nombre: row.nombre,
            descripcion: row.descripcion || '', // Manejo de nulos
            activo: row.activo
        });
        setOpenModal(true);
    };

    // --- BORRADO SEGURO ---
    const handleClickEliminar = (row) => {
        setConceptoAEliminar(row);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (conceptoAEliminar) {
                // CLAVE: Usamos id_concepto
                await conceptosService.eliminar(conceptoAEliminar.id_concepto);
                cargarConceptos();
            }
            setOpenDeleteDialog(false);
            setConceptoAEliminar(null);
        } catch (error) {
            alert("No se pudo eliminar. Probablemente ya se ha facturado este concepto.");
            setOpenDeleteDialog(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <RequestQuoteIcon sx={{ mr: 1 }} /> Conceptos de Cobro
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    setFormulario({ nombre: '', descripcion: '', activo: true });
                    setOpenModal(true);
                }}>
                    Nuevo Concepto
                </Button>
            </div>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Nombre (Concepto)</strong></TableCell>
                            <TableCell><strong>Descripción</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {conceptos.map((row) => (
                            <TableRow key={row.id_concepto} hover>
                                <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre}</TableCell>
                                <TableCell>{row.descripcion}</TableCell>
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
                <DialogTitle>{modoEdicion ? 'Editar Concepto' : 'Nuevo Concepto de Cobro'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField 
                                label="Nombre (Ej: Renta Mensual, Multa)" 
                                name="nombre" 
                                fullWidth required autoFocus
                                value={formulario.nombre} 
                                onChange={handleChange} 
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                label="Descripción Detallada (Para el recibo)" 
                                name="descripcion" 
                                fullWidth multiline rows={2}
                                value={formulario.descripcion} 
                                onChange={handleChange} 
                            />
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
                                label="Concepto Activo (Disponible para facturar)"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO DE CONFIRMACIÓN */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Confirmar acción?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Deseas desactivar el concepto <strong>{conceptoAEliminar?.nombre}</strong>?                        
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

export default AdminConceptos;