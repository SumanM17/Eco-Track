import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Home, 
  Sparkles, 
  TrendingDown, 
  Zap, 
  CheckCircle2, 
  Coins, 
  Plus, 
  ShieldCheck, 
  AlertCircle,
  X 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { api } from '../api/client';

export function Family() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      const res = await api.getFamilyDashboard();
      setData(res);
    } catch (e) {
      console.warn('Failed to load family dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyData();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      await api.addFamilyMember(newMemberName, newMemberEmail);
      setShowAddMember(false);
      setNewMemberName('');
      setNewMemberEmail('');
      await loadFamilyData();
    } catch (err) {
      alert(`Error adding member: ${err.message}`);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-seafoam-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-coastal-600">Loading Household Carbon Hub...</p>
      </div>
    );
  }

  const pieData = (data.breakdown || []).map((b) => ({
    name: b.label || b.category,
    value: b.kg,
    color: b.color || '#52B788',
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <Home className="w-3.5 h-3.5 text-seafoam-600" />
            {t('family.title', 'Family & Household Carbon Hub')}
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {data.household_name}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            {t('family.subtitle', 'Tracking collective household footprint with deduplicated shared utility bills and collaborative reduction goals.')}
          </p>
        </div>

        <button
          onClick={() => setShowAddMember(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('family.add_member_btn', '+ Add Household Member')}</span>
        </button>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">{t('family.title', 'Total Household Footprint')}</div>
          <div className="text-3xl font-black text-seafoam-800 mb-1">
            {data.total_emissions_kg} <span className="text-sm font-semibold text-coastal-600">{t('common.kg_co2e', 'kg CO₂e')}</span>
          </div>
          <span className="text-xs text-coastal-500">Across all {data.member_count} household members</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">{t('family.per_person_title', 'Per-Person Average')}</div>
          <div className="text-3xl font-black text-coastal-900 mb-1">
            {data.per_person_kg} <span className="text-sm font-semibold text-coastal-600">kg/person</span>
          </div>
          <span className="text-xs text-seafoam-700 font-semibold">Below Indian urban household avg</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">{t('family.shared_bills_title', 'Shared Utility Bills')}</div>
          <div className="text-3xl font-black text-seafoam-700 mb-1">
            {data.shared_records_count} Bills
          </div>
          <span className="text-xs text-coastal-500">{t('family.deduplication_note', 'Deduplicated whole-home records')}</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-seafoam-300 bg-seafoam-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-seafoam-800 mb-2">{t('rewards.balance_title', 'Household Carbon Coins')}</div>
          <div className="text-3xl font-black text-seafoam-800 mb-1 flex items-center gap-1.5">
            <Coins className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>{data.coin_balance}</span>
          </div>
          <span className="text-xs text-seafoam-700 font-semibold">Shared family rewards pool</span>
        </div>

      </div>

      {/* Main Grid: Breakdown + Collective Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Household Breakdown Donut */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-beach-300">
          <h3 className="font-bold text-base text-coastal-900 mb-1">Household Emissions by Source</h3>
          <p className="text-xs text-coastal-500 mb-4">Electricity, kitchen LPG, and shared waste</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                </Pie>
                <RechartsTooltip formatter={(val) => [`${val} kg CO₂e`, 'Emissions']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-beach-200">
            {data.breakdown.map((item) => (
              <div key={item.category} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-coastal-600 truncate">{item.label}:</span>
                <span className="font-bold text-coastal-900">{item.kg} kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collective Household Reduction Targets */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-beach-300 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-coastal-900 mb-1">Collective Reduction Targets</h3>
            <p className="text-xs text-coastal-500 mb-4">Family climate goals tracked across billing cycles</p>

            <div className="space-y-4">
              {data.household_goals.map((g, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-beach-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-coastal-900">{g.title}</span>
                    <span className="text-[11px] font-bold text-seafoam-700 bg-seafoam-100 px-2.5 py-0.5 rounded-full">{g.target}</span>
                  </div>
                  <div className="w-full bg-beach-200 rounded-full h-2 mb-1.5 overflow-hidden">
                    <div className="bg-seafoam-600 h-full rounded-full transition-all duration-700" style={{ width: `${g.progress_pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-coastal-500 font-semibold">
                    <span>Progress: {g.progress_pct}%</span>
                    <span className="capitalize text-seafoam-700 font-bold">{g.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-seafoam-50 border border-seafoam-200 text-xs text-seafoam-900 mt-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-seafoam-600 flex-shrink-0" />
            <span>Anti-Duplication Guard: Electricity bills uploaded by parents automatically sync to all members without multiplying the footprint.</span>
          </div>
        </div>

      </div>

      {/* Household Members Table */}
      <div className="glass-card rounded-3xl border border-beach-300 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-beach-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-coastal-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-seafoam-600" />
            Household Members ({data.members.length})
          </h3>
          <span className="text-xs text-coastal-500 font-medium">Shared profile contributions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-beach-200/60 font-bold uppercase tracking-wider text-coastal-600">
              <tr>
                <th className="py-3 px-4 sm:px-6">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beach-200">
              {data.members.map((m) => (
                <tr key={m.id} className="hover:bg-beach-50/50 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-coastal-900">{m.name}</td>
                  <td className="py-3.5 px-4 text-coastal-600 capitalize">{m.role}</td>
                  <td className="py-3.5 px-4 text-coastal-500">{m.joined_at?.split(' ')[0] || 'Active'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-seafoam-100 text-seafoam-800 border border-seafoam-200">
                      Active Contributor
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 bg-coastal-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-beach-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-coastal-900">Add Household Member</h3>
              <button onClick={() => setShowAddMember(false)} className="text-coastal-400 hover:text-coastal-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-beach-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="member@sharma.in"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-beach-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-beach-200">
                <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 text-xs font-semibold text-coastal-600">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-full text-xs font-bold bg-seafoam-700 text-white shadow-sm">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Family;
