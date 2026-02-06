import React, { useState, useEffect, useMemo } from 'react';
import { 
    Container, Paper, Typography, Grid, TextField, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    MenuItem, Select, FormControl, InputLabel, Box, Stack, 
    Alert, CircularProgress, Divider, Chip
} from '@mui/material';

// ICONOS
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PrintIcon from '@mui/icons-material/Print'; 

// SERVICIOS
import { mediosService } from '../services/mediosService';
import { reportesService } from '../services/reportesService';

// =============================================================================
// ESTILOS DE IMPRESIÓN (MODO AUDITORÍA - 7 COLUMNAS)
// =============================================================================
const printStyles = `
  @media print {
    /* 1. Configuración de Hoja */
    html, body { height: auto !important; width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible; }
    .no-print { display: none !important; }
    .print-only { display: flex !important; }

    /* 2. Contenedor Principal */
    .print-container.MuiContainer-root {
      max-width: 100% !important;
      width: 100% !important;
      position: absolute;
      left: 0;
      top: 0;
      margin: 0 !important;
      padding: 10mm 5mm !important; /* Márgenes laterales reducidos para que quepan 7 cols */
      background-color: white !important;
    }

    /* 3. Tipografía y Colores (Ahorro de Tinta) */
    * {
      color: black !important;
      background-color: transparent !important;
      box-shadow: none !important;
      border-color: #999 !important;
      font-family: Arial, sans-serif !important;
    }

    /* 4. Tablas (Compactas) */
    .MuiTableContainer-root { overflow: visible !important; display: block !important; border: none !important; height: auto !important; }
    
    .MuiTableCell-root {
      padding: 2px 2px !important; /* Relleno mínimo horizontal */
      font-size: 7.5pt !important; /* Letra un poco más chica para 7 columnas */
      line-height: 1.1 !important;
      border-bottom: 1px solid #ccc !important;
    }
    
    .MuiTableCell-head {
      font-weight: bold !important;
      border-bottom: 2px solid black !important;
      border-top: 1px solid black !important;
      background-color: #f0f0f0 !important;
      font-size: 8pt !important;
      text-align: center !important;
    }

    /* 5. Resumen de Saldos (Cuadro simple) */
    .resumen-box {
        border: 1px solid black !important;
        margin-bottom: 15px !important;
        padding: 5px !important;
    }

    /* 6. Títulos */
    h4 { font-size: 14pt !important; margin: 0 !important; text-align: center; font-weight: bold !important; }
    h5 { font-size: 11pt !important; margin: 0 !important; text-align: center; }
    .subtitle-print { font-size: 10pt !important; text-align: center; margin-bottom: 10px !important; display: block !important; }

    /* 7. Paginación */
    tr { page-break-inside: avoid; }
  }
`;

const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split('-'); 
    return `${day}/${month}/${year}`;
};

