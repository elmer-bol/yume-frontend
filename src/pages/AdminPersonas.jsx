import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, Snackbar, Alert, InputAdornment, FormControl,
    InputLabel, Select, MenuItem
} from '@mui/material';

// ICONOS (¡Es vital importarlos todos!)
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';         // Nuevo
import SmartphoneIcon from '@mui/icons-material/Smartphone'; // Nuevo
import EmailIcon from '@mui/icons-material/Email';         // Nuevo

// SERVICIOS
import { personasService } from '../services/personasService'; 

const AdminPersonas = () => {
    // --- ESTADOS ---
    const [personas, setPersonas] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [personaAEliminar, setPersonaAEliminar] = useState(null);

    // Formulario con TODOS los campos nuevos
    const [formulario, setFormulario] = useState({
        nombres: '',
        apellidos: '',
        telefono: '',
        celular: '',
        email: '',
        activo: true
    });

    // Notificaciones
    const [notificacion, setNotificacion] = useState({
        open: false, mensaje: '', tipo: 'info'
    });

    // --- CARGA DE DATOS ---
    const cargarPersonas = async () => {
        try {
            const data = await personasService.obtenerTodas();
            setPersonas(data);
        } catch (error) {
            console.error("Error cargando personas:", error);
            mostrarMensaje("Error al conectar con el servidor", "error");
        }
    };

    useEffect(() => {
        cargarPersonas();
    }, []);

    // --- MANEJADORES ---
    const mostrarMensaje = (mensaje, tipo = 'success') => {
        setNotificacion({ open: true, mensaje, tipo });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario({ ...formulario, [name]: value });
    };

    // Preparar Modal para CREAR
    const handleAbrirNuevo = () => {
        setModoEdicion(false);
        setFormulario({
            nombres: '', apellidos: '', telefono: '', celular: '', email: '', activo: true
        });
        setOpenModal(true);
    };

    // Preparar Modal para EDITAR
    const handleAbrirEditar = (persona) => {
        setModoEdicion(true);
        setIdEdicion(persona.id_persona);
        setFormulario({
            nombres: persona.nombres,
            apellidos: persona.apellidos,
            // Usamos || '' para evitar warnings si viene null del backend
            telefono: persona.telefono || '',
            celular: persona.celular || '',
            email: persona.email || '',
            activo: persona.activo
        });
        setOpenModal(true);
    };

    // GUARDAR (Crear o Editar)
    // GUARDAR (Crear o Editar)
    // GUARDAR (Crear o Editar)
    const handleGuardar = async () => {
        try {
            // 1. Validaciones básicas
            if (!formulario.nombres || !formulario.apellidos) {
                mostrarMensaje("Nombre y Apellido son obligatorios", "warning");
                return;
            }

            // 2. PREPARAR DATOS (Sanitización estricta)
            // Creamos un nuevo objeto SOLO con los campos que el backend espera.
            // Usamos || "" para asegurar que siempre enviamos STRING, nunca null.
            const datosLimpios = {
                nombres: formulario.nombres,
                apellidos: formulario.apellidos,
                telefono: formulario.telefono || "", 
                celular: formulario.celular || "",
                email: formulario.email || "",
                activo: formulario.activo
            };

            console.log("📤 Enviando Payload:", datosLimpios); // <--- MIRA ESTO EN LA CONSOLA (F12)

            if (modoEdicion) {
                // EDITAR: El ID va en la URL (primer parámetro), los datos en el Body
                await personasService.actualizar(idEdicion, datosLimpios);
                mostrarMensaje("Persona actualizada correctamente", "success");
            } else {
                // CREAR
                await personasService.crear(datosLimpios);
                mostrarMensaje("Persona registrada con éxito", "success");
            }
            
            setOpenModal(false);
            cargarPersonas();

        } catch (error) {
            console.error("🔥 Error capturado:", error);

            // 3. EXTRACCIÓN DEL ERROR REAL DEL BACKEND
            let mensajeError = "Error desconocido al guardar.";

            if (error.response) {
                // El servidor respondió, intentamos leer el detalle
                console.log("Data del error:", error.response.data);
                
                if (error.response.data?.detail) {
                    // Caso: FastAPI envía {"detail": "Email ya existe"} o una lista de errores
                    const detalle = error.response.data.detail;
                    if (Array.isArray(detalle)) {
                         // Si es lista de validaciones (msg + loc)
                         mensajeError = detalle.map(d => d.msg).join(', ');
                    } else {
                         mensajeError = detalle;
                    }
                } else {
                    mensajeError = `Error ${error.response.status}: ${error.response.statusText}`;
                }
            } else if (error.request) {
                mensajeError = "No hubo respuesta del servidor (Revisa tu conexión o logs del backend).";
            } else {
                mensajeError = error.message;
            }

            mostrarMensaje(`Fallo: ${mensajeError}`, "error");
        }
    };

    // ELIMINAR
    const handleClickEliminar = (persona) => {
        setPersonaAEliminar(persona);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (personaAEliminar) {
                await personasService.eliminar(personaAEliminar.id_persona);
                mostrarMensaje("Persona eliminada", "success");
                cargarPersonas();
            }
            setOpenDeleteDialog(false);
        } catch (error) {
            mostrarMensaje("No se pudo eliminar el registro", "error");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} /> Gestión de Personas
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAbrirNuevo}>
                    Nueva Persona
                </Button>
            </div>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Nombre Completo</strong></TableCell>
                            <TableCell><strong>Contacto</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {personas.map((persona) => (
                            <TableRow key={persona.id_persona} hover>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {persona.nombres} {persona.apellidos}
                                </TableCell>
                                <TableCell>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {persona.celular && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <SmartphoneIcon fontSize="small" color="primary"/> 
                                                <Typography variant="body2">{persona.celular}</Typography>
                                            </div>
                                        )}
                                        {persona.telefono && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'gray' }}>
                                                <PhoneIcon fontSize="small" /> 
                                                <Typography variant="body2">{persona.telefono}</Typography>
                                            </div>
                                        )}
                                        {!persona.celular && !persona.telefono && (
                                            <Typography variant="caption" color="text.disabled">Sin contacto</Typography>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{persona.email || '-'}</TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={persona.activo ? "Activo" : "Inactivo"} 
                                        color={persona.activo ? "success" : "default"} 
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton color="primary" onClick={() => handleAbrirEditar(persona)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleClickEliminar(persona)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL FORMULARIO */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{modoEdicion ? 'Editar Persona' : 'Nueva Persona'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        
                        {/* NOMBRES Y APELLIDOS */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nombres"
                                name="nombres"
                                value={formulario.nombres}
                                onChange={handleChange}
                                fullWidth required
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Apellidos"
                                name="apellidos"
                                value={formulario.apellidos}
                                onChange={handleChange}
                                fullWidth required
                            />
                        </Grid>

                        {/* DATOS DE CONTACTO */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Celular (WhatsApp)"
                                name="celular"
                                value={formulario.celular}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SmartphoneIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Teléfono Fijo"
                                name="telefono"
                                value={formulario.telefono}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* EMAIL */}
                        <Grid item xs={12}>
                            <TextField
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                value={formulario.email}
                                onChange={handleChange}
                                fullWidth
                                placeholder="ejemplo@correo.com"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* ESTADO */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="activo"
                                    value={formulario.activo}
                                    label="Estado"
                                    onChange={(e) => setFormulario({...formulario, activo: e.target.value})}
                                >
                                    <MenuItem value={true}>Activo</MenuItem>
                                    <MenuItem value={false}>Inactivo</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">
                        {modoEdicion ? 'Guardar Cambios' : 'Registrar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO DE CONFIRMACIÓN BORRAR */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Eliminar Persona?</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro que deseas eliminar a <strong>{personaAEliminar?.nombres} {personaAEliminar?.apellidos}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* SNACKBAR */}
            <Snackbar 
                open={notificacion.open} 
                autoHideDuration={4000} 
                onClose={() => setNotificacion({...notificacion, open: false})}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notificacion.tipo} onClose={() => setNotificacion({...notificacion, open: false})}>
                    {notificacion.mensaje}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminPersonas;