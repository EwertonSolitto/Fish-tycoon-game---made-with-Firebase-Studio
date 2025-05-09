
"use client";

import type React from 'react';
import type { MinigameUpgradeData } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';

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

  let effectDescription = "";
  switch (upgrade.effect.type) {
    case 'maxFish':
      effectDescription = `+${upgrade.effect.value} max fish`;
      break;
    case 'lifetime':
      effectDescription = `+${(upgrade.effect.value / 1000).toFixed(1)}s lifetime`;
      break;
    case 'value':
      effectDescription = `+${upgrade.effect.value} fish per catch`;
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
            <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" /> Current Level: {currentLevel}
          </p>
          <p className="text-sm text-muted-foreground">
            Effect per Level: {effectDescription}
          </p>
          {!isMaxLevel && (
            <p className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Upgrade Cost: {Math.ceil(nextCost).toLocaleString('en-US')} fish
            </p>
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
