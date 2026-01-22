import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, Grid, 
    Chip, IconButton, FormControlLabel, Switch, Tooltip,
    DialogContentText, MenuItem // <--- AGREGADO: MenuItem para el Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings'; // Icono para cuenta contable

// IMPORTAMOS TUS SERVICIOS
import { mediosService } from '../services/mediosService';
import { categoriasService } from '../services/categoriasService'; // <--- NUEVO IMPORT

const AdminMedios = () => {
    const [medios, setMedios] = useState([]);
    const [categorias, setCategorias] = useState([]); // <--- NUEVO ESTADO: Lista de Cuentas
    
    // Modal de Crear/Editar
    const [openModal, setOpenModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    // Estados para borrado seguro
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [medioAEliminar, setMedioAEliminar] = useState(null); 

    // Estado Formulario (Actualizado con id_catalogo)
    const [formulario, setFormulario] = useState({
        nombre: '', 
        tipo: '', 
        requiere_referencia: false, 
        id_catalogo: '', // <--- NUEVO CAMPO OBLIGATORIO
        activo: true
    });

    const cargarDatos = async () => {
        try {
            // 1. Cargar Medios
            const dataMedios = await mediosService.obtenerTodos();
            setMedios(dataMedios);

            // 2. Cargar Categorías (Cuentas)
            const dataCats = await categoriasService.obtenerTodas();
            // Filtramos solo Ingresos (Cajas y Bancos)
            const cuentasFiltradas = dataCats.filter(c => c.tipo === 'INGRESO' || c.tipo === 'Ingreso');
            setCategorias(cuentasFiltradas);

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
        // 1. VALIDACIÓN OBLIGATORIA
        if (!formulario.id_catalogo) {
            alert("⚠️ Error: Debes seleccionar una Cuenta Contable de Destino (Caja o Banco).");
            return; // <--- ESTO DETIENE EL ENVÍO
        }
        
        // Validación simple
        if (!formulario.id_catalogo) {
            alert("Debe seleccionar una Cuenta Contable de Destino.");
            return;
        }

        try {
            if (modoEdicion) {
                await mediosService.actualizarMedio(idEdicion, formulario);
            } else {
                await mediosService.crearMedio(formulario);
            }
            setOpenModal(false);
            cargarDatos();
        } catch (error) {
            console.error(error);
            alert("Error al guardar: " + (error.response?.data?.detail || "Error desconocido"));
        }
    };

    const handleAbrirEditar = (row) => {
        setModoEdicion(true);
        setIdEdicion(row.id_medio_ingreso);
        setFormulario({
            nombre: row.nombre,
            tipo: row.tipo,
            requiere_referencia: row.requiere_referencia,
            id_catalogo: row.id_catalogo, // <--- CARGAR EL DATO EXISTENTE
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
            alert("No se pudo eliminar. Probablemente tiene transacciones.");
            setOpenDeleteDialog(false);
        }
    };

    // Helper para mostrar nombre de la cuenta en la tabla
    const getNombreCuenta = (id) => {
        const cat = categorias.find(c => c.id_catalogo === id);
        return cat ? cat.nombre_cuenta : 'Sin asignar';
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}> {/* Aumenté a 'lg' para que quepa la nueva columna */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} /> Medios de Ingreso
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setModoEdicion(false);
                    // Resetear formulario con id_catalogo vacío
                    setFormulario({ nombre: '', tipo: '', id_catalogo: '', requiere_referencia: false, activo: true });
                    setOpenModal(true);
                }}>
                    Nuevo Medio
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Nombre</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            {/* NUEVA COLUMNA */}
                            <TableCell><strong>Cuenta Destino (Contable)</strong></TableCell> 
                            <TableCell align="center"><strong>Requiere Ref.</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {medios.map((row) => (
                            <TableRow key={row.id_medio_ingreso} hover>
                                <TableCell>{row.nombre}</TableCell>
                                <TableCell>{row.tipo}</TableCell>
                                
                                {/* DATO NUEVO EN TABLA */}
                                <TableCell sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                    {getNombreCuenta(row.id_catalogo)}
                                </TableCell>

                                <TableCell align="center">
                                    {row.requiere_referencia ? <ReceiptLongIcon color="action" /> : '-'}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.activo ? "Activo" : "Inactivo"} 
                                        color={row.activo ? "success" : "default"} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title={row.nombre.toLowerCase() === 'efectivo' ? "Registro del Sistema" : "Editar"}>
                                        <span>
                                            <IconButton 
                                                color="primary" 
                                                onClick={() => handleAbrirEditar(row)}
                                                disabled={row.nombre.toLowerCase() === 'efectivo'}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Eliminar / Desactivar">
                                        <span>
                                            <IconButton 
                                                color="error" 
                                                disabled={row.nombre.toLowerCase() === 'efectivo'}
                                                onClick={() => handleClickEliminar(row)}
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
                 <DialogTitle>{modoEdicion ? 'Editar Medio' : 'Nuevo Medio'}</DialogTitle>
                 <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Nombre" 
                                name="nombre" 
                                fullWidth required 
                                value={formulario.nombre} 
                                onChange={handleChange} 
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            {/* Convertido a Select para consistencia, aunque puede ser texto */}
                            <TextField 
                                select 
                                label="Tipo Sistema" 
                                name="tipo" 
                                fullWidth required 
                                value={formulario.tipo} 
                                onChange={handleChange}
                            >
                                <MenuItem value="efectivo">Efectivo</MenuItem>
                                <MenuItem value="transferencia">Transferencia</MenuItem>
                                <MenuItem value="qr">QR</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                                <MenuItem value="otro">Otro</MenuItem>
                            </TextField>
                        </Grid>

                        {/* --- NUEVO CAMPO CRÍTICO: SELECTOR DE CUENTA CONTABLE --- */}
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Cuenta Contable de Destino"
                                name="id_catalogo"
                                value={formulario.id_catalogo}
                                onChange={handleChange}
                                fullWidth
                                required
                                helperText="¿Dónde entra el dinero físicamente?"
                                InputProps={{
                                    startAdornment: <SavingsIcon color="action" sx={{ mr: 1 }} />,
                                }}
                            >
                                {categorias.length > 0 ? (
                                    categorias.map((cat) => (
                                        <MenuItem key={cat.id_catalogo} value={cat.id_catalogo}>
                                            {cat.nombre_cuenta}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem value="" disabled>No hay cuentas de Ingreso creadas</MenuItem>
                                )}
                            </TextField>
                        </Grid>
                        {/* -------------------------------------------------------- */}

                        <Grid item xs={12} sm={6}>
                            <FormControlLabel 
                                control={<Switch checked={formulario.requiere_referencia} onChange={handleChange} name="requiere_referencia" />} 
                                label="Exigir Nro. Documento" 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel 
                                control={<Switch checked={formulario.activo} onChange={handleChange} name="activo" color="success" />} 
                                label="Activo / Visible" 
                            />
                        </Grid>
                    </Grid>
                 </DialogContent>
                 <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGuardar} variant="contained" color="primary">Guardar</Button>
                 </DialogActions>
            </Dialog>

            {/* DIALOGO DE CONFIRMACIÓN (Sin cambios) */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>{"¿Confirmar acción?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro que deseas eliminar o desactivar el medio de ingreso: 
                        <strong> {medioAEliminar?.nombre}</strong>?
                        <br/><br/>
                        <small>Si ya tiene transacciones, se desactivará en lugar de borrarse.</small>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">Cancelar</Button>
                    <Button onClick={confirmarEliminacion} color="error" variant="contained" autoFocus>
                        Sí, Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminMedios;