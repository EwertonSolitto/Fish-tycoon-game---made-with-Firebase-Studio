
"use client";

import type React from 'react';
import { useEffect, useRef } from 'react';

interface FloatingNumberProps {
  id: string;
  value: number;
  x: number; // percentage
  y: number; // percentage
  onAnimationComplete: (id: string) => void;
}

export function FloatingNumber({ id, value, x, y, onAnimationComplete }: FloatingNumberProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      const handleAnimationEnd = () => {
        onAnimationComplete(id);
      };
      // Check for animationend event support (some headless browsers might not support it for tests)
      if (typeof node.addEventListener === 'function') {
        node.addEventListener('animationend', handleAnimationEnd);
        return () => {
          node.removeEventListener('animationend', handleAnimationEnd);
        };
      } else {
        // Fallback for environments without animationend (e.g., during SSR tests or very old browsers)
        // This will remove the element after 1 second regardless of animation.
        const timeoutId = setTimeout(() => {
          onAnimationComplete(id);
        }, 1000); // Match animation duration
        return () => clearTimeout(timeoutId);
      }
    }
  }, [id, onAnimationComplete]);

  return (
    <div
      ref={ref}
      className="absolute text-lg font-bold text-primary animate-float-up-fade-out pointer-events-none select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        // Initial transform to position the number above the click point.
        // The animation will then take over translateY.
        transform: 'translate(-50%, -120%)', 
      }}
      role="status"
      aria-live="polite"
    >
      +{value}
    </div>
  );
}
