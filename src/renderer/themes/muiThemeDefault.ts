import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            variants: [
              {
                props: { variant: 'outlined' },
                style: {
                  borderWidth: '3px',
                },
              },
            ],
          },
        },
      },
    },
  });
  

export { theme };