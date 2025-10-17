import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Badge, 
  IconButton,
  Tooltip,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FaGamepad, 
  FaArrowLeft, 
  FaCogs,
  FaRocket,
  FaMouse,
  FaImages,
  FaMusic,
  FaCode
} from 'react-icons/fa';
import { GiJoystick, GiSparkles } from 'react-icons/gi';
import { MdAnimation, MdPhotoSizeSelectLarge } from 'react-icons/md';
import PhaserGame from './PhaserGame';

interface PhaserDemoProps {
  onBack?: () => void;
}

/**
 * Phaser Demo Component
 * 
 * Showcases Phaser 3 integration with Electron React Boilerplate.
 * The game runs as an inset background with feature icons displayed alongside.
 */
const PhaserDemo: React.FC<PhaserDemoProps> = ({ onBack }) => {
  const features = [
    { icon: FaCogs, label: 'Physics Engine', description: 'Arcade & Matter.js physics with collision detection' },
    { icon: GiSparkles, label: 'Particle Systems', description: 'Dynamic particle effects and emitters' },
    { icon: FaMouse, label: 'Input Handling', description: 'Mouse, keyboard, touch, and gamepad support' },
    { icon: FaImages, label: 'Asset Loading', description: 'Images, sprites, atlases, and more' },
    { icon: MdAnimation, label: 'Animations', description: 'Sprite animations and tweens' },
    { icon: FaRocket, label: 'WebGL Rendering', description: 'Hardware-accelerated graphics' },
    { icon: MdPhotoSizeSelectLarge, label: 'Scene Management', description: 'Multiple game states and transitions' },
    { icon: FaMusic, label: 'Audio System', description: 'Web Audio API with spatial sound' },
    { icon: GiJoystick, label: 'Game Objects', description: 'Sprites, groups, and custom objects' },
    { icon: FaCode, label: 'TypeScript', description: 'Full type definitions included' },
  ];

  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      {/* Background Phaser Game (Full Screen Inset) */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        opacity={0.35}
        pointerEvents="auto"
      >
        <PhaserGame width={1920} height={1080} />
      </Box>

      {/* Content Overlay */}
      <Box position="relative" zIndex={1} minH="100vh" pointerEvents="none">
        <HStack spacing={0} align="stretch" h="100vh">
          {/* Feature Icons Sidebar */}
          <VStack
            spacing={3}
            p={4}
            bg="rgba(0, 0, 0, 0.7)"
            backdropFilter="blur(20px)"
            borderRight="1px solid rgba(255, 255, 255, 0.1)"
            justify="center"
            minW="80px"
            pointerEvents="auto"
          >
            {features.map((feature, index) => (
              <Tooltip
                key={index}
                label={
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      {feature.label}
                    </Text>
                    <Text fontSize="xs">{feature.description}</Text>
                  </Box>
                }
                placement="right"
                hasArrow
              >
                <IconButton
                  aria-label={feature.label}
                  icon={<feature.icon size={24} />}
                  variant="ghost"
                  colorScheme="blue"
                  size="lg"
                  _hover={{
                    bg: 'rgba(0, 217, 255, 0.2)',
                    transform: 'scale(1.1)',
                  }}
                  transition="all 0.2s"
                />
              </Tooltip>
            ))}
          </VStack>

          {/* Main Content Area */}
          <Box flex={1} p={8} overflowY="auto">
            <VStack spacing={6} align="stretch" maxW="900px" mx="auto">
              {/* Header */}
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <FaGamepad size={32} color="#00d9ff" />
                  <Heading size="lg" textShadow="0 2px 10px rgba(0,0,0,0.8)">
                    Phaser 3 Game Engine
                  </Heading>
                  <Badge colorScheme="green" fontSize="sm">
                    v3.87
                  </Badge>
                </HStack>
                {onBack && (
                  <Button
                    leftIcon={<FaArrowLeft />}
                    onClick={onBack}
                    variant="solid"
                    colorScheme="blue"
                    bg="rgba(66, 153, 225, 0.9)"
                    _hover={{ bg: 'rgba(66, 153, 225, 1)' }}
                    backdropFilter="blur(10px)"
                  >
                    Back
                  </Button>
                )}
              </HStack>

              {/* Description */}
              <Box
                p={4}
                borderRadius="md"
                bg="rgba(0, 217, 255, 0.15)"
                border="1px solid rgba(0, 217, 255, 0.3)"
                backdropFilter="blur(10px)"
              >
                <Text fontSize="sm" color="gray.100" fontWeight="medium">
                  Phaser 3 is a fast, free, and fun open source HTML5 game framework. It provides
                  WebGL and Canvas rendering, a full physics engine, input handling, and more.
                  The demo runs automatically in the background - click anywhere to spawn particles!
                </Text>
              </Box>

              {/* Quick Stats Grid */}
              <SimpleGrid columns={3} spacing={4}>
                <Box
                  p={4}
                  borderRadius="md"
                  bg="rgba(0, 255, 0, 0.1)"
                  border="1px solid rgba(0, 255, 0, 0.3)"
                  backdropFilter="blur(10px)"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="green.300">
                    6
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    Bouncing Sprites
                  </Text>
                </Box>
                <Box
                  p={4}
                  borderRadius="md"
                  bg="rgba(255, 0, 255, 0.1)"
                  border="1px solid rgba(255, 0, 255, 0.3)"
                  backdropFilter="blur(10px)"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="purple.300">
                    ∞
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    Particles
                  </Text>
                </Box>
                <Box
                  p={4}
                  borderRadius="md"
                  bg="rgba(0, 217, 255, 0.1)"
                  border="1px solid rgba(0, 217, 255, 0.3)"
                  backdropFilter="blur(10px)"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="blue.300">
                    60
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    FPS Target
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Quick Start */}
              <Box
                p={4}
                borderRadius="md"
                bg="rgba(255, 255, 255, 0.08)"
                border="1px solid rgba(255, 255, 255, 0.15)"
                backdropFilter="blur(10px)"
              >
                <Heading size="sm" mb={3} color="white">
                  Quick Start:
                </Heading>
                <VStack align="start" spacing={2} fontSize="sm" fontFamily="monospace" color="gray.200">
                  <Text>1. Create scenes in: <code style={{ color: '#00d9ff' }}>src/renderer/phaser/scenes/</code></Text>
                  <Text>2. Import and add to PhaserGame component</Text>
                  <Text>3. Load assets in <code style={{ color: '#00d9ff' }}>scene.preload()</code></Text>
                  <Text>4. Initialize game objects in <code style={{ color: '#00d9ff' }}>scene.create()</code></Text>
                  <Text>5. Update logic in <code style={{ color: '#00d9ff' }}>scene.update()</code></Text>
                </VStack>
              </Box>

              {/* Documentation Link */}
              <HStack spacing={4} justify="center">
                <Button
                  as="a"
                  href="https://phaser.io/learn"
                  target="_blank"
                  rel="noreferrer"
                  colorScheme="blue"
                  variant="solid"
                  bg="rgba(66, 153, 225, 0.9)"
                  _hover={{ bg: 'rgba(66, 153, 225, 1)' }}
                  backdropFilter="blur(10px)"
                >
                  View Documentation
                </Button>
                <Button
                  as="a"
                  href="https://phaser.io/examples"
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  colorScheme="blue"
                  borderColor="rgba(66, 153, 225, 0.5)"
                  bg="rgba(0, 0, 0, 0.3)"
                  _hover={{ bg: 'rgba(66, 153, 225, 0.2)' }}
                  backdropFilter="blur(10px)"
                >
                  Browse Examples
                </Button>
              </HStack>
            </VStack>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
};

export default PhaserDemo;
