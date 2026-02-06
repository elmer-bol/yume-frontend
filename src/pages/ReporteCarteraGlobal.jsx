import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Chip, Box, TextField, InputAdornment, Grid, 
    Alert, LinearProgress, TableSortLabel, Button, Container
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PrintIcon from '@mui/icons-material/Print';
import { visuallyHidden } from '@mui/utils';
import { reportesService } from '../services/reportesService'; 

// =============================================================================
// ESTILOS DE IMPRESIÓN "MODO LIMPIO & SIN PÁGINAS EXTRA"
// =============================================================================
const printStyles = `
  @media print {
    /* 1. Reset Total del Cuerpo para evitar hojas en blanco */
    html, body {
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* 2. Ocultar todo lo que no es el reporte */
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible; }
    .no-print { display: none !important; }

    /* 3. Posicionamiento Absoluto para tomar el control de la hoja */
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 20px !important; /* Margen interno seguro */
      background-color: white !important;
    }

    /* 4. ROMPER EL SCROLL (LA "VENTANA") AL IMPRIMIR */
    /* Esto es vital: fuerza a la tabla a expandirse completa */
    .MuiTableContainer-root {
      max-height: none !important;
      overflow: visible !important;
      display: block !important;
      height: auto !important;
    }

    /* 5. Ahorro de Tinta y Estilos de Tabla */
    * {
      color: black !important;
      background-color: transparent !important;
      box-shadow: none !important;
      border-color: #ccc !important;
    }

    .MuiTableCell-root {
      padding: 4px 6px !important;
      font-size: 9pt !important;
      line-height: 1.2 !important;
      border-bottom: 1px solid #ddd !important;
    }

    .MuiTableCell-head {
      font-weight: bold !important;
      border-bottom: 2px solid black !important;
    }

    /* 6. Evitar cortes feos */
    tr { page-break-inside: avoid; }
    
    /* 7. Encabezados de impresión */
    h4 { font-size: 16pt !important; margin-bottom: 5px !important; }
  }
`;

