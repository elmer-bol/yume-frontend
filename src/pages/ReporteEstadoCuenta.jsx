import React, { useState, useEffect, useMemo } from 'react';
import { 
    Container, Typography, Grid, Paper, Box, 
    TextField, Autocomplete, Card, CardContent, 
    Table, TableBody, TableCell, TableHead, TableRow, Chip, 
    LinearProgress, Alert, InputAdornment, Button, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PrintIcon from '@mui/icons-material/Print';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

import { personasService } from '../services/personasService';
import { reportesService } from '../services/reportesService';
import { contratosService } from '../services/contratosService';
import { unidadesService } from '../services/unidadesService';

// =============================================================================
// ESTILOS DE IMPRESIÓN (ULTRA COMPACTO)
// =============================================================================
const printStyles = `
  @media print {
    html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible; }
    .no-print { display: none !important; }

    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 15px !important;
      background-color: white !important;
    }

    * {
      color: black !important;
      background-color: transparent !important;
      box-shadow: none !important;
      border-color: #999 !important;
      font-family: Arial, sans-serif !important;
    }
    
    h4 { font-size: 14pt !important; margin-bottom: 2px !important; text-align: center; }
    h5 { font-size: 11pt !important; font-weight: bold !important; margin: 0 !important; }
    h6 { font-size: 10pt !important; font-weight: bold !important; margin-bottom: 2px !important; margin-top: 5px !important; }
    .subtitle-print { font-size: 8pt !important; text-align: center; margin-bottom: 10px !important; display: block !important; }

    .MuiTableContainer-root { max-height: none !important; overflow: visible !important; display: block !important; height: auto !important; }
    
    .MuiTableCell-root {
      padding: 1px 4px !important;
      font-size: 8pt !important;
      line-height: 1.1 !important;
      border-bottom: 1px solid #ccc !important;
    }
    
    .MuiTableCell-head {
      font-weight: bold !important;
      border-bottom: 1px solid black !important;
      background-color: #f0f0f0 !important;
      font-size: 8pt !important;
    }

    .MuiGrid-item { padding-top: 5px !important; padding-bottom: 5px !important; }
    .MuiCard-root { border: 1px solid #000 !important; margin-bottom: 5px !important; box-shadow: none; }
    .MuiCardContent-root { padding: 4px 8px !important; }
    .MuiCardContent-root:last-child { padding-bottom: 4px !important; }
    
    .amount-text { font-size: 12pt !important; font-weight: bold !important; }
    .label-text { font-size: 8pt !important; margin-bottom: 0 !important; }

    .MuiDivider-root { margin-bottom: 5px !important; margin-top: 5px !important; }
    .section-container { margin-bottom: 10px !important; padding: 0 !important; border: none !important; }
    
    tr { page-break-inside: avoid; }
  }
`;

const ReporteEstadoCuenta = () => {
    const [opcionesBuscador, setOpcionesBuscador] = useState([]);
    const [seleccion, setSeleccion] = useState(null);
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // 1. CARGA DE DATOS INICIAL
    useEffect(() => {
        const cargarDatosBuscador = async () => {
            try {
                const [listaPersonas, listaUnidades, listaContratos] = await Promise.all([
                    personasService.obtenerTodas(),
                    unidadesService.obtenerTodas(),
                    contratosService.obtenerTodos()
                ]);

                const mapaUnidades = {};
                listaUnidades.forEach(u => {
                    mapaUnidades[u.id_unidad] = u.identificador_unico;
                });

                const mapaPersonas = {};
                listaPersonas.forEach(p => {
                    mapaPersonas[p.id_persona] = `${p.nombres} ${p.apellidos}`.trim();
                });

                const opciones = [];
                listaContratos.forEach(c => {
                    const estado = c.estado ? c.estado.toUpperCase() : '';
                    if (estado === 'ACTIVO' || estado === 'VIGENTE') {
                        const nombreUnidad = mapaUnidades[c.id_unidad] || 'Sin Unidad';
                        const nombrePersona = mapaPersonas[c.id_persona] || 'Sin Propietario';

                        opciones.push({
                            id_persona: c.id_persona,
                            id_unidad: c.id_unidad, 
                            nombre_unidad: nombreUnidad,
                            nombre_persona: nombrePersona,
                            label: `${nombreUnidad} - ${nombrePersona}` 
                        });
                    }
                });

                opciones.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
                setOpcionesBuscador(opciones);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoadingData(false);
            }
        };
        cargarDatosBuscador();
    }, []);

    // 2. CARGAR REPORTE GLOBAL (Backend devuelve TODO lo de la persona)
    useEffect(() => {
        if (seleccion) {
            setLoading(true);
            setReporte(null);
            reportesService.obtenerEstadoCuenta(seleccion.id_persona)
                .then(data => setReporte(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setReporte(null);
        }
    }, [seleccion]);

    // 3. LÓGICA DE FILTRADO Y RECÁLCULO (Aquí ocurre la magia ✨)
    const datosFiltrados = useMemo(() => {
        if (!reporte || !seleccion) return null;

        // Si el backend no envía 'id_unidad' en los detalles, mostramos todo para no romper nada.
        // Pero idealmente debería tenerlo.
        
        // A. FILTRAR DEUDAS
        const deudas = reporte.deudas_pendientes.filter(d => {
            // Si el objeto deuda tiene id_unidad, lo usamos.
            // Si no, intentamos buscar el nombre de la unidad en la descripción/concepto.
            if (d.id_unidad) return d.id_unidad === seleccion.id_unidad;
            
            // Fallback (Búsqueda por texto) si el backend no manda ID
            // "Expensas LOCAL 1 Enero" contiene "LOCAL 1"
            return true; // POR AHORA DEJAMOS PASAR TODO SI NO HAY ID, PARA EVITAR TABLA VACÍA
            // Nota: Para que esto sea exacto, tu backend debe incluir id_unidad en cada item de deuda
        });

        // B. FILTRAR BILLETERAS (Esto sí suele tener el nombre de unidad)
        const billeteras = reporte.billeteras.filter(b => 
            // Buscamos coincidencia exacta de nombre o ID si existiera
            b.unidad === seleccion.nombre_unidad
        );

        // C. RECALCULAR TOTALES
        const totalVencido = deudas
            .filter(d => d.estado === 'VENCIDO')
            .reduce((acc, curr) => acc + curr.saldo_pendiente, 0);
            
        const totalTotal = deudas
            .reduce((acc, curr) => acc + curr.saldo_pendiente, 0);

        const saldoFavor = billeteras
            .reduce((acc, curr) => acc + curr.saldo, 0);

        // Retornamos un objeto "virtual" solo con lo de esa unidad
        return {
            ...reporte,
            billeteras: billeteras,
            deudas_pendientes: deudas,
            resumen: {
                ...reporte.resumen,
                total_deuda_vencida: totalVencido,
                total_deuda_pendiente: totalTotal,
                saldo_a_favor_disponible: saldoFavor,
                // Recalculamos estado visual
                estado_general: totalVencido > 0 ? 'Moroso' : (totalTotal > 0 ? 'Deuda Corriente' : 'Solvente')
            }
        };

    }, [reporte, seleccion]);

    // --- IMPORTANTE ---
    // Usamos 'datosFiltrados' para renderizar, no 'reporte' directo.
    // Si la lógica de filtrado falla (backend no manda IDs), usamos 'reporte' como respaldo.
    const dataVisual = datosFiltrados || reporte;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="print-container">
            <style>{printStyles}</style>

            {/* TÍTULO PANTALLA */}
            <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center' }}>
                    <PersonSearchIcon sx={{ mr: 2, fontSize: 40, color: '#1976d2' }}/> 
                    Estado de Cuenta
                </Typography>
                {dataVisual && (
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ bgcolor: '#1e293b' }}>
                        Imprimir
                    </Button>
                )}
            </Box>

            {/* HEADER IMPRESIÓN */}
            <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 1, textAlign: 'center' } }}>
                <Typography variant="h4" fontWeight="bold">ESTADO DE CUENTA</Typography>
                <Typography className="subtitle-print">Fecha: {new Date().toLocaleDateString()}</Typography>
                <Divider sx={{ mb: 1, borderColor: 'black' }} />
            </Box>

            {/* BUSCADOR */}
            <Paper className="no-print" sx={{ p: 3, mb: 4, backgroundColor: '#f8fafc', borderLeft: '5px solid #1976d2' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Busque por <strong>Número de Unidad</strong> (Filtra deudas específicas).
                </Typography>
                {loadingData ? <LinearProgress /> : (
                    <Autocomplete
                        options={opcionesBuscador}
                        getOptionLabel={(option) => option.label}
                        sx={{ width: '100%', maxWidth: 700 }}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Seleccione Unidad..." 
                                variant="outlined" 
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (<><InputAdornment position="start"><HomeWorkIcon color="action" /></InputAdornment>{params.InputProps.startAdornment}</>)
                                }}
                            />
                        )}
                        value={seleccion}
                        onChange={(event, newValue) => setSeleccion(newValue)}
                        noOptionsText="No encontrado"
                    />
                )}
            </Paper>

            {loading && <LinearProgress sx={{ mb: 2 }} className="no-print" />}

            {dataVisual && (
                <Box sx={{ animation: 'fadeIn 0.5s' }}>
                    
                    {/* DATOS DEL CLIENTE */}
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #ccc', pb: 1 }}>
                        <div style={{ maxWidth: '80%' }}>
                            {/* TITULO UNIDAD GRANDE */}
                            <Typography variant="h5" fontWeight="bold">
                                {seleccion?.nombre_unidad || "Consolidado Global"}
                            </Typography>
                            <Typography variant="subtitle1" className="subtitle-print" style={{textAlign:'left', margin:0, lineHeight: 1.2}}>
                                Propietario: {dataVisual.nombre_persona} <br/>
                                <span style={{fontSize: '0.9em', color: '#666'}}>ID Cliente: {dataVisual.id_persona}</span>
                            </Typography>
                        </div>
                        <Chip 
                            label={dataVisual.resumen.estado_general.toUpperCase()} 
                            color={dataVisual.resumen.estado_general === 'Moroso' ? 'error' : 'success'}
                            size="small"
                            sx={{ fontWeight: 'bold', '@media print': { border: '1px solid black', color: 'black', height: '20px', fontSize: '8pt' } }}
                        />
                    </Box>

                    {/* TARJETAS DE RESUMEN (Calculadas dinámicamente) */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#eff6ff', height: '100%' }}>
                                <CardContent>
                                    <Typography className="label-text" color="textSecondary" gutterBottom>Saldo a Favor</Typography>
                                    <Typography className="amount-text" variant="h4" sx={{ fontWeight: 'bold', color: '#1d4ed8' }}>
                                        {dataVisual.resumen.saldo_a_favor_disponible.toLocaleString('es-BO', { minimumFractionDigits: 2 })} <small style={{fontSize: '0.6em'}}>Bs</small>
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#fef2f2', height: '100%' }}>
                                <CardContent>
                                    <Typography className="label-text" color="textSecondary" gutterBottom>Deuda Vencida</Typography>
                                    <Typography className="amount-text" variant="h4" sx={{ fontWeight: 'bold', color: '#b91c1c' }}>
                                        {dataVisual.resumen.total_deuda_vencida.toLocaleString('es-BO', { minimumFractionDigits: 2 })} <small style={{fontSize: '0.6em'}}>Bs</small>
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#fff7ed', height: '100%' }}>
                                <CardContent>
                                    <Typography className="label-text" color="textSecondary" gutterBottom>Total a Pagar</Typography>
                                    <Typography className="amount-text" variant="h4" sx={{ fontWeight: 'bold', color: '#c2410c' }}>
                                        {dataVisual.resumen.total_deuda_pendiente.toLocaleString('es-BO', { minimumFractionDigits: 2 })} <small style={{fontSize: '0.6em'}}>Bs</small>
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* DETALLE BILLETERAS */}
                    {dataVisual.billeteras.length > 0 ? (
                        <Paper className="section-container" sx={{ p: 2, mb: 4, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                            <Typography variant="h6" gutterBottom color="primary" sx={{ '@media print': { color: 'black' } }}>
                                Billeteras / Unidades
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Unidad</TableCell>
                                        <TableCell>Relación</TableCell>
                                        <TableCell align="right">Saldo a Favor</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dataVisual.billeteras.map((b, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{b.unidad}</TableCell>
                                            <TableCell>{b.tipo_relacion}</TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                {b.saldo.toFixed(2)} Bs
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    ) : (
                        // Mensaje opcional si al filtrar no quedan billeteras para esa unidad
                        <Typography variant="caption" sx={{display:'block', mb: 2, fontStyle:'italic', color:'grey'}}>Sin saldo específico para esta unidad.</Typography>
                    )}

                    {/* TABLA DE DEUDAS */}
                    <Paper className="section-container" sx={{ p: 2, mb: 4, borderTop: '4px solid #ef5350', boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                           <span className="no-print" style={{marginRight: '5px'}}>🔴</span> Detalle de Deudas
                        </Typography>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell>Periodo</TableCell>
                                    <TableCell>Concepto</TableCell>
                                    <TableCell>Vence</TableCell>
                                    <TableCell align="right">Monto</TableCell>
                                    <TableCell align="right">Pendiente</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dataVisual.deudas_pendientes.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{item.periodo}</TableCell>
                                        <TableCell>{item.concepto}</TableCell>
                                        <TableCell>{item.fecha_vencimiento}</TableCell>
                                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{item.monto_base.toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.saldo_pendiente.toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={item.estado} 
                                                color={item.estado === 'VENCIDO' ? 'error' : 'warning'} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ height: '20px', fontSize: '0.7rem', '@media print': { border: '1px solid #333', color: 'black' } }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {dataVisual.deudas_pendientes.length === 0 && (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 2, color: 'text.secondary' }}>No hay deudas pendientes para esta unidad.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>

                    {/* HISTORIAL RECIENTE (Mostramos todo el historial de la persona porque los pagos suelen ser globales, o filtrado si el backend lo permite) */}
                    <Paper className="section-container" sx={{ p: 2, mb: 4, borderTop: '4px solid #66bb6a', boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom>
                             <span className="no-print" style={{marginRight: '5px'}}>🟢</span> Historial Reciente (Global)
                        </Typography>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Recibo</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell>Método</TableCell>
                                    <TableCell align="right">Monto</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dataVisual.ultimos_pagos.map((pago, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>{pago.num_documento}</TableCell>
                                        <TableCell>{pago.descripcion}</TableCell>
                                        <TableCell>{pago.medio_pago}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                            {pago.monto_total.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {dataVisual.ultimos_pagos.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center">Sin movimientos recientes</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>

                    {/* FIRMAS */}
                    <Box sx={{ display: 'none', '@media print': { display: 'flex', mt: 4, pt: 2, justifyContent: 'space-between' } }}>
                        <Box sx={{ borderTop: '1px solid black', width: '40%', textAlign: 'center', pt: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '8pt' }}>Recibido Conforme</Typography>
                        </Box>
                        <Box sx={{ borderTop: '1px solid black', width: '40%', textAlign: 'center', pt: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '8pt' }}>Administración</Typography>
                        </Box>
                    </Box>

                </Box>
            )}
        </Container>
    );
};

export default ReporteEstadoCuenta;