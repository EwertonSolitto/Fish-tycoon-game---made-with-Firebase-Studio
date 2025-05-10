
"use client";

import React, { useState, useEffect } from 'react';
import type { FishermanType } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, UserPlus, ArrowUpCircle, Activity, TimerIcon, FishIcon as CollectionIcon, Users2Icon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FloatingNumber } from './FloatingNumber'; // Assuming FloatingNumber can be used/adapted
import { formatNumber } from '@/lib/utils';

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
  collectionAmount: number;
  collectionIntervalSeconds: number;
  collectionNotification?: { amount: number; key: string };
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
  collectionIntervalSeconds,
  collectionNotification
}: HireableFishermanCardProps) {
  const IconComponent = fishermanType.icon;
  
  const [animateAction, setAnimateAction] = useState<'hire' | 'upgrade' | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);
  const [localFloatingNumbers, setLocalFloatingNumbers] = useState<{id: string; value: number}[]>([]);

  const lastNotificationKey = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    if (animateAction) {
      const timer = setTimeout(() => setAnimateAction(null), 500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [animateAction]);

  useEffect(() => {
    if (collectionNotification && collectionNotification.key !== lastNotificationKey.current) {
      lastNotificationKey.current = collectionNotification.key;
      
      // Vibration
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 300); // Vibration duration

      // Floating number
      if (collectionNotification.amount > 0) {
        const newFloaterId = `crew-fn-${fishermanType.id}-${Date.now()}-${Math.random()}`;
        setLocalFloatingNumbers(prev => [...prev, { id: newFloaterId, value: collectionNotification.amount }]);
      }
    }
  }, [collectionNotification, fishermanType.id]);

  const handleLocalFloatingNumberAnimationComplete = (id: string) => {
    setLocalFloatingNumbers(prev => prev.filter(fn => fn.id !== id));
  };

  const displayInterval = collectionIntervalSeconds === Infinity || ownedQuantity === 0 
    ? fishermanType.baseCollectionTimeMs / 1000 
    : collectionIntervalSeconds;

  const displayAmount = ownedQuantity === 0 
    ? (fishermanType.baseCollectionAmount * Math.pow(2, 0)) // Show base amount for Lvl 1 if none owned
    : collectionAmount;

  const animationClass = animateAction === 'hire' ? 'animate-pulse-once' 
                       : animateAction === 'upgrade' ? 'animate-pulse-once' // Could be a different animation
                       : '';
  const vibrationClass = isVibrating ? 'animate-shake-sm' : '';


  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between relative overflow-visible ${animationClass} ${vibrationClass}`}>
      {localFloatingNumbers.map(fn => (
        <FloatingNumber
          key={fn.id}
          id={fn.id}
          value={fn.value}
          x={90} // Percentage for top-rightish
          y={10} // Percentage for top-rightish
          onAnimationComplete={handleLocalFloatingNumberAnimationComplete}
        />
      ))}
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
              <Users2Icon className="h-4 w-4 mr-1 text-muted-foreground" /> Owned: {ownedQuantity} (Level {currentLevel})
            </p>
             <p className="text-sm text-muted-foreground flex items-center">
              <CollectionIcon className="h-4 w-4 mr-1" /> Collects: {formatNumber(displayAmount)} fish 
            </p>
             <p className="text-sm text-muted-foreground flex items-center">
              <TimerIcon className="h-4 w-4 mr-1" /> Interval: {displayInterval.toFixed(1)}s 
              {ownedQuantity === 0 && " (for 1 unit, Lvl 1)"}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Cost to Hire: {formatNumber(currentHireCost)} fish
            </p>
            <p className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" /> Upgrade Cost: {formatNumber(currentCrewUpgradeCost)} fish
            </p>
           
          </div>
        </CardContent>
      </div>
      
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <Button 
          onClick={() => { onHire(fishermanType.id); setAnimateAction('hire'); }}
          disabled={!canAffordHire}
          className="w-full"
          aria-label={`Hire ${fishermanType.name}`}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Hire
        </Button>
        <Button 
          onClick={() => { onUpgrade(fishermanType.id); setAnimateAction('upgrade');}} 
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
