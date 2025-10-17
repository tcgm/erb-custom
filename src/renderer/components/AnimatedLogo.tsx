import React, { useRef, useEffect } from 'react';
import { Box } from '@chakra-ui/react';

interface AnimatedLogoProps {
  size?: number;
  electronGlowRadius?: number;
  centerGlowMultiplier?: number; // Multiplier for center radial glow (relative to size)
  plusGlowLayers?: number;
  plusGlowSize?: number;
  plusCoreSize?: number;
  dropShadowSizes?: [number, number, number]; // Three drop shadow sizes
  dropShadowOpacities?: [number, number, number]; // Three drop shadow opacities
  float?: boolean; // If true, positions logo absolutely without taking up layout space
  floatPosition?: {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
  };
  // Animation
  bobAnimationDuration?: number; // Duration of bob animation in seconds
  bobAnimationDistance?: number; // Distance of bob movement in pixels
  // Electron configuration
  orbitRadiusMultiplier?: number; // Multiplier for orbit radius (relative to size)
  electronSpeeds?: [number, number, number]; // Speed for each electron
  orbitRotations?: [number, number, number]; // Rotation angle for each orbit in radians
  electronColors?: [string, string, string]; // Colors for each electron
  electronCoreRadius?: number; // Radius of electron core
  trailMaxLength?: number; // Maximum length of electron trail
  trailOpacity?: number; // Opacity multiplier for trails
  orbitOpacity?: number; // Opacity of orbit paths
  orbitLineWidth?: number; // Width of orbit path lines
  // Lens flare
  flareBlur?: number; // Blur amount for main flare
  coreBlur?: number; // Blur amount for core
  flareWidthMultiplier?: number; // Multiplier for flare width (relative to size)
  flareHeightMultiplier?: number; // Multiplier for flare height (relative to size)
  verticalFlareHeightMultiplier?: number; // Multiplier for vertical flare height
  verticalFlareWidthMultiplier?: number; // Multiplier for vertical flare width
  coreRadiusMultiplier?: number; // Multiplier for core radius (relative to size)
  // Plus sign
  plusOuterGlowWidth?: number; // Width of outer glow on plus
  plusOuterGlowBlur?: number; // Blur amount for outer glow on plus (in pixels)
  plusInnerCoreWidth?: number; // Width of inner core on plus
  plusGlowBaseWidth?: number; // Base width for plus glow layers
  plusGlowWidthIncrement?: number; // Width increment per glow layer
  // Pulse animation
  pulseSpeed?: number; // Speed of pulse animation
  pulseScale?: number; // Scale amplitude of pulse
  glowIntensityBase?: number; // Base glow intensity
  glowIntensityVariation?: number; // Variation in glow intensity
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 200,
  electronGlowRadius = 20,
  centerGlowMultiplier = 0.8,
  plusGlowLayers = 3,
  plusGlowSize = 15,
  plusCoreSize = 50,
  dropShadowSizes = [60, 120, 180],
  dropShadowOpacities = [0.8, 0.6, 0.4],
  float = false,
  floatPosition = { top: '2rem', left: '50%' },
  bobAnimationDuration = 10,
  bobAnimationDistance = 15,
  orbitRadiusMultiplier = 0.35,
  electronSpeeds = [0.02, 0.022, 0.018],
  orbitRotations = [0, Math.PI / 3, -Math.PI / 3],
  electronColors = ['#60a5fa', '#34d399', '#f472b6'],
  electronCoreRadius = 8,
  trailMaxLength = 64,
  trailOpacity = 1,
  orbitOpacity = 0.8,
  orbitLineWidth = 2,
  flareBlur = 20,
  coreBlur = 10,
  flareWidthMultiplier = 2.5,
  flareHeightMultiplier = 0.12,
  verticalFlareHeightMultiplier = 1.5,
  verticalFlareWidthMultiplier = 0.08,
  coreRadiusMultiplier = 0.15,
  plusOuterGlowWidth = 32,
  plusOuterGlowBlur = 8,
  plusInnerCoreWidth = 20,
  plusGlowBaseWidth = 32,
  plusGlowWidthIncrement = 2,
  pulseSpeed = 0.5,
  pulseScale = 0.15,
  glowIntensityBase = 0.8,
  glowIntensityVariation = 0.2
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Canvas needs to be larger to accommodate the wide flare
  const canvasSize = size * 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const orbitRadius = size * orbitRadiusMultiplier;
    
    // Electron configuration - 3 orbits at different angles
    const electrons = [
      { angle: 0, speed: electronSpeeds[0], orbitRotation: orbitRotations[0], color: electronColors[0] },
      { angle: Math.PI * 2 / 3, speed: electronSpeeds[1], orbitRotation: orbitRotations[1], color: electronColors[1] },
      { angle: Math.PI * 4 / 3, speed: electronSpeeds[2], orbitRotation: orbitRotations[2], color: electronColors[2] }
    ];

    // Trail positions for each electron
    const trails = electrons.map(() => [] as Array<{ x: number; y: number; alpha: number }>);
    const maxTrailLength = trailMaxLength;

    let animationFrameId: number;

