import React from 'react';
import { 
    Drawer, List, ListItemButton, ListItemIcon, ListItemText, 
    Toolbar, Divider, Typography, ListSubheader, Box 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// --- IMPORTAMOS EL CEREBRO DE YUME ---
import { LABELS } from '../config/language';
import authService from '../services/authService'; // <--- IMPORT NUEVO

// --- ICONOS ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';            
import ApartmentIcon from '@mui/icons-material/Apartment';      
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; 
import CreditCardIcon from '@mui/icons-material/CreditCard';    
import DescriptionIcon from '@mui/icons-material/Description'; 
import CategoryIcon from '@mui/icons-material/Category';        
import AssignmentIcon from '@mui/icons-material/Assignment';    
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'; 
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'; 
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; 
import MoneyOffIcon from '@mui/icons-material/MoneyOff';   
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // <--- IMPORT NUEVO     

import AssessmentIcon from '@mui/icons-material/Assessment';
import SummarizeIcon from '@mui/icons-material/Summarize';

export const drawerWidth = 260;

const menuStructure = [
    {
        title: 'Principal',
        items: [
            { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
        ]
    },
    {
        title: 'Procesos Operativos',
        items: [
            { text: `${LABELS.relacion}s`, path: '/admin/contratos', icon: <AssignmentIcon /> },
            { text: `Finanzas (${LABELS.deuda}s)`, path: '/admin/deudas', icon: <RequestQuoteIcon /> },
            { text: 'Caja (Cobros)', path: '/admin/cajas', icon: <PointOfSaleIcon /> },
            { text: 'Cierre y Depósitos', path: '/admin/depositos', icon: <AccountBalanceIcon /> },
            { text: 'Gastos / Egresos', path: '/admin/egresos', icon: <MoneyOffIcon /> },
        ]
    },
    {
        title: 'Administración / Config',
        items: [
            { text: LABELS.personas, path: '/admin/personas', icon: <PeopleIcon /> },
            { text: LABELS.unidades, path: '/admin/unidades', icon: <ApartmentIcon /> },
            { text: 'Catálogo Cuentas', path: '/admin/categorias', icon: <AccountBalanceWalletIcon /> },
            { text: 'Medios de Pago', path: '/admin/medios', icon: <CreditCardIcon /> },
            { text: `Conceptos ${LABELS.concepto}`, path: '/admin/conceptos', icon: <DescriptionIcon /> },
            { text: 'Tipos de Egreso', path: '/admin/tipoegresos', icon: <CategoryIcon /> },
        ]
    },
    // --- NUEVO GRUPO ---
    {
        title: 'Reportes y Consultas',
        items: [
            { text: 'Morosidad Global', path: '/reportes/morosidad', icon: <AssessmentIcon /> },
            { text: 'Estado de Cuenta', path: '/reportes/estado-cuenta', icon: <SummarizeIcon /> },
        ]
    }
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        // 1. Borrar token y usuario del localStorage
        authService.logout(); 
        // 2. Redirigir al Login (authService suele hacerlo, pero por seguridad lo forzamos)
        // Como authService.logout() usa window.location.href, esto es redundante pero seguro.
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { 
                    width: drawerWidth, 
                    boxSizing: 'border-box',
                    bgcolor: '#1e293b', 
                    color: '#e2e8f0',
                    display: 'flex',       // Flexbox para empujar el footer
                    flexDirection: 'column' // Columna vertical
                },
            }}
        >
            {/* Logo / Título YUME */}
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#60a5fa', letterSpacing: 1 }}>
                    🌙 {LABELS.appName.toUpperCase()}
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* LISTA DE MENÚ (Con flex-grow para ocupar espacio disponible) */}
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                <List component="nav">
                    {menuStructure.map((group, index) => (
                        <React.Fragment key={index}>
                            <ListSubheader sx={{ bgcolor: 'transparent', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', mt: 2 }}>
                                {group.title}
                            </ListSubheader>

                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <ListItemButton 
                                        key={item.text} 
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            mx: 1,
                                            borderRadius: 1,
                                            mb: 0.5,
                                            bgcolor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent', 
                                            color: isActive ? '#60a5fa' : 'inherit',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: isActive ? '#60a5fa' : '#64748b', minWidth: '40px' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={item.text} 
                                            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 'bold' : 'normal' }}
                                        />
                                    </ListItemButton>
                                );
                            })}
                            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                        </React.Fragment>
                    ))}
                </List>
            </Box>

            {/* --- FOOTER: CERRAR SESIÓN --- */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <ListItemButton 
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 1,
                        color: '#ef4444', // Rojo suave (Tailwind Red 500)
                        '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.1)', // Fondo rojo muy suave al pasar mouse
                        }
                    }}
                >
                    <ListItemIcon sx={{ color: '#ef4444', minWidth: '40px' }}>
                        <ExitToAppIcon />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Cerrar Sesión" 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                </ListItemButton>
            </Box>

        </Drawer>
    );
};

export default Sidebar;