import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Coins, 
  Award, 
  Gift, 
  Tag, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';
import { api } from '../api/client';

export function Rewards() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redemption state
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      const res = await api.getRewardsDashboard();
      setData(res);
    } catch (e) {
      console.warn('Failed to load rewards dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, []);

  const handleRedeem = async () => {
    if (!selectedReward) return;
    setRedeeming(true);
    try {
      const res = await api.redeemCoupon(selectedReward.id);
      setRedeemSuccess(res);
      setSelectedReward(null);
      await loadRewardsData();
    } catch (err) {
      alert(`Redemption error: ${err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-seafoam-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-coastal-600">Loading Rewards Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <Coins className="w-3.5 h-3.5 text-seafoam-600" />
            {t('rewards.title', 'Verified Carbon Coins & Green Marketplace')}
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {t('nav.rewards', 'Rewards')}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            {t('rewards.subtitle', 'Redeem verified carbon reduction points for public transit passes, EV fast-charging discounts, and eco-coupons.')}
          </p>
        </div>
      </div>

      {/* Hero Balance & Tier Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-seafoam-300 shadow-md mb-8 bg-gradient-to-br from-white via-seafoam-50/40 to-beach-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-300 flex items-center justify-center shadow-inner flex-shrink-0">
              <Coins className="w-9 h-9 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-coastal-500">{t('rewards.balance_title', 'Available Balance')}</span>
              <div className="text-4xl font-black text-coastal-900">
                {data.balance} <span className="text-base font-bold text-seafoam-700">{t('common.coins', 'Carbon Coins')}</span>
              </div>
              <span className="text-xs text-coastal-600">{t('rewards.terms', 'Earned via verified utility bills & transit swaps')}</span>
            </div>
          </div>

          <div className="w-full sm:w-72 bg-white/80 p-4 rounded-2xl border border-beach-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-coastal-800">{t('rewards.tier_title', 'Rewards Tier')}: {data.tier}</span>
              <span className="text-[11px] font-semibold text-seafoam-700">{data.progress_pct}% to next</span>
            </div>
            <div className="w-full bg-beach-200 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-seafoam-600 h-full rounded-full transition-all duration-700" style={{ width: `${data.progress_pct}%` }} />
            </div>
            <p className="text-[10px] text-coastal-500 leading-tight">
              Perk: {data.perk}
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {redeemSuccess && (
        <div className="mb-8 p-5 rounded-3xl bg-seafoam-50 border border-seafoam-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-seafoam-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-coastal-900">Coupon Successfully Redeemed!</div>
              <div className="text-xs text-coastal-600">Voucher code: <strong className="font-mono text-seafoam-800">{redeemSuccess.coupon_code}</strong> ({redeemSuccess.title})</div>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(redeemSuccess.coupon_code)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white text-coastal-900 border border-beach-300 hover:bg-beach-50"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedCode === redeemSuccess.coupon_code ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>
      )}

      {/* Rewards Catalog Grid */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-coastal-900">Partner Rewards Catalog</h2>
            <p className="text-xs text-coastal-500">Working demo coupon marketplace with real partner voucher shapes</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-beach-200 text-coastal-700 border border-beach-300">
            {data.catalog?.length} Coupons Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.catalog.map((reward) => {
            const canAfford = data.balance >= reward.coin_cost;

            return (
              <div
                key={reward.id}
                className="glass-card rounded-3xl p-6 border border-beach-300 hover:border-beach-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coastal-500 bg-beach-200 px-2.5 py-0.5 rounded-full">
                      {reward.provider}
                    </span>
                    <div className="flex items-center gap-1 font-black text-sm text-amber-600">
                      <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{reward.coin_cost} Coins</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-coastal-900 mb-1">{reward.title}</h3>
                  <p className="text-xs text-coastal-600 mb-3">{reward.discount_description}</p>
                </div>

                <div>
                  <div className="text-[10px] text-coastal-400 mb-3">
                    Valid for {reward.expiry_days} days • Demo Partner Voucher
                  </div>

                  <button
                    onClick={() => setSelectedReward(reward)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      canAfford
                        ? 'bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-sm'
                        : 'bg-beach-200 text-coastal-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{canAfford ? "Redeem Reward" : `Need ${reward.coin_cost - data.balance} more coins`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Redeemed Vouchers Wallet */}
      {data.my_vouchers && data.my_vouchers.length > 0 && (
        <div className="glass-card rounded-3xl border border-beach-300 shadow-sm overflow-hidden mb-10">
          <div className="p-4 sm:p-6 border-b border-beach-200 flex items-center justify-between">
            <h3 className="font-bold text-base text-coastal-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-seafoam-600" />
              My Active Vouchers & Coupons ({data.my_vouchers.length})
            </h3>
            <span className="text-xs text-coastal-500">Ready to use at checkout</span>
          </div>

          <div className="divide-y divide-beach-200">
            {data.my_vouchers.map((v) => (
              <div key={v.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-beach-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-coastal-900">{v.title}</span>
                    <span className="text-[10px] bg-seafoam-100 text-seafoam-800 font-bold px-2 py-0.5 rounded-full capitalize">{v.status}</span>
                  </div>
                  <p className="text-xs text-coastal-600">{v.discount_description} • Provider: {v.provider}</p>
                  <span className="text-[10px] text-coastal-400">Expires: {v.expires_at?.split(' ')[0]}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="font-mono font-bold text-sm bg-white px-3 py-1.5 rounded-xl border border-beach-300 text-coastal-900 shadow-inner">
                    {v.coupon_code}
                  </div>
                  <button
                    onClick={() => copyToClipboard(v.coupon_code)}
                    className="p-2 rounded-xl bg-beach-200 hover:bg-beach-300 text-coastal-700"
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-coastal-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-beach-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-coastal-900">Confirm Redemption</h3>
              <button onClick={() => setSelectedReward(null)} className="text-coastal-400 hover:text-coastal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-beach-50 border border-beach-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-coastal-500">Reward:</span>
                <span className="font-bold text-coastal-900">{selectedReward.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coastal-500">Provider:</span>
                <span className="font-bold text-coastal-900">{selectedReward.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coastal-500">Coins Deducted:</span>
                <span className="font-black text-amber-600">{selectedReward.coin_cost} Coins</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-beach-200">
                <span className="text-coastal-500">Balance After:</span>
                <span className="font-bold text-seafoam-800">{data.balance - selectedReward.coin_cost} Coins</span>
              </div>
            </div>

            <p className="text-[11px] text-coastal-500 mb-6">
              This action atomically writes to the Carbon Coins ledger and issues an auditable digital voucher.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-beach-200">
              <button onClick={() => setSelectedReward(null)} className="px-4 py-2 text-xs font-semibold text-coastal-600">Cancel</button>
              <button
                disabled={redeeming}
                onClick={handleRedeem}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-seafoam-700 text-white shadow-sm disabled:opacity-50"
              >
                {redeeming ? "Deducting Coins..." : "Confirm & Redeem"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Rewards;
