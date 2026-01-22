import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Paper, Typography, TextField, Button,
    MenuItem, Card, CardContent, InputAdornment, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, Box, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Divider, Checkbox, Tooltip, Collapse
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'; // Icono extra para deuda

import { mediosService } from '../services/mediosService';
import { contratosService } from '../services/contratosService';
import { facturablesService } from '../services/facturablesService';
import { ingresoService } from '../services/ingresoService';

// Función auxiliar para encontrar el ID
const obtenerId = (t) => {
    if (!t) return "";
    return t.id_transaccion_ingreso || t.id_transaccion || t.id || "";
};

// =============================================================================
// COMPONENTE AUXILIAR: FILA EXPANDIBLE (Row)
// =============================================================================
function Row({ row, onImprimir, onAnular }) {
    const [open, setOpen] = useState(false);
    const isAnulado = row.estado && row.estado.toLowerCase() === 'anulado';

    const rowStyle = {
        bgcolor: isAnulado ? '#ffebee' : 'inherit',
        opacity: isAnulado ? 0.7 : 1,
        '& > *': { borderBottom: 'unset' }
    };
    const textStyle = {
        color: isAnulado ? 'text.secondary' : 'inherit',
        textDecoration: isAnulado ? 'line-through' : 'none',
        fontWeight: isAnulado ? 'normal' : 'bold'
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
                <TableCell sx={{ color: 'green', ...textStyle }}>
                    Bs {parseFloat(row.monto_total).toFixed(2)}
                </TableCell>
                <TableCell>{row.descripcion || '-'}</TableCell>
                <TableCell>{row.id_usuario_creador === 1 ? "Admin" : "Cajero"}</TableCell>
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
    const [medios, setMedios] = useState([]);
    const [listaContratos, setListaContratos] = useState([]);
    const [contratosFiltrados, setContratosFiltrados] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
    const [deudas, setDeudas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [reciboOpen, setReciboOpen] = useState(false);
    const [datoRecibo, setDatoRecibo] = useState(null);
    const [formPago, setFormPago] = useState({
        id_medio_ingreso: '',
        monto_total: '',
        num_documento: '',
        descripcion: ''
    });
    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

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

    useEffect(() => {
        const totalSeleccionado = deudas
            .filter(d => seleccionados.includes(d.id_item))
            .reduce((sum, item) => sum + parseFloat(item.saldo_pendiente), 0);
        if (totalSeleccionado > 0) {
            setFormPago(prev => ({ ...prev, monto_total: totalSeleccionado }));
        }
    }, [seleccionados, deudas]);

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
        try {
            if (contrato.id_unidad) {
                const items = await facturablesService.obtenerDeudaPendiente(contrato.id_unidad);
                setDeudas(items);
            }
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => setFormPago({ ...formPago, [e.target.name]: e.target.value });

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
                fecha: new Date().toISOString().split('T')[0],
                num_documento: formPago.num_documento,
                descripcion: formPago.descripcion,
                id_usuario_creador: 1, 
                id_deposito: null, 
                monto_billetera_usado: 0.0, 
                detalles: detallesPago 
            };

            await ingresoService.crearIngreso(payload);
            setMensaje({ open: true, text: "Pago registrado exitosamente", type: "success" });
            setFormPago({ id_medio_ingreso: '', monto_total: '', num_documento: '', descripcion: '' });
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

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1565c0' }}>
                Caja / Cobranzas
            </Typography>

            <Grid container spacing={3}>
                
                {/* 1. FILA SUPERIOR: BUSCADOR (Izquierda) + DEUDAS (Derecha) */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6"><SearchIcon sx={{ verticalAlign: 'middle' }}/> Inquilino</Typography>
                        <Box position="relative" sx={{ mt: 2 }}>
                            <TextField fullWidth label="Buscar nombre o unidad..." value={busqueda} onChange={(e) => handleBuscar(e.target.value)} autoComplete="off" />
                            {contratosFiltrados.length > 0 && (
                                <Paper sx={{ position: 'absolute', width: '100%', zIndex: 10, maxHeight: 300, overflow: 'auto' }}>
                                    {contratosFiltrados.map((c) => (
                                        <Box key={c.id_relacion} sx={{ p: 2, cursor: 'pointer', borderBottom: '1px solid #eee', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => seleccionarContrato(c)}>
                                            <Typography fontWeight="bold">{c.persona?.nombres} {c.persona?.apellidos}</Typography>
                                            <Typography variant="caption" color="primary">UNIDAD: {c.unidad?.identificador_unico}</Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            )}
                        </Box>
                        {contratoSeleccionado && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                    {contratoSeleccionado.persona?.nombres} {contratoSeleccionado.persona?.apellidos}
                                </Typography>
                                <Typography variant="body2">
                                    Unidad: {contratoSeleccionado.unidad?.identificador_unico}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%', minHeight: 300 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6"><ReceiptLongIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> Deudas Pendientes</Typography>
                            <Chip label={`Total: Bs ${totalDeuda.toFixed(2)}`} color={totalDeuda > 0 ? "error" : "success"} />
                        </Box>
                        {contratoSeleccionado ? (
                            <TableContainer sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox"></TableCell>
                                            <TableCell>Concepto</TableCell>
                                            <TableCell>Periodo</TableCell>
                                            <TableCell align="right">Saldo</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {deudas.map((d) => {
                                            const idReal = d.id_item || d.id;
                                            const isSelected = seleccionados.indexOf(idReal) !== -1;
                                            return (
                                                <TableRow key={idReal} hover onClick={() => handleToggleDeuda(idReal)} role="checkbox" aria-checked={isSelected} selected={isSelected} sx={{ cursor: 'pointer' }}>
                                                    <TableCell padding="checkbox"><Checkbox checked={isSelected} /></TableCell>
                                                    <TableCell>{d.concepto?.nombre} {d.descripcion ? `- ${d.descripcion}` : ''}</TableCell>
                                                    <TableCell>{d.periodo}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{d.saldo_pendiente}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {deudas.length === 0 && <TableRow><TableCell colSpan={4} align="center">¡Al día! No hay deuda pendiente. 🌟</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height="200px" color="text.secondary">
                                <Typography>Seleccione un inquilino para ver sus deudas.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* 2. FILA MEDIA: REGISTRO DE PAGO (Horizontal) */}
                <Grid item xs={12}>
                    <Card sx={{ bgcolor: '#fff', border: '1px solid #ccc' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary"><AttachMoneyIcon /> Registrar Nuevo Pago</Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <TextField select fullWidth label="Medio Pago" name="id_medio_ingreso" value={formPago.id_medio_ingreso} onChange={handleChange} size="small">
                                        {medios.map(m => <MenuItem key={m.id_medio_ingreso} value={m.id_medio_ingreso}>{m.nombre}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField fullWidth type="number" label="Monto" name="monto_total" value={formPago.monto_total} onChange={handleChange} size="small" InputProps={{ startAdornment: <InputAdornment position="start">Bs</InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField fullWidth label="Referencia / Recibo" name="num_documento" value={formPago.num_documento} onChange={handleChange} size="small" />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField fullWidth label="Nota" name="descripcion" value={formPago.descripcion} onChange={handleChange} size="small" />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button fullWidth variant="contained" color="success" size="large" onClick={handlePagar} disabled={!contratoSeleccionado || loading}>
                                        {loading ? "..." : "COBRAR"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 3. FILA INFERIOR: HISTORIAL */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}><HistoryIcon sx={{ mr: 1 }} /> Historial del Día</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell />
                                        <TableCell>ID</TableCell>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Inquilino</TableCell>
                                        <TableCell>Unidad</TableCell>
                                        <TableCell>Monto</TableCell>
                                        <TableCell>Desc.</TableCell>
                                        <TableCell>Usuario</TableCell>
                                        <TableCell align="center">Recibo</TableCell>
                                        <TableCell align="center">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historial.map((h) => <Row key={h.id_transaccion_ingreso || h.id_transaccion} row={h} onImprimir={abrirRecibo} onAnular={handleAnular} />)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* MODAL RECIBO */}
            <Dialog open={reciboOpen} onClose={() => setReciboOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', borderBottom: '1px dashed #ccc' }}>🏢 RECIBO DE PAGO</DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {datoRecibo && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold">Bs {datoRecibo.monto_total}</Typography>
                            <Typography variant="body2" color="text.secondary">Nro: {obtenerId(datoRecibo)} | {datoRecibo.fecha}</Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1">Recibimos de: {datoRecibo.relacion_cliente?.persona?.nombres} {datoRecibo.relacion_cliente?.persona?.apellidos}</Typography>
                            <Typography variant="caption">{datoRecibo.descripcion}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                    <Button onClick={imprimirNavegador} variant="contained" startIcon={<PrintIcon />}>Imprimir</Button>
                    <Button onClick={() => setReciboOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={mensaje.open} autoHideDuration={4000} onClose={() => setMensaje({...mensaje, open: false})}>
                <Alert severity={mensaje.type}>{mensaje.text}</Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminCaja;