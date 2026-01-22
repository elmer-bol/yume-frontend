import React, { useEffect, useState, useMemo } from 'react';
import { 
    Container, Typography, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, 
    Chip, CircularProgress, Alert, Box, TextField, 
    InputAdornment, IconButton, Collapse, Grid, Button,
    MenuItem, Select, FormControl, InputLabel
} from '@mui/material';

// Iconos
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PrintIcon from '@mui/icons-material/Print';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FilterListIcon from '@mui/icons-material/FilterList';

import { reportesService } from '../services/reportesService';

// --- ESTILOS IMPRESIÓN ---
const printStyles = `
  @media print {
    .no-print { display: none !important; }
    .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
    body { background-color: white; }
    @page { margin: 1cm; size: landscape; }
  }
`;

// --- FILA CON DETALLE EXPANDIBLE ---
const RowMoroso = ({ row }) => {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? '#f8fafc' : 'inherit' }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {row.identificador_unico}
                </TableCell>
                <TableCell>{row.nombre_inquilino}</TableCell>
                <TableCell align="center">
                    <Chip label={`${row.cantidad_meses} Meses`} color={row.cantidad_meses > 3 ? "error" : "warning"} variant="outlined" size="small" />
                </TableCell>
                <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1rem' }}>
                    {row.total_deuda.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, backgroundColor: '#fff', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#64748b' }}>
                                🧾 Detalle de Deuda
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Periodo</TableCell>
                                        <TableCell sx={{ color: '#2563eb', fontWeight: 'bold' }}>Concepto</TableCell> {/* COLUMNA NUEVA */}
                                        <TableCell>Días Atraso</TableCell>
                                        <TableCell align="right">Monto</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.detalles.map((detalle, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{detalle.periodo}</TableCell>
                                            <TableCell sx={{ color: '#2563eb' }}>{detalle.concepto}</TableCell> {/* DATO NUEVO */}
                                            <TableCell>{detalle.dias_atraso} días</TableCell>
                                            <TableCell align="right">{detalle.monto_pendiente.toFixed(2)} Bs</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.total_deuda.toFixed(2)} Bs</TableCell>
                                    </TableRow>
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

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const data = await reportesService.obtenerMorosos();
                setMorosos(data);
            } catch (err) {
                setError("Error cargando reporte. Verifique su conexión.");
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, []);

    // 1. EXTRAER LISTA ÚNICA DE CONCEPTOS PARA EL FILTRO
    const listaConceptos = useMemo(() => {
        const conceptosSet = new Set();
        morosos.forEach(m => {
            m.detalles.forEach(d => conceptosSet.add(d.concepto));
        });
        return ["TODOS", ...Array.from(conceptosSet)];
    }, [morosos]);

    // 2. LÓGICA DE FILTRADO MAESTRA
    const datosProcesados = useMemo(() => {
        let data = morosos;

        // A. Filtro por Texto (Depto o Nombre)
        if (busqueda) {
            const lowerBusqueda = busqueda.toLowerCase();
            data = data.filter(m => 
                m.identificador_unico.toLowerCase().includes(lowerBusqueda) ||
                m.nombre_inquilino.toLowerCase().includes(lowerBusqueda)
            );
        }

        // B. Filtro por Concepto (RECALCULA TOTALES)
        if (conceptoFiltro !== "TODOS") {
            data = data.map(unidad => {
                // Filtramos solo los detalles que coincidan con el concepto seleccionado
                const detallesFiltrados = unidad.detalles.filter(d => d.concepto === conceptoFiltro);
                
                // Si no tiene deudas de este concepto, devolvemos null (para filtrarlo después)
                if (detallesFiltrados.length === 0) return null;

                // Recalculamos la deuda total de la unidad basándonos SOLO en el concepto filtrado
                const nuevaDeuda = detallesFiltrados.reduce((acc, d) => acc + d.monto_pendiente, 0);

                return {
                    ...unidad,
                    detalles: detallesFiltrados,
                    total_deuda: nuevaDeuda,
                    cantidad_meses: detallesFiltrados.length // Actualizamos contador de meses
                };
            }).filter(item => item !== null); // Eliminamos los que quedaron vacíos
        }

        return data;
    }, [morosos, busqueda, conceptoFiltro]);

    const totalDeudaGeneral = datosProcesados.reduce((acc, curr) => acc + curr.total_deuda, 0);

    const handlePrint = () => window.print();

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="print-container">
            <style>{printStyles}</style>

            <Box className="no-print">
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                    📉 Reporte de Morosidad
                </Typography>

                {/* TARJETAS DE TOTALES */}
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

                {/* BARRA DE FILTROS */}
                <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    
                    {/* 1. Buscador Texto */}
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

                    {/* 2. Filtro Concepto (NUEVO) */}
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

            {/* TABLA DE RESULTADOS */}
            <Paper elevation={3} sx={{ p: 2 }}>
                {/* Encabezado visible solo al imprimir */}
                <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2 } }}>
                    <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
                        REPORTE DE MOROSIDAD - {conceptoFiltro === "TODOS" ? "GENERAL" : conceptoFiltro.toUpperCase()}
                    </Typography>
                    <Typography variant="subtitle1" align="center">
                        Fecha: {new Date().toLocaleDateString()}
                    </Typography>
                </Box>

                {datosProcesados.length === 0 ? (
                    <Alert severity="success">No se encontraron deudas con los filtros seleccionados.</Alert>
                ) : (
                    <TableContainer>
                        <Table aria-label="tabla morosos">
                            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell width="50px" />
                                    <TableCell><strong>Unidad</strong></TableCell>
                                    <TableCell><strong>Inquilino / Propietario</strong></TableCell>
                                    <TableCell align="center"><strong>Cant. Cuotas</strong></TableCell>
                                    <TableCell align="right"><strong>Deuda Total</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {datosProcesados.map((row) => (
                                    <RowMoroso key={row.identificador_unico} row={row} />
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