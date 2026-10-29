import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingDown, 
  IndianRupee, 
  TreePine, 
  Smartphone, 
  Car, 
  Zap,
  Flame,
  Trash2,
  Sparkles, 
  HelpCircle, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Info, 
  RotateCcw,
  Sliders,
  Volume2,
  X,
  Coins,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { api } from '../api/client';

export function Dashboard() {
  const { t, i18n } = useTranslation();

  const [calcData, setCalcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [explainMode, setExplainMode] = useState('student'); // kid | student | expert
  const [explanation, setExplanation] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);

  // Bill scan state
  const [showBillModal, setShowBillModal] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [billScanResult, setBillScanResult] = useState(null);
  const [billScanning, setBillScanning] = useState(false);

  // Methodology modal state
  const [showMethodology, setShowMethodology] = useState(false);

  // Load activities & calculate
  useEffect(() => {
    const fetchCalculation = async () => {
      setLoading(true);
      let activities = [];
      const saved = localStorage.getItem('carbonkatha_current_activities');
      if (saved) {
        try {
          activities = JSON.parse(saved);
        } catch {
          activities = [];
        }
      }

      if (!activities || activities.length === 0) {
        activities = [
          { category: 'electricity', item: '1.5-ton Split AC', value: 4.0, unit: 'hours', frequency: 'daily', confidence: 0.95 },
          { category: 'transport', item: 'Delhi Metro', value: 15.0, unit: 'km', frequency: 'daily', confidence: 0.92 },
          { category: 'fuel', item: 'LPG Stove Cooking', value: 0.5, unit: 'hours', frequency: 'daily', confidence: 0.85 },
          { category: 'electricity', item: 'Ceiling Fan', value: 8.0, unit: 'hours', frequency: 'daily', confidence: 0.88 },
        ];
      }

      try {
        const result = await api.calculate(activities);
        setCalcData(result);
      } catch (e) {
        console.warn('Calculation error, using mock:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCalculation();
  }, []);

  // Fetch explanation when mode or language changes
  useEffect(() => {
    if (!calcData) return;
    const fetchExplanation = async () => {
      setExplainLoading(true);
      try {
        const res = await api.explain(calcData.breakdown, explainMode, i18n.language);
        setExplanation(res.explanation || '');
      } catch (err) {
        console.error('Explanation error:', err);
      } finally {
        setExplainLoading(false);
      }
    };

    fetchExplanation();
  }, [calcData, explainMode, i18n.language]);

  // Handle Bill Scan
  const handleBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBillFile(file);
    setBillScanning(true);
    setBillScanResult(null);

    try {
      const result = await api.scanBill(file);
      setBillScanResult(result);
    } catch (err) {
      console.error('Bill scan failed:', err);
    } finally {
      setBillScanning(false);
    }
  };

  // Download PDF/JSON report
  const handleDownloadReport = () => {
    const reportData = {
      appName: "EcoTrack",
      timestamp: new Date().toISOString(),
      language: i18n.language,
      calculation: calcData,
      explanation: explanation
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EcoTrack_Audit_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !calcData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Calculating your carbon breakdown...</p>
      </div>
    );
  }

  // Format data for Recharts Pie & Bar
  const pieData = (calcData.breakdown || []).map((b) => ({
    name: b.label || b.category,
    value: b.kg,
    color: b.color || '#2D6A4F'
  }));

  const barComparisonData = [
    { category: 'Electricity', user: calcData.breakdown.find(b => b.category === 'electricity')?.kg || 0, nationalAvg: 2.8 },
    { category: 'Transport', user: calcData.breakdown.find(b => b.category === 'transport')?.kg || 0, nationalAvg: 1.6 },
    { category: 'Fuel', user: calcData.breakdown.find(b => b.category === 'fuel')?.kg || 0, nationalAvg: 0.7 },
    { category: 'Waste', user: calcData.breakdown.find(b => b.category === 'waste')?.kg || 0, nationalAvg: 0.4 },
  ];

  const getCategoryData = (cat) => {
    const item = calcData.breakdown?.find(b => b.category === cat);
    return item || { kg: 0, percentage: 0, label: cat };
  };

  const elecData = getCategoryData('electricity');
  const transData = getCategoryData('transport');
  const fuelData = getCategoryData('fuel');
  const wasteData = getCategoryData('waste');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* 1. Header & Overview Section */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('dashboard.cea_notice', 'CEA Grid Factor: 0.820 kg CO₂e / kWh')}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {t('nav.dashboard', 'EcoTrack Dashboard')}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {t('dashboard.subtitle', 'Real-time carbon emissions tracking based on CEA Grid Emission Factor v19 (0.820 kg CO₂e/kWh).')}
            </p>
          </div>

          {/* Action Buttons: Bill Scan & Report Download */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBillModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs transition-all"
            >
              <UploadCloud className="w-4 h-4 text-emerald-700" />
              <span>{t('evidence.upload_title', 'Scan Power Bill')}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>{t('common.download', 'Export Audit Report')}</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics: Total Emissions Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          
          {/* Main Total Metric */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {t('dashboard.monthly_total', 'Total Carbon Emissions')}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100 border border-emerald-700">
                Range: {calcData.range?.min_kg} - {calcData.range?.max_kg} kg
              </span>
            </div>
            <div className="my-2">
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
                {calcData.total_kg}
                <span className="text-lg font-semibold text-emerald-300">{t('common.kg_co2e', 'kg CO₂e / day')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-200 pt-3 border-t border-emerald-800/80 mt-2">
              <span>Monthly Projected: <strong className="text-white">~{calcData.monthly_projected_kg} kg</strong></span>
              <span>Estimated Cost: <strong className="text-white">₹{calcData.cost_incurred_inr}</strong></span>
            </div>
          </div>

          {/* Top Emitter */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('dashboard.highest_source', 'Top Contributor')}</span>
              <PieIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div className="my-2">
              <div className="text-xl font-bold text-slate-900 truncate">
                {calcData.biggest_source?.item || 'Air Conditioning'}
              </div>
              <span className="text-xs text-amber-700 font-bold block mt-1">
                {calcData.biggest_source?.percentage}% of total footprint
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 truncate">
              {calcData.biggest_source?.tip || 'Opt for eco settings'}
            </p>
          </div>

          {/* Trees to Offset */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">{t('dashboard.trees_equiv', 'Sequestration Target')}</span>
              <TreePine className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-emerald-900">
                {calcData.equivalents?.trees_needed} <span className="text-sm font-semibold text-emerald-700">trees/yr</span>
              </div>
              <span className="text-xs text-emerald-700 block mt-1">
                Equivalent to {calcData.equivalents?.smartphones_charged} phone charges
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-800 pt-2 border-t border-emerald-200/60">
              Offset target for net neutrality
            </div>
          </div>

        </div>
      </section>

      {/* 2. Category Statistics Section: Electricity, Transport, Fuel, Waste */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Activity Breakdown by Sector</h2>
            <p className="text-xs text-slate-500">Separated statistics for core emission streams</p>
          </div>
          <button
            onClick={() => setShowMethodology(true)}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Calculation Factors</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Electricity Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {elecData.percentage}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('log.category_electricity', 'Electricity')}</h3>
            <div className="text-2xl font-black text-slate-900 my-1">
              {elecData.kg} <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              Factor: 0.82 kg/kWh (CEA Grid v19)
            </p>
          </div>

          {/* Transport Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {transData.percentage}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('log.category_transport', 'Transportation')}</h3>
            <div className="text-2xl font-black text-slate-900 my-1">
              {transData.kg} <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              Includes metro, two-wheeler, or car
            </p>
          </div>

          {/* Fuel / Cooking Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {fuelData.percentage}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('log.category_fuel', 'Cooking & Fuel')}</h3>
            <div className="text-2xl font-black text-slate-900 my-1">
              {fuelData.kg} <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              LPG cylinder & stove baseline
            </p>
          </div>

          {/* Waste Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Trash2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {wasteData.percentage}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('log.category_waste', 'Waste Management')}</h3>
            <div className="text-2xl font-black text-slate-900 my-1">
              {wasteData.kg} <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              IPCC Tier-1 municipal baseline
            </p>
          </div>

        </div>
      </section>

      {/* 3. Analytics Section: Sector Donut Chart + National Benchmark Comparison */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sector Donut Chart */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Emissions by Sector</h3>
              <p className="text-xs text-slate-500">Proportional share of your daily routine</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              4 Categories
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
            {calcData.breakdown.map((item) => (
              <div key={item.category} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.label}:</span>
                <span className="font-bold text-slate-900">{item.kg} kg ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* National Benchmark Bar Chart */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">You vs Urban Indian Average</h3>
              <p className="text-xs text-slate-500">Benchmarked against Ministry of Power data</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              National Index
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip 
                  formatter={(value, name) => [`${value} kg CO₂e`, name === 'user' ? 'Your Footprint' : 'Urban Indian Avg']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="user" fill="#1B4332" radius={[6, 6, 0, 0]} name="user" />
                <Bar dataKey="nationalAvg" fill="#74C69D" radius={[6, 6, 0, 0]} name="nationalAvg" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#1B4332]" />
              <span className="text-slate-800">Your Current Footprint</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#74C69D]" />
              <span className="text-slate-600">Urban National Average</span>
            </div>
          </div>
        </div>

      </section>

      {/* 4. AI Intelligent Explanation & Voice Card */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('dashboard.ai_explain_title', 'AI Explanation (Indian Context)')}
              </h2>
              <span className="text-xs text-slate-500">Customized insights tailored to your comprehension level</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'kid', label: t('dashboard.toggle_kid', '🧒 Kid') },
              { id: 'student', label: t('dashboard.toggle_student', '🎓 Student') },
              { id: 'expert', label: t('dashboard.toggle_expert', '🔬 Expert (ESG)') },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setExplainMode(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  explainMode === m.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Explanation Content */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
          {explainLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Generating explanation in {i18n.language.toUpperCase()}...</span>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-slate-800 leading-relaxed font-normal flex-1">
                  {explanation}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(explanation);
                      const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN' };
                      utterance.lang = langMap[i18n.language] || 'en-IN';
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs transition-all flex-shrink-0"
                  title="Listen in regional voice"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('chat.voice_speak', 'Listen')}</span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  Recommended Action: {calcData.biggest_source?.tip}
                </span>
                <span className="text-[11px] text-slate-500 uppercase">
                  Language: {i18n.language}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Carbon Reduction Progress & Rewards Summary */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Eco Rewards Active</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Ready to Reduce and Earn?</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every green commute and energy-efficient choice is verified with SHA-256 integrity and earns verified Carbon Coins redeemable for metro passes and retail partner vouchers across India.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/actions"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all"
          >
            <span>Explore Action List</span>
          </Link>
          <Link
            to="/rewards"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all"
          >
            <span>Redeem Carbon Coins</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Electricity Bill Scanner Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-lg text-slate-900">
                  Scan Electricity Bill (Vision OCR)
                </h3>
              </div>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Upload a photo or PDF of your DISCOM bill (e.g. BSES, TNEB, Bescom, TSSPDCL). Our vision model extracts units in kWh and converts them into precise carbon footprint data.
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mb-4 bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleBillUpload}
                id="bill-upload-input"
                className="hidden"
              />
              <label htmlFor="bill-upload-input" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  {billFile ? billFile.name : 'Click to choose bill photo'}
                </span>
                <span className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP</span>
              </label>
            </div>

            {billScanning && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 py-3">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Reading bill units and tariff using Vision OCR...</span>
              </div>
            )}

            {billScanResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 mb-4">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>DISCOM: {billScanResult.discom_name}</span>
                  <span className="text-emerald-800">{billScanResult.billing_month}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200">
                  <div>
                    <span className="text-slate-500">Units Billed:</span>
                    <div className="font-black text-sm text-slate-900">{billScanResult.units_kwh} kWh</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Carbon Footprint:</span>
                    <div className="font-black text-sm text-emerald-900">{billScanResult.estimated_emissions_kg} kg CO₂e</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Confidence: {Math.round(billScanResult.confidence * 100)}%</span>
                  <span className="text-emerald-800 font-semibold">Verified Calculation</span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowBillModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-lg text-slate-900">
                  How is this Footprint Calculated?
                </h3>
              </div>
              <button onClick={() => setShowMethodology(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              EcoTrack adheres strictly to Indian governmental and international climate emission accounting baselines:
            </p>

            <div className="space-y-2.5 text-xs text-slate-700 mb-6">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">⚡ Electricity: </span>
                <span>0.82 kg CO₂e / kWh (Central Electricity Authority User Guide v19, 2024 Pan-India Weighted Average).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">🚗 Commute: </span>
                <span>Petrol car (0.170 kg/p-km), Two-wheeler (0.045 kg/p-km), Electric Metro (0.015 kg/p-km).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">🔥 Cooking: </span>
                <span>LPG combustion at 2.98 kg CO₂e / kg (~0.25 kg LPG per hour cooking).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">🗑️ Solid Waste: </span>
                <span>0.50 kg CO₂e / kg (IPCC Tier-1 Landfill Methane Emission Baseline).</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowMethodology(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
