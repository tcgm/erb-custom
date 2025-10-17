import React, { useState } from 'react';
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
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Code,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { 
  FaGamepad, 
  FaArrowLeft, 
  FaCogs,
  FaRocket,
  FaMouse,
  FaImages,
  FaMusic,
  FaCode,
  FaCheckCircle
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
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  const features = [
    { 
      icon: FaCogs, 
      label: 'Physics Engine', 
      description: 'Arcade & Matter.js physics with collision detection',
      details: 'Phaser includes two physics engines: Arcade Physics for simple AABB collision detection, and Matter.js for advanced polygon-based physics.',
      howTo: [
        'Enable physics in game config: physics: { default: "arcade" }',
        'Add physics to sprites: this.physics.add.sprite(x, y, key)',
        'Set properties: sprite.setVelocity(x, y), sprite.setBounce(value)',
        'Detect collisions: this.physics.add.collider(obj1, obj2, callback)',
        'Use Matter.js for complex shapes and constraints'
      ]
    },
    { 
      icon: GiSparkles, 
      label: 'Particle Systems', 
      description: 'Dynamic particle effects and emitters',
      details: 'Create stunning visual effects with particle emitters. Control emission rate, lifespan, velocity, gravity, and more.',
      howTo: [
        'Add particles: this.add.particles(x, y, texture)',
        'Create emitter: particles.createEmitter({ config })',
        'Configure: speed, angle, scale, alpha, lifespan',
        'Emit on events: emitter.explode(count, x, y)',
        'Follow objects: emitter.startFollow(sprite)'
      ]
    },
    { 
      icon: FaMouse, 
      label: 'Input Handling', 
      description: 'Mouse, keyboard, touch, and gamepad support',
      details: 'Unified input system supporting multiple devices. Handle clicks, drags, keyboard shortcuts, and gamepad controls.',
      howTo: [
        'Pointer events: this.input.on("pointerdown", callback)',
        'Make interactive: sprite.setInteractive()',
        'Keyboard: this.input.keyboard.createCursorKeys()',
        'Custom keys: this.input.keyboard.addKey("W")',
        'Gamepad: this.input.gamepad.once("connected", callback)'
      ]
    },
    { 
      icon: FaImages, 
      label: 'Asset Loading', 
      description: 'Images, sprites, atlases, and more',
      details: 'Efficient asset loading system with progress tracking. Supports images, sprite sheets, texture atlases, audio, and JSON.',
      howTo: [
        'Load in preload(): this.load.image(key, path)',
        'Sprite sheets: this.load.spritesheet(key, path, { frameWidth, frameHeight })',
        'Atlas: this.load.atlas(key, imagePath, jsonPath)',
        'Audio: this.load.audio(key, paths)',
        'Track progress: this.load.on("progress", callback)'
      ]
    },
    { 
      icon: MdAnimation, 
      label: 'Animations', 
      description: 'Sprite animations and tweens',
      details: 'Frame-based sprite animations and timeline-based tweens for smooth motion and property changes.',
      howTo: [
        'Create animation: this.anims.create({ key, frames, frameRate })',
        'Play on sprite: sprite.play(key)',
        'Tweens: this.tweens.add({ targets, props, duration })',
        'Timeline: this.tweens.timeline({ targets, tweens: [] })',
        'Easing functions: "Linear", "Quad.easeIn", "Bounce.easeOut"'
      ]
    },
    { 
      icon: FaRocket, 
      label: 'WebGL Rendering', 
      description: 'Hardware-accelerated graphics',
      details: 'High-performance WebGL renderer with automatic Canvas fallback. Supports shaders, filters, and custom pipelines.',
      howTo: [
        'Set renderer: type: Phaser.WEBGL',
        'Auto-select: type: Phaser.AUTO',
        'Custom shaders: extend Phaser.Renderer.WebGL.Pipelines.PostFXPipeline',
        'Filters: sprite.setPipeline(pipelineName)',
        'Render textures: this.add.renderTexture(x, y, width, height)'
      ]
    },
    { 
      icon: MdPhotoSizeSelectLarge, 
      label: 'Scene Management', 
      description: 'Multiple game states and transitions',
      details: 'Organize your game into scenes (menu, gameplay, game over). Launch, pause, and switch between scenes seamlessly.',
      howTo: [
        'Create scene: export default class extends Phaser.Scene',
        'Add to config: scene: [Scene1, Scene2]',
        'Switch scenes: this.scene.start(key, data)',
        'Run parallel: this.scene.launch(key)',
        'Pass data: this.scene.start(key, { level: 1 })'
      ]
    },
    { 
      icon: FaMusic, 
      label: 'Audio System', 
      description: 'Web Audio API with spatial sound',
      details: 'Full-featured audio system with volume control, looping, seeking, and spatial audio positioning.',
      howTo: [
        'Load audio: this.load.audio(key, paths)',
        'Play sound: this.sound.add(key).play()',
        'Background music: this.sound.add(key, { loop: true }).play()',
        'Control: sound.setVolume(value), sound.pause()',
        'Spatial audio: sound.setPosition(x, y, distance)'
      ]
    },
    { 
      icon: GiJoystick, 
      label: 'Game Objects', 
      description: 'Sprites, groups, and custom objects',
      details: 'Rich set of game objects: sprites, images, text, shapes, containers, and groups. Create custom game objects by extending base classes.',
      howTo: [
        'Sprite: this.add.sprite(x, y, texture)',
        'Image: this.add.image(x, y, texture)',
        'Text: this.add.text(x, y, content, style)',
        'Group: this.add.group({ classType: Sprite })',
        'Custom: export class extends Phaser.GameObjects.Sprite'
      ]
    },
    { 
      icon: FaCode, 
      label: 'TypeScript', 
      description: 'Full type definitions included',
      details: 'Phaser 3 is written in JavaScript but includes complete TypeScript definitions for type-safe game development.',
      howTo: [
        'Install types: npm install phaser',
        'Import: import Phaser from "phaser"',
        'Type scenes: export default class extends Phaser.Scene',
        'Type config: const config: Phaser.Types.Core.GameConfig',
        'Intellisense: Full autocomplete for all Phaser APIs'
      ]
    },
  ];

  return (
    <Box position="relative" h="100vh" w="100vw" overflow="hidden">
      {/* Background Phaser Game (Full Screen Inset) */}
      <Box
        position="absolute"
        top="10px"
        left={"80px"}
        right={0}
        bottom="10px"
        zIndex={0}
        opacity={0.35}
        pointerEvents="auto"
      >
        <PhaserGame width={1920} height={1080} />
      </Box>

      {/* Content Overlay */}
      <Box position="relative" zIndex={1} h="100%" w="100%" pointerEvents="none">
        <HStack spacing={0} align="stretch" h="100%">
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
                  onClick={() => setSelectedFeature(index)}
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
          <Box flex={1} p={8} overflow="hidden" pointerEvents="none" h="100%">
            <VStack spacing={4} align="stretch" maxW="900px" mx="auto" pointerEvents="none" h="100%" justify="center">
              {/* Header */}
              <HStack justify="space-between" align="center" pointerEvents="auto">
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
                pointerEvents="none"
              >
                <Text fontSize="sm" color="gray.100" fontWeight="medium" pointerEvents="auto">
                  Phaser 3 is a fast, free, and fun open source HTML5 game framework. It provides
                  WebGL and Canvas rendering, a full physics engine, input handling, and more.
                  The demo runs automatically in the background - click anywhere to spawn particles!
                </Text>
              </Box>

              {/* Quick Stats Grid */}
              <SimpleGrid columns={3} spacing={4} pointerEvents="none">
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
                pointerEvents="none"
              >
                <Heading size="sm" mb={3} color="white">
                  Quick Start:
                </Heading>
                <VStack align="start" spacing={2} fontSize="sm" fontFamily="monospace" color="gray.200">
                  <Text pointerEvents="auto">1. Create scenes in: <code style={{ color: '#00d9ff' }}>src/renderer/phaser/scenes/</code></Text>
                  <Text pointerEvents="auto">2. Import and add to PhaserGame component</Text>
                  <Text pointerEvents="auto">3. Load assets in <code style={{ color: '#00d9ff' }}>scene.preload()</code></Text>
                  <Text pointerEvents="auto">4. Initialize game objects in <code style={{ color: '#00d9ff' }}>scene.create()</code></Text>
                  <Text pointerEvents="auto">5. Update logic in <code style={{ color: '#00d9ff' }}>scene.update()</code></Text>
                </VStack>
              </Box>

              {/* Documentation Link */}
              <HStack spacing={4} justify="center" pointerEvents="auto">
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

      {/* Feature Detail Modal */}
      {selectedFeature !== null && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedFeature(null)} 
          size="xl"
          isCentered
        >
          <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.6)" />
          <ModalContent bg="rgba(26, 32, 44, 0.95)" backdropFilter="blur(20px)" border="1px solid rgba(0, 217, 255, 0.3)">
            <ModalHeader>
              <HStack spacing={3}>
                {React.createElement(features[selectedFeature].icon, { size: 28, color: '#00d9ff' })}
                <Text>{features[selectedFeature].label}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="md" color="gray.300">
                    {features[selectedFeature].details}
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={3} color="cyan.300">
                    How to Use:
                  </Heading>
                  <List spacing={2}>
                    {features[selectedFeature].howTo.map((step, idx) => (
                      <ListItem key={idx} display="flex" alignItems="flex-start">
                        <ListIcon as={FaCheckCircle} color="green.400" mt={1} />
                        <Text fontSize="sm" flex={1}>
                          {step.includes(':') ? (
                            <>
                              <Text as="span" fontWeight="bold" color="gray.200">
                                {step.split(':')[0]}:
                              </Text>
                              <Code ml={2} colorScheme="cyan" fontSize="xs">
                                {step.split(':')[1].trim()}
                              </Code>
                            </>
                          ) : (
                            step
                          )}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="blue" 
                onClick={() => setSelectedFeature(null)}
                bg="rgba(66, 153, 225, 0.9)"
                _hover={{ bg: 'rgba(66, 153, 225, 1)' }}
              >
                Got it!
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default PhaserDemo;
