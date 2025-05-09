
"use client";

import type React from 'react';
import type { MinigameUpgradeData } from '@/config/gameData';
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
}

export function MinigameUpgradeCard({ 
  upgrade, 
  onPurchase, 
  currentLevel, 
  nextCost, 
  canAfford,
  isMaxLevel
}: MinigameUpgradeCardProps) {
  const IconComponent = upgrade.icon;

  const actualCurrentLevel = currentLevel === 0 ? 1 : currentLevel; // Ensure level is at least 1 for display
  const currentBonusValue = actualCurrentLevel * upgrade.effect.value;
  
  let currentBonusDescription = "";
  let nextLevelEffectDescription = "";

  switch (upgrade.effect.type) {
    case 'maxFish':
      currentBonusDescription = `+${currentBonusValue} Max Fish`;
      nextLevelEffectDescription = `Adds +${upgrade.effect.value} Max Fish`;
      break;
    case 'lifetime':
      currentBonusDescription = `+${(currentBonusValue / 1000).toFixed(1)}s Fish Lifetime`;
      nextLevelEffectDescription = `Adds +${(upgrade.effect.value / 1000).toFixed(1)}s Fish Lifetime`;
      break;
    case 'value':
      currentBonusDescription = `+${currentBonusValue} Fish Value`;
      nextLevelEffectDescription = `Adds +${upgrade.effect.value} Fish Value`;
      break;
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
            <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" /> Current Level: {actualCurrentLevel}
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
            aria-label={`Upgrade ${upgrade.name} to level ${actualCurrentLevel + 1}`}
          >
            <Zap className="mr-2 h-4 w-4" /> Upgrade (Lvl {actualCurrentLevel + 1})
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