const ReporteCaja = () => {
    const [medios, setMedios] = useState([]);
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [filtro, setFiltro] = useState({
        id_medio: '',
        fecha_inicio: new Date().toISOString().slice(0, 8) + '01', 
        fecha_fin: new Date().toISOString().slice(0, 10) 
    });

    useEffect(() => {
        const cargarMedios = async () => {
            try {
                const data = await mediosService.obtenerTodos();
                setMedios(data);
                if (data.length > 0) {
                    setFiltro(prev => ({ ...prev, id_medio: data[0].id_medio_ingreso }));
                }
            } catch (err) {
                console.error("Error medios:", err);
                setError("No se pudieron cargar las Cajas/Bancos.");
            }
        };
        cargarMedios();
    }, []);

    const handleGenerar = async () => {
        if (!filtro.id_medio || !filtro.fecha_inicio || !filtro.fecha_fin) {
            setError("Por favor completa todos los filtros.");
            return;
        }
        setLoading(true);
        setError('');
        setReporte(null);

        try {
            const data = await reportesService.obtenerMovimientosCaja(
                filtro.id_medio,
                filtro.fecha_inicio,
                filtro.fecha_fin
            );
            setReporte(data);
        } catch (err) {
            console.error("Error reporte:", err);
            setError("Error al generar el reporte. Verifique conexión.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFiltro({ ...filtro, [e.target.name]: e.target.value });
    };

    const handleImprimir = () => {
        window.print();
    };

    const nombreCajaSeleccionada = useMemo(() => {
        const caja = medios.find(m => m.id_medio_ingreso === filtro.id_medio);
        return caja ? caja.nombre : "Caja Desconocida";
    }, [medios, filtro.id_medio]);

    const totalIngresos = reporte?.movimientos.reduce((acc, m) => acc + m.ingreso, 0) || 0;
    const totalEgresos = reporte?.movimientos.reduce((acc, m) => acc + m.egreso, 0) || 0;

    return (
        <Container maxWidth="lg" sx={{ mt: 3, pb: 5 }} className="print-container">
            <style>{printStyles}</style>
            
            {/* CABECERA PANTALLA */}
            <Box className="no-print">
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 32 }} />
                                <Typography variant="h5" fontWeight="bold" color="#333">
                                    Libro de Caja y Bancos
                                </Typography>
                            </Box>
                            {reporte && (
                                <Button variant="contained" startIcon={<PrintIcon />} onClick={handleImprimir} sx={{ bgcolor: '#1e293b' }}>
                                    Imprimir
                                </Button>
                            )}
                        </Box>
                        <Divider />
                        
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Seleccionar Caja o Banco</InputLabel>
                                    <Select
                                        name="id_medio"
                                        value={filtro.id_medio}
                                        label="Seleccionar Caja o Banco"
                                        onChange={handleChange}
                                    >
                                        {medios.map((m) => (
                                            <MenuItem key={m.id_medio_ingreso} value={m.id_medio_ingreso}>
                                                {m.tipo === 'Banco' ? '🏦 ' : '💵 '} {m.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    label="Desde" type="date" name="fecha_inicio"
                                    value={filtro.fecha_inicio} onChange={handleChange}
                                    fullWidth size="small" InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    label="Hasta" type="date" name="fecha_fin"
                                    value={filtro.fecha_fin} onChange={handleChange}
                                    fullWidth size="small" InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button 
                                    variant="contained" color="primary" fullWidth sx={{ height: 40 }}
                                    onClick={handleGenerar} disabled={loading}
                                >
                                    <SearchIcon />
                                </Button>
                            </Grid>
                        </Grid>
                    </Stack>
                </Paper>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }} className="no-print"><CircularProgress /></Box>}

            {/* TABLA DE RESULTADOS */}
            {reporte && (
                <div id="reporte-imprimible">
                    
                    {/* ENCABEZADO IMPRESIÓN */}
                    <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, textAlign: 'center', borderBottom: '2px solid black', pb: 1 } }}>
                        <Typography variant="h4" fontWeight="bold">LIBRO DE MOVIMIENTOS</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5 }}>{nombreCajaSeleccionada.toUpperCase()}</Typography>
                        <Typography className="subtitle-print">
                            Del {formatearFecha(filtro.fecha_inicio)} al {formatearFecha(filtro.fecha_fin)}
                        </Typography>
                    </Box>

                    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 'none', border: '1px solid #ddd' }}>
                        
                        {/* Resumen Superior */}
                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderBottom: '1px solid #e2e8f0' }} className="resumen-box">
                            <Grid container spacing={2} textAlign="center">
                                <Grid item xs={4} sx={{ borderRight: '1px solid #ddd' }}>
                                    <Typography variant="caption" color="textSecondary">SALDO ANTERIOR</Typography>
                                    <Typography variant="h6" color="#64748b" sx={{ '@media print': { color: 'black' } }}>
                                        {reporte.saldo_inicial.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                                    </Typography>
                                </Grid>
                                <Grid item xs={4} sx={{ borderRight: '1px solid #ddd' }}>
                                    <Typography variant="caption" color="textSecondary">MOVIMIENTO NETO</Typography>
                                    <Typography variant="h6" sx={{ color: (totalIngresos - totalEgresos) >= 0 ? 'success.main' : 'error.main', '@media print': { color: 'black' } }}>
                                        {(totalIngresos - totalEgresos).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="textSecondary">SALDO FINAL</Typography>
                                    <Typography variant="h6" color="primary" fontWeight="bold" sx={{ '@media print': { color: 'black' } }}>
                                        {reporte.saldo_final.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { backgroundColor: '#1e293b', color: 'white' }, '@media print': { '& th': { bgcolor: '#f0f0f0', color: 'black' } } }}>
                                        <TableCell width="10%">Fecha</TableCell>
                                        
                                        {/* NUEVA COLUMNA: ORIGEN (Depto / Beneficiario) */}
                                        <TableCell width="18%">Depto / Benef.</TableCell>
                                        
                                        <TableCell>Descripción</TableCell>
                                        <TableCell width="8%">Doc.</TableCell>
                                        <TableCell align="right" width="11%">Ingreso</TableCell>
                                        <TableCell align="right" width="11%">Egreso</TableCell>
                                        <TableCell align="right" width="12%">Saldo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* FILA 0: SALDO INICIAL */}
                                    <TableRow sx={{ backgroundColor: '#fff7ed', '@media print': { bgcolor: 'white' } }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            {formatearFecha(reporte.fecha_inicio)}
                                        </TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell colSpan={2} sx={{ fontStyle: 'italic' }}>
                                            <strong>SALDO INICIAL (Arrastre)</strong>
                                        </TableCell>
                                        <TableCell align="right" colSpan={3} sx={{ fontWeight: 'bold', pr: 2 }}>
                                            {reporte.saldo_inicial.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>

                                    {/* MOVIMIENTOS */}
                                    {reporte.movimientos.map((row, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.fecha).toLocaleDateString()}</TableCell>
                                            
                                            {/* DATOS DE LA NUEVA COLUMNA */}
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                                                {row.origen || '-'}
                                            </TableCell>
                                            
                                            <TableCell sx={{ fontSize: '0.9em' }}>{row.descripcion}</TableCell>
                                            <TableCell>
                                                {row.numero_doc ? (
                                                    <span className="no-print"><Chip label={row.numero_doc} size="small" variant="outlined" /></span>
                                                ) : '-'}
                                                <span className="print-only" style={{display:'none'}}>{row.numero_doc}</span>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: row.ingreso > 0 ? 'success.main' : 'inherit', '@media print': { color: 'black' } }}>
                                                {row.ingreso > 0 ? row.ingreso.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: row.egreso > 0 ? 'error.main' : 'inherit', '@media print': { color: 'black' } }}>
                                                {row.egreso > 0 ? row.egreso.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', '@media print': { bgcolor: 'transparent' } }}>
                                                {row.saldo_acumulado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* TOTALES */}
                                    <TableRow sx={{ backgroundColor: '#e2e8f0', '@media print': { bgcolor: '#f0f0f0', borderTop: '2px solid black' } }}>
                                        <TableCell colSpan={4} align="right"><strong>TOTALES:</strong></TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {totalEgresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                            {reporte.saldo_final.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                </div>
            )}
        </Container>
    );
};

export default ReporteCaja;