    const animate = () => {
      // Clear canvas completely for transparent background
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Draw orbit paths FIRST (so they appear behind everything)
      electrons.forEach((electron) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(electron.orbitRotation);
        
        // Draw orbit ellipse - more visible
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRadius, orbitRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96, 165, 250, ${orbitOpacity})`;
        ctx.lineWidth = orbitLineWidth;
        ctx.stroke();
        
        ctx.restore();
      });

      // Update and draw electrons with trails
      electrons.forEach((electron, idx) => {
        electron.angle += electron.speed;

        // Calculate electron position
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(electron.orbitRotation);
        
        const x = Math.cos(electron.angle) * orbitRadius;
        const y = Math.sin(electron.angle) * orbitRadius * 0.3;
        
        // Transform back to canvas coordinates for trail
        const transformedX = centerX + x * Math.cos(electron.orbitRotation) - y * Math.sin(electron.orbitRotation);
        const transformedY = centerY + x * Math.sin(electron.orbitRotation) + y * Math.cos(electron.orbitRotation);
        
        ctx.restore();

        // Add to trail
        trails[idx].unshift({ x: transformedX, y: transformedY, alpha: 1 });
        if (trails[idx].length > maxTrailLength) {
          trails[idx].pop();
        }

        // Draw trail
        trails[idx].forEach((point, i) => {
          const alpha = (1 - i / maxTrailLength) * point.alpha * trailOpacity;
          const radius = 2 + (1 - i / maxTrailLength) * 2;
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = electron.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(');
          
          // Convert hex to rgba
          const r = parseInt(electron.color.slice(1, 3), 16);
          const g = parseInt(electron.color.slice(3, 5), 16);
          const b = parseInt(electron.color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();
        });

        // Draw electron
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(electron.orbitRotation);
        
        // Electron large glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, electronGlowRadius);
        const r = parseInt(electron.color.slice(1, 3), 16);
        const g = parseInt(electron.color.slice(3, 5), 16);
        const b = parseInt(electron.color.slice(5, 7), 16);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.8)`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.4)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, electronGlowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Electron core
        ctx.fillStyle = electron.color;
        ctx.beginPath();
        ctx.arc(x, y, electronCoreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Draw central glowing plus
      const time = Date.now() * 0.002;
      const pulseSc = 1 + Math.sin(time * pulseSpeed) * pulseScale;
      const glowIntensity = glowIntensityBase + Math.sin(time * pulseSpeed) * glowIntensityVariation;

      // JJ Abrams style wide horizontal lens flare - BLUE and HEAVILY BLURRED
      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Enable heavy blur for the flare
      ctx.filter = `blur(${flareBlur}px)`;
      
      // Main horizontal flare - very wide and bright BLUE
      const flareWidth = size * flareWidthMultiplier;
      const flareHeight = size * flareHeightMultiplier;
      
      const horizontalGradient = ctx.createLinearGradient(-flareWidth / 2, 0, flareWidth / 2, 0);
      horizontalGradient.addColorStop(0, 'rgba(96, 165, 250, 0)');
      horizontalGradient.addColorStop(0.35, `rgba(96, 165, 250, ${glowIntensity * 0.5})`);
      horizontalGradient.addColorStop(0.5, `rgba(150, 200, 255, ${glowIntensity * 0.9})`);
      horizontalGradient.addColorStop(0.65, `rgba(96, 165, 250, ${glowIntensity * 0.5})`);
      horizontalGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
      
      ctx.fillStyle = horizontalGradient;
      ctx.fillRect(-flareWidth / 2, -flareHeight / 2, flareWidth, flareHeight);
      
      // Secondary horizontal flare (thinner, more intense)
      const flareHeight2 = size * (flareHeightMultiplier / 2);
      const horizontalGradient2 = ctx.createLinearGradient(-flareWidth / 2, 0, flareWidth / 2, 0);
      horizontalGradient2.addColorStop(0, 'rgba(96, 165, 250, 0)');
      horizontalGradient2.addColorStop(0.4, `rgba(150, 200, 255, ${glowIntensity * 0.7})`);
      horizontalGradient2.addColorStop(0.5, `rgba(200, 220, 255, ${glowIntensity})`);
      horizontalGradient2.addColorStop(0.6, `rgba(150, 200, 255, ${glowIntensity * 0.7})`);
      horizontalGradient2.addColorStop(1, 'rgba(96, 165, 250, 0)');
      ctx.fillStyle = horizontalGradient2;
      ctx.fillRect(-flareWidth / 2, -flareHeight2 / 2, flareWidth, flareHeight2);
      
      // Vertical flare (shorter) - BLUE
      const verticalFlareHeight = size * verticalFlareHeightMultiplier;
      const verticalFlareWidth = size * verticalFlareWidthMultiplier;
      
      const verticalGradient = ctx.createLinearGradient(0, -verticalFlareHeight / 2, 0, verticalFlareHeight / 2);
      verticalGradient.addColorStop(0, 'rgba(96, 165, 250, 0)');
      verticalGradient.addColorStop(0.4, `rgba(96, 165, 250, ${glowIntensity * 0.4})`);
      verticalGradient.addColorStop(0.5, `rgba(150, 200, 255, ${glowIntensity * 0.8})`);
      verticalGradient.addColorStop(0.6, `rgba(96, 165, 250, ${glowIntensity * 0.4})`);
      verticalGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
      
      ctx.fillStyle = verticalGradient;
      ctx.fillRect(-verticalFlareWidth / 2, -verticalFlareHeight / 2, verticalFlareWidth, verticalFlareHeight);
      
      // Reset blur for the core
      ctx.filter = `blur(${coreBlur}px)`;
      
      // Bright blue core
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * coreRadiusMultiplier);
      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${glowIntensity})`);
      coreGradient.addColorStop(0.3, `rgba(200, 220, 255, ${glowIntensity * 0.8})`);
      coreGradient.addColorStop(0.6, `rgba(150, 200, 255, ${glowIntensity * 0.5})`);
      coreGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, size * coreRadiusMultiplier, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.filter = 'none'; // Reset filter
      ctx.restore();

      // Large radial glow from center - illuminates the whole page
      const maxGlowRadius = size * centerGlowMultiplier;
      for (let i = 5; i > 0; i--) {
        const glowRadius = maxGlowRadius * (i / 5);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        
        const alpha = glowIntensity * (0.15 / i);
        gradient.addColorStop(0, `rgba(96, 165, 250, ${alpha * 1.5})`);
        gradient.addColorStop(0.3, `rgba(96, 165, 250, ${alpha})`);
        gradient.addColorStop(0.7, `rgba(96, 165, 250, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(96, 165, 250, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Plus glow layers - smaller shaped glow
      for (let i = plusGlowLayers; i > 0; i--) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(pulseSc, pulseSc);
        
        const glowSize = plusGlowSize + i * 5;
        const alpha = glowIntensity * (0.3 / i);
        
        ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
        ctx.lineWidth = plusGlowBaseWidth + i * plusGlowWidthIncrement;
        ctx.lineCap = 'round';
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(0, -glowSize);
        ctx.lineTo(0, glowSize);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(-glowSize, 0);
        ctx.lineTo(glowSize, 0);
        ctx.stroke();
        
        ctx.restore();
      }

      // Plus solid core - very bright white
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulseSc, pulseSc);
      
      // Outer white glow with blur
      ctx.filter = `blur(${plusOuterGlowBlur}px)`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity * 0.9})`;
      ctx.lineWidth = plusOuterGlowWidth;
      ctx.lineCap = 'round';
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(0, -plusCoreSize);
      ctx.lineTo(0, plusCoreSize);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(-plusCoreSize, 0);
      ctx.lineTo(plusCoreSize, 0);
      ctx.stroke();
      
      // Inner bright white core (no blur)
      ctx.filter = 'none';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = plusInnerCoreWidth;
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(0, -plusCoreSize);
      ctx.lineTo(0, plusCoreSize);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(-plusCoreSize, 0);
      ctx.lineTo(plusCoreSize, 0);
      ctx.stroke();
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    size, canvasSize, electronGlowRadius, centerGlowMultiplier, plusGlowLayers, plusGlowSize, plusCoreSize,
    orbitRadiusMultiplier, electronSpeeds, orbitRotations, electronColors, electronCoreRadius,
    trailMaxLength, trailOpacity, orbitOpacity, orbitLineWidth, flareBlur, coreBlur,
    flareWidthMultiplier, flareHeightMultiplier, verticalFlareHeightMultiplier, verticalFlareWidthMultiplier,
    coreRadiusMultiplier, plusOuterGlowWidth, plusOuterGlowBlur, plusInnerCoreWidth, plusGlowBaseWidth, plusGlowWidthIncrement,
    pulseSpeed, pulseScale, glowIntensityBase, glowIntensityVariation
  ]);

  const dropShadowFilter = `drop-shadow(0 0 ${dropShadowSizes[0]}px rgba(96, 165, 250, ${dropShadowOpacities[0]})) drop-shadow(0 0 ${dropShadowSizes[1]}px rgba(96, 165, 250, ${dropShadowOpacities[1]})) drop-shadow(0 0 ${dropShadowSizes[2]}px rgba(96, 165, 250, ${dropShadowOpacities[2]}))`;

  return (
    <>
      <style>
        {`
          @keyframes bob {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-${bobAnimationDistance}px); }
          }
        `}
      </style>
      <Box
        display="inline-block"
        position={float ? 'absolute' : 'relative'}
        top={float ? floatPosition.top : undefined}
        left={float ? floatPosition.left : undefined}
        right={float ? floatPosition.right : undefined}
        bottom={float ? floatPosition.bottom : undefined}
        zIndex={float ? 10 : 'auto'}
        sx={{
          animation: `bob ${bobAnimationDuration}s ease-in-out infinite`,
          transform: float && floatPosition.left === '50%' ? 'translateX(-50%)' : undefined,
          pointerEvents: float ? 'none' : 'auto'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            display: 'block',
            width: `${size}px`,
            height: `${size}px`,
            filter: dropShadowFilter
          }}
        />
      </Box>
    </>
  );
};

export default AnimatedLogo;
