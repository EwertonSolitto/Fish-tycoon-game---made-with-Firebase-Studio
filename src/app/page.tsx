"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FishDisplay } from '@/components/game/FishDisplay';
import { HireableFishermanCard } from '@/components/game/HireableFishermanCard';
import { OwnedFishermanCard } from '@/components/game/OwnedFishermanCard';
import { PurchasableUpgradeCard } from '@/components/game/PurchasableUpgradeCard';
import { FISHERMAN_TYPES, GLOBAL_UPGRADES_DATA, INITIAL_FISH_COUNT, GAME_TICK_INTERVAL_MS } from '@/config/gameData';
import { RotateCcw } from 'lucide-react';

interface HiredFisherman {
  instanceId: string;
  typeId: string;
  name: string;
  level: number;
  currentUpgradeCost: number;
}

export default function FishWorldTycoonPage() {
  const [fish, setFish] = useState<number>(INITIAL_FISH_COUNT);
  const [hiredFishermen, setHiredFishermen] = useState<HiredFisherman[]>([]);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, boolean>>({});
  const [globalRateMultiplier, setGlobalRateMultiplier] = useState<number>(1);
  const [nextFishermanCosts, setNextFishermanCosts] = useState<Record<string, number>>({});
  const [numHiredByType, setNumHiredByType] = useState<Record<string, number>>({});


  const { toast } = useToast();

  const initializeGameState = useCallback(() => {
    const initialCosts: Record<string, number> = {};
    const initialCounts: Record<string, number> = {};
    FISHERMAN_TYPES.forEach(ft => {
      initialCosts[ft.id] = ft.initialCost;
      initialCounts[ft.id] = 0;
    });
    setNextFishermanCosts(initialCosts);
    setNumHiredByType(initialCounts);
    setFish(INITIAL_FISH_COUNT);
    setHiredFishermen([]);
    setPurchasedUpgrades({});
    setGlobalRateMultiplier(1);
  }, []);

  useEffect(() => {
    initializeGameState();
  }, [initializeGameState]);


  const calculateFishermanRate = useCallback((typeId: string, level: number): number => {
    const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === typeId);
    if (!fishermanType) return 0;
    return fishermanType.baseRate * level * globalRateMultiplier;
  }, [globalRateMultiplier]);

  const fishermenWithRates = useMemo(() => {
    return hiredFishermen.map(f => ({
      ...f,
      currentRate: calculateFishermanRate(f.typeId, f.level),
    }));
  }, [hiredFishermen, calculateFishermanRate]);

  const totalFishPerSecond = useMemo(() => {
    return fishermenWithRates.reduce((total, fisherman) => total + fisherman.currentRate, 0);
  }, [fishermenWithRates]);

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
      const newFisherman: HiredFisherman = {
        instanceId: crypto.randomUUID(),
        typeId: fishermanType.id,
        name: `${fishermanType.name} #${(numHiredByType[typeId] || 0) + 1}`,
        level: 1,
        currentUpgradeCost: fishermanType.baseUpgradeCost,
      };
      setHiredFishermen(prev => [...prev, newFisherman]);
      
      setNextFishermanCosts(prevCosts => ({
        ...prevCosts,
        [typeId]: cost * fishermanType.costIncreaseFactor,
      }));
      setNumHiredByType(prevCounts => ({
        ...prevCounts,
        [typeId]: (prevCounts[typeId] || 0) + 1,
      }));

      toast({ title: "Fisherman Hired!", description: `You hired a ${fishermanType.name}.` });
    } else {
      toast({ title: "Not enough fish!", description: `You need ${Math.ceil(cost).toLocaleString('en-US')} fish to hire.`, variant: "destructive" });
    }
  };

  const handleUpgradeFisherman = (instanceId: string) => {
    setHiredFishermen(prev => prev.map(f => {
      if (f.instanceId === instanceId) {
        const fishermanType = FISHERMAN_TYPES.find(ft => ft.id === f.typeId);
        if (!fishermanType) return f;

        const upgradeCost = f.currentUpgradeCost;
        if (fish >= upgradeCost) {
          setFish(prevFish => prevFish - upgradeCost);
          toast({ title: "Fisherman Upgraded!", description: `${f.name} is now level ${f.level + 1}.` });
          return {
            ...f,
            level: f.level + 1,
            currentUpgradeCost: upgradeCost * fishermanType.upgradeCostIncreaseFactor,
          };
        } else {
          toast({ title: "Not enough fish!", description: `You need ${Math.ceil(upgradeCost).toLocaleString('en-US')} fish to upgrade.`, variant: "destructive" });
          return f;
        }
      }
      return f;
    }));
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
        {hiredFishermen.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">My Active Crew ({hiredFishermen.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fishermenWithRates.map(f => {
                const typeData = FISHERMAN_TYPES.find(ft => ft.id === f.typeId);
                if (!typeData) return null;
                return (
                  <OwnedFishermanCard
                    key={f.instanceId}
                    fisherman={f}
                    fishermanTypeData={typeData}
                    onUpgrade={handleUpgradeFisherman}
                    canAffordUpgrade={fish >= f.currentUpgradeCost}
                  />
                );
              })}
            </div>
          </section>
        )}
        
        {hiredFishermen.length > 0 && <Separator className="my-6" />}


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
