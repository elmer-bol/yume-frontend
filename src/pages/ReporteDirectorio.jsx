import React, { useState } from 'react';
import { 
    Container, Grid, Paper, Typography, Button, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Box, Divider, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Tooltip, Stack
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { reportesService } from '../services/reportesService';

// =============================================================================
// ESTILOS DE IMPRESIÓN (UNA COLUMNA + PIE VISIBLE)
// =============================================================================
const printStyles = `
  /* Ocultar elementos de impresión en la pantalla normal */
  .print-only { display: none; }

  @media print {
    /* 1. Reset Total */
    html, body { 
        height: auto !important; 
        width: 100% !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        overflow: visible !important; 
    }
    
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible; }
    
    /* Clases de utilidad */
    .no-print { display: none !important; }
    .print-only { display: flex !important; } /* Forzamos que aparezca */

    /* 2. Hoja Completa */
    .print-container.MuiContainer-root {
      max-width: 100% !important;
      width: 100% !important;
      position: absolute;
      left: 0;
      top: 0;
      margin: 0 !important;
      padding: 15mm !important;
      background-color: white !important;
    }

    #reporte-imprimible { width: 100%; }

    /* 3. FORZAR UNA SOLA COLUMNA CENTRADA */
    .MuiGrid-container {
        display: block !important;
    }
    .MuiGrid-item {
        width: 100% !important;
        max-width: 100% !important;
        flex-basis: 100% !important;
        margin-bottom: 10px !important;
        padding-left: 0 !important;
    }

    /* 4. Estilos de Texto y Tablas */
    * {
      color: black !important;
      background-color: transparent !important;
      box-shadow: none !important;
      border-color: #aaa !important;
      font-family: Arial, sans-serif !important;
    }

    .MuiTableContainer-root { overflow: visible !important; display: block !important; border: none !important; }
    
    .MuiTableCell-root {
      padding: 1px 5px !important;
      font-size: 9pt !important;
      line-height: 1.2 !important;
      border-bottom: 1px solid #ddd !important;
    }
    
    .MuiTableCell-head {
      font-weight: bold !important;
      border-bottom: 2px solid black !important;
      background-color: #f0f0f0 !important;
      font-size: 9pt !important;
    }

    /* 5. Títulos */
    h4 { font-size: 16pt !important; margin: 0 !important; text-align: center; font-weight: bold !important; }
    h5 { font-size: 11pt !important; margin: 0 !important; text-align: center; }
    
    /* 6. Footer de Resumen (Estilo Específico) */
    .footer-print-row {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        width: 100% !important;
        margin-top: 20px !important;
        border: 1px solid #ccc;
        padding: 5px;
    }
    
    .footer-print-item {
        flex: 1;
        text-align: center;
        padding: 5px;
    }
    
    .footer-print-item:first-child {
        border-right: 1px solid #000;
    }

    /* Ocultar iconos decorativos */
    .MuiSvgIcon-root { display: none !important; }

    /* 7. Paginación */
    tr { page-break-inside: avoid; }
  }
`;

// --- FUNCIÓN DE AYUDA PARA FECHAS ---
const formatearFechaSimple = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split('-'); 
    return `${day}/${month}/${year}`;
};

