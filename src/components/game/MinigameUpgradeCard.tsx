
"use client";

import type React from 'react';
import type { MinigameUpgradeData } from '@/config/gameData';
import { 
  INITIAL_MINIGAME_MAX_FISH,
  INITIAL_MINIGAME_FISH_LIFETIME_MS,
  INITIAL_MINIGAME_FISH_VALUE,
  INITIAL_CRITICAL_FISH_CHANCE,
  INITIAL_MIN_SPAWN_INTERVAL_MS,
  INITIAL_MAX_SPAWN_INTERVAL_MS
} from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, CheckCircle2, TrendingUp, ShieldCheck, Info } from 'lucide-react';

interface MinigameUpgradeCardProps {
  upgrade: MinigameUpgradeData;
  onPurchase: (upgradeId: string) => void;
  currentLevel: number;
  nextCost: number;
  canAfford: boolean;
  isMaxLevel: boolean;
  gameStats: { // Pass current game state for accurate display
    minigameMaxFish: number;
    minigameFishLifetime: number;
    minigameFishValue: number;
    criticalFishChance: number;
    minigameMinSpawnMs: number;
    minigameMaxSpawnMs: number;
    boosterBaitBaseChance: number;
    boosterBaitAdditionalChance: number;
    boosterBaitBaseDurationMs: number;
    boosterBaitAdditionalDurationMs: number;
    autoNetBaseCatchAmount: number;
    autoNetCatchAmount: number;
  };
}

const formatSpawnCooldown = (minMs: number, maxMs: number): string => {
  return `${(minMs / 1000).toFixed(1)}s - ${(maxMs / 1000).toFixed(1)}s`;
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
}

export function MinigameUpgradeCard({ 
  upgrade, 
  onPurchase, 
  currentLevel, 
  nextCost, 
  canAfford,
  isMaxLevel,
  gameStats,
}: MinigameUpgradeCardProps) {
  const IconComponent = upgrade.icon;
  
  let currentBonusDescription = "";
  let nextLevelEffectDescription = "";

  // Calculate current effective value based on gameStats and currentLevel
  // This is more complex now as some upgrades modify gameStats directly, 
  // while others have a base value + per-level increment.
  // For simplicity, we'll display the direct effect of the upgrade here.

  switch (upgrade.effect.type) {
    case 'maxFish':
      currentBonusDescription = `${gameStats.minigameMaxFish} Max Fish`;
      nextLevelEffectDescription = `+${upgrade.effect.value} Max Fish`;
      break;
    case 'lifetime':
      currentBonusDescription = `${(gameStats.minigameFishLifetime / 1000).toFixed(1)}s Fish Lifetime`;
      nextLevelEffectDescription = `+${(upgrade.effect.value / 1000).toFixed(1)}s Lifetime`;
      break;
    case 'value':
      currentBonusDescription = `${gameStats.minigameFishValue} Fish Value`;
      nextLevelEffectDescription = `+${upgrade.effect.value} Fish Value`;
      break;
    case 'criticalChance':
      currentBonusDescription = `${formatPercentage(gameStats.criticalFishChance)} Crit Chance`;
      nextLevelEffectDescription = `+${formatPercentage(upgrade.effect.value)} Crit Chance`;
      break;
    case 'spawnCooldownReduction':
      currentBonusDescription = `Spawn: ${formatSpawnCooldown(gameStats.minigameMinSpawnMs, gameStats.minigameMaxSpawnMs)}`;
      nextLevelEffectDescription = `-${upgrade.effect.value}ms Cooldown`;
      break;
    case 'boosterBaitChance':
      const totalBoosterChance = gameStats.boosterBaitBaseChance + gameStats.boosterBaitAdditionalChance;
      currentBonusDescription = `${formatPercentage(totalBoosterChance)} Booster Chance`;
      nextLevelEffectDescription = `+${formatPercentage(upgrade.effect.value)} Booster Chance`;
      break;
    case 'boosterBaitDuration':
      const totalBoosterDuration = gameStats.boosterBaitBaseDurationMs + gameStats.boosterBaitAdditionalDurationMs;
      currentBonusDescription = `${(totalBoosterDuration / 1000).toFixed(1)}s Booster Duration`;
      nextLevelEffectDescription = `+${(upgrade.effect.value / 1000).toFixed(1)}s Duration`;
      break;
    case 'autoNetCatchAmount':
        currentBonusDescription = `${gameStats.autoNetCatchAmount} Fish per Net Haul`;
        nextLevelEffectDescription = `+${upgrade.effect.value} Fish per Haul`;
        break;
    default:
      // Fallback for unknown types
      const currentTotalValueGeneric = (INITIAL_MINIGAME_MAX_FISH + (currentLevel -1) * upgrade.effect.value); // Example fallback
      currentBonusDescription = `Current: ${currentTotalValueGeneric.toFixed(1)}`;
      nextLevelEffectDescription = `Adds +${upgrade.effect.value.toFixed(1)}`;
  }


  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between`}>
      <div>
        <CardHeader className="flex flex-row items-start space-x-4 pb-2">
          <IconComponent className="h-10 w-10 text-primary mt-1" aria-hidden="true" />
          <div>
            <CardTitle className="text-xl">{upgrade.name}</CardTitle>
            <CardDescription className="text-xs">{upgrade.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-2 pb-4">
          <p className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" /> Current Level: {currentLevel}
            {upgrade.maxLevel && ` / ${upgrade.maxLevel}`}
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
             <Info className="h-4 w-4 mr-1 text-muted-foreground" /> Current Bonus: {currentBonusDescription}
          </p>
          {!isMaxLevel && (
            <>
              <p className="text-sm text-muted-foreground flex items-center">
                <Info className="h-4 w-4 mr-1 text-muted-foreground" /> Next Upgrade: {nextLevelEffectDescription}
              </p>
              <p className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Upgrade Cost: {Math.ceil(nextCost).toLocaleString('en-US')} fish
              </p>
            </>
          )}
           {isMaxLevel && (
            <p className="text-sm font-semibold flex items-center text-primary">
              <ShieldCheck className="h-4 w-4 mr-1" /> Max Level Reached!
            </p>
          )}
        </CardContent>
      </div>
      <CardFooter>
        {isMaxLevel ? (
          <Button disabled className="w-full" variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Max Level
          </Button>
        ) : (
          <Button 
            onClick={() => onPurchase(upgrade.id)} 
            disabled={!canAfford}
            className="w-full"
            aria-label={`Upgrade ${upgrade.name} to level ${currentLevel + 1}`}
          >
            <Zap className="mr-2 h-4 w-4" /> Upgrade (Lvl {currentLevel + 1})
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
