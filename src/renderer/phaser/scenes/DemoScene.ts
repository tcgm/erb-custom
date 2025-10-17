import Phaser from 'phaser';

/**
 * Demo Phaser Scene
 * 
 * A simple demo showing Phaser 3 integration in Electron.
 * Features:
 * - Bouncing logo sprite
 * - Particle effects
 * - Click to spawn particles
 * - FPS counter
 */
export default class DemoScene extends Phaser.Scene {
  private logo?: Phaser.Physics.Arcade.Image;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private fpsText?: Phaser.GameObjects.Text;
  private sprites: Phaser.Physics.Arcade.Image[] = [];
  private autoParticleTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'DemoScene' });
  }

  preload() {
    // Create a simple logo sprite (placeholder - replace with actual assets)
    this.createPlaceholderLogo();
  }

  create() {
    const { width, height } = this.cameras.main;

    // Add animated gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e, 1);
    bg.fillRect(0, 0, width, height);
    
    // Animate background gradient
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const value = tween.getValue() ?? 0;
        bg.clear();
        const color1 = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0x0a0a1e),
          Phaser.Display.Color.ValueToColor(0x1a1a4e),
          100,
          value * 100
        );
        const color2 = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0x1a1a3e),
          Phaser.Display.Color.ValueToColor(0x2a2a5e),
          100,
          value * 100
        );
        bg.fillGradientStyle(
          Phaser.Display.Color.GetColor(color1.r, color1.g, color1.b),
          Phaser.Display.Color.GetColor(color1.r, color1.g, color1.b),
          Phaser.Display.Color.GetColor(color2.r, color2.g, color2.b),
          Phaser.Display.Color.GetColor(color2.r, color2.g, color2.b),
          1
        );
        bg.fillRect(0, 0, width, height);
      },
    });

    // Create multiple bouncing sprites with different colors
    const colors = [0x00d9ff, 0xff00ff, 0xffff00, 0x00ff00, 0xff6b6b, 0x4ecdc4];
    for (let i = 0; i < 6; i++) {
      const sprite = this.physics.add.image(
        Phaser.Math.Between(100, width - 100),
        Phaser.Math.Between(100, height - 100),
        'logo'
      );
      sprite.setDisplaySize(60, 60);
      sprite.setVelocity(
        Phaser.Math.Between(100, 250) * (Math.random() > 0.5 ? 1 : -1),
        Phaser.Math.Between(100, 250) * (Math.random() > 0.5 ? 1 : -1)
      );
      sprite.setBounce(1, 1);
      sprite.setCollideWorldBounds(true);
      sprite.setTint(colors[i]);
      sprite.setAlpha(0.8);
      this.sprites.push(sprite);
      
      // Add pulsing effect
      this.tweens.add({
        targets: sprite,
        scale: { from: 1, to: 1.2 },
        duration: 1000 + i * 200,
        yoyo: true,
        repeat: -1,
      });
    }

    // Create particle system
    const particles = this.add.particles(0, 0, 'logo', {
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600,
      gravityY: 100,
      quantity: 5,
      tint: colors,
      emitting: false,
    });

    this.particles = particles;

    // Click to emit particles
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      particles.emitParticleAt(pointer.x, pointer.y, 15);
    });
    
    // Auto-emit particles periodically at random sprites
    this.autoParticleTimer = this.time.addEvent({
      delay: 1500,
      callback: () => {
        if (this.sprites.length > 0) {
          const randomSprite = Phaser.Utils.Array.GetRandom(this.sprites);
          if (randomSprite) {
            particles.emitParticleAt(randomSprite.x, randomSprite.y, 8);
          }
        }
      },
      loop: true,
    });

    // Add FPS counter (semi-transparent)
    this.fpsText = this.add.text(10, 10, 'FPS: 0', {
      fontSize: '12px',
      color: '#00ff00',
      fontFamily: 'monospace',
    }).setAlpha(0.6);

    // Add subtle title
    this.add
      .text(width / 2, 30, 'Phaser 3 Demo', {
        fontSize: '18px',
        color: '#00d9ff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
  }

  update() {
    // Update FPS counter
    if (this.fpsText) {
      this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }

    // Rotate sprites as they bounce
    this.sprites.forEach((sprite) => {
      sprite.rotation += 0.015;
    });
  }
  
  shutdown() {
    // Clean up timer
    if (this.autoParticleTimer) {
      this.autoParticleTimer.remove();
    }
  }

  /**
   * Create a placeholder logo texture
   * In production, replace this with actual asset loading
   */
  private createPlaceholderLogo() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00d9ff, 1);
    graphics.fillCircle(50, 50, 40);
    graphics.lineStyle(5, 0xffffff, 1);
    graphics.strokeCircle(50, 50, 40);
    graphics.generateTexture('logo', 100, 100);
    graphics.destroy();
  }
}
