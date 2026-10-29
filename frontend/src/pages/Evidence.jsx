import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Clock, 
  RotateCcw,
  Sparkles,
  Zap,
  Car,
  Trash2,
  X
} from 'lucide-react';
import { api } from '../api/client';

export function Evidence() {
  const { t, i18n } = useTranslation();

  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('electricity_bill');
  const [fileToUpload, setFileToUpload] = useState(null);

  // Confirmation modal state
  const [pendingExtraction, setPendingExtraction] = useState(null);
  const [confirmedQty, setConfirmedQty] = useState(0);
  const [confirmedUnit, setConfirmedUnit] = useState('kWh');
  const [confirming, setConfirming] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const list = await api.getEvidenceList();
      setEvidenceList(list || []);
    } catch (e) {
      console.warn('Failed to load evidence', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setFileToUpload(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploading(true);
    setSuccessBanner(null);

    try {
      const res = await api.uploadEvidence(fileToUpload, docType);
      setPendingExtraction(res);
      setConfirmedQty(res.extraction?.extracted_quantity || 100);
      setConfirmedUnit(res.extraction?.extracted_unit || 'kWh');
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      setFileToUpload(null);
    }
  };

  const handleConfirmExtraction = async () => {
    if (!pendingExtraction) return;
    setConfirming(true);
    try {
      const res = await api.confirmEvidence(
        pendingExtraction.evidence_id,
        parseFloat(confirmedQty) || 0,
        confirmedUnit
      );
      setSuccessBanner(res.message);
      setPendingExtraction(null);
      await fetchEvidence();
    } catch (err) {
      alert(`Confirmation failed: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status, isFlagged) => {
    if (isFlagged) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Under Review (Flagged)
        </span>
      );
    }
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-seafoam-100 text-seafoam-800 border border-seafoam-300">
          <CheckCircle2 className="w-3 h-3 text-seafoam-600" /> Verified (25 Coins Earned)
        </span>
      );
    }
    if (status === 'awaiting_confirmation') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-ocean-100 text-ocean-800 border border-ocean-300">
          <Clock className="w-3 h-3" /> Awaiting Confirmation
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-beach-200 text-coastal-700">
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-seafoam-600" />
            {t('evidence.anti_fraud_badge', 'SHA-256 Anti-Fraud Guard Active')}
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {t('evidence.title', 'Evidence Verification Center')}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            {t('evidence.subtitle', 'Upload utility bills, transit tickets, or receipts to verify your footprint and earn verified Carbon Coins.')}
          </p>
        </div>
      </div>

      {successBanner && (
        <div className="mb-6 p-4 rounded-2xl bg-seafoam-50 border border-seafoam-300 text-seafoam-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-seafoam-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* 8-Stage Verification Pipeline Card */}
      <div className="glass-card p-6 rounded-3xl border border-beach-300 mb-8 bg-white/70">
        <h3 className="text-xs font-bold uppercase tracking-wider text-coastal-500 mb-3">
          {t('evidence.pipeline_title', '8-Stage Verification Workflow')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[11px] font-semibold">
          {[
            { step: "1. Not Supported", desc: "Self-Reported" },
            { step: "2. Uploaded", desc: "SHA-256 Hashing" },
            { step: "3. OCR Extracted", desc: "DISCOM Telemetry" },
            { step: "4. Awaiting User", desc: "User Review" },
            { step: "5. Anti-Fraud", desc: "Duplicate Check" },
            { step: "6. Verified", desc: "Coins Awarded" },
            { step: "7. Needs Fix", desc: "Clarification" },
            { step: "8. Rejected", desc: "Invalid Record" },
          ].map((s, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-beach-100 border border-beach-200">
              <div className="text-coastal-900 font-bold">{s.step}</div>
              <div className="text-[10px] text-coastal-500 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Box */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-beach-300 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-coastal-900 mb-2">
          {t('evidence.upload_title', 'Upload Supporting Document')}
        </h2>
        <p className="text-xs text-coastal-600 mb-6">
          {t('evidence.upload_desc', 'Drag and drop electricity bills (PDF, JPG, PNG) from BSES, BESCOM, TNEB, TSSPDCL, Tata Power')}
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full p-3 rounded-xl border border-beach-300 bg-white text-sm focus:ring-2 focus:ring-seafoam-500"
              >
                <option value="electricity_bill">⚡ Electricity Bill (DISCOM kWh)</option>
                <option value="fuel_receipt">⛽ Fuel Dispensing Receipt (LPG / Petrol / Diesel)</option>
                <option value="transit_ticket">🚇 Public Transit Ticket / Metro Card Pass</option>
                <option value="waste_certificate">♻️ Waste Recycling / E-Waste Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">
                Choose Document File
              </label>
              <input
                type="file"
                required
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileSelect}
                className="w-full p-2.5 rounded-xl border border-beach-300 bg-white text-xs text-coastal-700 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-seafoam-100 file:text-seafoam-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !fileToUpload}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-xs font-bold bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-md disabled:opacity-50 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? "Analyzing with AI OCR..." : "Upload & Analyze"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {pendingExtraction && (
        <div className="fixed inset-0 z-50 bg-coastal-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-beach-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-seafoam-600" />
                <h3 className="font-bold text-lg text-coastal-900">
                  Confirm Extracted Details
                </h3>
              </div>
              <button onClick={() => setPendingExtraction(null)} className="text-coastal-400 hover:text-coastal-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pendingExtraction.is_flagged ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs mb-4 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Anti-Fraud / Duplicate Warning</div>
                  <div>{pendingExtraction.flag_reason}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-seafoam-50 border border-seafoam-300 text-seafoam-900 text-xs mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                <span>SHA-256 Checksum Passed: Verified unique authentic document.</span>
              </div>
            )}

            <div className="space-y-3 text-xs mb-6 bg-beach-50 p-4 rounded-2xl border border-beach-200">
              <div className="flex justify-between">
                <span className="text-coastal-500">Issuer / Provider:</span>
                <span className="font-bold text-coastal-900">{pendingExtraction.extraction?.issuer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coastal-500">Consumer / Ticket ID:</span>
                <span className="font-mono font-semibold text-coastal-800">{pendingExtraction.extraction?.consumer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coastal-500">Billing Period:</span>
                <span className="font-bold text-coastal-800">{pendingExtraction.extraction?.billing_start} to {pendingExtraction.extraction?.billing_end}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-beach-200">
                <span className="font-bold text-coastal-800">Confirmed Consumption:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    value={confirmedQty}
                    onChange={(e) => setConfirmedQty(e.target.value)}
                    className="w-20 p-1 rounded-lg border border-beach-300 bg-white font-bold text-center text-coastal-900"
                  />
                  <input
                    type="text"
                    value={confirmedUnit}
                    onChange={(e) => setConfirmedUnit(e.target.value)}
                    className="w-14 p-1 rounded-lg border border-beach-300 bg-white text-center text-coastal-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-beach-200">
              <button
                type="button"
                onClick={() => setPendingExtraction(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-coastal-600 hover:bg-beach-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmExtraction}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-md disabled:opacity-50"
              >
                {confirming ? "Verifying..." : "Confirm & Award +25 Coins"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verified Evidence Documents Table */}
      <div className="glass-card rounded-3xl border border-beach-300 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-beach-200 flex items-center justify-between">
          <h2 className="font-bold text-base text-coastal-900">Your Document Ledger ({evidenceList.length})</h2>
          <span className="text-xs text-coastal-500 font-medium">Validated with cryptographic hashes</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-coastal-500">Loading verified document ledger...</div>
        ) : evidenceList.length === 0 ? (
          <div className="p-12 text-center text-xs text-coastal-500">
            No evidence documents uploaded yet. Upload your first electricity bill above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-beach-200/60 font-bold uppercase tracking-wider text-coastal-600">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Document Type</th>
                  <th className="py-3 px-4">Issuer / DISCOM</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Extracted Qty</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beach-200">
                {evidenceList.map((doc) => (
                  <tr key={doc.id} className="hover:bg-beach-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-coastal-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-seafoam-700" />
                      <span>{doc.original_filename}</span>
                    </td>
                    <td className="py-3.5 px-4 text-coastal-700">{doc.issuer_name || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-coastal-500">{doc.billing_start || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right font-black text-coastal-900">
                      {doc.extracted_quantity} {doc.extracted_unit}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      {getStatusBadge(doc.verification_status, Boolean(doc.is_flagged))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Evidence;
