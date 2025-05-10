
"use client";

import type React from 'react';
import { Fish as FishIcon } from 'lucide-react';

interface ClickableFishProps {
  id: string;
  x: number; // percentage
  y: number; // percentage
  onClick: (id: string, x: number, y: number) => void; // Pass x and y to handler
  size?: number; // Optional size for the fish in pixels
  isCritical?: boolean;
}

export function ClickableFish({ id, x, y, onClick, size = 40, isCritical = false }: ClickableFishProps) {
  return (
    <button
      type="button"
      aria-label={`Click to catch ${isCritical ? 'critical ' : ''}fish`}
      onClick={() => onClick(id, x, y)} // Pass x and y here
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 focus:outline-none rounded-full p-1"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
      }}
      data-testid={`clickable-fish-${id}`}
      data-ai-hint={`${isCritical ? 'yellow ' : ''}fish icon`}
    >
      <FishIcon className={`w-full h-full ${isCritical ? 'text-yellow-400' : 'text-primary'}`} />
    </button>
  );
}

