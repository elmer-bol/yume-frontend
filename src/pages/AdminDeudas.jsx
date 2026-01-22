import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControl, InputLabel, Select, MenuItem,
    InputAdornment, DialogContentText, Snackbar, Alert, Box,
    FormHelperText 
} from '@mui/material';

// ICONOS
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt'; 
import FlashOnIcon from '@mui/icons-material/FlashOn'; 
import BlockIcon from '@mui/icons-material/Block'; 
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History'; // <--- NUEVO ICONO

// SERVICIOS
import { facturablesService } from '../services/facturablesService';
import { personasService } from '../services/personasService'; 
import { unidadesService } from '../services/unidadesService'; 
import { conceptosService } from '../services/conceptosService';
import { contratosService } from '../services/contratosService'; 

// COMPONENTES
import ModalGenerarHistorial from '../components/ModalGenerarHistorial'; // <--- NUEVO COMPONENTE

const MenuProps = {
  PaperProps: {
    style: { maxHeight: 48 * 4.5 + 8, width: 250 },
  },
};

const AdminDeudas = () => {
    // --- ESTADOS DE DATOS ---
    const [deudas, setDeudas] = useState([]);
    const [personas, setPersonas] = useState([]); 
    const [unidades, setUnidades] = useState([]); 
    const [conceptos, setConceptos] = useState([]); 
    const [contratos, setContratos] = useState([]); 

    // --- ESTADOS DE UI ---
    const [openModal, setOpenModal] = useState(false); 
    const [openGlobalModal, setOpenGlobalModal] = useState(false); 
    
    // ESTADO PARA EL NUEVO MODAL DE HISTORIAL
    const [openHistorial, setOpenHistorial] = useState(false); // <--- NUEVO ESTADO

    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [deudaACancelar, setDeudaACancelar] = useState(null);

    // Formulario Manual
    const [formulario, setFormulario] = useState({
        id_persona: '',
        id_unidad: '',
        id_concepto: '',
        periodo: new Date().toISOString().slice(0, 7), 
        fecha_vencimiento: '',
        monto_base: 0,
        bloqueo_pago_automatico: false
    });

    // Estado Inicial Inteligente
    const getInitialGlobalState = () => {
        const hoy = new Date();
        const periodo = hoy.toISOString().slice(0, 7); 
        const [year, month] = periodo.split('-');
        const ultimoDia = new Date(year, month, 0).getDate();
        return {
            periodo: periodo,
            fecha_vencimiento: `${periodo}-${ultimoDia}`,
            id_concepto: ''
        };
    };
    const [formGlobal, setFormGlobal] = useState(getInitialGlobalState());

    // Notificaciones
    const [notificacion, setNotificacion] = useState({
        open: false, mensaje: '', tipo: 'info'
    });

    const mostrarMensaje = (mensaje, tipo = 'success') => {
        setNotificacion({ open: true, mensaje, tipo });
    };

    const handleCerrarNotificacion = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotificacion({ ...notificacion, open: false });
    };

    // --- CARGA INICIAL ---
    const cargarDatos = async () => {
        try {
            const [dataDeudas, dataPersonas, dataUnidades, dataConceptos, dataContratos] = await Promise.all([
                facturablesService.obtenerTodas(),
                personasService.obtenerTodas(),
                unidadesService.obtenerTodas(),
                conceptosService.obtenerTodos(),
                contratosService.obtenerTodos() 
            ]);
            setDeudas(dataDeudas);
            setPersonas(dataPersonas);
            setUnidades(dataUnidades);
            setConceptos(dataConceptos);
            setContratos(dataContratos);
        } catch (error) {
            console.error("Error cargando datos:", error);
            mostrarMensaje("Error de conexión al cargar las deudas.", "error");
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // --- HELPERS ---
    const getNombrePersona = (id) => {
        const p = personas.find(p => p.id_persona === id);
        return p ? `${p.nombre || p.nombres} ${p.apellido || p.apellidos}` : '...';
    };
    const getNombreUnidad = (id) => {
        const u = unidades.find(u => u.id_unidad === id);
        return u ? u.identificador_unico : '...';
    };
    const getNombreConcepto = (id) => {
        const c = conceptos.find(c => c.id_concepto === id);
        return c ? c.nombre : '...';
    };
    
    const getEstadoColor = (estado) => {
        switch(estado) {
            case 'pagado': return 'success';
            case 'pendiente': return 'warning';
            case 'vencido': return 'error';
            case 'cancelado': return 'default';
            default: return 'default';
        }
    };

    // --- MANEJADORES ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormulario({ ...formulario, [name]: type === 'checkbox' ? checked : value });
    };

    const handleUnidadChange = (e) => {
        const idUnidadSeleccionada = e.target.value;
        let nuevoFormulario = { ...formulario, id_unidad: idUnidadSeleccionada };

        const contratoActivo = contratos.find(c => c.id_unidad === idUnidadSeleccionada && c.estado === 'Activo');

        if (contratoActivo) {
            nuevoFormulario.id_persona = contratoActivo.id_persona;
        } else {
            nuevoFormulario.id_persona = '';
        }
        setFormulario(nuevoFormulario);
    };

    const handleChangeGlobal = (e) => {
        const { name, value } = e.target;
        let nuevoEstado = { ...formGlobal, [name]: value };

        if (name === 'periodo' && value) {
            const [anio, mes] = value.split('-');
            const ultimoDia = new Date(anio, mes, 0).getDate();
            nuevoEstado.fecha_vencimiento = `${value}-${ultimoDia}`;
        }
        setFormGlobal(nuevoEstado);
    };

    const handleGuardarManual = async () => {
        try {
            const fechaLimpia = formulario.fecha_vencimiento === '' ? null : formulario.fecha_vencimiento;

            if (modoEdicion) {
                const datosEdicion = {
                    fecha_vencimiento: fechaLimpia,
                    bloqueo_pago_automatico: formulario.bloqueo_pago_automatico
                };
                await facturablesService.actualizar(idEdicion, datosEdicion);
                mostrarMensaje("Fecha de vencimiento actualizada.", "success");

            } else {
                if (!formulario.id_unidad || !formulario.id_concepto || !formulario.monto_base) {
                    mostrarMensaje("Unidad, Concepto y Monto son obligatorios.", "warning");
                    return;
                }
                if (!formulario.id_persona) {
                    mostrarMensaje("La unidad seleccionada no tiene un responsable.", "warning");
                    return;
                }
                const datosCreacion = {
                    ...formulario,
                    monto_base: parseFloat(formulario.monto_base), 
                    fecha_vencimiento: fechaLimpia
                };
                await facturablesService.crear(datosCreacion);
                mostrarMensaje("Deuda registrada correctamente.", "success");
            }

            setOpenModal(false);
            cargarDatos();

        } catch (error) {
            const msg = error.response?.data?.detail || "Error al procesar la solicitud.";
            mostrarMensaje(typeof msg === 'object' ? JSON.stringify(msg) : msg, "error");
        }
    };

    const handleGenerarGlobal = async () => {
        try {
            if (!formGlobal.fecha_vencimiento || !formGlobal.id_concepto) {
                mostrarMensaje("Define fecha de vencimiento y el concepto.", "warning");
                return;
            }
            mostrarMensaje("Iniciando proceso masivo... espere.", "info");
            
            const resultado = await facturablesService.generarGlobal(formGlobal);
            
            mostrarMensaje(resultado.mensaje || "Generación masiva completada.", "success");
            setOpenGlobalModal(false);
            cargarDatos();
        } catch (error) {
            const msg = error.response?.data?.detail || "Error en generación masiva.";
            mostrarMensaje(typeof msg === 'object' ? JSON.stringify(msg) : msg, "error");
        }
    };

    const confirmarCancelacion = async () => {
        try {
            if (deudaACancelar) {
                await facturablesService.cancelar(deudaACancelar.id_item);
                mostrarMensaje("Deuda anulada.", "success");
                cargarDatos();
            }
            setOpenCancelDialog(false);
        } catch (error) {
            mostrarMensaje("No se pudo anular la deuda.", "error");
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        setIdEdicion(row.id_item);
        setFormulario({
            id_persona: row.id_persona,
            id_unidad: row.id_unidad,
            id_concepto: row.id_concepto,
            periodo: row.periodo,
            fecha_vencimiento: row.fecha_vencimiento,
            monto_base: row.monto_base,
            bloqueo_pago_automatico: row.bloqueo_pago_automatico
        });
        setOpenModal(true);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon sx={{ mr: 1 }} /> Cuentas por Cobrar
                </Typography>
                <Box>
                    {/* --- BOTÓN NUEVO: CARGAR HISTORIAL --- */}
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={<HistoryIcon />}
                        onClick={() => setOpenHistorial(true)}
                        sx={{ mr: 2 }}
                    >
                        Cargar Historial
                    </Button>

                    <Button 
                        variant="contained" 
                        color="secondary"
                        startIcon={<FlashOnIcon />} 
                        onClick={() => setOpenGlobalModal(true)}
                        sx={{ mr: 2 }}
                    >
                        Generar Cuotas del Mes
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => {
                            setModoEdicion(false);
                            setFormulario({
                                id_persona: '', id_unidad: '', id_concepto: '',
                                periodo: new Date().toISOString().slice(0, 7),
                                fecha_vencimiento: '', monto_base: '', bloqueo_pago_automatico: false
                            });
                            setOpenModal(true);
                        }}
                    >
                        Cargo Manual
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Periodo</strong></TableCell>
                            <TableCell><strong>Unidad</strong></TableCell>
                            <TableCell><strong>Responsable</strong></TableCell>
                            <TableCell><strong>Concepto</strong></TableCell>
                            <TableCell align="right"><strong>Monto Total</strong></TableCell>
                            <TableCell align="right"><strong>Saldo Pendiente</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {deudas.map((row) => (
                            <TableRow key={row.id_item} hover>
                                <TableCell>{row.periodo}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{getNombreUnidad(row.id_unidad)}</TableCell>
                                <TableCell>{getNombrePersona(row.id_persona)}</TableCell>
                                <TableCell>{getNombreConcepto(row.id_concepto)}</TableCell>
                                <TableCell align="right">${parseFloat(row.monto_base).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ color: parseFloat(row.saldo_pendiente) > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                                    ${parseFloat(row.saldo_pendiente).toFixed(2)}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.estado.toUpperCase()} 
                                        color={getEstadoColor(row.estado)} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    {['pendiente', 'vencido'].includes(row.estado) && (
                                        <>
                                            <IconButton size="small" color="primary" onClick={() => handleAbrirEditar(row)}>
                                                <EditIcon fontSize="small"/>
                                            </IconButton>
                                            <IconButton size="small" color="default" onClick={() => { setDeudaACancelar(row); setOpenCancelDialog(true); }}>
                                                <BlockIcon fontSize="small"/>
                                            </IconButton>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL 1: CARGO MANUAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>{modoEdicion ? 'Editar Deuda' : 'Registrar Cargo Manual'}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Use esto para multas, reparaciones o cargos fuera del contrato de alquiler.
                    </DialogContentText>
                    <Grid container spacing={2}>
                        {/* UNIDAD */}
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth required disabled={modoEdicion}>
                                <InputLabel>Unidad</InputLabel> 
                                <Select 
                                    name="id_unidad" 
                                    value={formulario.id_unidad} 
                                    label="Unidad" 
                                    onChange={handleUnidadChange} 
                                    MenuProps={MenuProps}
                                >
                                    {unidades.filter(u => u.activo).map((u) => (
                                        <MenuItem key={u.id_unidad} value={u.id_unidad}>{u.identificador_unico}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Identificador del inmueble</FormHelperText>
                            </FormControl>
                        </Grid>

                        {/* RESPONSABLE */}
                        <Grid item xs={12} sm={7}>
                            <FormControl fullWidth required disabled={modoEdicion}>
                                <InputLabel>Responsable</InputLabel>
                                <Select 
                                    name="id_persona" 
                                    value={formulario.id_persona} 
                                    label="Responsable" 
                                    onChange={handleChange}
                                    MenuProps={MenuProps}
                                >
                                    {personas.map((p) => (
                                        <MenuItem key={p.id_persona} value={p.id_persona}>
                                            {p.nombre || p.nombres} {p.apellido || p.apellidos}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Se selecciona automáticamente</FormHelperText>
                            </FormControl>
                        </Grid>

                        {/* CONCEPTO */}
                        <Grid item xs={12}>
                            <FormControl fullWidth required disabled={modoEdicion}>
                                <InputLabel>Concepto</InputLabel>
                                <Select 
                                    name="id_concepto" 
                                    value={formulario.id_concepto} 
                                    label="Concepto" 
                                    onChange={handleChange}
                                    MenuProps={MenuProps}
                                >
                                    {conceptos.filter(c => c.activo).map((c) => (
                                        <MenuItem key={c.id_concepto} value={c.id_concepto}>{c.nombre}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Razón del cobro</FormHelperText>
                            </FormControl>
                        </Grid>

                        {/* PERIODO */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Periodo"
                                name="periodo"
                                type="month"
                                fullWidth required
                                disabled={modoEdicion}
                                InputLabelProps={{ shrink: true }}
                                value={formulario.periodo}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* MONTO */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Monto"
                                name="monto_base"
                                type="number"
                                fullWidth required
                                disabled={modoEdicion}
                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                value={formulario.monto_base}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* VENCIMIENTO */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Vencimiento"
                                name="fecha_vencimiento"
                                type="date"
                                fullWidth required
                                InputLabelProps={{ shrink: true }}
                                value={formulario.fecha_vencimiento}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button onClick={handleGuardarManual} variant="contained" color="primary">Guardar Deuda</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 2: GENERACIÓN MASIVA */}
            <Dialog open={openGlobalModal} onClose={() => setOpenGlobalModal(false)}>
                <DialogTitle>⚡ Generación Masiva de Cuotas</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Esta acción buscará <strong>TODOS los contratos activos</strong> y generará la deuda correspondiente.
                    </DialogContentText>
                    <Box sx={{ mt: 2 }}>
                         <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Concepto</InputLabel>
                            <Select
                                name="id_concepto"
                                value={formGlobal.id_concepto}
                                label="Concepto"
                                onChange={handleChangeGlobal}
                                MenuProps={MenuProps}
                            >
                                {conceptos
                                    .filter(c => c.activo)
                                    .map((c) => (
                                    <MenuItem key={c.id_concepto} value={c.id_concepto}>
                                        {c.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>Ej: Renta Mensual</FormHelperText>
                        </FormControl>

                        <TextField
                            label="Periodo"
                            name="periodo"
                            type="month"
                            fullWidth
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                            value={formGlobal.periodo}
                            onChange={handleChangeGlobal}
                        />
                        <TextField
                            label="Fecha de Vencimiento"
                            name="fecha_vencimiento"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formGlobal.fecha_vencimiento}
                            onChange={handleChangeGlobal}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGlobalModal(false)}>Cancelar</Button>
                    <Button onClick={handleGenerarGlobal} variant="contained" color="secondary" startIcon={<FlashOnIcon />}>
                        Ejecutar Generación
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- MODAL 3: GENERAR HISTORIAL (¡NUEVO!) --- */}
            <ModalGenerarHistorial 
                open={openHistorial}
                onClose={() => setOpenHistorial(false)}
                onSuccess={cargarDatos} 
            />

            {/* CONFIRMACIÓN ANULAR */}
            <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
                <DialogTitle>¿Anular Deuda?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Esta acción cancelará la deuda seleccionada. El saldo pendiente pasará a 0.
                        Esta acción es irreversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCancelDialog(false)}>Salir</Button>
                    <Button onClick={confirmarCancelacion} color="error" variant="contained">Confirmar Anulación</Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={notificacion.open} 
                autoHideDuration={6000} 
                onClose={handleCerrarNotificacion}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notificacion.tipo} variant="filled" sx={{ width: '100%' }}>
                    {notificacion.mensaje}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminDeudas;