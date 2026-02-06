import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, 
    Chip, CircularProgress, Alert, Box, TextField, InputAdornment, TableSortLabel
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { visuallyHidden } from '@mui/utils';

// Importamos nuestro servicio
import { reportesService } from '../services/reportesService';

// =============================================================================
// FUNCIONES DE ORDENAMIENTO
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
// COMPONENTE PRINCIPAL
// =============================================================================
const Dashboard = () => {
    const [morosos, setMorosos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- ESTADOS DE FILTRO Y ORDEN ---
    const [busqueda, setBusqueda] = useState('');
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id_unidad'); // Orden por defecto: Unidad

    // --- CARGA DE DATOS ---
    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const data = await reportesService.obtenerMorosidad(); 
                setMorosos(data);
            } catch (err) {
                console.error("Error en Dashboard:", err); 
                setError("No se pudo conectar con el servidor. Verifique la consola.");
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, []);

    // --- MANEJADORES ---
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // --- FILTRADO EN TIEMPO REAL ---
    const morososFiltrados = morosos.filter((row) => {
        if (!busqueda) return true;
        const texto = busqueda.toLowerCase();
        return (
            row.identificador_unico.toLowerCase().includes(texto) ||
            row.nombre_inquilino.toLowerCase().includes(texto)
        );
    });

    // Calcular deuda total de lo que se ve en pantalla
    const totalDeudaVisible = morososFiltrados.reduce((acc, curr) => acc + curr.total_deuda, 0);

    // 1. Estado de Carga
    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
        </Box>
    );

    // 2. Estado de Error
    if (error) return (
        <Container sx={{ mt: 5 }}>
            <Alert severity="error">{error}</Alert>
        </Container>
    );

    // 3. Estado Normal (Mostrar Datos)
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    📊 Dashboard Financiero
                </Typography>
                
                {/* TARJETA DE RESUMEN RÁPIDO */}
                <Paper elevation={3} sx={{ p: 2, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AttachMoneyIcon color="primary" fontSize="large" />
                    <Box>
                        <Typography variant="caption" color="text.secondary">DEUDA TOTAL (VISIBLE)</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {totalDeudaVisible.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            <Paper elevation={3} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                        Reporte de Morosidad
                    </Typography>

                    {/* BUSCADOR */}
                    <TextField
                        size="small"
                        placeholder="Buscar Unidad o Persona..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                        }}
                        sx={{ width: { xs: '100%', sm: '300px' } }}
                    />
                </Box>
                
                {morosos.length === 0 ? (
                    <Alert severity="success">¡Excelente! No hay deudas vencidas en el sistema.</Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    {/* UNIDAD (Ordenable) */}
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'id_unidad'} // Usamos id_unidad para orden lógico (1, 2, 10...)
                                            direction={orderBy === 'id_unidad' ? order : 'asc'}
                                            onClick={() => handleRequestSort('id_unidad')}
                                        >
                                            <strong>Unidad</strong>
                                            {orderBy === 'id_unidad' ? (
                                                <Box component="span" sx={visuallyHidden}>
                                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                                </Box>
                                            ) : null}
                                        </TableSortLabel>
                                    </TableCell>

                                    {/* INQUILINO (Ordenable) */}
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'nombre_inquilino'}
                                            direction={orderBy === 'nombre_inquilino' ? order : 'asc'}
                                            onClick={() => handleRequestSort('nombre_inquilino')}
                                        >
                                            <strong>Persona</strong>
                                        </TableSortLabel>
                                    </TableCell>

                                    {/* MESES ATRASO (Ordenable) */}
                                    <TableCell align="center">
                                        <TableSortLabel
                                            active={orderBy === 'cantidad_meses'}
                                            direction={orderBy === 'cantidad_meses' ? order : 'asc'}
                                            onClick={() => handleRequestSort('cantidad_meses')}
                                        >
                                            <strong>Meses Atraso</strong>
                                        </TableSortLabel>
                                    </TableCell>

                                    {/* DEUDA TOTAL (Ordenable) */}
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'total_deuda'}
                                            direction={orderBy === 'total_deuda' ? order : 'asc'}
                                            onClick={() => handleRequestSort('total_deuda')}
                                        >
                                            <strong>Deuda Total</strong>
                                        </TableSortLabel>
                                    </TableCell>

                                    <TableCell align="center"><strong>Estado</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stableSort(morososFiltrados, getComparator(order, orderBy))
                                    .map((row) => (
                                        <TableRow key={row.identificador_unico} hover>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{row.identificador_unico}</TableCell>
                                            <TableCell>{row.nombre_inquilino}</TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={row.cantidad_meses} 
                                                    color={row.cantidad_meses > 2 ? "error" : "warning"} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {row.total_deuda.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label="Moroso" color="error" size="small" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                                {morososFiltrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            No se encontraron resultados para "{busqueda}".
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

export default Dashboard;