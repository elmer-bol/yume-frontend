import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, Snackbar, Alert, InputAdornment, FormControl,
    InputLabel, Select, MenuItem, TableSortLabel, Box
} from '@mui/material';

// ICONOS
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search'; // <--- IMPORTANTE: Icono de búsqueda
import { visuallyHidden } from '@mui/utils';

import { personasService } from '../services/personasService'; 

// =============================================================================
// FUNCIONES DE ORDENAMIENTO (UTILIDADES)
// =============================================================================
function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
const AdminPersonas = () => {
    // --- ESTADOS DE DATOS ---
    const [personas, setPersonas] = useState([]);
    const [busqueda, setBusqueda] = useState(''); // <--- NUEVO: Estado del buscador
    
    // --- ESTADOS DE ORDENAMIENTO ---
    // AQUÍ ESTABA EL "ERROR": Lo cambiamos a 'id_persona' para que respete el Backend
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id_persona'); 

    // --- ESTADOS DE UI ---
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [personaAEliminar, setPersonaAEliminar] = useState(null);

    // Formulario
    const [formulario, setFormulario] = useState({
        nombres: '', apellidos: '', telefono: '', celular: '', email: '', activo: true
    });

    const [notificacion, setNotificacion] = useState({ open: false, mensaje: '', tipo: 'info' });

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

    // --- LÓGICA DE FILTRADO (BUSCADOR) ---
    const personasFiltradas = personas.filter((persona) => {
        if (!busqueda) return true;
        const texto = busqueda.toLowerCase();
        return (
            persona.nombres.toLowerCase().includes(texto) ||
            persona.apellidos.toLowerCase().includes(texto) ||
            (persona.celular && persona.celular.includes(texto)) ||
            (persona.telefono && persona.telefono.includes(texto))
        );
    });

    // --- MANEJADORES ---
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const mostrarMensaje = (mensaje, tipo = 'success') => {
        setNotificacion({ open: true, mensaje, tipo });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario({ ...formulario, [name]: value });
    };

    const handleAbrirNuevo = () => {
        setModoEdicion(false);
        setFormulario({ nombres: '', apellidos: '', telefono: '', celular: '', email: '', activo: true });
        setOpenModal(true);
    };

    const handleAbrirEditar = (persona) => {
        setModoEdicion(true);
        setIdEdicion(persona.id_persona);
        setFormulario({
            nombres: persona.nombres,
            apellidos: persona.apellidos,
            telefono: persona.telefono || '',
            celular: persona.celular || '',
            email: persona.email || '',
            activo: persona.activo
        });
        setOpenModal(true);
    };

    const handleGuardar = async () => {
        try {
            if (!formulario.nombres || !formulario.apellidos) {
                mostrarMensaje("Nombre y Apellido son obligatorios", "warning");
                return;
            }

            const datosLimpios = {
                nombres: formulario.nombres,
                apellidos: formulario.apellidos,
                telefono: formulario.telefono || "", 
                celular: formulario.celular || "",
                email: formulario.email || "",
                activo: formulario.activo
            };

            if (modoEdicion) {
                await personasService.actualizar(idEdicion, datosLimpios);
                mostrarMensaje("Persona actualizada correctamente", "success");
            } else {
                await personasService.crear(datosLimpios);
                mostrarMensaje("Persona registrada con éxito", "success");
            }
            
            setOpenModal(false);
            cargarPersonas();

        } catch (error) {
            let mensajeError = "Error desconocido.";
            if (error.response?.data?.detail) {
                const det = error.response.data.detail;
                mensajeError = Array.isArray(det) ? det.map(d => d.msg).join(', ') : det;
            } else if (error.message) {
                mensajeError = error.message;
            }
            mostrarMensaje(`Fallo: ${mensajeError}`, "error");
        }
    };

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
            mostrarMensaje("No se pudo eliminar", "error");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* CABECERA CON BUSCADOR */}
            <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} /> Gestión de Personas
                </Typography>

                {/* CAMPO DE BÚSQUEDA */}
                <TextField
                    size="small"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: '100%', sm: '300px' } }}
                />

                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAbrirNuevo}>
                    Nueva Persona
                </Button>
            </Paper>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {/* COLUMNA ID */}
                            <TableCell width="60">
                                <TableSortLabel
                                    active={orderBy === 'id_persona'}
                                    direction={orderBy === 'id_persona' ? order : 'asc'}
                                    onClick={() => handleRequestSort('id_persona')}
                                >
                                    <strong>ID</strong>
                                    {orderBy === 'id_persona' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA NOMBRES */}
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'nombres'}
                                    direction={orderBy === 'nombres' ? order : 'asc'}
                                    onClick={() => handleRequestSort('nombres')}
                                >
                                    <strong>Nombre</strong>
                                    {orderBy === 'nombres' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA APELLIDOS */}
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'apellidos'}
                                    direction={orderBy === 'apellidos' ? order : 'asc'}
                                    onClick={() => handleRequestSort('apellidos')}
                                >
                                    <strong>Apellidos</strong>
                                    {orderBy === 'apellidos' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            <TableCell><strong>Contacto</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* ⚠️ USAMOS personasFiltradas AQUÍ */}
                        {stableSort(personasFiltradas, getComparator(order, orderBy))
                            .map((persona) => (
                                <TableRow key={persona.id_persona} hover>
                                    <TableCell sx={{ color: 'gray' }}>{persona.id_persona}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{persona.nombres}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{persona.apellidos}</TableCell>
                                    <TableCell>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {persona.celular && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <SmartphoneIcon fontSize="small" color="primary"/> 
                                                    <Typography variant="body2">{persona.celular}</Typography>
                                                </div>
                                            )}
                                            {!persona.celular && persona.telefono && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <PhoneIcon fontSize="small" color="action"/> 
                                                    <Typography variant="body2">{persona.telefono}</Typography>
                                                </div>
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
                            ))
                        }
                        {personasFiltradas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    {busqueda ? `No hay resultados para "${busqueda}"` : "No hay personas registradas."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL FORMULARIO */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{modoEdicion ? 'Editar Persona' : 'Nueva Persona'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Nombres" name="nombres" value={formulario.nombres} onChange={handleChange} fullWidth required autoFocus />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Apellidos" name="apellidos" value={formulario.apellidos} onChange={handleChange} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Celular (WhatsApp)" name="celular" value={formulario.celular} onChange={handleChange} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><SmartphoneIcon color="action" /></InputAdornment>)}} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Teléfono Fijo" name="telefono" value={formulario.telefono} onChange={handleChange} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>)}} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Correo Electrónico" name="email" type="email" value={formulario.email} onChange={handleChange} fullWidth placeholder="ejemplo@correo.com" InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>)}} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select name="activo" value={formulario.activo} label="Estado" onChange={(e) => setFormulario({...formulario, activo: e.target.value})}>
                                    <MenuItem value={true}>Activo</MenuItem>
                                    <MenuItem value={false}>Inactivo</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">{modoEdicion ? 'Guardar Cambios' : 'Registrar'}</Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO BORRAR */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Eliminar Persona?</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro que deseas eliminar a <strong>{personaAEliminar?.nombres} {personaAEliminar?.apellidos}</strong>?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notificacion.open} autoHideDuration={4000} onClose={() => setNotificacion({...notificacion, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={notificacion.tipo} onClose={() => setNotificacion({...notificacion, open: false})}>{notificacion.mensaje}</Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminPersonas;