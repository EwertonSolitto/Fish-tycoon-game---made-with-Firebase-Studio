
"use client";

import type React from 'react';
import type { FishermanType } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpCircle, Activity, Users } from 'lucide-react';

interface OwnedFishermanTypeCardProps {
  fishermanTypeData: FishermanType;
  typeState: {
    quantity: number;
    level: number;
    currentUnitUpgradeCost: number; 
  };
  currentRateForType: number;
  totalUpgradeCost: number;
  onUpgrade: (typeId: string) => void;
  canAffordUpgrade: boolean;
}

export function OwnedFishermanTypeCard({ 
  fishermanTypeData, 
  typeState, 
  currentRateForType,
  totalUpgradeCost,
  onUpgrade, 
  canAffordUpgrade 
}: OwnedFishermanTypeCardProps) {
  const IconComponent = fishermanTypeData.icon;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <IconComponent className="h-8 w-8 text-secondary-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">{fishermanTypeData.name} Crew</CardTitle>
        </div>
        <CardDescription>
          Level: {typeState.level} | Quantity: {typeState.quantity}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-2 pb-4">
        <p className="text-sm font-medium flex items-center">
          <Activity className="h-4 w-4 mr-1 text-muted-foreground" /> Total Rate: {currentRateForType.toFixed(2)} fish/sec
        </p>
        <p className="text-sm font-medium flex items-center">
          <Users className="h-4 w-4 mr-1 text-muted-foreground" /> Unit Upgrade Cost: {Math.ceil(typeState.currentUnitUpgradeCost).toLocaleString('en-US')} fish
        </p>
        <p className="text-sm font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Total Upgrade Cost: {Math.ceil(totalUpgradeCost).toLocaleString('en-US')} fish
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onUpgrade(fishermanTypeData.id)} 
          disabled={!canAffordUpgrade || typeState.quantity === 0}
          variant="secondary"
          className="w-full"
          aria-label={`Upgrade ${fishermanTypeData.name} crew`}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade Crew (Lvl {typeState.level + 1})
        </Button>
      </CardFooter>
    </Card>
  );
}

