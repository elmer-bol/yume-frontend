import React, { useEffect, useState, useMemo } from 'react';
import { 
    Container, Typography, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, 
    Chip, CircularProgress, Alert, Box, TextField, 
    InputAdornment, IconButton, Collapse, Grid, Button,
    MenuItem, Select, FormControl, InputLabel, Tooltip
} from '@mui/material';

// Iconos
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PrintIcon from '@mui/icons-material/Print';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { reportesService } from '../services/reportesService';

// --- ESTILOS DE IMPRESIÓN "MODO COMPACTO PRO" ---
const printStyles = `
  @media print {
    /* 1. Ocultamos todo lo ajeno */
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible; }
    .no-print { display: none !important; }

    /* 2. Posicionamiento */
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 10px !important;
    }

    /* 3. AHORRO DE TINTA */
    * {
      color: black !important;
      background-color: transparent !important;
      box-shadow: none !important;
      border-color: #ccc !important;
    }

    /* 4. FUENTE MÁS PEQUEÑA Y COMPACTA */
    .MuiTableCell-root {
      padding: 3px 6px !important;
      font-size: 9pt !important;
      line-height: 1.2 !important;
    }
    
    /* Títulos */
    h4, h5 { font-size: 14pt !important; margin: 0 0 5px 0 !important; }
    h6 { font-size: 11pt !important; }
    
    /* 5. EXPANDIR SIEMPRE LOS DETALLES */
    .MuiCollapse-root {
      display: block !important;
      height: auto !important;
      visibility: visible !important;
    }
    
    /* Evitar cortes feos de página */
    tr { page-break-inside: avoid; }
    
    /* Forzar ancho completo */
    table { width: 100% !important; }
  }
`;

