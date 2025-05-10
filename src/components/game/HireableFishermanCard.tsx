
"use client";

import type React from 'react';
import type { FishermanType } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, UserPlus, ArrowUpCircle, Activity, TrendingUp, Users2Icon, TimerIcon, FishIcon as CollectionIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface HireableFishermanCardProps {
  fishermanType: FishermanType;
  onHire: (typeId: string) => void;
  currentHireCost: number;
  canAffordHire: boolean;

  ownedQuantity: number;
  currentLevel: number;
  currentCrewUpgradeCost: number;
  onUpgrade: (typeId: string) => void;
  canAffordCrewUpgrade: boolean;
  collectionAmount: number; // Amount collected per cycle for this crew type (factoring level and global multipliers)
  collectionIntervalSeconds: number; // Current collection interval in seconds for this crew type
}

export function HireableFishermanCard({ 
  fishermanType, 
  onHire, 
  currentHireCost, 
  canAffordHire,
  ownedQuantity,
  currentLevel,
  currentCrewUpgradeCost,
  onUpgrade,
  canAffordCrewUpgrade,
  collectionAmount,
  collectionIntervalSeconds
}: HireableFishermanCardProps) {
  const IconComponent = fishermanType.icon;
  
  const displayInterval = collectionIntervalSeconds === Infinity || ownedQuantity === 0 
    ? fishermanType.baseCollectionTimeMs / 1000 
    : collectionIntervalSeconds;

  const displayAmount = ownedQuantity === 0 
    ? fishermanType.baseCollectionAmount // Show base amount if none owned
    : collectionAmount;


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-start space-x-4 pb-2">
          <IconComponent className="h-10 w-10 text-primary mt-1" aria-hidden="true" />
          <div>
            <CardTitle className="text-xl">{fishermanType.name}</CardTitle>
            <CardDescription className="text-xs">{fishermanType.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2 pb-4">
          <div>
            <p className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Cost to Hire: {Math.ceil(currentHireCost).toLocaleString('en-US')} fish
            </p>
            <p className="text-sm text-muted-foreground flex items-center">
              <CollectionIcon className="h-4 w-4 mr-1" /> Base Collection: {fishermanType.baseCollectionAmount} fish 
            </p>
             <p className="text-sm text-muted-foreground flex items-center">
              <TimerIcon className="h-4 w-4 mr-1" /> Base Interval: {(fishermanType.baseCollectionTimeMs / 1000).toFixed(1)}s (for 1 unit)
            </p>
          </div>

          <>
            <Separator />
            <div>
              <p className="text-sm font-semibold flex items-center">
                <Users2Icon className="h-4 w-4 mr-1 text-muted-foreground" /> Owned: {ownedQuantity} (Level {currentLevel})
              </p>
              {ownedQuantity > 0 && (
                 <>
                  <p className="text-sm font-medium flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-muted-foreground" /> Collects: {displayAmount.toFixed(1)} fish
                  </p>
                  <p className="text-sm font-medium flex items-center">
                    <TimerIcon className="h-4 w-4 mr-1 text-muted-foreground" /> Every: {displayInterval.toFixed(1)} seconds
                  </p>
                 </>
              )}
              <p className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Upgrade Cost: {Math.ceil(currentCrewUpgradeCost).toLocaleString('en-US')} fish
              </p>
            </div>
          </>
        </CardContent>
      </div>
      
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <Button 
          onClick={() => onHire(fishermanType.id)} 
          disabled={!canAffordHire}
          className="w-full"
          aria-label={`Hire ${fishermanType.name}`}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Hire
        </Button>
        <Button 
          onClick={() => onUpgrade(fishermanType.id)} 
          disabled={!canAffordCrewUpgrade}
          variant="secondary"
          className="w-full"
          aria-label={`Upgrade ${fishermanType.name} crew to level ${currentLevel + 1}`}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade Crew (Lvl {currentLevel + 1})
        </Button>
      </CardFooter>
    </Card>
  );
}
