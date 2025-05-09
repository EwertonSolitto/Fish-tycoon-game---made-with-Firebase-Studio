
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClickableFish } from './ClickableFish';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActiveFish {
  id: string;
  x: number; // percentage
  y: number; // percentage
  createdAt: number;
  size: number; // px
}

interface ClickableFishGameProps {
  onFishCaught: (count: number) => void;
  gameAreaWidth?: number; // pixels
  gameAreaHeight?: number; // pixels
  maxFishOnScreen?: number;
  fishLifetimeMs?: number;
  minSpawnIntervalMs?: number;
  maxSpawnIntervalMs?: number;
}

const DEFAULT_GAME_AREA_HEIGHT = 200;
const DEFAULT_MAX_FISH_ON_SCREEN = 5;
const DEFAULT_FISH_LIFETIME_MS = 3000; // 3 seconds
const DEFAULT_MIN_SPAWN_INTERVAL_MS = 1000; // 1 second
const DEFAULT_MAX_SPAWN_INTERVAL_MS = 2000; // 2 seconds
const MIN_FISH_SIZE = 24; // pixels
const MAX_FISH_SIZE = 40; // pixels

export function ClickableFishGame({
  onFishCaught,
  gameAreaWidth = 0, // Default to 0 to enable responsive width via '100%'
  gameAreaHeight = DEFAULT_GAME_AREA_HEIGHT,
  maxFishOnScreen = DEFAULT_MAX_FISH_ON_SCREEN,
  fishLifetimeMs = DEFAULT_FISH_LIFETIME_MS,
  minSpawnIntervalMs = DEFAULT_MIN_SPAWN_INTERVAL_MS,
  maxSpawnIntervalMs = DEFAULT_MAX_SPAWN_INTERVAL_MS,
}: ClickableFishGameProps) {
  const [activeFish, setActiveFish] = useState<ActiveFish[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const spawnTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const despawnIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const spawnFish = useCallback(() => {
    if (activeFish.length >= maxFishOnScreen) {
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const x = Math.random() * 90 + 5; 
    const y = Math.random() * 90 + 5;
    const size = Math.floor(Math.random() * (MAX_FISH_SIZE - MIN_FISH_SIZE + 1) + MIN_FISH_SIZE);
    const newFish: ActiveFish = { id, x, y, createdAt: Date.now(), size };
    
    setActiveFish((prev) => {
      if (prev.length < maxFishOnScreen) {
        return [...prev, newFish];
      }
      return prev;
    });

  }, [activeFish.length, maxFishOnScreen]);
  
  const scheduleNextSpawn = useCallback(() => {
    if (spawnTimeoutIdRef.current) {
      clearTimeout(spawnTimeoutIdRef.current);
    }
    const nextSpawnTime = Math.random() * (maxSpawnIntervalMs - minSpawnIntervalMs) + minSpawnIntervalMs;
    spawnTimeoutIdRef.current = setTimeout(() => {
      spawnFish();
      scheduleNextSpawn();
    }, nextSpawnTime);
  }, [spawnFish, minSpawnIntervalMs, maxSpawnIntervalMs]);

  useEffect(() => {
    scheduleNextSpawn();
    return () => {
      if (spawnTimeoutIdRef.current) clearTimeout(spawnTimeoutIdRef.current);
    };
  }, [scheduleNextSpawn]);

  useEffect(() => {
    despawnIntervalIdRef.current = setInterval(() => {
      const now = Date.now();
      setActiveFish((prev) => prev.filter((fish) => now - fish.createdAt < fishLifetimeMs));
    }, 500);

    return () => {
      if (despawnIntervalIdRef.current) clearInterval(despawnIntervalIdRef.current);
    };
  }, [fishLifetimeMs]);

  const handleFishClick = useCallback(
    (fishId: string) => {
      onFishCaught(1);
      setActiveFish((prev) => prev.filter((fish) => fish.id !== fishId));
    },
    [onFishCaught]
  );

  return (
    <Card className="shadow-lg w-full max-w-md md:max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Quick Catch Minigame!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameAreaRef}
          className="relative border-2 border-primary rounded-md overflow-hidden bg-background/30"
          style={{ 
            width: gameAreaWidth > 0 ? `${gameAreaWidth}px` : '100%',
            height: `${gameAreaHeight}px`, 
            minWidth: '200px'
          }}
          aria-live="polite" 
          role="application" 
          aria-label="Clickable fish game area. Click fish as they appear to catch them."
        >
          {activeFish.map((fish) => (
            <ClickableFish
              key={fish.id}
              id={fish.id}
              x={fish.x}
              y={fish.y}
              size={fish.size}
              onClick={handleFishClick}
            />
          ))}
          {activeFish.length === 0 && (
             <p 
                className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-4 text-center"
                aria-hidden="true"
             >
                Look out for fish! Click them to catch.
             </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
