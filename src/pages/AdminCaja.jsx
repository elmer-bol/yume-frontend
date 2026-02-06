import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Paper, Typography, TextField, Button,
    MenuItem, Card, CardContent, InputAdornment, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, Box, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Divider, Checkbox, Tooltip, Collapse
} from '@mui/material';

// Iconos
import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'; 
import HandshakeIcon from '@mui/icons-material/Handshake';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; 
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // <--- Icono Fecha

// Servicios
import { mediosService } from '../services/mediosService';
import { contratosService } from '../services/contratosService';
import { facturablesService } from '../services/facturablesService';
import { ingresoService } from '../services/ingresoService';
import { planesService } from '../services/planesService';
// import { cajaService } from '../services/cajaService'; // No se usa por ahora

// Componentes
import ModalTransferencia from '../components/ModalTransferencia';

// Función auxiliar para ID
const obtenerId = (t) => {
    if (!t) return "";
    return t.id_transaccion_ingreso || t.id_transaccion || t.id || "";
};

// =============================================================================
// COMPONENTE AUXILIAR: FILA EXPANDIBLE
// =============================================================================
function Row({ row, onImprimir, onAnular }) {
    const [open, setOpen] = useState(false);
    const isAnulado = row.estado && row.estado.toLowerCase() === 'anulado';

    const rowStyle = {
        bgcolor: isAnulado ? '#ffebee' : 'inherit',
        opacity: isAnulado ? 0.7 : 1,
        '& > *': { borderBottom: 'unset' }
    };

    return (
        <React.Fragment>
            <TableRow sx={rowStyle} hover>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">#{obtenerId(row)}</TableCell>
                <TableCell>{row.fecha}</TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                        {row.relacion_cliente?.persona?.nombres} {row.relacion_cliente?.persona?.apellidos}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Chip label={row.relacion_cliente?.unidad?.identificador_unico || "S/N"} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>
                    Bs {parseFloat(row.monto_total).toFixed(2)}
                </TableCell>
                <TableCell>{row.descripcion || '-'}</TableCell>
                <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {
                                row.usuario_creador?.persona?.nombres 
                                ? `${row.usuario_creador.persona.nombres} ${row.usuario_creador.persona.apellidos || ''}`.toLowerCase()
                                : (row.usuario_creador?.email || (row.id_usuario_creador === 1 ? "Admin" : `Cajero ID:${row.id_usuario_creador}`))
                            }
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell align="center">
                    {!isAnulado && (
                        <IconButton color="primary" onClick={() => onImprimir(row)}>
                            <PrintIcon />
                        </IconButton>
                    )}
                </TableCell>
                <TableCell align="center">
                    {!isAnulado ? (
                        <IconButton color="error" size="small" onClick={() => onAnular(row)}>
                            <DeleteIcon />
                        </IconButton>
                    ) : (
                        <Typography variant="caption" color="error" fontWeight="bold">ANULADO</Typography>
                    )}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, backgroundColor: '#f9f9f9', p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                🧾 Desglose del Pago:
                            </Typography>
                            {row.monto_billetera_usado > 0 && (
                                <Alert severity="info" sx={{ mb: 1, py: 0 }}>
                                    Se usó <b>Bs {row.monto_billetera_usado}</b> del Saldo a Favor.
                                </Alert>
                            )}
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Detalle Deuda</b></TableCell>
                                        <TableCell align="right"><b>Monto Aplicado</b></TableCell>
                                        <TableCell align="right"><b>Estado</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.detalles && row.detalles.length > 0 ? (
                                        row.detalles.map((detalleRow, index) => (
                                            <TableRow key={index}>
                                                <TableCell component="th" scope="row">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {detalleRow.item_facturable 
                                                            ? `Periodo: ${detalleRow.item_facturable.periodo}` 
                                                            : `Item #${detalleRow.id_item}`
                                                        }
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID: {detalleRow.id_item}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    Bs {parseFloat(detalleRow.monto_aplicado).toFixed(2)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip label={detalleRow.estado} size="small" color={detalleRow.estado === 'REVERSADO' ? 'error' : 'success'} variant="outlined" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3}>Sin detalles</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

// =============================================================================
// COMPONENTE PRINCIPAL: AdminCaja
// =============================================================================
const AdminCaja = () => {
    // --- ESTADOS ---
    const [medios, setMedios] = useState([]);
    const [listaContratos, setListaContratos] = useState([]);
    const [contratosFiltrados, setContratosFiltrados] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
    const [deudas, setDeudas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [historial, setHistorial] = useState([]);
    
    // Modales
    const [reciboOpen, setReciboOpen] = useState(false);
    const [datoRecibo, setDatoRecibo] = useState(null);
    const [planOpen, setPlanOpen] = useState(false);
    const [transferenciaOpen, setTransferenciaOpen] = useState(false);

    // Formularios
    const [formPago, setFormPago] = useState({
        id_medio_ingreso: '',
        monto_total: '',
        num_documento: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0] // <--- NUEVO: Fecha por defecto HOY
    });

    const [planForm, setPlanForm] = useState({
        numero_cuotas: 2,
        fecha_inicio: new Date().toISOString().split('T')[0],
        observaciones: ''
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

    // --- CARGA INICIAL ---
    useEffect(() => {
        const initData = async () => {
            try {
                const dataMedios = await mediosService.obtenerTodos();
                setMedios(dataMedios.filter(m => m.activo));
                const dataContratos = await contratosService.obtenerActivos();
                setListaContratos(dataContratos);
                cargarHistorialPagos();
            } catch (error) { console.error(error); }
        };
        initData();
    }, []);

    // --- CALCULO AUTOMATICO MONTO ---
    useEffect(() => {
        const totalSeleccionado = deudas
            .filter(d => seleccionados.includes(d.id_item))
            .reduce((sum, item) => sum + parseFloat(item.saldo_pendiente), 0);
        
        if (totalSeleccionado > 0 && !planOpen) {
            setFormPago(prev => ({ ...prev, monto_total: totalSeleccionado }));
        }
    }, [seleccionados, deudas, planOpen]);

    const cargarHistorialPagos = async () => {
        try {
            const data = await ingresoService.obtenerHistorial();
            setHistorial(data);
        } catch (error) { console.error(error); }
    };

    const handleBuscar = (val) => {
        setBusqueda(val);
        if (val.length < 1) { setContratosFiltrados([]); return; }
        const term = val.toLowerCase();
        const resultados = listaContratos.filter(c => {
             const n = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : "";
             const u = c.unidad ? c.unidad.identificador_unico : "";
             return `${n} ${u}`.toLowerCase().includes(term);
        });
        setContratosFiltrados(resultados);
    };

    const seleccionarContrato = async (contrato) => {
        setContratoSeleccionado(contrato);
        setContratosFiltrados([]);
        setBusqueda('');
        setDeudas([]);
        setSeleccionados([]);
        try {
            if (contrato.id_unidad) {
                const items = await facturablesService.obtenerDeudaPendiente(contrato.id_unidad);
                setDeudas(items);
            }
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => setFormPago({ ...formPago, [e.target.name]: e.target.value });

    // --- COBRAR ---
    const handlePagar = async () => {
        if (!contratoSeleccionado) return;
        if (!formPago.id_medio_ingreso) return alert("Seleccione medio de pago");
        
        setLoading(true);
        try {
            let dineroDisponible = parseFloat(formPago.monto_total);
            
            const detallesPago = seleccionados.map(id => {
                const item = deudas.find(d => d.id_item === id);
                if (!item) return null;
                const deudaActual = parseFloat(item.saldo_pendiente);
                let montoAUsar = 0;
                if (dineroDisponible > 0) {
                    if (dineroDisponible >= deudaActual) {
                        montoAUsar = deudaActual;
                        dineroDisponible -= deudaActual; 
                    } else {
                        montoAUsar = dineroDisponible;
                        dineroDisponible = 0; 
                    }
                }
                if (montoAUsar > 0.001) {
                    return { id_item: id, monto_aplicado: montoAUsar };
                }
                return null;
            }).filter(d => d !== null); 

            const payload = {
                id_relacion: contratoSeleccionado.id_relacion,
                id_medio_ingreso: formPago.id_medio_ingreso,
                monto_total: parseFloat(formPago.monto_total),
                fecha: formPago.fecha, // <--- ENVIAMOS LA FECHA SELECCIONADA POR EL USUARIO
                num_documento: formPago.num_documento,
                descripcion: formPago.descripcion,
                id_usuario_creador: 1, 
                id_deposito: null, 
                monto_billetera_usado: 0.0, 
                detalles: detallesPago 
            };

            await ingresoService.crearIngreso(payload);
            setMensaje({ open: true, text: "Pago registrado exitosamente", type: "success" });
            
            // RESETEAMOS FORMULARIO
            setFormPago({ 
                id_medio_ingreso: '', 
                monto_total: '', 
                num_documento: '', 
                descripcion: '', 
                fecha: new Date().toISOString().split('T')[0] // Reseteamos a HOY
            });
            
            setSeleccionados([]); 
            seleccionarContrato(contratoSeleccionado); 
            cargarHistorialPagos();
        } catch (error) {
            console.error("🔥 Error:", error);
            let mensajeError = "Error al procesar pago";
            if (error.response && error.response.data && error.response.data.detail) {
                const det = error.response.data.detail;
                mensajeError = Array.isArray(det) ? det.map(d => `${d.msg}`).join("\n") : det;
            }
            alert("🛑 ERROR: " + mensajeError);
        } finally {
            setLoading(false);
        }
    };

    // --- PLANES ---
    const handleAbrirPlan = () => {
        if (seleccionados.length === 0) {
            alert("Seleccione al menos una deuda para refinanciar.");
            return;
        }
        setPlanOpen(true);
    };

    const handleCrearPlan = async () => { /* ... Lógica Plan igual ... */ 
        if (!contratoSeleccionado) return;
        setLoading(true);
        try {
            const totalDeudaSeleccionada = deudas
                .filter(d => seleccionados.includes(d.id_item))
                .reduce((sum, item) => sum + parseFloat(item.saldo_pendiente), 0);

            const montoCuota = (totalDeudaSeleccionada / planForm.numero_cuotas).toFixed(2);

            const payload = {
                id_persona: contratoSeleccionado.id_persona || contratoSeleccionado.persona.id_persona,
                items_ids: seleccionados,
                numero_cuotas: parseInt(planForm.numero_cuotas),
                monto_cuota_mensual: parseFloat(montoCuota),
                fecha_inicio_pago: planForm.fecha_inicio,
                observaciones: planForm.observaciones || `Refinanciamiento ${seleccionados.length} items.`
            };

            await planesService.crearPlan(payload);
            setMensaje({ open: true, text: "✅ Plan creado correctamente. Deudas congeladas.", type: "success" });
            setPlanOpen(false);
            setSeleccionados([]);
            seleccionarContrato(contratoSeleccionado);
        } catch (error) {
            console.error("Error creando plan:", error);
            alert("Error al crear plan");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDeuda = (idItem) => {
        const selectedIndex = seleccionados.indexOf(idItem);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = newSelected.concat(seleccionados, idItem);
        else if (selectedIndex === 0) newSelected = newSelected.concat(seleccionados.slice(1));
        else if (selectedIndex === seleccionados.length - 1) newSelected = newSelected.concat(seleccionados.slice(0, -1));
        else if (selectedIndex > 0) newSelected = newSelected.concat(seleccionados.slice(0, selectedIndex), seleccionados.slice(selectedIndex + 1));
        setSeleccionados(newSelected);
    };

    const handleAnular = async (transaccion) => {
        const idReal = obtenerId(transaccion);
        if (!confirm("¿Seguro de ANULAR?")) return;
        setLoading(true);
        try {
            await ingresoService.anularIngreso(idReal, 1);
            setMensaje({ open: true, text: "Anulado correctamente.", type: "success" });
            cargarHistorialPagos(); 
            if (contratoSeleccionado) await seleccionarContrato(contratoSeleccionado);
        } catch (error) {
            setMensaje({ open: true, text: "Error al anular", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const abrirRecibo = (transaccion) => { setDatoRecibo(transaccion); setReciboOpen(true); };
    const imprimirNavegador = () => { window.print(); };
    const totalDeuda = deudas.reduce((acc, item) => acc + parseFloat(item.saldo_pendiente), 0);

    // MANEJADOR PARA EL FORMULARIO DEL PLAN (Nuevo)
    const handlePlanChange = (e) => {
        setPlanForm({ ...planForm, [e.target.name]: e.target.value });
    };

    // Calculamos la cuota estimada para mostrarla en vivo
    const totalParaPlan = deudas
        .filter(d => seleccionados.includes(d.id_item || d.id))
        .reduce((sum, item) => sum + parseFloat(item.saldo_pendiente), 0);
        
    const cuotaEstimada = planForm.numero_cuotas > 0 
        ? (totalParaPlan / planForm.numero_cuotas).toFixed(2) 
        : 0;

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            
            {/* 1. CABECERA */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1565c0', display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 1, fontSize: 32 }}/> Caja y Cobranzas
                </Typography>
                <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={() => setTransferenciaOpen(true)}>
                    Transferencia Interna
                </Button>
            </Box>

            {/* 2. BUSCADOR */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <SearchIcon sx={{ fontSize: 16, verticalAlign: '-2px' }}/> Buscar Inquilino
                        </Typography>
                        <Box position="relative">
                            <TextField 
                                fullWidth 
                                placeholder="Escriba Nombre o Unidad..." 
                                value={busqueda} 
                                onChange={(e) => handleBuscar(e.target.value)} 
                                size="small"
                                sx={{ bgcolor: 'white' }}
                            />
                            {contratosFiltrados.length > 0 && (
                                <Paper sx={{ position: 'absolute', width: '100%', zIndex: 99, maxHeight: 300, overflow: 'auto', mt: 0.5, boxShadow: 3 }}>
                                    {contratosFiltrados.map((c) => (
                                        <Box key={c.id_relacion} sx={{ p: 1.5, cursor: 'pointer', borderBottom: '1px solid #eee', '&:hover': { bgcolor: '#e3f2fd' } }} onClick={() => seleccionarContrato(c)}>
                                            <Typography fontWeight="bold" variant="body2">{c.persona?.nombres} {c.persona?.apellidos}</Typography>
                                            <Typography variant="caption" color="primary">UNIDAD: {c.unidad?.identificador_unico}</Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        {contratoSeleccionado ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px dashed #bdbdbd', borderRadius: 1, bgcolor: 'white' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">CLIENTE</Typography>
                                    <Typography variant="subtitle1" fontWeight="bold">{contratoSeleccionado.persona?.nombres} {contratoSeleccionado.persona?.apellidos}</Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">UNIDAD</Typography>
                                    <Chip label={contratoSeleccionado.unidad?.identificador_unico} color="primary" size="small" />
                                </Box>
                                <Box sx={{ flexGrow: 1 }} />
                                <Chip label={totalDeuda > 0 ? `DEUDA: Bs ${totalDeuda.toFixed(2)}` : "AL DÍA"} color={totalDeuda > 0 ? "error" : "success"} variant={totalDeuda > 0 ? "filled" : "outlined"} />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.disabled" align="center">👈 Seleccione un inquilino para comenzar.</Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* 3. ZONA DE TRABAJO */}
            <Grid container spacing={3} alignItems="flex-start">
                
                {/* IZQUIERDA: DETALLE DE DEUDAS */}
                <Grid item xs={12} md={8} lg={9}>
                    <Paper elevation={3} sx={{ overflow: 'hidden', border: '1px solid #e0e0e0', minHeight: 500 }}>
                        <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" color="#424242">
                                <ReceiptLongIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#ef6c00' }}/> 
                                Detalle de Deudas
                            </Typography>
                            <Button size="small" startIcon={<HandshakeIcon />} onClick={handleAbrirPlan} disabled={seleccionados.length === 0}>
                                Crear Plan
                            </Button>
                        </Box>

                        <Box sx={{ p: 0 }}>
                            {contratoSeleccionado ? (
                                <TableContainer sx={{ maxHeight: 450 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox" sx={{ bgcolor: '#fafafa' }}></TableCell>
                                                <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 'bold' }}>Concepto</TableCell>
                                                <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 'bold' }}>Periodo</TableCell>
                                                <TableCell align="right" sx={{ bgcolor: '#fafafa', fontWeight: 'bold' }}>Saldo</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {deudas.map((d) => {
                                                const idReal = d.id_item || d.id;
                                                const isSelected = seleccionados.indexOf(idReal) !== -1;
                                                return (
                                                    <TableRow key={idReal} hover onClick={() => handleToggleDeuda(idReal)} role="checkbox" aria-checked={isSelected} selected={isSelected} sx={{ cursor: 'pointer' }}>
                                                        <TableCell padding="checkbox"><Checkbox checked={isSelected} size="small" /></TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">{d.concepto?.nombre}</Typography>
                                                            {d.descripcion && <Typography variant="caption" color="text.secondary">{d.descripcion}</Typography>}
                                                        </TableCell>
                                                        <TableCell>{d.periodo}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{parseFloat(d.saldo_pendiente).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {deudas.length === 0 && (
                                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>✨ ¡Al día! No tiene deuda pendiente.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ p: 10, textAlign: 'center', color: '#bdbdbd' }}>
                                    <Typography variant="h6">Esperando selección...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* DERECHA: TERMINAL DE COBRO */}
                <Grid item xs={12} md={4} lg={3}>
                    <Card elevation={6} sx={{ position: 'sticky', top: 20, borderTop: '4px solid #2e7d32' }}>
                        <Box sx={{ bgcolor: '#e8f5e9', p: 1.5, textAlign: 'center', borderBottom: '1px solid #c8e6c9' }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="#1b5e20">
                                <AttachMoneyIcon sx={{ fontSize: 18, verticalAlign: 'middle' }}/> TERMINAL DE COBRO
                            </Typography>
                        </Box>
                        
                        <CardContent sx={{ p: 2 }}>
                            <Box display="flex" flexDirection="column" gap={2}>
                                {/* --- CAMPO DE FECHA NUEVO --- */}
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Fecha de Pago"
                                    name="fecha"
                                    value={formPago.fecha}
                                    onChange={handleChange}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" /></InputAdornment>,
                                    }}
                                    helperText="Puede registrar pagos de días anteriores"
                                />

                                <TextField 
                                    select label="Medio de Pago" name="id_medio_ingreso" 
                                    value={formPago.id_medio_ingreso} onChange={handleChange} size="small" fullWidth
                                >
                                    {medios.map(m => <MenuItem key={m.id_medio_ingreso} value={m.id_medio_ingreso}>{m.nombre}</MenuItem>)}
                                </TextField>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">Monto a Recibir</Typography>
                                    <TextField 
                                        fullWidth type="number" name="monto_total" 
                                        value={formPago.monto_total} onChange={handleChange} 
                                        InputProps={{ startAdornment: <InputAdornment position="start">Bs</InputAdornment>, style: { fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' } }} 
                                    />
                                </Box>

                                <TextField label="Nro. Recibo / Comprobante" name="num_documento" value={formPago.num_documento} onChange={handleChange} size="small" fullWidth />
                                <TextField label="Nota" name="descripcion" value={formPago.descripcion} onChange={handleChange} size="small" multiline rows={2} fullWidth />

                                <Button 
                                    fullWidth variant="contained" color="success" size="large" 
                                    onClick={handlePagar} disabled={!contratoSeleccionado || loading}
                                    sx={{ mt: 1, py: 1.5, fontWeight: 'bold' }}
                                >
                                    {loading ? "..." : "COBRAR"}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 4. HISTORIAL */}
            <Box mt={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#555' }}>
                        <HistoryIcon sx={{ fontSize: 18, verticalAlign: '-3px', mr: 0.5 }} /> Últimos Movimientos
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell width={30}/>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Fecha Pago</TableCell> {/* Etiqueta cambiada */}
                                    <TableCell>Inquilino</TableCell>
                                    <TableCell>Unidad</TableCell>
                                    <TableCell>Monto</TableCell>
                                    <TableCell>Detalle</TableCell>
                                    <TableCell>Registrado Por</TableCell>
                                    <TableCell align="center">Acción</TableCell>
                                    <TableCell align="center">Anular</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historial.slice(0, 5).map((h) => <Row key={h.id_transaccion_ingreso || h.id_transaccion} row={h} onImprimir={abrirRecibo} onAnular={handleAnular} />)}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>

            {/* MODALES */}
            <Dialog open={reciboOpen} onClose={() => setReciboOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', borderBottom: '1px dashed #ccc' }}>🏢 RECIBO</DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {datoRecibo && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold">Bs {datoRecibo.monto_total}</Typography>
                            <Typography variant="body2" color="text.secondary">Fecha de Pago: {datoRecibo.fecha}</Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1">{datoRecibo.relacion_cliente?.persona?.nombres}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                    <Button onClick={imprimirNavegador} variant="contained" startIcon={<PrintIcon />}>Imprimir</Button>
                    <Button onClick={() => setReciboOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={planOpen} onClose={() => setPlanOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#1565c0', color: 'white' }}>
                    📅 Configurar Plan de Pagos
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Box sx={{ p: 1 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Estás a punto de refinanciar una deuda total de: <strong>Bs {totalParaPlan.toFixed(2)}</strong>
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Cantidad de Cuotas"
                                    name="numero_cuotas"
                                    type="number"
                                    value={planForm.numero_cuotas}
                                    onChange={handlePlanChange}
                                    fullWidth
                                    inputProps={{ min: 2, max: 24 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Fecha 1ra Cuota"
                                    name="fecha_inicio"
                                    type="date"
                                    value={planForm.fecha_inicio}
                                    onChange={handlePlanChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">CUOTA MENSUAL APROXIMADA</Typography>
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        Bs {cuotaEstimada}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Observaciones / Motivo"
                                    name="observaciones"
                                    value={planForm.observaciones}
                                    onChange={handlePlanChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Ej: Autorizado por el directorio según acta..."
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setPlanOpen(false)} color="inherit">Cancelar</Button>
                    <Button 
                        onClick={handleCrearPlan} 
                        variant="contained" 
                        color="primary"
                        disabled={loading || planForm.numero_cuotas < 2}
                    >
                        {loading ? "Creando..." : "Confirmar Plan"}
                    </Button>
                </DialogActions>
            </Dialog>

            <ModalTransferencia open={transferenciaOpen} onClose={() => setTransferenciaOpen(false)} onSuccess={() => setMensaje({ open: true, text: "Transferencia Exitosa", type: "success" })} />
            <Snackbar open={mensaje.open} autoHideDuration={4000} onClose={() => setMensaje({...mensaje, open: false})}><Alert severity={mensaje.type}>{mensaje.text}</Alert></Snackbar>
        </Container>
    );
};

export default AdminCaja;