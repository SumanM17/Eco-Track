import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Medal, 
  Flame, 
  Award, 
  Crown, 
  TrendingDown, 
  Sparkles,
  Zap,
  Car,
  ShieldCheck
} from 'lucide-react';

export function Leaderboard() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('weekly'); // weekly | college | national

  const leaderboardData = [
    { rank: 1, name: "Priya S.", city: "Bengaluru", reductionKg: 18.4, streak: 14, badge: "Metro Maven", isUser: false },
    { rank: 2, name: "Arjun Rao", city: "Hyderabad", reductionKg: 16.2, streak: 11, badge: "AC Optimizer", isUser: false },
    { rank: 3, name: "Aditi Sharma", city: "Delhi", reductionKg: 14.8, streak: 9, badge: "Solar Champion", isUser: false },
    { rank: 4, name: "You (Hack Fest Demo)", city: "Campus", reductionKg: 12.5, streak: 7, badge: "Eco Explorer", isUser: true },
    { rank: 5, name: "Karthik V.", city: "Chennai", reductionKg: 11.0, streak: 6, badge: "Zero Waste Hero", isUser: false },
    { rank: 6, name: "Sneha Patel", city: "Ahmedabad", reductionKg: 9.7, streak: 5, badge: "Cycle Commuter", isUser: false },
  ];

  const badges = [
    { name: "Metro Maven", desc: "Took public transit 10+ times", icon: Car, earned: true },
    { name: "AC Optimizer", desc: "Maintained 26°C setpoint for 7 days", icon: Zap, earned: true },
    { name: "Eco Explorer", desc: "Logged routine in 2+ Indian languages", icon: Sparkles, earned: true },
    { name: "Zero Waste Champion", desc: "100% kitchen waste segregated for 14 days", icon: ShieldCheck, earned: false },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <Trophy className="w-3.5 h-3.5 text-seafoam-600" />
            Community Benchmark & Leaderboards
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {t('nav.leaderboard')}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            Compare your emissions reductions with peers across your college, city, and nationwide.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-beach-200 rounded-full border border-beach-300">
          {['weekly', 'college', 'national'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                filter === tab
                  ? 'bg-seafoam-700 text-white shadow-sm'
                  : 'text-coastal-700 hover:text-coastal-900'
              }`}
            >
              {tab === 'weekly' ? 'This Week' : tab === 'college' ? 'Hostel / College' : 'Pan-India'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {leaderboardData.slice(0, 3).map((item, idx) => {
          const podiumStyles = [
            { border: 'border-amber-300 bg-amber-50/50', crown: 'text-amber-500', title: '1st Place' },
            { border: 'border-slate-300 bg-slate-50/50', crown: 'text-slate-400', title: '2nd Place' },
            { border: 'border-amber-600/30 bg-orange-50/40', crown: 'text-amber-700', title: '3rd Place' }
          ];
          const style = podiumStyles[idx];

          return (
            <div 
              key={item.rank} 
              className={`glass-card p-6 rounded-3xl border ${style.border} text-center relative overflow-hidden`}
            >
              <div className="w-12 h-12 rounded-full mx-auto mb-3 bg-white shadow-md flex items-center justify-center font-black text-lg text-coastal-900 border border-beach-200">
                <Crown className={`w-6 h-6 ${style.crown}`} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-1">{style.title}</div>
              <h3 className="font-bold text-lg text-coastal-900">{item.name}</h3>
              <p className="text-xs text-coastal-500 mb-3">{item.city}</p>
              
              <div className="p-2.5 rounded-2xl bg-white/80 border border-beach-200 flex justify-around items-center text-xs">
                <div>
                  <div className="font-black text-seafoam-700">{item.reductionKg} kg</div>
                  <div className="text-[10px] text-coastal-500">Reduced</div>
                </div>
                <div className="h-6 w-px bg-beach-200" />
                <div>
                  <div className="font-black text-coral-600 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-coral-500" />
                    {item.streak}d
                  </div>
                  <div className="text-[10px] text-coastal-500">Streak</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Leaderboard Table */}
      <div className="glass-card rounded-3xl border border-beach-300 shadow-sm overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-beach-200 flex items-center justify-between">
          <h2 className="font-bold text-base text-coastal-900">Rankings & Impact Metrics</h2>
          <span className="text-xs text-coastal-500 font-medium">Updated every midnight</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-beach-200/60 text-xs font-bold uppercase tracking-wider text-coastal-600">
              <tr>
                <th className="py-3 px-4 sm:px-6">Rank</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4 text-right">CO₂e Reduced</th>
                <th className="py-3 px-4 text-center">Active Streak</th>
                <th className="py-3 px-4 sm:px-6 text-center">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beach-200">
              {leaderboardData.map((row) => (
                <tr 
                  key={row.rank}
                  className={`transition-colors ${
                    row.isUser ? 'bg-seafoam-100/60 font-semibold' : 'hover:bg-beach-50/50'
                  }`}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-coastal-800">
                    #{row.rank}
                  </td>
                  <td className="py-3.5 px-4 text-coastal-900 flex items-center gap-2">
                    {row.name}
                    {row.isUser && (
                      <span className="text-[10px] bg-seafoam-700 text-white px-2 py-0.5 rounded-full font-bold">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-coastal-600 text-xs">{row.city}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-seafoam-700">
                    {row.reductionKg} kg
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-coral-600">
                      <Flame className="w-3.5 h-3.5 fill-coral-500" />
                      {row.streak}d
                    </span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-center">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-beach-300 text-coastal-700 shadow-xs">
                      {row.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badges Showcase Section */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-beach-300 shadow-sm">
        <h2 className="text-lg font-bold text-coastal-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-seafoam-600" />
          Earned Badges & Climate Achievements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div 
                key={b.name}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  b.earned ? 'border-seafoam-300 bg-seafoam-50/50 shadow-xs' : 'border-beach-300 bg-beach-100/50 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  b.earned ? 'bg-seafoam-600 text-white' : 'bg-beach-300 text-coastal-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-coastal-900 mb-1">{b.name}</h4>
                <p className="text-[11px] text-coastal-600 leading-tight">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Leaderboard;
