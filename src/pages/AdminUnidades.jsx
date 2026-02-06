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
import BusinessIcon from '@mui/icons-material/Business'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import { visuallyHidden } from '@mui/utils';

import { unidadesService } from '../services/unidadesService'; 

// =============================================================================
// FUNCIONES DE ORDENAMIENTO
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
const AdminUnidades = () => {
    // --- ESTADOS DE DATOS ---
    const [unidades, setUnidades] = useState([]);
    const [busqueda, setBusqueda] = useState('');

    // --- ESTADOS DE ORDENAMIENTO ---
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id_unidad'); 

    // --- ESTADOS DE UI ---
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [unidadAEliminar, setUnidadAEliminar] = useState(null);

    const [formulario, setFormulario] = useState({
        identificador_unico: '',
        tipo_unidad: '',
        descripcion: '', // <--- NUEVO CAMPO AGREGADO
        estado: 'Disponible',
        activo: true
    });

    const [notificacion, setNotificacion] = useState({ open: false, mensaje: '', tipo: 'info' });

    // --- CARGA DE DATOS ---
    const cargarUnidades = async () => {
        try {
            const data = await unidadesService.obtenerTodas();
            setUnidades(data);
        } catch (error) {
            console.error("Error cargando unidades:", error);
            mostrarMensaje("Error al conectar con el servidor", "error");
        }
    };

    useEffect(() => {
        cargarUnidades();
    }, []);

    // --- FILTRADO (BUSCADOR ACTUALIZADO) ---
    const unidadesFiltradas = unidades.filter((unidad) => {
        if (!busqueda) return true;
        const texto = busqueda.toLowerCase();
        return (
            unidad.identificador_unico.toLowerCase().includes(texto) ||
            unidad.tipo_unidad.toLowerCase().includes(texto) ||
            (unidad.descripcion && unidad.descripcion.toLowerCase().includes(texto)) // <--- BUSCAR EN DESCRIPCIÓN
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
        // Reseteamos el formulario incluyendo la descripción
        setFormulario({ 
            identificador_unico: '', 
            tipo_unidad: '', 
            descripcion: '', 
            estado: 'Disponible', 
            activo: true 
        });
        setOpenModal(true);
    };

    const handleAbrirEditar = (unidad) => {
        setModoEdicion(true);
        setIdEdicion(unidad.id_unidad);
        setFormulario({
            identificador_unico: unidad.identificador_unico,
            tipo_unidad: unidad.tipo_unidad,
            descripcion: unidad.descripcion || '', // <--- CARGAR DESCRIPCIÓN
            estado: unidad.estado,
            activo: unidad.activo
        });
        setOpenModal(true);
    };

    const handleGuardar = async () => {
        try {
            if (!formulario.identificador_unico || !formulario.tipo_unidad) {
                mostrarMensaje("Identificador y Tipo son obligatorios", "warning");
                return;
            }

            const datosLimpios = {
                identificador_unico: formulario.identificador_unico,
                tipo_unidad: formulario.tipo_unidad,
                descripcion: formulario.descripcion, // <--- ENVIAR DESCRIPCIÓN
                estado: formulario.estado,
                activo: formulario.activo
            };

            if (modoEdicion) {
                await unidadesService.actualizar(idEdicion, datosLimpios);
                mostrarMensaje("Unidad actualizada", "success");
            } else {
                await unidadesService.crear(datosLimpios);
                mostrarMensaje("Unidad creada", "success");
            }
            setOpenModal(false);
            cargarUnidades();

        } catch (error) {
            let mensajeError = "Error desconocido.";
            if (error.response?.data?.detail) {
                mensajeError = error.response.data.detail;
            } else if (error.message) {
                mensajeError = error.message;
            }
            mostrarMensaje(`Fallo: ${mensajeError}`, "error");
        }
    };

    const handleClickEliminar = (unidad) => {
        setUnidadAEliminar(unidad);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (unidadAEliminar) {
                await unidadesService.eliminar(unidadAEliminar.id_unidad);
                mostrarMensaje("Unidad eliminada", "success");
                cargarUnidades();
            }
            setOpenDeleteDialog(false);
        } catch (error) {
            mostrarMensaje("No se pudo eliminar", "error");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} /> Gestión de Unidades
                </Typography>

                <TextField
                    size="small"
                    placeholder="Buscar (ej: 10A, Local, Piso 3)..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                    }}
                    sx={{ width: { xs: '100%', sm: '300px' } }}
                />

                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAbrirNuevo}>
                    Nueva Unidad
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
                                    active={orderBy === 'id_unidad'}
                                    direction={orderBy === 'id_unidad' ? order : 'asc'}
                                    onClick={() => handleRequestSort('id_unidad')}
                                >
                                    <strong>ID</strong>
                                    {orderBy === 'id_unidad' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA IDENTIFICADOR */}
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'identificador_unico'}
                                    direction={orderBy === 'identificador_unico' ? order : 'asc'}
                                    onClick={() => handleRequestSort('identificador_unico')}
                                >
                                    <strong>Identificador</strong>
                                    {orderBy === 'identificador_unico' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA TIPO & DESCRIPCIÓN (Combinadas) */}
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'tipo_unidad'}
                                    direction={orderBy === 'tipo_unidad' ? order : 'asc'}
                                    onClick={() => handleRequestSort('tipo_unidad')}
                                >
                                    <strong>Tipo & Descripción</strong>
                                    {orderBy === 'tipo_unidad' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA ESTADO */}
                            <TableCell align="center">
                                <TableSortLabel
                                    active={orderBy === 'estado'}
                                    direction={orderBy === 'estado' ? order : 'asc'}
                                    onClick={() => handleRequestSort('estado')}
                                >
                                    <strong>Estado</strong>
                                    {orderBy === 'estado' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            <TableCell align="center"><strong>Activo</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stableSort(unidadesFiltradas, getComparator(order, orderBy))
                            .map((unidad) => (
                                <TableRow key={unidad.id_unidad} hover>
                                    <TableCell sx={{ color: 'gray' }}>{unidad.id_unidad}</TableCell>
                                    
                                    <TableCell>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <HomeWorkIcon color="action" />
                                            <Typography fontWeight="bold">{unidad.identificador_unico}</Typography>
                                        </div>
                                    </TableCell>
                                    
                                    {/* CELDA COMBINADA: TIPO + DESCRIPCIÓN */}
                                    <TableCell>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box>
                                                <Chip 
                                                    label={unidad.tipo_unidad} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined" 
                                                />
                                            </Box>
                                            {unidad.descripcion && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {unidad.descripcion}
                                                </Typography>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip 
                                            label={unidad.estado || "Desconocido"} 
                                            color={unidad.estado === 'Ocupado' ? 'warning' : 'success'} 
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={unidad.activo ? "Sí" : "No"} 
                                            color={unidad.activo ? "default" : "error"} 
                                            size="small" 
                                            sx={{ height: 24 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => handleAbrirEditar(unidad)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleClickEliminar(unidad)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                        {unidadesFiltradas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    {busqueda ? `No hay resultados para "${busqueda}"` : "No hay unidades registradas."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL FORMULARIO */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{modoEdicion ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Identificador (Ej: 1A, Local 1)" name="identificador_unico" value={formulario.identificador_unico} onChange={handleChange} fullWidth required autoFocus />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Tipo Unidad (Ej: Departamento, Local)" 
                                name="tipo_unidad" 
                                value={formulario.tipo_unidad} 
                                onChange={handleChange} 
                                fullWidth 
                                required 
                            />
                        </Grid>

                        {/* NUEVO CAMPO: DESCRIPCIÓN */}
                        <Grid item xs={12}>
                            <TextField 
                                label="Descripción Detallada (Opcional)" 
                                name="descripcion" 
                                value={formulario.descripcion} 
                                onChange={handleChange} 
                                fullWidth 
                                multiline
                                rows={2}
                                placeholder="Ej: Torre A, Vista al Mar, Piso 3"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Estado Ocupación</InputLabel>
                                <Select name="estado" value={formulario.estado} label="Estado Ocupación" onChange={(e) => setFormulario({...formulario, estado: e.target.value})}>
                                    <MenuItem value="Disponible">Disponible</MenuItem>
                                    <MenuItem value="Ocupado">Ocupado</MenuItem>
                                    <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Sistema Activo</InputLabel>
                                <Select name="activo" value={formulario.activo} label="Sistema Activo" onChange={(e) => setFormulario({...formulario, activo: e.target.value})}>
                                    <MenuItem value={true}>Activo</MenuItem>
                                    <MenuItem value={false}>Inactivo</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">{modoEdicion ? 'Guardar' : 'Crear'}</Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO BORRAR */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Eliminar Unidad?</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro de borrar <strong>{unidadAEliminar?.identificador_unico}</strong>?</Typography>
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

export default AdminUnidades;