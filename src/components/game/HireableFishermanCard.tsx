"use client";

import type React from 'react';
import type { FishermanType } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, UserPlus } from 'lucide-react';

interface HireableFishermanCardProps {
  fishermanType: FishermanType;
  onHire: (typeId: string) => void;
  currentCost: number;
  canAfford: boolean;
}

export function HireableFishermanCard({ fishermanType, onHire, currentCost, canAfford }: HireableFishermanCardProps) {
  const IconComponent = fishermanType.icon;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <IconComponent className="h-10 w-10 text-primary" aria-hidden="true" />
        <div>
          <CardTitle className="text-xl">{fishermanType.name}</CardTitle>
          <CardDescription className="text-xs">{fishermanType.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-2 pb-4">
        <p className="text-sm font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Cost: {Math.ceil(currentCost).toLocaleString()} fish
        </p>
        <p className="text-sm text-muted-foreground">Base Rate: {fishermanType.baseRate.toFixed(1)} fish/sec (Lvl 1)</p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onHire(fishermanType.id)} 
          disabled={!canAfford}
          className="w-full"
          aria-label={`Hire ${fishermanType.name}`}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Hire
        </Button>
      </CardFooter>
    </Card>
  );
}
