import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Heading, Button as ChakraButton, Stack } from "@chakra-ui/react"
// Using a plain anchor with Bootstrap classes to avoid heavy union types from react-bootstrap Button
import { Button as MUIButton } from "@mui/material"
import icon from "../../assets/icon.svg"
import HelloBits from "./components/react-bits/HelloBits"
import Dock from "./components/react-bits/all/Components/Dock/Dock"
import ModuleStatus from "./components/ModuleStatus"
import { FaHome, FaGithub, FaCogs, FaGamepad } from "react-icons/fa"

const DocsButton: React.FC = () => (
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
)

const DonateLink: React.FC = () => (
  <a
    href="https://github.com/sponsors/electron-react-boilerplate"
    target="_blank"
    rel="noreferrer"
    className="btn btn-warning"
    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
  >
    <span role="img" aria-label="donate">🙏</span> Donate (Bootstrap)
  </a>
)

const StarButton: React.FC = () => (
  <MUIButton
    href="https://github.com/tcgm/erb-custom"
    target="_blank"
    rel="noreferrer"
    variant="contained"
    color="primary"
  >
    ⭐ Star on GitHub (MUI)
  </MUIButton>
)

const MainComponent: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box textAlign="center" p={8}>
    <Box className="Hello" mb={6} display="flex" justifyContent="center">
      <img width="200" alt="icon" src={icon} />
    </Box>

      <Heading as="h1" size="xl" mb={6}>
        ERB Custom
      </Heading>
      <Box display="flex" justifyContent="center" mb={6}>
        <HelloBits />
      </Box>

      <Stack
        direction="row"
        spacing={4}
        justify="center"
        className="Hello"
        flexWrap="wrap"
      >
        <DocsButton />
        <DonateLink />
        <StarButton />
        <ChakraButton
          onClick={() => navigate('/phaser')}
          colorScheme="purple"
          variant="solid"
          leftIcon={<FaGamepad />}
        >
          🎮 Phaser Demo
        </ChakraButton>
      </Stack>

      {/* Module Status Line */}
      <Box mt={8} mb={6} display="flex" justifyContent="center">
        <ModuleStatus />
      </Box>

      <Box mt={4} display="flex" justifyContent="center">
        <Box width="100%" maxW="800px">
          <Dock
            items={[
              { icon: <FaHome size={26} />, label: "Home", onClick: () => console.log("Home") },
              { icon: <FaGamepad size={26} />, label: "Phaser", onClick: () => navigate('/phaser') },
              {
                icon: <FaGithub size={26} />, label: "GitHub", onClick: () => window.open("https://github.com/tcgm/erb-custom", "_blank")
              },
              { icon: <FaCogs size={26} />, label: "Settings", onClick: () => console.log("Settings") }
            ]}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default MainComponent
