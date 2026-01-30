'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';

export function CommissionCalculator(): JSX.Element {
  const [annualSales, setAnnualSales] = useState(100000);

  // Commission rate assumptions
  const typicalAgencyRate = 0.65; // 65% of commission
  const apexRate = 1.35; // 135% average (up to 145%)

  // Average commission rate on life insurance products (industry standard ~100%)
  const baseCommissionRate = 1.0;

  // Calculate earnings
  const calculations = useMemo(() => {
    const typicalAgencyEarnings = annualSales * baseCommissionRate * typicalAgencyRate;
    const apexEarnings = annualSales * baseCommissionRate * apexRate;
    const difference = apexEarnings - typicalAgencyEarnings;
    const percentageIncrease = ((difference / typicalAgencyEarnings) * 100).toFixed(0);

    return { typicalAgencyEarnings, apexEarnings, difference, percentageIncrease };
  }, [annualSales, baseCommissionRate, typicalAgencyRate, apexRate]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatSales = useCallback((value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  }, []);

  const handleSalesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAnnualSales(Number(e.target.value));
  }, []);

  return (
    <div className="w-full">
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <Badge className="mb-3 bg-amber-500/20 text-amber-700 border-amber-500/30">
              Income Calculator
            </Badge>
            <h3 className="text-2xl font-bold mb-2">See What You Could Actually Earn</h3>
            <p className="text-muted-foreground">
              Move the slider to see your potential income at Apex vs. a typical agency
            </p>
          </div>

          {/* Slider Input */}
          <div className="mb-8">
            <label htmlFor="sales-slider" className="block text-sm font-medium mb-2 text-center">
              Your Annual Production (Premium Volume)
            </label>
            <div className="relative px-2">
              <input
                id="sales-slider"
                type="range"
                min="50000"
                max="500000"
                step="10000"
                value={annualSales}
                onChange={handleSalesChange}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                style={{
                  background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${((annualSales - 50000) / 450000) * 100}%, rgb(254 215 170) ${((annualSales - 50000) / 450000) * 100}%, rgb(254 215 170) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$50K</span>
                <span className="font-semibold text-base text-amber-600">{formatSales(annualSales)}</span>
                <span>$500K</span>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Typical Agency */}
            <Card className="border-2 border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Typical Agency (65%)</p>
                  <div className="text-3xl font-bold text-slate-700 mb-2">
                    {formatCurrency(calculations.typicalAgencyEarnings)}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                    <DollarSign className="h-3 w-3" />
                    <span>per year</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Apex */}
            <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-amber-100 mb-1">At Apex (135% avg)</p>
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(calculations.apexEarnings)}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-amber-100">
                    <TrendingUp className="h-3 w-3" />
                    <span>per year</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Difference Highlight */}
          <div className="bg-white rounded-lg border-2 border-green-500 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">You Would Earn</p>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(calculations.difference)} More
            </div>
            <p className="text-xs text-muted-foreground">
              That's a <span className="font-semibold text-green-600">{calculations.percentageIncrease}% increase</span> in your annual income
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 text-xs text-muted-foreground text-center space-y-1">
            <p>
              * Based on average commission rates. Actual earnings vary based on product mix, carrier contracts, and individual performance.
            </p>
            <p className="font-medium">
              Apex commission rates range from 90% to 145% depending on product and carrier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
