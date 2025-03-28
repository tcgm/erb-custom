// theme.ts
import { extendTheme, type ThemeConfig } from "@chakra-ui/react"

// Optional: configure color mode settings
const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
}

// You can customize the theme here
const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#e0fcf9",
      100: "#b3f5ee",
      200: "#80eee2",
      300: "#4de7d7",
      400: "#26e1cd",
      500: "#0dc7b3",
      600: "#059c8c",
      700: "#037065",
      800: "#014640",
      900: "#001b1b",
    },
  },
  fonts: {
    heading: `'Segoe UI', sans-serif`,
    body: `'Segoe UI', sans-serif`,
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: "brand.500",
          color: "white",
          _hover: { bg: "brand.600" },
        },
      },
    },
  },
})


export { theme };
