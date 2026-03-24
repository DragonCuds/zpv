import { createTheme } from '@mui/material';

const vazirFontFaces = `
  @font-face {
    font-family: 'Vazir';
    src: url('/fonts/vazir-font-v16.1.0/Vazir.woff2') format('woff2'),
         url('/fonts/vazir-font-v16.1.0/Vazir.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Vazir';
    src: url('/fonts/vazir-font-v16.1.0/Vazir-Bold.woff2') format('woff2'),
         url('/fonts/vazir-font-v16.1.0/Vazir-Bold.woff') format('woff');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Vazir';
    src: url('/fonts/vazir-font-v16.1.0/Vazir-Medium.woff2') format('woff2'),
         url('/fonts/vazir-font-v16.1.0/Vazir-Medium.woff') format('woff');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Vazir';
    src: url('/fonts/vazir-font-v16.1.0/Vazir-Light.woff2') format('woff2'),
         url('/fonts/vazir-font-v16.1.0/Vazir-Light.woff') format('woff');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }
`;

const sharedComponents = {
  MuiCssBaseline: {
    styleOverrides: vazirFontFaces,
  },
};

const sharedTypography = {
  fontFamily: 'Vazir, Roboto, sans-serif',
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2AABEE' },
    background: {
      default: '#ffffff',
      paper: '#f4f4f5',
      paper2:"#2d2d2d",
    },
  },
  typography: sharedTypography,
  components: sharedComponents,
});


export const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#2AABEE',
      },
      background: {
        default: '#000000',
        paper: '#111111',
        paper2:"#2d2d2d"
      },
      divider: '#222222',
    },
    typography: sharedTypography,
    components: sharedComponents,
  });