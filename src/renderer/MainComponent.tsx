import React from "react"
import { Box, Heading, Button as ChakraButton, Stack } from "@chakra-ui/react"
import { Button as BootstrapButton } from "react-bootstrap"
import { Button as MUIButton } from "@mui/material"
import icon from "../../assets/icon.svg"

const MainComponent: React.FC = () => {
  return (
    <Box textAlign="center" p={8}>
    <Box className="Hello" mb={6} display="flex" justifyContent="center">
      <img width="200" alt="icon" src={icon} />
    </Box>

      <Heading as="h1" size="xl" mb={6}>
        ERB Custom
      </Heading>

      <Stack
        direction="row"
        spacing={4}
        justify="center"
        className="Hello"
        flexWrap="wrap"
      >
        {/* Chakra UI Button */}
        <ChakraButton
          as="a"
          href="https://electron-react-boilerplate.js.org/"
          target="_blank"
          rel="noreferrer"
          colorScheme="green"
          variant="solid"
        >
          📚 Read our docs (Chakra)
        </ChakraButton>

        {/* Bootstrap Button */}
        <BootstrapButton
          href="https://github.com/sponsors/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
          variant="warning"
        >
          🙏 Donate (Bootstrap)
        </BootstrapButton>

        {/* MUI Button */}
        <MUIButton
          href="https://github.com/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
          variant="contained"
          color="primary"
        >
          ⭐ Star on GitHub (MUI)
        </MUIButton>
      </Stack>
    </Box>
  )
}

export default MainComponent
