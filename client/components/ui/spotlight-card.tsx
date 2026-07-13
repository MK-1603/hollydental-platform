"use client";

import React, { useEffect, useRef, ReactNode, useState } from 'react';

/**
 * Hook to determine the application's primary color and convert it to glow parameters.
 */
const useApplicationColor = () => {
  const [appColor, setAppColor] = useState<{ base: number; spread: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // For this specific app, the primary blue is roughly hue 210
      // We'll hardcode it as the default "app color" since we know it's a dental app with a blue theme (#1E73BE is hue ~208)
      setAppColor({ base: 208, spread: 200 }); 
    }
  }, []);

  return appColor;
};

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  autoColor?: boolean;
  
  /**
   * Defines how the glow responds to pointer movement:
   * - 'global': follows the cursor across the entire screen (default)
   * - 'hover': only tracks the cursor when hovering directly over the card
   * - 'custom': stops internal event tracking.
   */
  cursorMode?: 'global' | 'hover' | 'custom';
  
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean; // When true, ignores size prop and uses width/height or className
}

const glowColorMap = {
  blue: { base: 200, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor,
  autoColor = true,
  cursorMode = 'hover',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isClicked, setIsClicked] = useState(false);
  
  const appColor = useApplicationColor();

  // If glowColor is explicitly provided, it takes precedence.
  // Otherwise, use the app color (if autoColor is true and resolved), falling back to blue.
  const baseColorInfo = glowColor 
    ? glowColorMap[glowColor] 
    : glowColorMap['blue']; // Default to blue for normal state to match user request

  // The prompt asked: "While clicking color must match to current applicaiton color"
  const activeColor = isClicked && autoColor && appColor ? appColor : baseColorInfo;

  const { base, spread } = activeColor;

  useEffect(() => {
    if (cursorMode === 'custom') return;

    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      
      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', x.toFixed(2));
        cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
        cardRef.current.style.setProperty('--y', y.toFixed(2));
        cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
      }
    };

    if (cursorMode === 'global') {
      document.addEventListener('pointermove', syncPointer);
      return () => document.removeEventListener('pointermove', syncPointer);
    } else if (cursorMode === 'hover' && cardRef.current) {
      const card = cardRef.current;
      card.addEventListener('pointermove', syncPointer);
      
      const resetPointer = () => {
        if (cardRef.current) {
          cardRef.current.style.setProperty('--x', '-1000');
          cardRef.current.style.setProperty('--y', '-1000');
        }
      };
      card.addEventListener('pointerleave', resetPointer);
      
      return () => {
        card.removeEventListener('pointermove', syncPointer);
        card.removeEventListener('pointerleave', resetPointer);
      };
    }
  }, [cursorMode]);

  const getSizeClasses = () => {
    if (customSize) {
      return '';
    }
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles: React.CSSProperties & Record<string, string> = {
      '--base': base.toString(),
      '--spread': spread.toString(),
      '--radius': '28',
      '--border': '2',
      '--backdrop': 'white', // We set to white to match the light theme design
      '--backup-border': 'var(--backdrop)',
      '--size': '300', // Spotlight size
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative' as const,
      touchAction: 'none' as const,
    };

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
    
    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }
    
    [data-glow] > [data-glow]::before {
      inset: -10px;
      border-width: 10px;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        onPointerDown={() => setIsClicked(true)}
        onPointerUp={() => setIsClicked(false)}
        onPointerLeave={() => setIsClicked(false)}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          relative 
          ${className}
        `}
      >
        <div ref={innerRef} data-glow></div>
        {children}
      </div>
    </>
  );
};

export { GlowCard };