// --- COMPONENTE AUXILIAR RECURSIVO ---
const FilaRecursiva = ({ nodo, onVerDetalle }) => {
    if (!nodo) return null;

    const esRubro = nodo.es_rubro;
    const nivel = nodo.nivel || 0;
    const paddingLeft = nivel * 20; 
    
    const montoFormateado = new Intl.NumberFormat('es-BO', { 
        style: 'decimal', 
        minimumFractionDigits: 2 
    }).format(nodo.monto);

    return (
        <>
            <TableRow hover sx={{ backgroundColor: esRubro ? '#fafafa' : 'white' }}>
                <TableCell sx={{ pl: `${paddingLeft}px !important` }}>
                    <Typography 
                        variant="body2" 
                        fontWeight={esRubro ? 'bold' : 'normal'}
                        color={esRubro ? 'text.primary' : 'text.secondary'}
                        sx={{ fontSize: 'inherit' }} 
                    >
                        {nodo.codigo} - {nodo.nombre}
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" fontWeight={esRubro ? 'bold' : 'normal'} sx={{ fontSize: 'inherit' }}>
                        {montoFormateado}
                    </Typography>
                </TableCell>
                <TableCell align="center" style={{ width: 60 }} className="no-print">
                    {!esRubro && (
                        <Tooltip title="Ver detalle de movimientos">
                            <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => onVerDetalle(nodo)}
                            >
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </TableCell>
            </TableRow>

            {nodo.hijos && nodo.hijos.map((hijo) => (
                <FilaRecursiva key={hijo.codigo} nodo={hijo} onVerDetalle={onVerDetalle} />
            ))}
        </>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ReporteDirectorio = () => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    const [filtros, setFiltros] = useState({ fechaInicio: primerDia, fechaFin: ultimoDia });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- ESTADOS MODAL ---
    const [modalOpen, setModalOpen] = useState(false);
    const [detalleMovimientos, setDetalleMovimientos] = useState([]);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState("");

    const handleGenerar = async () => {
        setLoading(true);
        setError(null);
        try {
            const resultado = await reportesService.obtenerEstadoResultados(filtros.fechaInicio, filtros.fechaFin);
            setData(resultado);
        } catch (err) {
            console.error(err);
            setError("Error al generar el reporte. Verifique su conexión.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerDetalle = async (nodo) => {
        setCuentaSeleccionada(`${nodo.codigo} - ${nodo.nombre}`);
        setModalOpen(true);
        setLoadingDetalle(true);
        setDetalleMovimientos([]);

        try {
            const idParaBuscar = nodo.id_catalogo || nodo.codigo; 
            const movimientos = await reportesService.obtenerDetalleCuenta(
                idParaBuscar,
                filtros.fechaInicio,
                filtros.fechaFin
            );
            setDetalleMovimientos(movimientos);
        } catch (error) {
            console.error("Error cargando detalle:", error);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleImprimir = () => {
        window.print();
    };

    const renderModalDetalle = () => (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth className="no-print">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="h6">Detalle: {cuentaSeleccionada}</Typography>
                <IconButton onClick={() => setModalOpen(false)}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {loadingDetalle ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : detalleMovimientos.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>No se encontraron movimientos detallados en este periodo.</Alert>
                ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#eee' }}>
                                    <TableCell><strong>Fecha</strong></TableCell>
                                    <TableCell><strong>Descripción</strong></TableCell>
                                    <TableCell><strong>Beneficiario / Pagador</strong></TableCell>
                                    <TableCell><strong>Doc.</strong></TableCell>
                                    <TableCell align="right"><strong>Monto</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detalleMovimientos.map((mov, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{mov.fecha}</TableCell>
                                        <TableCell>{mov.descripcion}</TableCell>
                                        <TableCell>{mov.beneficiario_o_pagador}</TableCell>
                                        <TableCell>{mov.nro_documento || '-'}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: mov.tipo === 'INGRESO' ? 'green' : 'red' }}>
                                            {mov.monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setModalOpen(false)} variant="contained">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="print-container">
            <style>{printStyles}</style>

            {/* TÍTULO Y FILTROS (PANTALLA) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
                <Typography variant="h4" color="primary" fontWeight="bold">
                    Reporte Financiero Contable
                </Typography>
                {data && (
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handleImprimir}>
                        Imprimir / PDF
                    </Button>
                )}
            </Box>

            <Paper sx={{ p: 3, mb: 4, bgcolor: '#f5f5f5' }} className="no-print">
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Fecha Inicio"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={filtros.fechaInicio}
                            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Fecha Fin"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={filtros.fechaFin}
                            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button 
                            variant="contained" 
                            fullWidth 
                            size="large" 
                            startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SearchIcon />}
                            onClick={handleGenerar}
                            disabled={loading}
                        >
                            {loading ? "Calculando..." : "Generar Reporte"}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ÁREA DEL REPORTE */}
            {data && (
                <div id="reporte-imprimible">
                    
                    {/* ENCABEZADO IMPRESIÓN */}
                    <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, textAlign: 'center', borderBottom: '1px solid black', pb: 1 } }}>
                        <Typography variant="h4">ESTADO DE RESULTADOS</Typography>
                        <Typography variant="subtitle1" sx={{fontSize: '10pt'}}>
                            Periodo: {formatearFechaSimple(data.fecha_inicio)} al {formatearFechaSimple(data.fecha_fin)}
                        </Typography>
                    </Box>

                    {/* TÍTULO PANTALLA */}
                    <Box sx={{ textAlign: 'center', mb: 4 }} className="no-print">
                        <Typography variant="h5" fontWeight="bold">ESTADO DE RESULTADOS & FLUJO DE FONDOS</Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Del {formatearFechaSimple(data.fecha_inicio)} al {formatearFechaSimple(data.fecha_fin)}
                        </Typography>
                        <Divider sx={{ mt: 2 }} />
                    </Box>

                    {/* --- BLOQUE: SALDO INICIAL --- */}
                    <Paper elevation={2} sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderLeft: '6px solid #ff9800', '@media print': { border: '1px solid black', boxShadow: 'none' } }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountBalanceWalletIcon sx={{ color: '#ef6c00', mr: 2, fontSize: 30 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="#e65100" fontWeight="bold" sx={{ '@media print': { color: 'black' } }}>
                                        SALDO INICIAL DISPONIBLE
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ '@media print': { color: '#333' } }}>
                                        Dinero acumulado hasta el {formatearFechaSimple(data.fecha_inicio)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="h5" color="#e65100" fontWeight="bold" sx={{ '@media print': { color: 'black', fontSize: '12pt' } }}>
                                {data.saldo_anterior?.toLocaleString('es-BO', { minimumFractionDigits: 2 }) || '0.00'} Bs
                            </Typography>
                        </Stack>
                    </Paper>

                    {/* --- CUERPO DEL REPORTE (UNA COLUMNA) --- */}
                    <Grid container spacing={4}>
                        
                        {/* SECCIÓN INGRESOS */}
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ overflow: 'hidden', '@media print': { boxShadow: 'none', border: 'none', mb: 0 } }}>
                                <Box sx={{ p: 1, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc' }}>
                                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                                    <Typography variant="h6" color="success.main" fontWeight="bold" sx={{ '@media print': { color: 'black', fontSize: '11pt' } }}>
                                        INGRESOS
                                    </Typography>
                                </Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Cuenta</strong></TableCell>
                                                <TableCell align="right"><strong>Monto (Bs)</strong></TableCell>
                                                <TableCell align="center" className="no-print"><strong>Ver</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.ingresos && data.ingresos.hijos.map(hijo => (
                                                <FilaRecursiva 
                                                    key={hijo.codigo} 
                                                    nodo={hijo} 
                                                    onVerDetalle={handleVerDetalle} 
                                                />
                                            ))}
                                            <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                                                <TableCell><strong>TOTAL INGRESOS</strong></TableCell>
                                                <TableCell align="right">
                                                    <strong>{data.total_ingresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
                                                </TableCell>
                                                <TableCell className="no-print" />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* SECCIÓN EGRESOS */}
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ overflow: 'hidden', '@media print': { boxShadow: 'none', border: 'none', mt: 3 } }}>
                                <Box sx={{ p: 1, bgcolor: '#ffebee', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc' }}>
                                    <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                                    <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ '@media print': { color: 'black', fontSize: '11pt' } }}>
                                        EGRESOS
                                    </Typography>
                                </Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Cuenta</strong></TableCell>
                                                <TableCell align="right"><strong>Monto (Bs)</strong></TableCell>
                                                <TableCell align="center" className="no-print"><strong>Ver</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.egresos && data.egresos.hijos.map(hijo => (
                                                <FilaRecursiva 
                                                    key={hijo.codigo} 
                                                    nodo={hijo} 
                                                    onVerDetalle={handleVerDetalle} 
                                                />
                                            ))}
                                            <TableRow sx={{ bgcolor: '#ffebee' }}>
                                                <TableCell><strong>TOTAL EGRESOS</strong></TableCell>
                                                <TableCell align="right">
                                                    <strong>{data.total_egresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
                                                </TableCell>
                                                <TableCell className="no-print" />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* --- FOOTER RESUMEN --- */}
                    
                    {/* VERSIÓN PANTALLA (Tarjetas bonitas) */}
                    <Box className="no-print" sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Paper elevation={4} sx={{ p: 2, minWidth: 200, textAlign: 'center', bgcolor: 'white' }}>
                            <Typography variant="subtitle2" color="text.secondary">RESULTADO</Typography>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: data.resultado_neto >= 0 ? '#2e7d32' : '#c62828' }}>
                                {data.resultado_neto.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                            </Typography>
                        </Paper>
                        <Paper elevation={6} sx={{ p: 2, minWidth: 250, textAlign: 'center', bgcolor: '#1e293b', color: 'white' }}>
                            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>SALDO FINAL</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#4ade80' }}>
                                {data.saldo_final_acumulado?.toLocaleString('es-BO', { minimumFractionDigits: 2 }) || '0.00'} Bs
                            </Typography>
                        </Paper>
                    </Box>

                    {/* VERSIÓN IMPRESIÓN (Horizontal forzada) */}
                    <div className="print-only footer-print-row"> 
                        <div className="footer-print-item">
                            <Typography variant="subtitle2" fontWeight="bold">RESULTADO PERIODO</Typography>
                            <Typography variant="h6">
                                {data.resultado_neto.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                            </Typography>
                        </div>
                        <div className="footer-print-item">
                            <Typography variant="subtitle2" fontWeight="bold">SALDO FINAL DISPONIBLE</Typography>
                            <Typography variant="h6">
                                {data.saldo_final_acumulado?.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                            </Typography>
                        </div>
                    </div>

                    
                </div>
            )}

            {renderModalDetalle()}
        </Container>
    );
};

export default ReporteDirectorio;