// --- FILA CON DETALLE EXPANDIBLE ---
const RowMoroso = ({ row, isOpen, onToggle }) => {
    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: isOpen ? '#f8fafc' : 'inherit' }}>
                <TableCell className="no-print" width="40px">
                    <IconButton size="small" onClick={() => onToggle(row.identificador_unico)}>
                        {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                
                {/* Celda fantasma para impresión */}
                <TableCell sx={{ display: 'none', '@media print': { display: 'table-cell', width: '10px' } }}></TableCell>

                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    {row.identificador_unico}
                </TableCell>
                
                <TableCell>{row.nombre_inquilino}</TableCell>
                
                <TableCell align="center">
                    <Chip 
                        label={`${row.cantidad_meses} Meses`} 
                        color={row.cantidad_meses > 3 ? "error" : "warning"} 
                        variant="outlined" 
                        size="small" 
                    />
                </TableCell>
                
                <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    {row.total_deuda.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                </TableCell>
            </TableRow>
            
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit className="print-always-visible">
                        <Box sx={{ margin: 2, p: 1, borderRadius: 1, border: '1px solid #e2e8f0', '@media print': { margin: '2px 0 10px 20px', border: 'none', borderLeft: '1px solid #999', paddingLeft: '10px' } }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', display: 'block', mb: 0.5 }}>
                                DETALLE:
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="15%">Periodo</TableCell>
                                        <TableCell>Concepto</TableCell>
                                        <TableCell width="15%">Atraso</TableCell>
                                        <TableCell align="right" width="20%">Monto</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.detalles.map((detalle, index) => (
                                        <TableRow key={index}>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{detalle.periodo}</TableCell>
                                            <TableCell>{detalle.concepto}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{detalle.dias_atraso} días</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                {detalle.monto_pendiente.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ReporteMorosidad = () => {
    const [morosos, setMorosos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [busqueda, setBusqueda] = useState("");
    const [conceptoFiltro, setConceptoFiltro] = useState("TODOS");
    
    const [expandedIds, setExpandedIds] = useState(new Set());

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const data = await reportesService.obtenerMorosidad(); 
                setMorosos(data);
            } catch (err) {
                console.error(err);
                setError("Error cargando reporte. Verifique su conexión.");
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, []);

    const listaConceptos = useMemo(() => {
        const conceptosSet = new Set();
        morosos.forEach(m => {
            m.detalles.forEach(d => conceptosSet.add(d.concepto));
        });
        return ["TODOS", ...Array.from(conceptosSet)];
    }, [morosos]);

    const datosProcesados = useMemo(() => {
        let data = [...morosos];

        if (busqueda) {
            const lowerBusqueda = busqueda.toLowerCase();
            data = data.filter(m => 
                m.identificador_unico.toLowerCase().includes(lowerBusqueda) ||
                m.nombre_inquilino.toLowerCase().includes(lowerBusqueda)
            );
        }

        if (conceptoFiltro !== "TODOS") {
            data = data.map(unidad => {
                let detalles = unidad.detalles.filter(d => d.concepto === conceptoFiltro);
                if (detalles.length === 0) return null;
                const detallesOrdenados = [...detalles].sort((a, b) => a.periodo.localeCompare(b.periodo));
                const nuevaDeuda = detallesOrdenados.reduce((acc, d) => acc + d.monto_pendiente, 0);

                return {
                    ...unidad,
                    detalles: detallesOrdenados,
                    total_deuda: nuevaDeuda,
                    cantidad_meses: detallesOrdenados.length
                };
            }).filter(item => item !== null);
        } else {
             data = data.map(unidad => ({
                 ...unidad,
                 detalles: [...unidad.detalles].sort((a, b) => a.periodo.localeCompare(b.periodo))
             }));
        }

        return data;
    }, [morosos, busqueda, conceptoFiltro]);

    const totalDeudaGeneral = datosProcesados.reduce((acc, curr) => acc + curr.total_deuda, 0);

    const handleToggleRow = (id) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const handleToggleAll = () => {
        if (expandedIds.size === datosProcesados.length && datosProcesados.length > 0) {
            setExpandedIds(new Set());
        } else {
            const allIds = datosProcesados.map(d => d.identificador_unico);
            setExpandedIds(new Set(allIds));
        }
    };

    // --- ¡AQUÍ ESTABA LA LÍNEA FALTANTE! ---
    const allExpanded = datosProcesados.length > 0 && expandedIds.size === datosProcesados.length;
    // ----------------------------------------

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="print-container">
            <style>{printStyles}</style>

            <Box className="no-print">
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                    📉 Reporte de Morosidad
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                            <AttachMoneyIcon sx={{ fontSize: 40, color: '#ef4444', mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle2" color="textSecondary">
                                    {conceptoFiltro === "TODOS" ? "Deuda Total Vencida" : `Deuda Total (${conceptoFiltro})`}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#b91c1c' }}>
                                    {totalDeudaGeneral.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
                            <PeopleAltIcon sx={{ fontSize: 40, color: '#f97316', mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle2" color="textSecondary">Unidades con Deuda</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c2410c' }}>
                                    {datosProcesados.length}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField 
                        size="small" 
                        label="Buscar Unidad o Nombre" 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: '200px' }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filtrar por Concepto</InputLabel>
                        <Select
                            value={conceptoFiltro}
                            label="Filtrar por Concepto"
                            onChange={(e) => setConceptoFiltro(e.target.value)}
                            startAdornment={<InputAdornment position="start"><FilterListIcon /></InputAdornment>}
                        >
                            {listaConceptos.map((c) => (
                                <MenuItem key={c} value={c}>
                                    {c === "TODOS" ? "Todos los Conceptos" : c}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button 
                        variant="contained" 
                        startIcon={<PrintIcon />} 
                        onClick={handlePrint}
                        sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }}
                    >
                        Imprimir
                    </Button>
                </Paper>
            </Box>

            <Paper elevation={3} sx={{ p: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                
                <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 1, textAlign: 'center', borderBottom: '1px solid black', pb: 1 } }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>REPORTE DE MOROSIDAD</Typography>
                    <Typography variant="subtitle2">
                        FILTRO: {conceptoFiltro === "TODOS" ? "GENERAL" : conceptoFiltro.toUpperCase()} | 
                        FECHA: {new Date().toLocaleDateString()}
                    </Typography>
                    <Grid container sx={{ mt: 1, pt: 0 }}>
                        <Grid item xs={6} textAlign="left">
                            <strong>TOTAL DEUDA: {totalDeudaGeneral.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs</strong>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                            <strong>UNIDADES EN MORA: {datosProcesados.length}</strong>
                        </Grid>
                    </Grid>
                </Box>

                {datosProcesados.length === 0 ? (
                    <Alert severity="success">No se encontraron deudas con los filtros seleccionados.</Alert>
                ) : (
                    <TableContainer>
                        <Table aria-label="tabla morosos" size="small">
                            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell width="40px" className="no-print">
                                        <Tooltip title={allExpanded ? "Contraer Todos" : "Expandir Todos"}>
                                            <IconButton size="small" onClick={handleToggleAll} color="primary">
                                                {allExpanded ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    
                                    <TableCell width="10px" sx={{ display: 'none', '@media print': { display: 'table-cell' } }}></TableCell>

                                    <TableCell><strong>Unidad</strong></TableCell>
                                    <TableCell><strong>Inquilino / Propietario</strong></TableCell>
                                    <TableCell align="center"><strong>Meses</strong></TableCell>
                                    <TableCell align="right"><strong>Deuda Total</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {datosProcesados.map((row) => (
                                    <RowMoroso 
                                        key={row.identificador_unico} 
                                        row={row} 
                                        isOpen={expandedIds.has(row.identificador_unico)}
                                        onToggle={handleToggleRow}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

export default ReporteMorosidad;