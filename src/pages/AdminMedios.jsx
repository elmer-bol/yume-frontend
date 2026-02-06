import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControlLabel, Switch, Tooltip,
    DialogContentText, MenuItem, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings'; 
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn'; // Icono Límite

// IMPORTAMOS TUS SERVICIOS
import { mediosService } from '../services/mediosService';
import { categoriasService } from '../services/categoriasService';

const AdminMedios = () => {
    const [medios, setMedios] = useState([]);
    const [categorias, setCategorias] = useState([]); 
    
    // Modal de Crear/Editar
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    // Estados para borrado seguro
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [medioAEliminar, setMedioAEliminar] = useState(null); 

    // Estado Formulario
    const [formulario, setFormulario] = useState({
        nombre: '', 
        tipo: 'efectivo', // Valor por defecto seguro
        requiere_referencia: false, 
        id_catalogo: '', 
        limite_maximo: 0, // <--- NUEVO CAMPO (Regla 1000 Bs)
        activo: true
    });

    const cargarDatos = async () => {
        try {
            // 1. Cargar Medios
            const dataMedios = await mediosService.obtenerTodos();
            setMedios(dataMedios);

            // 2. Cargar Categorías (Cuentas)
            const dataCats = await categoriasService.obtenerTodas();
            
            // --- CORRECCIÓN CRÍTICA CONTABLE ---
            // Las Billeteras son ACTIVOS (Grupo 1), NO Ingresos (Grupo 4).
            // Filtramos todo lo que sea Tipo 'ACTIVO' o empiece con código '1.'
            const cuentasActivo = dataCats.filter(c => 
                c.tipo === 'ACTIVO' || c.tipo === 'Activo' || c.codigo.startsWith('1.')
            );
            setCategorias(cuentasActivo);

        } catch (error) {
            console.error("Error al cargar datos", error);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormulario({ ...formulario, [name]: type === 'checkbox' ? checked : value });
    };

    const handleGuardar = async () => {
        // VALIDACIÓN
        if (!formulario.id_catalogo) {
            alert("⚠️ Error: Debes vincular una Cuenta Contable de ACTIVO (Ej: Caja Principal).");
            return;
        }
        
        try {
            // Convertir tipos si es necesario
            const payload = {
                ...formulario,
                limite_maximo: parseFloat(formulario.limite_maximo) || 0
            };

            if (modoEdicion) {
                await mediosService.actualizarMedio(idEdicion, payload);
            } else {
                await mediosService.crearMedio(payload);
            }
            setOpenModal(false);
            cargarDatos();
        } catch (error) {
            console.error(error);
            // Mostrar mensaje bonito del backend
            const msg = error.response?.data?.detail || "Error desconocido";
            alert("Error: " + msg);
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        setIdEdicion(row.id_medio_ingreso);
        setFormulario({
            nombre: row.nombre,
            tipo: row.tipo,
            requiere_referencia: row.requiere_referencia,
            id_catalogo: row.id_catalogo || '', 
            limite_maximo: row.limite_maximo || 0, // <--- CARGAR LÍMITE
            activo: row.activo
        });
        setOpenModal(true);
    };

    const handleClickEliminar = (row) => {
        setMedioAEliminar(row); 
        setOpenDeleteDialog(true);
    };

    const confirmarEliminacion = async () => {
        try {
            if (medioAEliminar) {
                await mediosService.eliminarMedio(medioAEliminar.id_medio_ingreso);
                cargarDatos();
            }
            setOpenDeleteDialog(false); 
            setMedioAEliminar(null);    
        } catch (error) {
            const msg = error.response?.data?.detail || "No se pudo eliminar.";
            alert(msg);
            setOpenDeleteDialog(false);
        }
    };

    // Helper para mostrar nombre de la cuenta en la tabla
    const getNombreCuenta = (id) => {
        const cat = categorias.find(c => c.id_catalogo === id);
        return cat ? `${cat.codigo} - ${cat.nombre_cuenta}` : 'Sin asignar';
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', color: '#2e7d32', fontWeight: 'bold' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} /> Billeteras y Bancos
                </Typography>
                <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    // Resetear form
                    setFormulario({ nombre: '', tipo: 'efectivo', id_catalogo: '', requiere_referencia: false, limite_maximo: 0, activo: true });
                    setOpenModal(true);
                }}>
                    Nueva Billetera
                </Button>
            </div>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#e8f5e9' }}>
                        <TableRow>
                            <TableCell><strong>Nombre Billetera</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Cuenta Contable (Activo)</strong></TableCell> 
                            <TableCell align="center"><strong>Límite Gasto</strong></TableCell>
                            <TableCell align="center"><strong>Ref. Obligatoria</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {medios.map((row) => (
                            <TableRow key={row.id_medio_ingreso} hover>
                                <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre}</TableCell>
                                <TableCell>{row.tipo}</TableCell>
                                
                                {/* COLUMNA CUENTA CONTABLE */}
                                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                    {getNombreCuenta(row.id_catalogo)}
                                </TableCell>

                                {/* COLUMNA LÍMITE */}
                                <TableCell align="center">
                                    {row.limite_maximo > 0 ? (
                                        <Chip 
                                            icon={<DoNotDisturbOnIcon />} 
                                            label={`${row.limite_maximo} Bs`} 
                                            size="small" 
                                            color="warning" 
                                            variant="outlined" 
                                        />
                                    ) : (
                                        <span style={{ color: '#bdbdbd' }}>∞</span>
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    {row.requiere_referencia ? <ReceiptLongIcon color="action" fontSize="small" /> : '-'}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.activo ? "Activo" : "Inactivo"} 
                                        color={row.activo ? "success" : "default"} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title={row.nombre.toLowerCase().includes('efectivo') ? "Edición Limitada" : "Editar"}>
                                        <span>
                                            <IconButton color="primary" onClick={() => handleAbrirEditar(row)} size="small">
                                                <EditIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <span>
                                            <IconButton 
                                                color="error" 
                                                disabled={row.nombre.toLowerCase().includes('efectivo')}
                                                onClick={() => handleClickEliminar(row)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL FORMULARIO */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                 <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
                    {modoEdicion ? 'Editar Billetera' : 'Nueva Billetera'}
                 </DialogTitle>
                 <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Nombre (Ej: Caja Chica)" 
                                name="nombre" 
                                fullWidth required 
                                value={formulario.nombre} 
                                onChange={handleChange} 
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                select 
                                label="Tipo Sistema" 
                                name="tipo" 
                                fullWidth required 
                                value={formulario.tipo} 
                                onChange={handleChange}
                            >
                                <MenuItem value="efectivo">Efectivo</MenuItem>
                                <MenuItem value="banco">Banco / Transferencia</MenuItem>
                                <MenuItem value="qr">QR Digital</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                            </TextField>
                        </Grid>

                        {/* SELECTOR DE CUENTA CONTABLE (SOLO ACTIVOS) */}
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Vincular a Cuenta de Activo"
                                name="id_catalogo"
                                value={formulario.id_catalogo}
                                onChange={handleChange}
                                fullWidth
                                required
                                helperText="Seleccione la cuenta contable donde se guardará el dinero."
                                InputProps={{
                                    startAdornment: <SavingsIcon color="action" sx={{ mr: 1 }} />,
                                }}
                            >
                                {categorias.length > 0 ? (
                                    categorias.map((cat) => (
                                        <MenuItem key={cat.id_catalogo} value={cat.id_catalogo}>
                                            <strong>{cat.codigo}</strong> - {cat.nombre_cuenta}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem value="" disabled>No hay cuentas de ACTIVO creadas</MenuItem>
                                )}
                            </TextField>
                        </Grid>

                        {/* CAMPO LÍMITE DE GASTO */}
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Límite Máximo por Gasto" 
                                name="limite_maximo" 
                                type="number"
                                fullWidth 
                                value={formulario.limite_maximo} 
                                onChange={handleChange} 
                                helperText="0 = Sin límite (Ideal para Bancos)"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Bs</InputAdornment>,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControlLabel 
                                control={<Switch checked={formulario.requiere_referencia} onChange={handleChange} name="requiere_referencia" />} 
                                label="Exigir Nro. Documento" 
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <FormControlLabel 
                                control={<Switch checked={formulario.activo} onChange={handleChange} name="activo" color="success" />} 
                                label="Medio Activo" 
                            />
                        </Grid>
                    </Grid>
                 </DialogContent>
                 <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="success">Guardar</Button>
                 </DialogActions>
            </Dialog>

            {/* DIALOGO CONFIRMACIÓN */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Eliminar la billetera <strong>{medioAEliminar?.nombre}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminMedios;