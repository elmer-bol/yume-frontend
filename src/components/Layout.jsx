import React from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Avatar } from '@mui/material';
import Sidebar, { drawerWidth } from './Sidebar';

const Layout = ({ children }) => {
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            
            {/* BARRA SUPERIOR (AppBar) */}
            <AppBar
                position="fixed"
                sx={{ 
                    width: `calc(100% - ${drawerWidth}px)`, 
                    ml: `${drawerWidth}px`,
                    bgcolor: '#fff', 
                    color: '#1e293b',
                    boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' // Sombra sutil
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Panel de Control
                    </Typography>
                    
                    {/* Usuario (Simulado) */}
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">Admin Usuario</Typography>
                        <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>A</Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* MENÚ LATERAL */}
            <Sidebar />

            {/* CONTENIDO DE LA PÁGINA (Dinámico) */}
            <Box
                component="main"
                sx={{ 
                    flexGrow: 1, 
                    bgcolor: '#f8fafc', // Fondo gris muy clarito profesional
                    p: 3, 
                    minHeight: '100vh',
                    width: `calc(100% - ${drawerWidth}px)`
                }}
            >
                {/* Espaciador para que el contenido no quede debajo del AppBar */}
                <Toolbar /> 
                {children}
            </Box>
        </Box>
    );
};

export default Layout;