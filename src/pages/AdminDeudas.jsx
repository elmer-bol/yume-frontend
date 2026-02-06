import React, { useEffect, useState, useMemo } from 'react';
import { 
    Container, 
    Typography, 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Dialog, 
    Stack,
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Grid, 
    Chip, 
    IconButton, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    InputAdornment, 
    DialogContentText, 
    Snackbar, 
    Alert, 
    Box,
    FormHelperText,
    Autocomplete, 
    CircularProgress, 
    Tooltip, 
    Divider 
} from '@mui/material';

// ICONOS
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt'; 
import FlashOnIcon from '@mui/icons-material/FlashOn'; 
import BlockIcon from '@mui/icons-material/Block'; 
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import FilterAltIcon from '@mui/icons-material/FilterAlt'; 
import RefreshIcon from '@mui/icons-material/Refresh'; 
import PersonIcon from '@mui/icons-material/Person';   
import HomeWorkIcon from '@mui/icons-material/HomeWork'; 
import SearchIcon from '@mui/icons-material/Search';

// SERVICIOS
import { facturablesService } from '../services/facturablesService';
import { personasService } from '../services/personasService'; 
import { unidadesService } from '../services/unidadesService'; 
import { conceptosService } from '../services/conceptosService';
import { contratosService } from '../services/contratosService'; 

