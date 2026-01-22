import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Grid, Paper, Box, 
    TextField, Autocomplete, Card, CardContent, Divider,
    Table, TableBody, TableCell, TableHead, TableRow, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Servicios
import { personasService } from '../services/personasService';
import { reportesService } from '../services/reportesService';

const ReporteEstadoCuenta = () => {
    // Estado para el buscador
    const [personas, setPersonas] = useState([]);
    const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
    
    // Estado del reporte
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(false);

    // 1. Cargar lista de personas para el buscador
    useEffect(() => {
        const cargarPersonas = async () => {
            try {
                const data = await personasService.getAll(); // Asegúrate que este método exista en personasService
                setPersonas(data);
            } catch (error) {
                console.error("Error cargando personas", error);
            }
        };
        cargarPersonas();
    }, []);

    // 2. Cuando seleccionan a alguien, cargamos su reporte
    useEffect(() => {
        if (personaSeleccionada) {
            setLoading(true);
            reportesService.obtenerEstadoCuenta(personaSeleccionada.id_persona)
                .then(data => setReporte(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setReporte(null);
        }
    }, [personaSeleccionada]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                📋 Estado de Cuenta Individual
            </Typography>

            {/* BUSCADOR */}
            <Paper sx={{ p: 3, mb: 4, backgroundColor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                    <Autocomplete
                        options={personas}
                        getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                        sx={{ width: 400 }}
                        renderInput={(params) => <TextField {...params} label="Buscar Propietario o Inquilino" variant="standard" />}
                        value={personaSeleccionada}
                        onChange={(event, newValue) => setPersonaSeleccionada(newValue)}
                    />
                </Box>
            </Paper>

            {/* RESULTADOS */}
            {reporte && (
                <>
                    {/* TARJETAS DE RESUMEN */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#eff6ff' }}>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Estado General</Typography>
                                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#1d4ed8' }}>
                                        {reporte.resumen.estado_general}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#fef2f2' }}>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Deuda Vencida</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#b91c1c' }}>
                                        {reporte.resumen.total_deuda_vencida.toFixed(2)} Bs
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#f0fdf4' }}>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Saldo a Favor (Billetera)</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#15803d' }}>
                                        {reporte.resumen.saldo_a_favor_disponible.toFixed(2)} Bs
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* TABLA DE DEUDAS PENDIENTES */}
                    <Paper sx={{ p: 2, mb: 4 }}>
                        <Typography variant="h6" gutterBottom>🔴 Deudas Pendientes</Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Periodo</TableCell>
                                    <TableCell>Concepto</TableCell>
                                    <TableCell>Vencimiento</TableCell>
                                    <TableCell align="right">Saldo</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reporte.deudas_pendientes.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.periodo}</TableCell>
                                        <TableCell>{item.concepto}</TableCell>
                                        <TableCell>{item.fecha_vencimiento}</TableCell>
                                        <TableCell align="right">{item.saldo_pendiente.toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={item.estado} 
                                                color={item.estado === 'VENCIDO' ? 'error' : 'warning'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {reporte.deudas_pendientes.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center">No hay deudas pendientes</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </>
            )}
        </Container>
    );
};

export default ReporteEstadoCuenta;