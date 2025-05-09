
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FishermanType } from '@/config/gameData';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FishDisplay } from '@/components/game/FishDisplay';
import { HireableFishermanCard } from '@/components/game/HireableFishermanCard';
import { OwnedFishermanTypeCard } from '@/components/game/OwnedFishermanTypeCard';
import { PurchasableUpgradeCard } from '@/components/game/PurchasableUpgradeCard';
import { FISHERMAN_TYPES, GLOBAL_UPGRADES_DATA, INITIAL_FISH_COUNT, GAME_TICK_INTERVAL_MS } from '@/config/gameData';
import { RotateCcw } from 'lucide-react';

// State for each type of fisherman owned
interface FishermanTypeState {
  quantity: number;
  level: number;
  currentUnitUpgradeCost: number; // Cost to upgrade ALL fishermen of this type to the next level
}

export default function FishWorldTycoonPage() {
  const [fish, setFish] = useState<number>(INITIAL_FISH_COUNT);
  const [ownedFishermanTypes, setOwnedFishermanTypes] = useState<Record<string, FishermanTypeState>>({});
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, boolean>>({});
  const [globalRateMultiplier, setGlobalRateMultiplier] = useState<number>(1);
  const [nextFishermanCosts, setNextFishermanCosts] = useState<Record<string, number>>({});

  const { toast } = useToast();

  const initializeGameState = useCallback(() => {
    const initialCosts: Record<string, number> = {};
    const initialOwnedTypes: Record<string, FishermanTypeState> = {};

    FISHERMAN_TYPES.forEach(ft => {
      initialCosts[ft.id] = ft.initialCost;
      initialOwnedTypes[ft.id] = {
        quantity: 0,
        level: 1,
        currentUnitUpgradeCost: ft.baseUpgradeCost,
      };
    });

    setNextFishermanCosts(initialCosts);
    setOwnedFishermanTypes(initialOwnedTypes);
    setFish(INITIAL_FISH_COUNT);
    setPurchasedUpgrades({});
    setGlobalRateMultiplier(1);
  }, []);

  useEffect(() => {
    initializeGameState();
  }, [initializeGameState]);

  const totalFishPerSecond = useMemo(() => {
    let total = 0;
    for (const typeId in ownedFishermanTypes) {
      const typeState = ownedFishermanTypes[typeId];
      if (typeState.quantity > 0) {
        const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
        if (fishermanType) {
          // Rate per unit is baseRate * level multiplier * global multiplier
          // Level multiplier could be as simple as 'level', or Math.pow(someFactor, level -1), etc.
          // For now, let's use: baseRate * level (so level 2 is 2x baseRate, level 3 is 3x baseRate etc.)
          const ratePerUnit = fishermanType.baseRate * typeState.level * globalRateMultiplier;
          total += ratePerUnit * typeState.quantity;
        }
      }
    }
    return total;
  }, [ownedFishermanTypes, globalRateMultiplier]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFish(prevFish => prevFish + totalFishPerSecond);
    }, GAME_TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [totalFishPerSecond]);

  const handleHireFisherman = (typeId: string) => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    if (!fishermanType) return;

    const cost = nextFishermanCosts[typeId] || fishermanType.initialCost;

    if (fish >= cost) {
      setFish(prevFish => prevFish - cost);

      setOwnedFishermanTypes(prevTypes => {
        const currentTypeState = prevTypes[typeId];
        return {
          ...prevTypes,
          [typeId]: {
            ...currentTypeState,
            quantity: currentTypeState.quantity + 1,
          },
        };
      });
      
      setNextFishermanCosts(prevCosts => ({
        ...prevCosts,
        [typeId]: Math.ceil(cost * fishermanType.costIncreaseFactor),
      }));

      toast({ title: "Fisherman Hired!", description: `You hired a ${fishermanType.name}.` });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(cost).toLocaleString('en-US')} fish to hire.`, variant: "destructive" });
    }
  };

  const handleUpgradeFishermanType = (typeId: string) => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    const currentTypeState = ownedFishermanTypes[typeId];

    if (!fishermanType || !currentTypeState || currentTypeState.quantity === 0) return;

    const crewUpgradeCost = currentTypeState.currentUnitUpgradeCost;

    if (fish >= crewUpgradeCost) {
      setFish(prevFish => prevFish - crewUpgradeCost);
      
      setOwnedFishermanTypes(prevTypes => ({
        ...prevTypes,
        [typeId]: {
          ...currentTypeState,
          level: currentTypeState.level + 1,
          currentUnitUpgradeCost: Math.ceil(currentTypeState.currentUnitUpgradeCost * fishermanType.upgradeCostIncreaseFactor),
        },
      }));

      toast({ title: `${fishermanType.name} Crew Upgraded!`, description: `Your ${fishermanType.name} crew is now level ${currentTypeState.level + 1}.` });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(crewUpgradeCost).toLocaleString('en-US')} fish to upgrade your ${fishermanType.name} crew.`, variant: "destructive" });
    }
  };

  const handlePurchaseGlobalUpgrade = (upgradeId: string) => {
    const upgradeData = GLOBAL_UPGRADES_DATA.find(up => up.id === upgradeId);
    if (!upgradeData || purchasedUpgrades[upgradeId]) return;

    if (fish >= upgradeData.cost) {
      setFish(prevFish => prevFish - upgradeData.cost);
      setPurchasedUpgrades(prev => ({ ...prev, [upgradeId]: true }));
      setGlobalRateMultiplier(prev => prev * (1 + upgradeData.rateMultiplierIncrease));
      toast({ title: "Upgrade Purchased!", description: `${upgradeData.name} is now active.` });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${upgradeData.cost.toLocaleString('en-US')} fish for this upgrade.`, variant: "destructive" });
    }
  };
  
  const resetGame = () => {
    initializeGameState();
    toast({ title: "Game Reset", description: "You're starting fresh!"});
  };

  const totalHiredFishermen = useMemo(() => {
    return Object.values(ownedFishermanTypes).reduce((sum, ts) => sum + ts.quantity, 0);
  }, [ownedFishermanTypes]);


  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 space-y-6 bg-background text-foreground">
      <header className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center sm:text-left" style={{ color: 'hsl(var(--primary-foreground))', WebkitTextStroke: '1px hsl(var(--primary))', textShadow:'2px 2px 4px hsla(var(--primary), 0.5)'}}>
          Fish World Tycoon
        </h1>
        <FishDisplay fishCount={fish} fishPerSecond={totalFishPerSecond} />
      </header>

      <main className="w-full max-w-6xl space-y-8">
        {/* Hire Fishermen Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">Hire Crew</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FISHERMAN_TYPES.map(type => (
              <HireableFishermanCard
                key={type.id}
                fishermanType={type}
                onHire={handleHireFisherman}
                currentCost={nextFishermanCosts[type.id] || type.initialCost}
                canAfford={fish >= (nextFishermanCosts[type.id] || type.initialCost)}
              />
            ))}
          </div>
        </section>

        <Separator className="my-6" />

        {/* My Fishermen Section */}
        {totalHiredFishermen > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">My Active Crew ({totalHiredFishermen})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ownedFishermanTypes).map(([typeId, typeState]) => {
                if (typeState.quantity === 0) return null;
                const typeData = FISHERMAN_TYPES.find(ft => ft.id === typeId);
                if (!typeData) return null;

                const canAffordThisTypeUpgrade = fish >= typeState.currentUnitUpgradeCost;
                const ratePerUnit = typeData.baseRate * typeState.level * globalRateMultiplier;
                const totalRateForType = ratePerUnit * typeState.quantity;

                return (
                  <OwnedFishermanTypeCard
                    key={typeId}
                    fishermanTypeData={typeData}
                    typeState={typeState}
                    currentRateForType={totalRateForType}
                    onUpgrade={handleUpgradeFishermanType}
                    canAffordUpgrade={canAffordThisTypeUpgrade}
                  />
                );
              })}
            </div>
          </section>
        )}
        
        {totalHiredFishermen > 0 && <Separator className="my-6" />}


        {/* Global Upgrades Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">Research Upgrades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GLOBAL_UPGRADES_DATA.map(upgrade => (
              <PurchasableUpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                onPurchase={handlePurchaseGlobalUpgrade}
                isPurchased={!!purchasedUpgrades[upgrade.id]}
                canAfford={fish >= upgrade.cost}
              />
            ))}
          </div>
        </section>
        
        <Separator className="my-6" />
        
        <footer className="w-full flex justify-center py-6">
            <Button onClick={resetGame} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
            </Button>
        </footer>

      </main>
    </div>
  );
}
