"use client";

import type React from 'react';
import type { GlobalUpgradeData } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, CheckCircle2 } from 'lucide-react';

interface PurchasableUpgradeCardProps {
  upgrade: GlobalUpgradeData;
  onPurchase: (upgradeId: string) => void;
  isPurchased: boolean;
  canAfford: boolean;
}

export function PurchasableUpgradeCard({ upgrade, onPurchase, isPurchased, canAfford }: PurchasableUpgradeCardProps) {
  const IconComponent = upgrade.icon;

  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${isPurchased ? 'opacity-60' : ''}`}>
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <IconComponent className="h-10 w-10 text-primary" aria-hidden="true" />
        <div>
          <CardTitle className="text-xl">{upgrade.name}</CardTitle>
          <CardDescription className="text-xs">{upgrade.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        {!isPurchased && (
          <p className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Cost: {upgrade.cost.toLocaleString()} fish
          </p>
        )}
      </CardContent>
      <CardFooter>
        {isPurchased ? (
          <Button disabled className="w-full" variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Purchased
          </Button>
        ) : (
          <Button 
            onClick={() => onPurchase(upgrade.id)} 
            disabled={!canAfford}
            className="w-full"
            aria-label={`Purchase ${upgrade.name}`}
          >
            <Zap className="mr-2 h-4 w-4" /> Purchase
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
