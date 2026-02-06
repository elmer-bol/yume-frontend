import React from 'react';
import { 
    Drawer, List, ListItemButton, ListItemIcon, ListItemText, 
    Toolbar, Divider, Typography, ListSubheader, Box, Tooltip,
    useMediaQuery, useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// --- IMPORTAMOS EL CEREBRO DE YUME ---
import { LABELS } from '../config/language';
import authService from '../services/authService'; 

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
import ExitToAppIcon from '@mui/icons-material/ExitToApp';        

import AssessmentIcon from '@mui/icons-material/Assessment';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DomainIcon from '@mui/icons-material/Domain'; 

// Definimos los anchos según el estado
export const drawerWidth = 260; 
export const drawerWidthMobile = 70; 

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
    {
        title: 'Reportes y Consultas',
        items: [
            { text: 'Morosidad Global', path: '/reportes/morosidad', icon: <AssessmentIcon /> },
            { text: 'Cartera Global', path: '/reportes/cartera', icon: <TrendingUpIcon /> },
            { text: 'Estado de Cuenta', path: '/reportes/estado-cuenta', icon: <SummarizeIcon /> },
            { text: 'Estado de Resultados', path: '/reportes/directorio', icon: <DomainIcon /> },
            
            // 🔥 NUEVO REPORTE AGREGADO AQUÍ 🔥
            { text: 'Libro Caja Diaria', path: '/reportes/caja', icon: <AccountBalanceWalletIcon /> },
        ]
    }
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    
    // Detectamos si es móvil
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const currentWidth = isMobile ? drawerWidthMobile : drawerWidth;

    const handleLogout = () => {
        authService.logout(); 
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: currentWidth,
                flexShrink: 0,
                whiteSpace: 'nowrap', 
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
                [`& .MuiDrawer-paper`]: { 
                    width: currentWidth, 
                    boxSizing: 'border-box',
                    bgcolor: '#1e293b', 
                    color: '#e2e8f0',
                    display: 'flex',        
                    flexDirection: 'column',
                    overflowX: 'hidden', 
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                },
            }}
        >
            {/* Logo / Título YUME */}
            <Toolbar sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 2, 
                px: isMobile ? 1 : 2 
            }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#60a5fa', letterSpacing: 1 }}>
                    {isMobile ? '🌙' : `🌙 ${LABELS.appName.toUpperCase()}`}
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* LISTA DE MENÚ */}
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                <List component="nav">
                    {menuStructure.map((group, index) => (
                        <React.Fragment key={index}>
                            {!isMobile && (
                                <ListSubheader sx={{ bgcolor: 'transparent', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', mt: 2 }}>
                                    {group.title}
                                </ListSubheader>
                            )}
                            {isMobile && index > 0 && <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />}

                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                
                                return (
                                    <Tooltip title={isMobile ? item.text : ""} placement="right" arrow key={item.text}>
                                        <ListItemButton 
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                minHeight: 48,
                                                justifyContent: isMobile ? 'center' : 'initial', 
                                                px: 2.5,
                                                mx: isMobile ? 0.5 : 1,
                                                borderRadius: 1,
                                                mb: 0.5,
                                                bgcolor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent', 
                                                color: isActive ? '#60a5fa' : 'inherit',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                            }}
                                        >
                                            <ListItemIcon sx={{ 
                                                minWidth: 0,
                                                mr: isMobile ? 0 : 3, 
                                                justifyContent: 'center',
                                                color: isActive ? '#60a5fa' : '#64748b'
                                            }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            
                                            {!isMobile && (
                                                <ListItemText 
                                                    primary={item.text} 
                                                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 'bold' : 'normal' }}
                                                />
                                            )}
                                        </ListItemButton>
                                    </Tooltip>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </List>
            </Box>

            {/* FOOTER: CERRAR SESIÓN */}
            <Box sx={{ p: isMobile ? 1 : 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Tooltip title={isMobile ? "Cerrar Sesión" : ""} placement="right" arrow>
                    <ListItemButton 
                        onClick={handleLogout}
                        sx={{
                            minHeight: 48,
                            justifyContent: isMobile ? 'center' : 'initial',
                            borderRadius: 1,
                            px: 2.5,
                            color: '#ef4444',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                    >
                        <ListItemIcon sx={{ 
                            minWidth: 0,
                            mr: isMobile ? 0 : 3,
                            justifyContent: 'center',
                            color: '#ef4444' 
                        }}>
                            <ExitToAppIcon />
                        </ListItemIcon>
                        {!isMobile && (
                            <ListItemText 
                                primary="Cerrar Sesión" 
                                primaryTypographyProps={{ fontWeight: 'bold' }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>
            </Box>

        </Drawer>
    );
};

export default Sidebar;