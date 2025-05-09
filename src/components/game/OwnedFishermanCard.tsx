"use client";

import type React from 'react';
import type { FishermanType } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpCircle, Activity } from 'lucide-react';

interface OwnedFishermanCardProps {
  fisherman: {
    instanceId: string;
    typeId: string;
    name: string;
    level: number;
    currentRate: number;
    currentUpgradeCost: number;
  };
  fishermanTypeData: FishermanType;
  onUpgrade: (instanceId: string) => void;
  canAffordUpgrade: boolean;
}

export function OwnedFishermanCard({ fisherman, fishermanTypeData, onUpgrade, canAffordUpgrade }: OwnedFishermanCardProps) {
  const IconComponent = fishermanTypeData.icon;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <IconComponent className="h-8 w-8 text-secondary-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">{fisherman.name}</CardTitle>
        </div>
        <CardDescription>Level: {fisherman.level}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-2 pb-4">
        <p className="text-sm font-medium flex items-center">
          <Activity className="h-4 w-4 mr-1 text-muted-foreground" /> Rate: {fisherman.currentRate.toFixed(2)} fish/sec
        </p>
        <p className="text-sm font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Upgrade Cost: {Math.ceil(fisherman.currentUpgradeCost).toLocaleString()} fish
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onUpgrade(fisherman.instanceId)} 
          disabled={!canAffordUpgrade}
          variant="secondary"
          className="w-full"
          aria-label={`Upgrade ${fisherman.name}`}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade
        </Button>
      </CardFooter>
    </Card>
  );
}
