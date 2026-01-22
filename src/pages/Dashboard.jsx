import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, 
    Chip, CircularProgress, Alert, Box 
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

// Importamos nuestro servicio
import { reportesService } from '../services/reportesService';

const Dashboard = () => {
    const [morosos, setMorosos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Este efecto se ejecuta apenas se carga la pantalla
    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const data = await reportesService.obtenerMorosos();
                setMorosos(data);
            } catch (err) {
                setError("No se pudo conectar con el servidor. ¿Está prendido Python?");
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, []);

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
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                📊 Dashboard Financiero
            </Typography>

            <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    Reporte de Morosidad
                </Typography>
                
                {morosos.length === 0 ? (
                    <Alert severity="success">¡Excelente! No hay deudas vencidas en el sistema.</Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><strong>Unidad</strong></TableCell>
                                    <TableCell><strong>Inquilino</strong></TableCell>
                                    <TableCell align="center"><strong>Meses Atraso</strong></TableCell>
                                    <TableCell align="right"><strong>Deuda Total</strong></TableCell>
                                    <TableCell align="center"><strong>Estado</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {morosos.map((row) => (
                                    <TableRow key={row.identificador_unico} hover>
                                        <TableCell>{row.identificador_unico}</TableCell>
                                        <TableCell>{row.nombre_inquilino}</TableCell>
                                        <TableCell align="center">{row.cantidad_meses}</TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                            {row.total_deuda.toFixed(2)} Bs
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label="Moroso" color="error" size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

export default Dashboard;