import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Grid, Paper, Typography, TextField, Button,
    MenuItem, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Chip, Alert, Snackbar, Box, IconButton,
    InputAdornment, Autocomplete
} from '@mui/material';

import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

// Servicios
import { egresosService } from '../services/egresosService';
import { mediosService } from '../services/mediosService';
import { tipoEgresoService } from '../services/tipoEgresoService'; // Para traer los grupos con el vínculo
import { categoriasService } from '../services/categoriasService'; // Para traer todas las cuentas

const Egresos = () => {
    // --- ESTADOS ---
    const [lista, setLista] = useState([]);
    
    // Catálogos
    const [todasLasCuentas, setTodasLasCuentas] = useState([]); // Base de datos completa de cuentas imputables
    const [tiposDoc, setTiposDoc] = useState([]);    // Grupos visuales (con su vínculo a rubro)
    const [medios, setMedios] = useState([]);        // Billeteras
    
    const [loading, setLoading] = useState(false);

    // Formulario
    const [form, setForm] = useState({
        id_tipo_egreso: '',  // 1. Grupo (Filtro)
        id_catalogo: null,   // 2. Cuenta (Destino) - Ahora puede ser null para el Autocomplete
        id_medio_pago: '',   // 3. Billetera (Origen)
        beneficiario: '',
        num_comprobante: '',
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    const [mensaje, setMensaje] = useState({ open: false, text: '', type: 'success' });

    // --- CARGA INICIAL ---
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            // Carga paralela de todos los catálogos necesarios
            const [dataEgresos, dataCuentas, dataGrupos, dataMedios] = await Promise.all([
                egresosService.obtenerTodos(),
                categoriasService.obtenerTodas(), // Traemos todas para filtrar en cliente
                tipoEgresoService.obtenerTodos(), // Trae los grupos con el objeto 'rubro_contable'
                mediosService.obtenerTodos()
            ]);

            setLista(dataEgresos);
            
            // Filtramos solo las cuentas que NO son rubro (Imputables) y son de EGRESO
            const soloImputables = dataCuentas.filter(c => c.tipo === 'EGRESO' && c.es_rubro === false && c.activo === true);
            setTodasLasCuentas(soloImputables);
            
            setTiposDoc(dataGrupos.filter(g => g.activo)); // Solo grupos activos
            setMedios(dataMedios);

        } catch (error) {
            console.error("Error inicializando:", error);
            mostrarMensaje("Error al cargar listados", "error");
        }
    };

    // --- LÓGICA DE FILTRADO EN CASCADA (LA MAGIA) ---
    const cuentasFiltradas = useMemo(() => {
        // 1. Si no hay grupo seleccionado, no mostramos cuentas (o mostramos todas, depende de tu gusto)
        if (!form.id_tipo_egreso) return [];

        // 2. Buscamos el objeto del grupo seleccionado para ver su vínculo
        const grupoSelect = tiposDoc.find(g => g.id_tipo_egreso === form.id_tipo_egreso);
        
        // 3. Si el grupo no tiene vínculo contable, mostramos error o lista vacía
        if (!grupoSelect || !grupoSelect.rubro_contable) {
            return []; 
        }

        // 4. Obtenemos el código padre (Ej: "5.2.1.00")
        const codigoPadre = grupoSelect.rubro_contable.codigo;
        
        // 5. El truco del prefijo: Quitamos los ceros del final para buscar hijos
        // Ej: De "5.2.1.00" nos interesa que empiecen con "5.2.1"
        // Una forma segura es usar los primeros caracteres significativos.
        // Asumiendo estructura X.X.X.XX, los padres suelen ser X.X.X
        const prefijo = codigoPadre.substring(0, 5); // Toma "5.2.1"

        return todasLasCuentas.filter(c => c.codigo.startsWith(prefijo));

    }, [form.id_tipo_egreso, tiposDoc, todasLasCuentas]);


    // --- MANEJADORES ---
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        // Validaciones
        if (!form.id_tipo_egreso) return mostrarMensaje("Seleccione el Grupo primero", "warning");
        if (!form.id_catalogo) return mostrarMensaje("Seleccione la Cuenta Contable Específica", "warning");
        if (!form.id_medio_pago) return mostrarMensaje("Seleccione la Billetera de origen", "warning");
        if (!form.beneficiario) return mostrarMensaje("Falta el Beneficiario", "warning");
        if (!form.monto || parseFloat(form.monto) <= 0) return mostrarMensaje("El monto debe ser positivo", "warning");

        // Validación de Regla de Negocio (Documento Obligatorio)
        const grupo = tiposDoc.find(t => t.id_tipo_egreso === form.id_tipo_egreso);
        if (grupo?.requiere_num_doc && !form.num_comprobante.trim()) {
            return mostrarMensaje(`El grupo "${grupo.nombre}" exige un Número de Comprobante`, "error");
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                monto: parseFloat(form.monto),
            };

            await egresosService.crear(payload);
            mostrarMensaje("Gasto registrado correctamente", "success");
            
            // Limpiar formulario inteligente
            setForm({
                ...form,
                beneficiario: '',
                num_comprobante: '',
                descripcion: '',
                monto: ''
                // Mantenemos las selecciones de Grupo/Cuenta/Billetera para agilizar carga masiva
            });
            
            // Recargar lista historial
            const newData = await egresosService.obtenerTodos();
            setLista(newData);

        } catch (error) {
            console.error(error);
            let msg = "Error al guardar";
            if (error.response?.data?.detail) {
                msg = error.response.data.detail;
            }
            mostrarMensaje(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async (id) => {
        if (!window.confirm("¿Seguro de anular este gasto?")) return;
        try {
            await egresosService.anular(id);
            mostrarMensaje("Gasto anulado", "success");
            const newData = await egresosService.obtenerTodos();
            setLista(newData);
        } catch (error) {
            mostrarMensaje("No se pudo anular", "error");
        }
    };

    const mostrarMensaje = (texto, type = 'success') => {
        setMensaje({ open: true, text: texto, type });
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#d32f2f' }}>
                Registro de Gastos
            </Typography>

            <Grid container spacing={3} alignItems="flex-start">
                
                {/* 1. FORMULARIO */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, bgcolor: '#fff5f5', border: '1px solid #ffcdd2' }}> 
                        <Typography variant="h6" gutterBottom color="error" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <MoneyOffIcon sx={{ mr: 1 }}/> 
                            Nueva Salida de Dinero
                        </Typography>
                        
                        <Grid container spacing={2}>
                            
                            {/* --- PASO 1: GRUPO (EL FILTRO) --- */}
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="1. Grupo / Carpeta"
                                    name="id_tipo_egreso"
                                    value={form.id_tipo_egreso}
                                    onChange={(e) => {
                                        // Al cambiar de grupo, reseteamos la cuenta porque las opciones cambian
                                        setForm({ ...form, id_tipo_egreso: e.target.value, id_catalogo: null });
                                    }}
                                    helperText="Selecciona primero el tipo de gasto"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><FolderOpenIcon color="action"/></InputAdornment>,
                                    }}
                                >
                                    {tiposDoc.map((t) => (
                                        <MenuItem key={t.id_tipo_egreso} value={t.id_tipo_egreso}>
                                            {t.nombre}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* --- PASO 2: CUENTA ESPECÍFICA (AUTOCOMPLETE FILTRADO) --- */}
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={cuentasFiltradas}
                                    getOptionLabel={(option) => `${option.codigo} - ${option.nombre_cuenta}`}
                                    value={cuentasFiltradas.find(c => c.id_catalogo === form.id_catalogo) || null}
                                    onChange={(event, newValue) => {
                                        setForm({ ...form, id_catalogo: newValue ? newValue.id_catalogo : null });
                                    }}
                                    disabled={!form.id_tipo_egreso} // Se deshabilita si no eligió grupo
                                    noOptionsText={form.id_tipo_egreso ? "No hay cuentas en este rubro" : "Selecciona un grupo arriba"}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            label="2. Cuenta Contable (Detalle)" 
                                            placeholder="Busca por nombre..."
                                            helperText={form.id_tipo_egreso ? `Cuentas disponibles: ${cuentasFiltradas.length}` : "Esperando selección de grupo..."}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start"><AccountTreeIcon color="action"/></InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* --- PASO 3: BILLETERA --- */}
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="3. Pagar desde (Billetera)"
                                    name="id_medio_pago"
                                    value={form.id_medio_pago}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><AccountBalanceWalletIcon color="action"/></InputAdornment>,
                                    }}
                                >
                                    {medios.map((m) => (
                                        <MenuItem key={m.id_medio_ingreso} value={m.id_medio_ingreso}>
                                            {m.nombre} 
                                            {m.limite_maximo > 0 && ` (Máx: ${m.limite_maximo} Bs)`}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* --- DATOS DEL COMPROBANTE --- */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Fecha del Gasto"
                                    name="fecha"
                                    value={form.fecha}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Beneficiario"
                                    name="beneficiario"
                                    value={form.beneficiario}
                                    onChange={handleChange}
                                    placeholder="Ej: EPSAS, Ferretería Juan"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nro. Factura / Recibo"
                                    name="num_comprobante"
                                    value={form.num_comprobante}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Monto Total"
                                    name="monto"
                                    value={form.monto}
                                    onChange={handleChange}
                                    InputProps={{ 
                                        startAdornment: <InputAdornment position="start">Bs</InputAdornment>,
                                        style: { fontSize: '1.2rem', fontWeight: 'bold', color: '#d32f2f' }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Descripción / Detalle"
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    color="error" 
                                    size="large"
                                    startIcon={<SaveIcon />}
                                    onClick={handleGuardar}
                                    disabled={loading}
                                >
                                    {loading ? "Registrando..." : "REGISTRAR GASTO"}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* 2. HISTORIAL */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> 
                            Historial de Egresos
                        </Typography>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Cuenta / Grupo</TableCell>
                                        <TableCell>Pagado Con</TableCell>
                                        <TableCell>Beneficiario</TableCell>
                                        <TableCell align="right">Monto</TableCell>
                                        <TableCell align="center">Estado</TableCell>
                                        <TableCell align="center">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lista.map((row) => {
                                        const isAnulado = row.estado === 'cancelado';
                                        return (
                                            <TableRow 
                                                key={row.id_egreso} 
                                                hover
                                                sx={{ opacity: isAnulado ? 0.5 : 1, bgcolor: isAnulado ? '#f5f5f5' : 'inherit' }}
                                            >
                                                <TableCell>{row.fecha}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {row.nombre_cuenta}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {row.tipo_egreso?.nombre}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={row.medio_pago?.nombre || 'Desc.'} 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="primary"
                                                        icon={<AccountBalanceWalletIcon />}
                                                    />
                                                </TableCell>
                                                <TableCell>{row.beneficiario}</TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold', textDecoration: isAnulado ? 'line-through' : 'none' }}>
                                                    Bs {parseFloat(row.monto).toFixed(2)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={row.estado} 
                                                        size="small" 
                                                        color={isAnulado ? "default" : "success"} 
                                                        variant="filled" 
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {!isAnulado && (
                                                        <IconButton 
                                                            size="small" 
                                                            color="error" 
                                                            onClick={() => handleAnular(row.id_egreso)}
                                                            title="Anular Gasto"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {lista.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No hay gastos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

            </Grid>

            <Snackbar open={mensaje.open} autoHideDuration={5000} onClose={() => setMensaje({...mensaje, open: false})}>
                <Alert severity={mensaje.type}>{mensaje.text}</Alert>
            </Snackbar>
        </Container>
    );
};

export default Egresos;