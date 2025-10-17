# Phaser 3 Integration

## Overview

This ERB Custom boilerplate includes **Phaser 3** as an optional game engine module. Phaser is a fast, free, and fun open source HTML5 game framework that provides WebGL and Canvas rendering for desktop and mobile web browsers.

## What's Included

- ✅ **Phaser 3.87** - Latest stable version
- ✅ **React Component Wrapper** - Seamless integration with React
- ✅ **Demo Scene** - Interactive example with physics and particles
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **Physics Engine** - Arcade physics pre-configured
- ✅ **Module Status** - Real-time availability indicator

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install `phaser@^3.87.0` along with all other dependencies.

### 2. View the Demo

Run the app and click the **"🎮 Phaser Demo"** button or navigate via the dock to see the interactive demo scene.

### 3. Create Your Own Scene

Create a new scene in `src/renderer/phaser/scenes/`:

```typescript
// src/renderer/phaser/scenes/MyGame.ts
import Phaser from 'phaser';

export default class MyGame extends Phaser.Scene {
  constructor() {
    super({ key: 'MyGame' });
  }

  preload() {
    // Load assets
    this.load.image('player', 'assets/player.png');
  }

  create() {
    // Initialize game objects
    const player = this.add.sprite(400, 300, 'player');
  }

  update(time: number, delta: number) {
    // Game logic
  }
}
```

### 4. Add Scene to Game

Import and add your scene to the PhaserGame component:

```tsx
import PhaserGame from './phaser/PhaserGame';
import MyGame from './phaser/scenes/MyGame';
import DemoScene from './phaser/scenes/DemoScene';

// In your component:
<PhaserGame 
  width={800} 
  height={600}
  scenes={[MyGame, DemoScene]}
/>
```

## File Structure

```
src/renderer/phaser/
├── PhaserGame.tsx          # React wrapper component
├── PhaserDemo.tsx          # Demo page with documentation
└── scenes/
    └── DemoScene.ts        # Example scene with physics & particles
```

## Features

### Physics Engine

- Arcade Physics (lightweight, fast)
- Matter.js Physics (advanced, realistic)
- Support for sprites, groups, and collision detection

### Rendering

- WebGL renderer (hardware accelerated)
- Canvas fallback for older devices
- Built-in camera system with effects

### Input

- Mouse and touch support
- Keyboard input handling
- Gamepad/controller support

### Assets

- Image, sprite sheet, and atlas loading
- Audio (Web Audio API and HTML5 Audio)
- JSON, XML, and binary data
- Asset pack loading

### Animation

- Sprite sheet animations
- Tweens and timelines
- Particle systems
- Shader effects

## Configuration

The default configuration in `PhaserGame.tsx`:

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,                    // WebGL with Canvas fallback
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,                     // Set to true for debug rendering
    },
  },
  scene: scenes,
  scale: {
    mode: Phaser.Scale.FIT,            // Scale to fit container
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,                    // Set to true for pixel art games
  },
};
```

## Common Use Cases

### 1. 2D Games

Perfect for platformers, shooters, puzzle games, and more.

### 2. Interactive Visualizations

Create engaging data visualizations and infographics.

### 3. Educational Apps

Build interactive learning experiences and simulations.

### 4. Tools & Utilities

Game editors, level designers, animation tools.

### 5. Demos & Prototypes

Rapid prototyping of game concepts and mechanics.

## Best Practices

### Asset Management

```typescript
preload() {
  // Organize assets by type
  this.load.setPath('assets/');
  
  this.load.image('sprites/player', 'player.png');
  this.load.audio('sounds/jump', 'jump.mp3');
  this.load.json('data/levels', 'levels.json');
}
```

### Scene Management

```typescript
// Switch scenes
this.scene.start('NextScene', { score: 100 });

// Pause/resume
this.scene.pause('GameScene');
this.scene.resume('GameScene');

// Run scenes in parallel
this.scene.launch('UIScene');
```

### Memory Management

```typescript
shutdown() {
  // Clean up resources when scene ends
  this.textures.remove('tempTexture');
  this.sound.removeAll();
}
```

### Performance Tips

- Use texture atlases instead of individual images
- Enable texture compression for large games
- Pool game objects instead of creating/destroying
- Use `update()` sparingly - consider event-driven logic
- Enable `pixelArt: true` for retro games (better performance)

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser Examples](https://phaser.io/examples)
- [Phaser Labs](https://labs.phaser.io/)
- [Phaser Community](https://phaser.discourse.group/)
- [Game Dev Academy Tutorials](https://gamedevacademy.org/category/phaser-tutorials/)

## Troubleshooting

### Game Not Rendering

- Check that the container element exists when game initializes
- Verify scene key is correct
- Check browser console for WebGL errors

### Assets Not Loading

- Ensure asset paths are correct (relative to public folder)
- Check CORS settings if loading from external URLs
- Verify files are included in webpack config

### Performance Issues

- Enable debug mode to check physics body counts
- Monitor texture memory usage
- Consider using smaller sprite sheets
- Reduce particle counts

## License

Phaser 3 is released under the MIT License. See the [Phaser License](https://github.com/photonstorm/phaser/blob/master/license.txt) for details.

## Next Steps

1. Explore the demo scene code in `src/renderer/phaser/scenes/DemoScene.ts`
2. Read the [Official Phaser Tutorial](https://phaser.io/tutorials/making-your-first-phaser-3-game)
3. Browse [Phaser Examples](https://phaser.io/examples) for inspiration
4. Join the [Phaser Community](https://phaser.discourse.group/) for help

Happy game development! 🎮
