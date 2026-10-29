import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  TreePine, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { api } from '../api/client';

export function Progress() {
  const { t } = useTranslation();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const data = await api.getProgress();
        setProgressData(data);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading || !progressData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-seafoam-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-coastal-600">Loading your progress history...</p>
      </div>
    );
  }

  const adoptedSwapsList = [
    { name: "AC 26°C Setpoint", category: "Electricity", saved: "1.4 kg/day", date: "Adopted 7 days ago" },
    { name: "Metro Commute (15 km)", category: "Transport", saved: "3.2 kg/trip", date: "Adopted 5 days ago" },
    { name: "Covered Pot Cooking", category: "Fuel", saved: "0.3 kg/day", date: "Adopted 12 days ago" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-seafoam-600" />
          Before & After Verification
        </span>
        <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight mb-2">
          {t('nav.progress')}
        </h1>
        <p className="text-sm text-coastal-600">
          Measure verified emissions reductions against your initial baseline and track accumulated financial savings.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Baseline vs Current */}
        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">Daily Footprint</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-seafoam-800">{progressData.current_kg_daily}</span>
            <span className="text-sm font-medium text-coastal-500">kg CO₂e</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="line-through text-coastal-400">{progressData.baseline_kg_daily} kg baseline</span>
            <span className="font-bold text-seafoam-700 bg-seafoam-100 px-2 py-0.5 rounded-full flex items-center">
              <ArrowDownRight className="w-3 h-3" />
              {progressData.reduction_percentage}%
            </span>
          </div>
        </div>

        {/* Total CO2 Saved */}
        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">Total Carbon Abated</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-coastal-900">{progressData.kg_saved_total}</span>
            <span className="text-sm font-medium text-coastal-500">kg CO₂e</span>
          </div>
          <span className="text-xs text-coastal-500">
            Across 14 logged routine days
          </span>
        </div>

        {/* Rupee Savings */}
        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">Cumulative Savings</div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-black text-seafoam-800">₹{progressData.rupees_saved_total}</span>
          </div>
          <span className="text-xs text-seafoam-700 font-semibold">
            Power tariff + fuel avoided
          </span>
        </div>

        {/* Trees Equivalent */}
        <div className="glass-card p-6 rounded-3xl border border-seafoam-300 bg-seafoam-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-seafoam-800 mb-2">Sequestration Eqv</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-seafoam-800">{progressData.trees_equivalent}</span>
            <span className="text-sm font-semibold text-seafoam-700">mature trees</span>
          </div>
          <span className="text-xs text-seafoam-700">
            Annual biological absorption equivalent
          </span>
        </div>

      </div>

      {/* Main Historical Trajectory Line Chart */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-beach-300 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-bold text-lg text-coastal-900">Emissions Reduction Trajectory</h2>
            <p className="text-xs text-coastal-500 mt-0.5">Historical daily footprint vs unchanged baseline</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-beach-200 px-3 py-1.5 rounded-full border border-beach-300">
            <Calendar className="w-3.5 h-3.5 text-coastal-600" />
            <span>Last 7 Days</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData.history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E2D5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#405B50' }} />
              <YAxis domain={[0, 9]} tick={{ fontSize: 11, fill: '#405B50' }} unit=" kg" />
              <RechartsTooltip 
                formatter={(val, name) => [`${val} kg CO₂e`, name === 'actual' ? 'Actual Emissions' : 'Initial Baseline']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #D8F3DC', backgroundColor: '#FAF6F0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="baseline" 
                stroke="#C5D3CA" 
                strokeDasharray="5 5" 
                strokeWidth={2} 
                name="Baseline (No Action)" 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#2D6A4F" 
                strokeWidth={3} 
                name="Actual Emissions" 
                dot={{ r: 5, fill: '#2D6A4F' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Adopted Swaps Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-beach-300 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-coastal-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-seafoam-600" />
            Active Adopted Swaps ({progressData.adopted_swaps_count})
          </h2>
          <span className="text-xs text-seafoam-700 font-semibold">Continuous habit tracking</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {adoptedSwapsList.map((swap, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-beach-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-coastal-400 block mb-1">
                {swap.category}
              </span>
              <h4 className="font-bold text-sm text-coastal-900 mb-1">{swap.name}</h4>
              <div className="text-xs font-semibold text-seafoam-700 mb-1">Saved: {swap.saved}</div>
              <span className="text-[11px] text-coastal-400 block">{swap.date}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Progress;
