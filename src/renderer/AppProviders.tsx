import 'bootstrap/dist/css/bootstrap.min.css';
import { ChakraProvider, ThemeProvider as ChakraThemeProvider } from '@chakra-ui/react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { theme as chakraTheme } from './themes/chakaThemeDefault';
import { theme as muiTheme } from './themes/muiThemeDefault';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MUIThemeProvider theme={muiTheme}>
      <ChakraProvider theme={chakraTheme} resetCSS>
        <ChakraThemeProvider theme={chakraTheme}>
            {children}
        </ChakraThemeProvider>
    </ChakraProvider>
    </MUIThemeProvider>
  )
}
