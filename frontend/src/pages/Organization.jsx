import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  FileText, 
  Download, 
  Plus, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Layers, 
  TrendingDown, 
  Info,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { api } from '../api/client';

export function Organization() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);

  // New facility form
  const [facName, setFacName] = useState('');
  const [facLoc, setFacLoc] = useState('');
  const [facType, setFacType] = useState('branch_office');
  const [facArea, setFacArea] = useState(4000);

  const loadOrgData = async () => {
    try {
      setLoading(true);
      const res = await api.getOrgDashboard();
      setData(res);
    } catch (e) {
      console.warn('Failed to load org dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, []);

  const handleGenerateReport = async () => {
    try {
      const rep = await api.getOrgReport();
      setReport(rep);
      setShowReportModal(true);
    } catch (err) {
      alert(`Report generation failed: ${err.message}`);
    }
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    if (!facName.trim()) return;
    try {
      await api.createFacility(facName, facLoc, facType, parseFloat(facArea) || 3000);
      setShowAddFacility(false);
      setFacName('');
      setFacLoc('');
      await loadOrgData();
    } catch (err) {
      alert(`Error creating facility: ${err.message}`);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-seafoam-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-coastal-600">Loading Organization Portal...</p>
      </div>
    );
  }

  const facilityBarData = (data.branch_comparison || []).map((b) => ({
    name: b.name.split(' ')[0],
    emissions: b.emissions_kg,
    type: b.type,
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <Building2 className="w-3.5 h-3.5 text-seafoam-600" />
            {t('organization.title', 'Corporate ESG & Carbon Accounting')}
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {data.organization_name}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            {t('auth.industry_category', 'Industry')}: {data.industry} • {t('auth.employee_count', 'Employees')}: {data.employee_count} • {t('auth.city_label', 'City')}: {data.city}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddFacility(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white text-coastal-800 border border-beach-300 hover:bg-beach-100 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t('organization.facilities_title', 'Branch')}</span>
          </button>

          <button
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>{t('organization.download_report_btn', 'Download ESG Audit Report')}</span>
          </button>
        </div>
      </div>

      {/* Corporate Scopes & KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">Total Corporate Footprint</div>
          <div className="text-3xl font-black text-seafoam-800 mb-1">
            {roundMt(data.total_emissions_kg)} <span className="text-sm font-semibold text-coastal-600">MT CO₂e</span>
          </div>
          <span className="text-xs text-coastal-500">{data.total_emissions_kg} kg total recorded</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">Scope 2 (Electricity)</div>
          <div className="text-3xl font-black text-coastal-900 mb-1">
            {roundMt(data.scopes?.scope_2_electricity_kg)} <span className="text-sm font-semibold text-coastal-600">MT CO₂e</span>
          </div>
          <span className="text-xs text-coastal-500">Grid draw via CEA v19 factor (0.82)</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-beach-300">
          <div className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-2">Emissions per Employee</div>
          <div className="text-3xl font-black text-seafoam-700 mb-1">
            {data.emissions_per_employee_kg} <span className="text-sm font-semibold text-coastal-600">kg/emp</span>
          </div>
          <span className="text-xs text-seafoam-700 font-semibold">Normalized headcount metric</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-seafoam-300 bg-seafoam-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-seafoam-800 mb-2">Data Quality & Verification</div>
          <div className="text-3xl font-black text-seafoam-800 mb-1">
            {data.verification_ratio_pct}%
          </div>
          <span className="text-xs text-seafoam-700 font-semibold">Backed by utility DISCOM bills</span>
        </div>

      </div>

      {/* Branch Comparisons Bar Chart */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-beach-300 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-coastal-900">Multi-Branch Emissions Comparison</h3>
            <p className="text-xs text-coastal-500">Cross-facility carbon footprint breakdown (kg CO₂e)</p>
          </div>
          <span className="text-xs text-coastal-600 font-semibold bg-beach-200 px-3 py-1 rounded-full">
            {data.facilities?.length} Monitored Facilities
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={facilityBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E2D5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#405B50' }} />
              <YAxis tick={{ fontSize: 11, fill: '#405B50' }} />
              <RechartsTooltip formatter={(v) => [`${v} kg CO₂e`, 'Emissions']} />
              <Bar dataKey="emissions" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="glass-card rounded-3xl border border-beach-300 shadow-sm overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-beach-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-coastal-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-seafoam-600" />
            Registered Facilities & Branches
          </h3>
          <span className="text-xs text-coastal-500 font-medium">Telemetry by building</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-beach-200/60 font-bold uppercase tracking-wider text-coastal-600">
              <tr>
                <th className="py-3 px-4 sm:px-6">Facility Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Area (sqft)</th>
                <th className="py-3 px-4 sm:px-6 text-right">Total Emissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beach-200">
              {data.branch_comparison.map((f) => (
                <tr key={f.facility_id} className="hover:bg-beach-50/50 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-coastal-900">{f.name}</td>
                  <td className="py-3.5 px-4 text-coastal-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-coastal-400" />
                    <span>{f.location}</span>
                  </td>
                  <td className="py-3.5 px-4 text-coastal-600 capitalize">{f.type.replace('_', ' ')}</td>
                  <td className="py-3.5 px-4 text-right text-coastal-700">{f.area_sqft} sqft</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-seafoam-800">{f.emissions_kg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainability Report Modal */}
      {showReportModal && report && (
        <div className="fixed inset-0 z-50 bg-coastal-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-beach-300 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-beach-200 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-seafoam-700 bg-seafoam-100 px-2 py-0.5 rounded-full">
                  Audit Verified: {report.report_id}
                </span>
                <h2 className="text-xl font-bold text-coastal-900 mt-1">Corporate Sustainability & GHG Audit Report</h2>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-coastal-400 hover:text-coastal-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-coastal-700">
              <div className="p-4 rounded-2xl bg-beach-50 border border-beach-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-coastal-500 block">Organization:</span>
                  <span className="font-bold text-coastal-900 text-sm">{report.organization.name}</span>
                </div>
                <div>
                  <span className="text-coastal-500 block">Reporting Period:</span>
                  <span className="font-bold text-coastal-900 text-sm">{report.reporting_period}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-coastal-900 text-sm mb-2">Executive Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-seafoam-50 border border-seafoam-200">
                    <div className="font-black text-base text-seafoam-800">{report.executive_summary.total_emissions_mt_co2e} MT</div>
                    <div className="text-[10px] text-coastal-500">Total CO₂e</div>
                  </div>
                  <div className="p-3 rounded-xl bg-beach-100 border border-beach-200">
                    <div className="font-black text-base text-coastal-900">{report.executive_summary.emissions_per_employee_kg} kg</div>
                    <div className="text-[10px] text-coastal-500">Per Employee</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="font-black text-base text-emerald-800">ISO/CEA Ready</div>
                    <div className="text-[10px] text-coastal-500">Methodology</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-beach-100/70 border border-beach-200">
                <h5 className="font-bold text-coastal-900 mb-1">Methodology and Data Uncertainty Notes:</h5>
                <p className="text-[11px] text-coastal-600 leading-relaxed">
                  {report.methodology_and_uncertainty_notes}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-coastal-900 mb-1.5">Recommended Corporate Interventions:</h5>
                <ul className="list-disc list-inside space-y-1 text-coastal-600">
                  {report.recommended_interventions.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-beach-200 mt-6">
              <span className="text-[11px] text-coastal-500">Generated automatically by EcoTrack ESG Engine</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-coastal-900 text-white shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {showAddFacility && (
        <div className="fixed inset-0 z-50 bg-coastal-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-beach-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-coastal-900">Add Corporate Facility</h3>
              <button onClick={() => setShowAddFacility(false)} className="text-coastal-400 hover:text-coastal-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune R&D Center"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-beach-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">Location / Address</label>
                <input
                  type="text"
                  required
                  placeholder="Hinjewadi Phase 2, Pune"
                  value={facLoc}
                  onChange={(e) => setFacLoc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-beach-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">Facility Type</label>
                  <select
                    value={facType}
                    onChange={(e) => setFacType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-beach-300 text-xs bg-white"
                  >
                    <option value="branch_office">Branch Office</option>
                    <option value="headquarters">Headquarters</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="data_center">Data Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">Area (sqft)</label>
                  <input
                    type="number"
                    value={facArea}
                    onChange={(e) => setFacArea(e.target.value)}
                    className="w-full p-3 rounded-xl border border-beach-300 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-beach-200">
                <button type="button" onClick={() => setShowAddFacility(false)} className="px-4 py-2 text-xs font-semibold text-coastal-600">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-full text-xs font-bold bg-seafoam-700 text-white shadow-sm">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function roundMt(kg) {
  if (!kg) return "0.00";
  return (kg / 1000.0).toFixed(2);
}

export default Organization;