// =============================================================================
// 1. FUNCIONES DE ORDENAMIENTO
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
// 2. COMPONENTE PRINCIPAL
// =============================================================================
const ReporteCarteraGlobal = () => {
    const [data, setData] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ESTADOS DE ORDENAMIENTO
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id_unidad');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const resultado = await reportesService.obtenerCarteraGlobal();
            setData(resultado);
        } catch (err) {
            console.error("Error cargando cartera:", err);
            setError("No se pudo cargar el reporte financiero.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handlePrint = () => {
        window.print();
    };

    // LÓGICA DE FILTRO
    const dataFiltrada = data.filter(item => 
        item.identificador_unico.toLowerCase().includes(filtro.toLowerCase()) ||
        item.nombre_inquilino.toLowerCase().includes(filtro.toLowerCase())
    );

    // Cálculos de Totales
    const totalVencido = dataFiltrada.reduce((sum, item) => sum + item.deuda_vencida, 0);
    const totalFuturo = dataFiltrada.reduce((sum, item) => sum + item.deuda_futura, 0);
    const granTotal = totalVencido + totalFuturo;

    return (
        // Quitamos padding global al imprimir para que el styles controle todo
        <Container maxWidth="xl" className="print-container" sx={{ p: 0 }}>
            <style>{printStyles}</style>

            <Paper sx={{ p: 3, mt: 4, borderTop: '4px solid #00c853', boxShadow: 3 }}>
                
                {/* --- HEADER PANTALLA --- */}
                <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap">
                    <Box mb={{ xs: 2, sm: 0 }}>
                        <Typography variant="h6" color="success.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Cartera de Deuda Global
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Panorama completo de activos por cobrar.
                        </Typography>
                    </Box>
                    
                    <Box display="flex" gap={2}>
                        <TextField 
                            size="small"
                            placeholder="Buscar..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon color="action"/></InputAdornment>,
                            }}
                            sx={{ width: 250 }}
                        />
                        <Button 
                            variant="contained" 
                            startIcon={<PrintIcon />} 
                            onClick={handlePrint}
                            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }}
                        >
                            Imprimir
                        </Button>
                    </Box>
                </Box>

                {/* --- HEADER IMPRESIÓN --- */}
                <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, borderBottom: '2px solid black', pb: 1 } }}>
                    <Typography variant="h4" align="center" fontWeight="bold">REPORTE DE CARTERA GLOBAL</Typography>
                    <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2">FECHA: {new Date().toLocaleDateString()}</Typography>
                        <Typography variant="body2">TOTAL ACTIVOS: <strong>{granTotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs</strong></Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-around" mt={1} sx={{ borderTop: '1px solid #ccc', pt: 1 }}>
                        <Typography variant="caption">MORA: {totalVencido.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</Typography>
                        <Typography variant="caption">FUTURO: {totalFuturo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</Typography>
                        <Typography variant="caption">UNIDADES: {dataFiltrada.length}</Typography>
                    </Box>
                </Box>

                {/* 2. TABLA DE DATOS */}
                {loading && <LinearProgress color="success" sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* AQUÍ ESTÁ LA MAGIA: 
                   sx={{ maxHeight: 600 }} funciona en pantalla para crear la ventana.
                   El CSS .MuiTableContainer-root { max-height: none !important } lo anula al imprimir.
                */}
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {/* ID */}
                                <TableCell sx={{ bgcolor: '#e8f5e9', width: 50 }}>
                                    <TableSortLabel
                                        active={orderBy === 'id_unidad'}
                                        direction={orderBy === 'id_unidad' ? order : 'asc'}
                                        onClick={() => handleRequestSort('id_unidad')}
                                    >
                                        <strong>ID</strong>
                                    </TableSortLabel>
                                </TableCell>

                                {/* UNIDAD */}
                                <TableCell sx={{ bgcolor: '#e8f5e9' }}>
                                    <TableSortLabel
                                        active={orderBy === 'identificador_unico'}
                                        direction={orderBy === 'identificador_unico' ? order : 'asc'}
                                        onClick={() => handleRequestSort('identificador_unico')}
                                    >
                                        <strong>Unidad</strong>
                                    </TableSortLabel>
                                </TableCell>

                                {/* INQUILINO */}
                                <TableCell sx={{ bgcolor: '#e8f5e9' }}>
                                    <TableSortLabel
                                        active={orderBy === 'nombre_inquilino'}
                                        direction={orderBy === 'nombre_inquilino' ? order : 'asc'}
                                        onClick={() => handleRequestSort('nombre_inquilino')}
                                    >
                                        <strong>Inquilino / Propietario</strong>
                                    </TableSortLabel>
                                </TableCell>

                                {/* VENCIDO */}
                                <TableCell align="right" sx={{ bgcolor: '#ffebee', color: '#c62828' }}>
                                    <TableSortLabel
                                        active={orderBy === 'deuda_vencida'}
                                        direction={orderBy === 'deuda_vencida' ? order : 'asc'}
                                        onClick={() => handleRequestSort('deuda_vencida')}
                                    >
                                        <strong>Vencido 🔴</strong>
                                    </TableSortLabel>
                                </TableCell>

                                {/* FUTURO */}
                                <TableCell align="right" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}>
                                    <TableSortLabel
                                        active={orderBy === 'deuda_futura'}
                                        direction={orderBy === 'deuda_futura' ? order : 'asc'}
                                        onClick={() => handleRequestSort('deuda_futura')}
                                    >
                                        <strong>Futuro 🟢</strong>
                                    </TableSortLabel>
                                </TableCell>

                                {/* TOTAL */}
                                <TableCell align="right" sx={{ bgcolor: '#e8f5e9' }}>
                                    <TableSortLabel
                                        active={orderBy === 'total_general'}
                                        direction={orderBy === 'total_general' ? order : 'asc'}
                                        onClick={() => handleRequestSort('total_general')}
                                    >
                                        <strong>Total ⚫</strong>
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stableSort(dataFiltrada, getComparator(order, orderBy))
                                .map((row) => (
                                <TableRow key={row.id_unidad} hover>
                                    <TableCell sx={{ color: 'gray', fontSize: '0.8rem' }}>
                                        {row.id_unidad}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        <Chip 
                                            label={row.identificador_unico} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ borderRadius: 1, '@media print': { border: 'none', padding: 0 } }} 
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem' }}>{row.nombre_inquilino}</TableCell>
                                    
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: row.deuda_vencida > 0 ? 'bold' : 'normal', color: row.deuda_vencida > 0 ? '#c62828' : '#bdbdbd' }}>
                                        {row.deuda_vencida > 0 ? `${row.deuda_vencida.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>

                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: row.deuda_futura > 0 ? '#2e7d32' : '#bdbdbd' }}>
                                        {row.deuda_futura > 0 ? `${row.deuda_futura.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>

                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                        {row.total_general.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {/* TOTALES (VISIBLE EN IMPRESIÓN) */}
                            {dataFiltrada.length > 0 && (
                                <TableRow sx={{ bgcolor: '#fafafa', borderTop: '2px solid black' }}>
                                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>TOTALES:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{totalVencido.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{totalFuturo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em', whiteSpace: 'nowrap' }}>{granTotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            )}

                            {!loading && dataFiltrada.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No se encontraron registros.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 3. RESUMEN FINANCIERO (FOOTER PANTALLA) */}
                <Box className="no-print" sx={{ mt: 3, p: 2, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                    <Grid container spacing={2} textAlign="center" alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" display="block" color="text.secondary">TOTAL MORA (Vencido)</Typography>
                            <Typography variant="h6" color="error" fontWeight="bold">Bs {totalVencido.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" display="block" color="text.secondary">TOTAL FUTURO (Planes)</Typography>
                            <Typography variant="h6" color="success.main" fontWeight="bold">Bs {totalFuturo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 1, bgcolor: '#2e7d32', color: 'white' }}>
                                <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>TOTAL POR COBRAR</Typography>
                                <Typography variant="h5" fontWeight="bold">Bs {granTotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default ReporteCarteraGlobal;