// COMPONENTES
import ModalGenerarHistorial from '../components/ModalGenerarHistorial'; 

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
    const [openHistorial, setOpenHistorial] = useState(false); 
    
    // Estado de carga para el buscador
    const [loading, setLoading] = useState(false); 

    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [deudaACancelar, setDeudaACancelar] = useState(null);

    // --- ESTADO PARA EL BUSCADOR (AUTOCOMPLETE) ---
    const [valorBusqueda, setValorBusqueda] = useState(null); 

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

    // Estado Inicial Inteligente GLOBAL
    const getInitialGlobalState = () => {
        const hoy = new Date();
        const periodo = hoy.toISOString().slice(0, 7); 
        
        const [year, month] = periodo.split('-').map(Number);
        const fechaVencimientoObj = new Date(year, month + 1, 0); 
        const fechaVencimientoStr = fechaVencimientoObj.toISOString().slice(0, 10);

        return {
            periodo: periodo,
            fecha_vencimiento: fechaVencimientoStr, 
            id_concepto: '',
            tipo_unidad: 'Todos',
            monto_override: ''
        };
    };
    const [formGlobal, setFormGlobal] = useState(getInitialGlobalState());

    const [notificacion, setNotificacion] = useState({
        open: false, mensaje: '', tipo: 'info'
    });

    // ESTADO PARA ROLLBACK
    const [openRollback, setOpenRollback] = useState(false);
    const [formRollback, setFormRollback] = useState({
        periodo: new Date().toISOString().slice(0, 7),
        id_concepto: '',
        tipo_unidad: 'Todos', 
        motivo: ''
    });

    // --- LÓGICA DINÁMICA: TIPOS DE UNIDAD ---
    const tiposDeUnidadDisponibles = [
        ...new Set(unidades.filter(u => u.activo).map(u => u.tipo_unidad))
    ].sort();

    const mostrarMensaje = (mensaje, tipo = 'success') => {
        setNotificacion({ open: true, mensaje, tipo });
    };

    const handleCerrarNotificacion = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotificacion({ ...notificacion, open: false });
    };

    // --- CARGA INICIAL ---
    const cargarDatos = async () => {
        setLoading(true);
        try {
            // 1. Cargamos los catálogos primero
            const [dataPersonas, dataUnidades, dataConceptos, dataContratos] = await Promise.all([
                personasService.obtenerTodas(),
                unidadesService.obtenerTodas(),
                conceptosService.obtenerTodos(),
                contratosService.obtenerTodos() 
            ]);
            setPersonas(dataPersonas);
            setUnidades(dataUnidades);
            setConceptos(dataConceptos);
            setContratos(dataContratos);

            // 2. Cargamos las deudas (Por defecto las ultimas 100 para no saturar)
            const dataDeudas = await facturablesService.obtenerTodas(0, 100);
            setDeudas(dataDeudas);

        } catch (error) {
            console.error("Error cargando datos:", error);
            mostrarMensaje("Error de conexión al cargar las deudas.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // --- LÓGICA DEL BUSCADOR (CONECTADA AL SERVIDOR) ---
    const handleSeleccionBusqueda = async (event, newValue) => {
        setValorBusqueda(newValue);
        
        // Si el usuario limpia el buscador, recargamos la lista por defecto
        if (!newValue) {
            const data = await facturablesService.obtenerTodas(0, 100);
            setDeudas(data);
            return;
        }

        setLoading(true);
        try {
            let idParaBuscar = null;

            if (newValue.type === 'Unidad') {
                // Caso A: Seleccionó una unidad directamente
                idParaBuscar = newValue.id;
            } else if (newValue.type === 'Propietario') {
                // Caso B: Seleccionó una persona, buscamos su unidad en contratos
                const contratoActivo = contratos.find(c => c.id_persona === newValue.id && c.estado === 'Activo');
                if (contratoActivo) {
                    idParaBuscar = contratoActivo.id_unidad;
                } else {
                    mostrarMensaje("Este propietario no tiene una unidad activa asignada.", "warning");
                    setLoading(false);
                    return;
                }
            }

            if (idParaBuscar) {
                // 🔥 AQUÍ SE LLAMA A TU SERVICIO /facturables/unidad/{id}
                const resultados = await facturablesService.obtenerPorUnidad(idParaBuscar);
                setDeudas(resultados);
                
                if (resultados.length === 0) {
                    mostrarMensaje("No se encontraron deudas registradas para esta unidad.", "info");
                }
            }

        } catch (error) {
            console.error("Error al buscar en servidor:", error);
            mostrarMensaje("Error al realizar la búsqueda en el servidor.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Preparamos la lista para el Autocomplete
    const opcionesBusqueda = useMemo(() => {
        const opcionesUnidades = unidades.map(u => ({
            label: `${u.identificador_unico} (${u.tipo_unidad})`,
            id: u.id_unidad,
            type: 'Unidad'
        }));
        
        const opcionesPersonas = personas.map(p => ({
            label: `${p.nombre || p.nombres} ${p.apellido || p.apellidos}`,
            id: p.id_persona,
            type: 'Propietario'
        }));

        return [...opcionesUnidades, ...opcionesPersonas];
    }, [unidades, personas]);


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

        if (name === 'periodo' && value.length === 7 && value.includes('-')) {
            try {
                const [anioStr, mesStr] = value.split('-');
                const anio = parseInt(anioStr);
                const mes = parseInt(mesStr);
                if (!isNaN(anio) && !isNaN(mes) && mes >= 1 && mes <= 12) {
                    const fechaVencimientoObj = new Date(anio, mes + 1, 0);
                    if (!isNaN(fechaVencimientoObj.getTime())) {
                        nuevoEstado.fecha_vencimiento = fechaVencimientoObj.toISOString().slice(0, 10);
                    }
                }
            } catch (error) { console.log("Esperando fecha..."); }
        }
        setFormGlobal(nuevoEstado);
    };

    const handleGuardarManual = async () => {
        try {
            const fechaLimpia = formulario.fecha_vencimiento === '' ? null : formulario.fecha_vencimiento;

            if (!formulario.fecha_vencimiento) {
                mostrarMensaje("La Fecha de Vencimiento es obligatoria.", "warning");
                return; 
            }

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
            
            // Recargamos datos: Si hay búsqueda activa, repetimos la búsqueda, si no, carga general
            if (valorBusqueda) {
                handleSeleccionBusqueda(null, valorBusqueda);
            } else {
                cargarDatos();
            }

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
            
            const filtroTexto = formGlobal.tipo_unidad === 'Todos' ? 'TODAS las unidades' : `SOLO ${formGlobal.tipo_unidad}s`;
            mostrarMensaje(`Generando para ${filtroTexto}...`, "info");
            
            // --- CORRECCIÓN AQUÍ ---
            // Preparamos los datos limpios para que Python no se queje
            const payload = {
                ...formGlobal,
                // 1. Si el monto está vacío (''), enviamos null. Si tiene numero, lo convertimos a float.
                monto_override: formGlobal.monto_override === '' ? null : parseFloat(formGlobal.monto_override),
                // 2. Aseguramos que el concepto sea un entero
                id_concepto: parseInt(formGlobal.id_concepto, 10)
            };

            // Enviamos el 'payload' limpio en lugar de 'formGlobal' sucio
            const resultado = await facturablesService.generarGlobal(payload);
            
            mostrarMensaje(resultado.mensaje || "Generación masiva completada.", "success");
            setOpenGlobalModal(false);
            cargarDatos(); // Usamos la función de carga que tengas activa (cargarDatos o cargarDatosIniciales)
        } catch (error) {
            console.error("Error generación:", error); // Log para ver detalles en consola
            const msg = error.response?.data?.detail || "Error en generación masiva.";
            // Si el error es un array (típico de validación 422), lo mostramos bonito
            const textoError = Array.isArray(msg) 
                ? msg.map(e => `${e.loc[e.loc.length-1]}: ${e.msg}`).join(', ') 
                : (typeof msg === 'object' ? JSON.stringify(msg) : msg);

            mostrarMensaje(`Error: ${textoError}`, "error");
        }
    };

    const confirmarCancelacion = async () => {
        try {
            if (deudaACancelar) {
                await facturablesService.cancelar(deudaACancelar.id_item);
                mostrarMensaje("Deuda anulada.", "success");
                
                // Recarga inteligente
                if (valorBusqueda) {
                    handleSeleccionBusqueda(null, valorBusqueda);
                } else {
                    cargarDatos();
                }
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

    const handleChangeRollback = (e) => {
        setFormRollback({ ...formRollback, [e.target.name]: e.target.value });
    };

    const handleEjecutarRollback = async () => {
        if (!formRollback.periodo || !formRollback.id_concepto || formRollback.motivo.length < 5) {
            mostrarMensaje("Complete periodo, concepto y un motivo válido (min 5 letras).", "warning");
            return;
        }

        if (!window.confirm("⚠️ ¿ESTÁS SEGURO? Esto eliminará todas las deudas PENDIENTES que coincidan con el filtro.")) {
            return;
        }

        try {
            const payload = {
                ...formRollback,
                id_concepto: parseInt(formRollback.id_concepto, 10) 
            };

            const res = await facturablesService.anularMasivo(payload);
            
            mostrarMensaje(res.mensaje, "success");
            setOpenRollback(false);
            cargarDatos(); 

        } catch (error) {
            console.error("Error Rollback:", error);
            
            let msg = "Error al anular masivamente.";
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        msg = data.detail.map(e => `Campo ${e.loc[e.loc.length-1]}: ${e.msg}`).join(", ");
                    } else {
                        msg = data.detail;
                    }
                }
            }
            mostrarMensaje("🛑 " + msg, "error");
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 2 }}>
            
            {/* --- CABECERA REDISEÑADA: 3 FILAS CLARAS PARA EVITAR SOLAPAMIENTOS --- */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                
                {/* Usamos un Stack Vertical para forzar el orden: Título -> Botones -> Búsqueda */}
                <Stack spacing={2}>
                    
                    {/* FILA 1: TÍTULO y RECARGA */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptIcon color="primary" sx={{ fontSize: 32 }} /> 
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                                Cuentas por Cobrar
                            </Typography>
                        </Box>
                        
                        <Tooltip title="Recargar lista completa">
                            <IconButton onClick={cargarDatos} disabled={loading} size="medium">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* FILA 2: BOTONES DE ACCIÓN (Alineados a la derecha o izquierda según prefieras) */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            startIcon={<HistoryIcon />} 
                            onClick={() => setOpenHistorial(true)}
                        >
                            Historial
                        </Button>

                        <Button 
                            variant="outlined" 
                            color="error"
                            startIcon={<BlockIcon />} 
                            onClick={() => setOpenRollback(true)}
                            sx={{ borderColor: '#ef5350', color: '#ef5350' }}
                        >
                            Deshacer
                        </Button>

                        {/* Separador Vertical Visual */}
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'grey.400' }} />

                        <Button 
                            variant="contained" 
                            color="secondary"
                            startIcon={<FlashOnIcon />} 
                            onClick={() => setOpenGlobalModal(true)}
                            sx={{ boxShadow: 2 }}
                        >
                            Generar Mes
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
                            sx={{ boxShadow: 2 }}
                        >
                            Cargo Manual
                        </Button>
                    </Box>

                    {/* FILA 3: BUSCADOR GIGANTE (Ocupa todo el ancho disponible) */}
                    <Box sx={{ width: '100%', pt: 1 }}>
                        <Autocomplete
                            fullWidth // Asegura que use todo el ancho del Stack
                            options={opcionesBusqueda}
                            groupBy={(option) => option.type}
                            getOptionLabel={(option) => option.label}
                            value={valorBusqueda}
                            onChange={handleSeleccionBusqueda} // <-- LLAMADA AL SERVIDOR
                            disabled={loading}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="🔍 Buscar por Unidad o Propietario" 
                                    placeholder="Seleccione de la lista..."
                                    variant="outlined"
                                    sx={{ bgcolor: '#f8fafc' }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {option.type === 'Unidad' ? <HomeWorkIcon color="action" /> : <PersonIcon color="action" />}
                                        <Typography variant="body1">
                                            {option.label}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                        />
                    </Box>

                </Stack>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                <Table size="small" stickyHeader>
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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                    <CircularProgress />
                                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                        Buscando información en el servidor...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : deudas.length > 0 ? (
                            deudas.map((row) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {valorBusqueda 
                                            ? `No se encontraron deudas para ${valorBusqueda.label}`
                                            : "No hay registros recientes."}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
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
                            </FormControl>
                        </Grid>
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
                            </FormControl>
                        </Grid>
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
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Periodo" name="periodo" type="month" fullWidth required disabled={modoEdicion} InputLabelProps={{ shrink: true }} value={formulario.periodo} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Monto" name="monto_base" type="number" fullWidth required disabled={modoEdicion} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} value={formulario.monto_base} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Vencimiento" name="fecha_vencimiento" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={formulario.fecha_vencimiento} onChange={handleChange} />
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
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <FlashOnIcon sx={{ mr: 1, color: 'secondary.main' }} /> 
                    Generación Masiva de Cuotas
                </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Seleccione los parámetros para generar las deudas de forma masiva.
                        </DialogContentText>
                        
                        <Box sx={{ mt: 1 }}>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Filtrar por Tipo de Unidad</InputLabel>
                                <Select
                                    name="tipo_unidad"
                                    value={formGlobal.tipo_unidad}
                                    label="Filtrar por Tipo de Unidad"
                                    onChange={handleChangeGlobal}
                                    startAdornment={<InputAdornment position="start"><FilterAltIcon /></InputAdornment>}
                                >
                                    <MenuItem value="Todos" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                        🚀 Todos (Sin filtro)
                                    </MenuItem>
                                    {tiposDeUnidadDisponibles.map((tipo) => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo === 'Departamento' ? '🏠 ' : 
                                            tipo === 'Baulera' ? '📦 ' : 
                                            tipo === 'Parqueo' ? '🚗 ' : 
                                            tipo === 'Local' ? '🏪 ' : '🔸 '}
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Concepto de Cobro</InputLabel>
                                        <Select
                                            name="id_concepto"
                                            value={formGlobal.id_concepto}
                                            label="Concepto de Cobro"
                                            onChange={handleChangeGlobal}
                                            MenuProps={MenuProps}
                                        >
                                            {conceptos.filter(c => c.activo).map((c) => (
                                                <MenuItem key={c.id_concepto} value={c.id_concepto}>{c.nombre}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Monto Fijo (Opcional)"
                                        name="monto_override"
                                        type="number"
                                        fullWidth
                                        value={formGlobal.monto_override || ''}
                                        onChange={handleChangeGlobal}
                                        placeholder="Ej: 220"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">Bs</InputAdornment>,
                                        }}
                                        helperText={formGlobal.monto_override ? "⚠️ Se ignorarán los contratos." : "Dejar vacío para usar contrato."}
                                        color={formGlobal.monto_override ? "warning" : "primary"}
                                        focused={!!formGlobal.monto_override}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} sx={{ mt: 0 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Periodo (YYYY-MM)"
                                        name="periodo"
                                        type="text" 
                                        placeholder="2025-12"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={formGlobal.periodo}
                                        onChange={handleChangeGlobal}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Fecha de Vencimiento"
                                        name="fecha_vencimiento"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={formGlobal.fecha_vencimiento}
                                        onChange={handleChangeGlobal}
                                    />
                                </Grid>
                            </Grid>

                        </Box>
                    </DialogContent>                
                <DialogActions>
                    <Button onClick={() => setOpenGlobalModal(false)}>Cancelar</Button>
                    <Button onClick={handleGenerarGlobal} variant="contained" color="secondary">
                        Ejecutar Generación
                    </Button>
                </DialogActions>
            </Dialog>

            <ModalGenerarHistorial 
                open={openHistorial}
                onClose={() => setOpenHistorial(false)}
                onSuccess={cargarDatos} 
            />

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
            
            {/* MODAL ROLLBACK / DESHACER MASIVO */}
            <Dialog open={openRollback} onClose={() => setOpenRollback(false)}>
                <DialogTitle sx={{ bgcolor: '#ffebee', color: '#c62828', display: 'flex', alignItems: 'center' }}>
                    <BlockIcon sx={{ mr: 1 }} /> 
                    Deshacer Generación (Rollback)
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mt: 2, mb: 2 }}>
                        Si generaste cuotas por error, usa esto para borrarlas. 
                        <br/>
                        <b>Solo se borrarán las que siguen en estado "PENDIENTE".</b> Las pagadas se respetan.
                    </DialogContentText>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Periodo a Borrar"
                                name="periodo"
                                type="month"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formRollback.periodo}
                                onChange={handleChangeRollback}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Concepto</InputLabel>
                                <Select
                                    name="id_concepto"
                                    value={formRollback.id_concepto}
                                    label="Concepto"
                                    onChange={handleChangeRollback}
                                >
                                    {conceptos.filter(c => c.activo).map((c) => (
                                        <MenuItem key={c.id_concepto} value={c.id_concepto}>{c.nombre}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Filtrar por Tipo (Opcional)</InputLabel>
                                <Select
                                    name="tipo_unidad"
                                    value={formRollback.tipo_unidad}
                                    label="Filtrar por Tipo (Opcional)"
                                    onChange={handleChangeRollback}
                                >
                                    <MenuItem value="Todos">🚀 Todos (Sin Filtro)</MenuItem>
                                    {tiposDeUnidadDisponibles.map((tipo) => (
                                        <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Motivo de la anulación (Obligatorio)"
                                name="motivo"
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Ej: Error en el monto base, se generaron duplicados..."
                                value={formRollback.motivo}
                                onChange={handleChangeRollback}
                                error={formRollback.motivo.length > 0 && formRollback.motivo.length < 5}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRollback(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleEjecutarRollback} 
                        variant="contained" 
                        color="error"
                        disabled={!formRollback.id_concepto || formRollback.motivo.length < 5}
                    >
                        Ejecutar Eliminación
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminDeudas;