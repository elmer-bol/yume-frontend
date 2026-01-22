import { createTheme } from '@mui/material/styles';

// Definimos una paleta "Clásica Corporativa"
const theme = createTheme({
  palette: {
    mode: 'light', // Forzamos modo claro para evitar conflictos de contraste
    primary: {
      main: '#1565c0', // Un Azul "Banco" (Serio y profesional)
    },
    secondary: {
      main: '#9c27b0', // Un color secundario para detalles (opcional)
    },
    background: {
      default: '#f4f6f8', // Un gris muy pálido para el fondo (descansa la vista)
      paper: '#ffffff',   // Las tarjetas (Paper) serán blancas puras
    },
  },
  typography: {
    h5: {
      fontWeight: 600, // Títulos un poco más gorditos
    },
  },
  components: {
    // Arreglo para la Barra de Navegación (AppBar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2', // Azul sólido
          boxShadow: 'none', // Quitamos la sombra para un look más plano/limpio
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    // Arreglo para los Campos de Texto (Inputs)
    MuiTextField: {
      defaultProps: {
        variant: 'outlined', // El estilo "Cajita" es el más profesional
        size: 'small',       // Un poco más compactos para que quepan más datos
      },
      styleOverrides: {
        root: {
          backgroundColor: '#fff', // Fondo blanco forzado para que no se vea gris
        }
      }
    },
  },
});

export default theme;