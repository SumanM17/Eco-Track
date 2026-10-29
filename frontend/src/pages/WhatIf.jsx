import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sliders, 
  Sparkles, 
  TrendingDown, 
  IndianRupee, 
  Zap, 
  Car, 
  Sun, 
  Utensils, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

export function WhatIf() {
  const { t } = useTranslation();

  // Baseline defaults
  const baselineKg = 4.82;
  const baselineCost = 42.5;

  // Sliders state
  const [acTemp, setAcTemp] = useState(24); // 20 to 28 C (default 24)
  const [metroKm, setMetroKm] = useState(10); // 0 to 30 km shifted to metro
  const [plantMeals, setPlantMeals] = useState(4); // 0 to 14 meals
  const [solarPercent, setSolarPercent] = useState(20); // 0% to 100%

  const [adopted, setAdopted] = useState(false);

  // Dynamic savings calculations:
  // 1. AC temp: delta from 22C baseline. Each +1C saves ~6% AC power = ~0.25 kg CO2e and ~Rs 2.50
  const acDelta = Math.max(0, acTemp - 22);
  const acCo2Saved = Number((acDelta * 0.28).toFixed(2));
  const acCostSaved = Math.round(acDelta * 2.8);

  // 2. Metro shift: saves (0.170 - 0.015) = 0.155 kg CO2e per km
  const metroCo2Saved = Number((metroKm * 0.155).toFixed(2));
  const metroCostSaved = Math.round(metroKm * 2.2);

  // 3. Plant-rich meals: saves 0.35 kg CO2e per meal
  const plantCo2Saved = Number(((plantMeals / 7) * 0.35).toFixed(2));
  const plantCostSaved = Math.round((plantMeals / 7) * 4.0);

  // 4. Rooftop solar: saves up to 1.8 kg CO2e for typical household
  const solarCo2Saved = Number(((solarPercent / 100) * 1.8).toFixed(2));
  const solarCostSaved = Math.round((solarPercent / 100) * 18.0);

  // Total daily savings
  const totalDailyCo2Saved = Number((acCo2Saved + metroCo2Saved + plantCo2Saved + solarCo2Saved).toFixed(2));
  const totalDailyCostSaved = acCostSaved + metroCostSaved + plantCostSaved + solarCostSaved;

  const newDailyKg = Math.max(0.8, Number((baselineKg - totalDailyCo2Saved).toFixed(2)));
  const percentageCut = Math.min(85, Math.round((totalDailyCo2Saved / baselineKg) * 100));

  // Monthly & Yearly projections
  const monthlyCo2Saved = Math.round(totalDailyCo2Saved * 30);
  const monthlyCostSaved = totalDailyCostSaved * 30;
  const yearlyTreesEquivalent = (monthlyCo2Saved * 12 / 20).toFixed(1);

  const comparisonChartData = [
    { label: 'Current Routine', emissions: baselineKg, fill: '#E76F51' },
    { label: 'Simulated What-If', emissions: newDailyKg, fill: '#2D6A4F' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-seafoam-600" />
          Interactive Climate & Cost Simulator
        </span>
        <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight mb-2">
          {t('nav.whatif')}
        </h1>
        <p className="text-sm text-coastal-600">
          Slide your daily habits to see real-time impact on carbon emissions and household rupee savings before making actual changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Sliders Column */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-7 border border-beach-300 space-y-6">
          
          {/* Slider 1: AC Temperature Setpoint */}
          <div>
            <div className="flex items-center justify-between text-sm font-bold text-coastal-900 mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>AC Temperature Setpoint: {acTemp}°C</span>
              </div>
              <span className="text-xs font-semibold text-seafoam-700">
                -{acCo2Saved} kg CO₂ / day
              </span>
            </div>
            <p className="text-[11px] text-coastal-500 mb-2">
              BEE recommends 24°C–26°C. Each +1°C saves 6% power while keeping cooling comfortable with a fan.
            </p>
            <input 
              type="range" 
              min="20" 
              max="28" 
              value={acTemp} 
              onChange={(e) => setAcTemp(parseInt(e.target.value))}
              className="w-full accent-seafoam-700 cursor-pointer h-2 bg-beach-200 rounded-lg" 
            />
            <div className="flex justify-between text-[10px] text-coastal-400 font-semibold mt-1">
              <span>20°C (High Bill)</span>
              <span>24°C (Optimal)</span>
              <span>28°C (Eco Breeze)</span>
            </div>
          </div>

          {/* Slider 2: Metro Transit Shift */}
          <div>
            <div className="flex items-center justify-between text-sm font-bold text-coastal-900 mb-1">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Switch Cab Commute to Metro: {metroKm} km</span>
              </div>
              <span className="text-xs font-semibold text-seafoam-700">
                -{metroCo2Saved} kg CO₂ / day
              </span>
            </div>
            <p className="text-[11px] text-coastal-500 mb-2">
              Metro generates 75% less CO₂ per km compared to solo cab or ICE car trips.
            </p>
            <input 
              type="range" 
              min="0" 
              max="30" 
              step="5"
              value={metroKm} 
              onChange={(e) => setMetroKm(parseInt(e.target.value))}
              className="w-full accent-seafoam-700 cursor-pointer h-2 bg-beach-200 rounded-lg" 
            />
            <div className="flex justify-between text-[10px] text-coastal-400 font-semibold mt-1">
              <span>0 km</span>
              <span>15 km</span>
              <span>30 km</span>
            </div>
          </div>

          {/* Slider 3: Rooftop Solar */}
          <div>
            <div className="flex items-center justify-between text-sm font-bold text-coastal-900 mb-1">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Rooftop Solar Offset: {solarPercent}%</span>
              </div>
              <span className="text-xs font-semibold text-seafoam-700">
                -{solarCo2Saved} kg CO₂ / day
              </span>
            </div>
            <p className="text-[11px] text-coastal-500 mb-2">
              PM Surya Ghar Yojana rooftop solar slashes daytime electricity emissions down to near zero.
            </p>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="10"
              value={solarPercent} 
              onChange={(e) => setSolarPercent(parseInt(e.target.value))}
              className="w-full accent-seafoam-700 cursor-pointer h-2 bg-beach-200 rounded-lg" 
            />
            <div className="flex justify-between text-[10px] text-coastal-400 font-semibold mt-1">
              <span>0% (Grid Only)</span>
              <span>50%</span>
              <span>100% (Fully Solar)</span>
            </div>
          </div>

          {/* Slider 4: Plant-rich meals */}
          <div>
            <div className="flex items-center justify-between text-sm font-bold text-coastal-900 mb-1">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-600" />
                <span>Plant-Rich / Local Seasonal Meals: {plantMeals}/wk</span>
              </div>
              <span className="text-xs font-semibold text-seafoam-700">
                -{plantCo2Saved} kg CO₂ / day
              </span>
            </div>
            <p className="text-[11px] text-coastal-500 mb-2">
              Choosing seasonal pulses and local vegetables cuts supply chain and refrigeration emissions.
            </p>
            <input 
              type="range" 
              min="0" 
              max="14" 
              value={plantMeals} 
              onChange={(e) => setPlantMeals(parseInt(e.target.value))}
              className="w-full accent-seafoam-700 cursor-pointer h-2 bg-beach-200 rounded-lg" 
            />
            <div className="flex justify-between text-[10px] text-coastal-400 font-semibold mt-1">
              <span>0 meals</span>
              <span>7 meals/wk</span>
              <span>14 meals/wk</span>
            </div>
          </div>

        </div>

        {/* Live Simulation Results Column */}
        <div className="glass-card rounded-3xl p-6 border border-seafoam-300 bg-white/70 flex flex-col justify-between">
          
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-seafoam-700 block mb-1">
              Live Projected Impact
            </span>
            <div className="text-4xl font-black text-seafoam-800 mb-1">
              -{percentageCut}% <span className="text-base font-semibold text-coastal-600">Cut</span>
            </div>
            <p className="text-xs text-coastal-600 mb-5">
              Reduces daily emissions from {baselineKg} kg down to <strong className="text-seafoam-800">{newDailyKg} kg CO₂e</strong>.
            </p>

            {/* Comparison Mini Bar Chart */}
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9E2D5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#405B50' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#405B50' }} />
                  <RechartsTooltip formatter={(v) => [`${v} kg CO₂e`, 'Emissions']} />
                  <Bar dataKey="emissions" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Rupee & Carbon Savings */}
            <div className="p-3.5 rounded-2xl bg-seafoam-50 border border-seafoam-200 text-xs space-y-1.5 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-coastal-600 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-seafoam-700" />
                  Monthly Pocket Savings:
                </span>
                <span className="font-extrabold text-sm text-seafoam-900">₹{monthlyCostSaved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-coastal-600">Monthly CO₂ Avoided:</span>
                <span className="font-bold text-seafoam-800">{monthlyCo2Saved} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-coastal-600">Yearly Tree Offset Eqv:</span>
                <span className="font-bold text-seafoam-800">{yearlyTreesEquivalent} Trees</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setAdopted(true)}
            className={`w-full py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              adopted
                ? 'bg-seafoam-800 text-white shadow-md'
                : 'bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-md hover:scale-[1.02]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{adopted ? "Swaps Saved to Action Plan!" : "Adopt These Swaps"}</span>
          </button>

        </div>

      </div>

    </div>
  );
}

export default WhatIf;
