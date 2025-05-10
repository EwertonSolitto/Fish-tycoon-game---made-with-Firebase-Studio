
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClickableFish } from './ClickableFish';
import { FloatingNumber } from './FloatingNumber';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_MINIGAME_MAX_FISH, INITIAL_MINIGAME_FISH_LIFETIME_MS, INITIAL_MIN_SPAWN_INTERVAL_MS, INITIAL_MAX_SPAWN_INTERVAL_MS, INITIAL_MINIGAME_FISH_VALUE, INITIAL_CRITICAL_FISH_CHANCE, MINIGAME_CRITICAL_FISH_MIN_MULTIPLIER, MINIGAME_CRITICAL_FISH_MAX_MULTIPLIER } from '@/config/gameData';


interface ActiveFish {
  id: string;
  x: number; // percentage
  y: number; // percentage
  createdAt: number;
  size: number; // px
  isCritical: boolean;
  value: number; // Actual value of this fish when caught
}

interface FloatingNumberItem {
  id: string; // Unique ID for the floating number itself
  key: string; // React key
  value: number;
  x: number; // percentage position
  y: number; // percentage position
}

interface ClickableFishGameProps {
  onFishCaught: (count: number) => void;
  gameAreaWidth?: number; // pixels
  gameAreaHeight?: number; // pixels
  maxFishOnScreen?: number;
  fishLifetimeMs?: number;
  minSpawnIntervalMs?: number;
  maxSpawnIntervalMs?: number;
  fishValueOnClick?: number; // Base value for a normal fish
  criticalFishChance?: number;
}

const DEFAULT_GAME_AREA_HEIGHT = 200;
const MIN_FISH_SIZE = 32; // pixels
const MAX_FISH_SIZE = 48; // pixels


export function ClickableFishGame({
  onFishCaught,
  gameAreaWidth = 0, 
  gameAreaHeight = DEFAULT_GAME_AREA_HEIGHT,
  maxFishOnScreen = INITIAL_MINIGAME_MAX_FISH,
  fishLifetimeMs = INITIAL_MINIGAME_FISH_LIFETIME_MS,
  minSpawnIntervalMs = INITIAL_MIN_SPAWN_INTERVAL_MS,
  maxSpawnIntervalMs = INITIAL_MAX_SPAWN_INTERVAL_MS,
  fishValueOnClick = INITIAL_MINIGAME_FISH_VALUE, 
  criticalFishChance = INITIAL_CRITICAL_FISH_CHANCE,
}: ClickableFishGameProps) {
  const [activeFish, setActiveFish] = useState<ActiveFish[]>([]);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumberItem[]>([]);
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
    
    let isCritical = false;
    let value = fishValueOnClick;

    if (Math.random() < criticalFishChance) {
      isCritical = true;
      const multiplier = Math.random() * (MINIGAME_CRITICAL_FISH_MAX_MULTIPLIER - MINIGAME_CRITICAL_FISH_MIN_MULTIPLIER) + MINIGAME_CRITICAL_FISH_MIN_MULTIPLIER;
      value = Math.floor(fishValueOnClick * multiplier);
    }
    
    const newFish: ActiveFish = { id, x, y, createdAt: Date.now(), size, isCritical, value };
    
    setActiveFish((prev) => {
      if (prev.length < maxFishOnScreen) {
        return [...prev, newFish];
      }
      return prev;
    });

  }, [activeFish.length, maxFishOnScreen, fishValueOnClick, criticalFishChance]);
  
  const scheduleNextSpawn = useCallback(() => {
    if (spawnTimeoutIdRef.current) {
      clearTimeout(spawnTimeoutIdRef.current);
    }
    const nextSpawnTime = Math.random() * (maxSpawnIntervalMs - minSpawnIntervalMs) + minSpawnIntervalMs;
    spawnTimeoutIdRef.current = setTimeout(() => {
      spawnFish();
      scheduleNextSpawn(); // Reschedule after spawning
    }, nextSpawnTime);
  }, [spawnFish, minSpawnIntervalMs, maxSpawnIntervalMs]);


  // Effect for scheduling spawns - depends on dynamic intervals
  useEffect(() => {
    scheduleNextSpawn();
    return () => {
      if (spawnTimeoutIdRef.current) clearTimeout(spawnTimeoutIdRef.current);
    };
  }, [scheduleNextSpawn]); // Re-run if scheduleNextSpawn changes (due to interval props changing)


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
    (fishId: string, fishX: number, fishY: number) => {
      const clickedFish = activeFish.find(f => f.id === fishId);
      if (!clickedFish) return;

      onFishCaught(clickedFish.value);
      setActiveFish((prev) => prev.filter((fish) => fish.id !== fishId));

      const newFloatingNumberId = `fn-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
      setFloatingNumbers((prev) => [
        ...prev,
        { id: newFloatingNumberId, key: newFloatingNumberId, value: clickedFish.value, x: fishX, y: fishY },
      ]);
    },
    [onFishCaught, activeFish]
  );

  const handleFloatingNumberAnimationComplete = useCallback((id: string) => {
    setFloatingNumbers((prev) => prev.filter((fn) => fn.id !== id));
  }, []);

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
              isCritical={fish.isCritical}
              onClick={handleFishClick}
            />
          ))}
          {floatingNumbers.map((fn) => (
            <FloatingNumber
              key={fn.key}
              id={fn.id}
              value={fn.value}
              x={fn.x}
              y={fn.y}
              onAnimationComplete={handleFloatingNumberAnimationComplete}
            />
          ))}
         
        </div>
      </CardContent>
    </Card>
  );
}
