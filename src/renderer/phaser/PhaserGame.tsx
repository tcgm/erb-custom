import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import DemoScene from './scenes/DemoScene';

interface PhaserGameProps {
  width?: number;
  height?: number;
  scenes?: typeof Phaser.Scene[];
}

/**
 * PhaserGame Component
 * 
 * React wrapper for Phaser 3 game engine.
 * Handles game lifecycle and canvas management.
 */
const PhaserGame: React.FC<PhaserGameProps> = ({
  width = 800,
  height = 600,
  scenes = [DemoScene],
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: scenes,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [width, height, scenes]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default PhaserGame;
