import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControl, InputLabel, Select, MenuItem,
    InputAdornment, DialogContentText, Snackbar, Alert, TableSortLabel, Box
} from '@mui/material';

// ICONOS
import AddIcon from '@mui/icons-material/Add';
import HandshakeIcon from '@mui/icons-material/Handshake';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search'; // <--- IMPORTANTE
import { visuallyHidden } from '@mui/utils';

// Servicios
import { contratosService } from '../services/contratosService';
import { personasService } from '../services/personasService'; 
import { unidadesService } from '../services/unidadesService'; 

// =============================================================================
// FUNCIONES DE ORDENAMIENTO
// =============================================================================
function descendingComparator(a, b, orderBy) {
    // Manejo especial para datos anidados (ej: ordenar por nombre de unidad)
    // Pero como aquí tenemos IDs, lo haremos simple y usaremos helpers en el render
    // Si queremos ordenar por ID numérico es directo:
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
const AdminContratos = () => {
    // --- ESTADOS DE DATOS ---
    const [contratos, setContratos] = useState([]);
    const [personas, setPersonas] = useState([]); 
    const [unidades, setUnidades] = useState([]); 
    
    // --- ESTADOS DE ORDENAMIENTO ---
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id_relacion'); 
    const [busqueda, setBusqueda] = useState('');

    // --- ESTADOS DE UI ---
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [contratoAEliminar, setContratoAEliminar] = useState(null);

    // Formulario
    const [formulario, setFormulario] = useState({
        id_persona: '',
        id_unidad: '',
        tipo_relacion: 'Alquiler',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        monto_mensual: 0,
        estado: 'Activo'
    });

    const [notificacion, setNotificacion] = useState({ open: false, mensaje: '', tipo: 'info' });

    // --- CARGA DE DATOS ---
    const cargarDatos = async () => {
        try {
            const [dataContratos, dataPersonas, dataUnidades] = await Promise.all([
                contratosService.obtenerTodos(),
                personasService.obtenerTodas(),
                unidadesService.obtenerTodas()
            ]);
            setContratos(dataContratos);
            setPersonas(dataPersonas);
            setUnidades(dataUnidades);
        } catch (error) {
            console.error("Error cargando datos:", error);
            mostrarMensaje("Error de conexión al cargar los datos.", "error");
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // --- HELPERS (Memorizados o simples) ---
    const getNombrePersona = (id) => {
        const p = personas.find(p => p.id_persona === id);
        return p ? `${p.nombre || p.nombres} ${p.apellido || p.apellidos}` : 'Desconocido';
    };

    const getNombreUnidad = (id) => {
        const u = unidades.find(u => u.id_unidad === id);
        return u ? `${u.identificador_unico} (${u.tipo_unidad})` : 'Desconocida';
    };

    // --- LÓGICA DE BÚSQUEDA ---
    // Enriquecemos los datos primero para poder buscar por texto
    const contratosEnriquecidos = contratos.map(c => ({
        ...c,
        textoUnidad: getNombreUnidad(c.id_unidad).toLowerCase(),
        textoPersona: getNombrePersona(c.id_persona).toLowerCase()
    }));

    const contratosFiltrados = contratosEnriquecidos.filter(c => {
        if (!busqueda) return true;
        const texto = busqueda.toLowerCase();
        return (
            c.textoUnidad.includes(texto) || 
            c.textoPersona.includes(texto) ||
            c.estado.toLowerCase().includes(texto)
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

    const handleCerrarNotificacion = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotificacion({ ...notificacion, open: false });
    };

    const handleChange = (e) => {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        try {
            if (!formulario.id_persona || !formulario.id_unidad) {
                mostrarMensaje("Debes seleccionar Cliente y Unidad.", "warning");
                return;
            }
            if (!formulario.monto_mensual || parseFloat(formulario.monto_mensual) <= 0) {
                mostrarMensaje("El monto mensual debe ser mayor a 0.", "warning");
                return;
            }

            const datosParaEnviar = { ...formulario };
            if (datosParaEnviar.fecha_fin === '') datosParaEnviar.fecha_fin = null;

            if (modoEdicion) {
                await contratosService.actualizar(idEdicion, datosParaEnviar);
                mostrarMensaje("Contrato actualizado correctamente.", "success");
            } else {
                await contratosService.crear(datosParaEnviar);
                mostrarMensaje("Contrato creado con éxito.", "success");
            }
            
            setOpenModal(false);
            cargarDatos(); 
        } catch (error) {
            console.error(error);
            const msgError = error.response?.data?.detail || "Error al guardar el contrato.";
            mostrarMensaje(msgError, "error");
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        setIdEdicion(row.id_relacion);
        setFormulario({
            id_persona: row.id_persona,
            id_unidad: row.id_unidad,
            tipo_relacion: row.tipo_relacion,
            fecha_inicio: row.fecha_inicio,
            fecha_fin: row.fecha_fin || '',
            monto_mensual: row.monto_mensual,
            estado: row.estado
        });
        setOpenModal(true);
    };

    const handleClickEliminar = (row) => {
        setContratoAEliminar(row);
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (contratoAEliminar) {
                await contratosService.eliminar(contratoAEliminar.id_relacion);
                cargarDatos();
                mostrarMensaje("Contrato finalizado correctamente.", "success");
            }
            setOpenDeleteDialog(false);
        } catch (error) {
            mostrarMensaje("No se pudo finalizar el contrato.", "error");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* CABECERA */}
            <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <HandshakeIcon sx={{ mr: 1 }} /> Gestión de Contratos
                </Typography>

                {/* BUSCADOR */}
                <TextField
                    size="small"
                    placeholder="Buscar (Unidad, Persona)..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                    }}
                    sx={{ width: { xs: '100%', sm: '300px' } }}
                />

                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    setFormulario({
                        id_persona: '', id_unidad: '', tipo_relacion: 'Alquiler',
                        fecha_inicio: new Date().toISOString().split('T')[0],
                        fecha_fin: '', monto_mensual: '', estado: 'Activo'
                    });
                    setOpenModal(true);
                }}>
                    Nuevo Contrato
                </Button>
            </Paper>

            {/* TABLA */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {/* COLUMNA ID */}
                            <TableCell width="50">
                                <TableSortLabel
                                    active={orderBy === 'id_relacion'}
                                    direction={orderBy === 'id_relacion' ? order : 'asc'}
                                    onClick={() => handleRequestSort('id_relacion')}
                                >
                                    <strong>ID</strong>
                                    {orderBy === 'id_relacion' ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA UNIDAD */}
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'textoUnidad'}
                                    direction={orderBy === 'textoUnidad' ? order : 'asc'}
                                    onClick={() => handleRequestSort('textoUnidad')}
                                >
                                    <strong>Unidad</strong>
                                </TableSortLabel>
                            </TableCell>

                            {/* COLUMNA INQUILINO */}
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'textoPersona'}
                                    direction={orderBy === 'textoPersona' ? order : 'asc'}
                                    onClick={() => handleRequestSort('textoPersona')}
                                >
                                    <strong>Inquilino / Cliente</strong>
                                </TableSortLabel>
                            </TableCell>

                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Fechas</strong></TableCell>
                            <TableCell align="right"><strong>Monto</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* USAMOS LOS FILTRADOS Y ENRIQUECIDOS */}
                        {stableSort(contratosFiltrados, getComparator(order, orderBy))
                            .map((row) => (
                                <TableRow key={row.id_relacion} hover>
                                    {/* CELDA ID */}
                                    <TableCell sx={{ color: 'gray' }}>{row.id_relacion}</TableCell>
                                    
                                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                        {/* Usamos el dato pre-calculado o la función helper */}
                                        {row.textoUnidad ? row.textoUnidad.toUpperCase() : getNombreUnidad(row.id_unidad)}
                                    </TableCell>
                                    <TableCell>
                                        {getNombrePersona(row.id_persona)}
                                    </TableCell>
                                    <TableCell>{row.tipo_relacion}</TableCell>
                                    <TableCell>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            Desde: {row.fecha_inicio} <br/>
                                            {row.fecha_fin ? `Hasta: ${row.fecha_fin}` : '(Indefinido)'}
                                        </div>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>{parseFloat(row.monto_mensual).toFixed(2)}</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={row.estado} 
                                            color={row.estado === 'Activo' ? 'success' : 'default'} 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => handleAbrirEditar(row)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleClickEliminar(row)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                        {contratosFiltrados.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    {busqueda ? `No hay contratos con "${busqueda}"` : "No hay contratos registrados."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL (Se mantiene igual) */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>{modoEdicion ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1, pt: 1 }}>
                        {/* UNIDAD */}
                        <Grid item xs={12}> 
                            <FormControl fullWidth required sx={{ minWidth: 250 }}> 
                                <InputLabel id="label-unidad">Unidad / Inmueble</InputLabel>
                                <Select
                                    labelId="label-unidad"
                                    name="id_unidad"
                                    value={formulario.id_unidad}
                                    label="Unidad / Inmueble"
                                    onChange={handleChange}
                                    MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }} 
                                >
                                    {unidades
                                        .filter(u => u.activo)
                                        .sort((a, b) => (a.estado === 'Vacío' ? -1 : 1)) 
                                        .map((u) => (
                                        <MenuItem 
                                            key={u.id_unidad} 
                                            value={u.id_unidad}
                                            style={{ color: u.estado === 'Ocupado' ? 'red' : 'inherit' }}
                                        >
                                            {u.identificador_unico} - {u.tipo_unidad} ({u.estado})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* PERSONA */}
                        <Grid item xs={12}>
                            <FormControl fullWidth required sx={{ minWidth: 250 }}>
                                <InputLabel id="label-persona">Cliente / Inquilino</InputLabel>
                                <Select
                                    labelId="label-persona"
                                    name="id_persona"
                                    value={formulario.id_persona}
                                    label="Cliente / Inquilino"
                                    onChange={handleChange}
                                >
                                    {personas.map((p) => (
                                        <MenuItem key={p.id_persona} value={p.id_persona}>
                                            {p.nombre || p.nombres} {p.apellido || p.apellidos} 
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* TIPO RELACIÓN */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth sx={{ minWidth: 150 }}>
                                <InputLabel>Tipo Relación</InputLabel>
                                <Select
                                    name="tipo_relacion"
                                    value={formulario.tipo_relacion}
                                    label="Tipo Relación"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Inquilino">Inquilino</MenuItem>
                                    <MenuItem value="Propietario">Propietario</MenuItem>
                                    <MenuItem value="Anticrético">Anticrético</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* MONTO */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Monto Mensual"
                                name="monto_mensual"
                                type="number"
                                fullWidth required
                                sx={{ minWidth: 150 }}
                                InputProps={{ startAdornment: <InputAdornment position="start">Bs</InputAdornment> }}
                                value={formulario.monto_mensual}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* FECHAS */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha Inicio"
                                type="date"
                                name="fecha_inicio"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formulario.fecha_inicio}
                                onChange={handleChange}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha Fin"
                                type="date"
                                name="fecha_fin"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formulario.fecha_fin}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* ESTADO */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Estado Contrato</InputLabel>
                                <Select
                                    name="estado"
                                    value={formulario.estado}
                                    label="Estado Contrato"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Activo">Activo</MenuItem>
                                    <MenuItem value="Inactivo">Inactivo / Finalizado</MenuItem>
                                    <MenuItem value="Legal">En Proceso Legal</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">
                        {modoEdicion ? 'Guardar Cambios' : 'Generar Contrato'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* CONFIRMACIÓN BORRAR */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>¿Finalizar Contrato?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro que deseas finalizar la relación contractual con 
                        <strong> {contratoAEliminar ? getNombrePersona(contratoAEliminar.id_persona) : ''}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Finalizar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notificacion.open} autoHideDuration={6000} onClose={handleCerrarNotificacion} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCerrarNotificacion} severity={notificacion.tipo} variant="filled" sx={{ width: '100%' }}>
                    {notificacion.mensaje}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminContratos;