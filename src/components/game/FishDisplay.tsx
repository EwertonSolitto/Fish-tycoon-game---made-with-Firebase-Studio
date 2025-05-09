"use client";

import type React from 'react';
import { Fish as FishIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FishDisplayProps {
  fishCount: number;
  fishPerSecond: number;
}

export function FishDisplay({ fishCount, fishPerSecond }: FishDisplayProps) {
  return (
    <Card className="shadow-lg w-full text-center bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Your Catch
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-2">
        <div className="flex items-center text-5xl font-extrabold text-primary">
          <FishIcon className="mr-3 h-12 w-12" aria-hidden="true" />
          {Math.floor(fishCount).toLocaleString()}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <TrendingUp className="mr-1 h-4 w-4" />
          {fishPerSecond.toFixed(1)} fish/sec
        </div>
      </CardContent>
    </Card>
  );
}
