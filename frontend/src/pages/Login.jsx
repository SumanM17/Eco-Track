import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Building2,
  Home,
  Lock,
  Mail,
  MapPin,
  Globe2,
  Users,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Leaf
} from 'lucide-react';
import { api } from '../api/client';

export default function Login({ defaultMode = 'login' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(defaultMode); // 'login' | 'register'
  const [accountType, setAccountType] = useState('individual'); // 'individual' | 'organization' | 'family'
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Individual registration fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [prefLang, setPrefLang] = useState(i18n.language || 'en');
  const [householdSize, setHouseholdSize] = useState(3);

  // Organization registration fields
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('Software & IT Services');
  const [orgType, setOrgType] = useState('Private Limited');
  const [employeeCount, setEmployeeCount] = useState(45);
  const [sizeCategory, setSizeCategory] = useState('sme');

  // Family registration fields
  const [familyName, setFamilyName] = useState('');
  const [householdType, setHouseholdType] = useState('apartment');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError(t('auth.err_fill_all', 'Please enter both email and password.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setSuccess(t('auth.login_success', 'Login successful! Redirecting...'));
      setTimeout(() => {
        if (res.user?.account_type === 'organization') navigate('/organization');
        else if (res.user?.account_type === 'family') navigate('/family');
        else navigate('/dashboard');
        window.location.reload(); // Refresh session state
      }, 600);
    } catch (err) {
      setError(err.message || t('auth.err_invalid_creds', 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.err_pw_mismatch', 'Passwords do not match.'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.err_pw_len', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    try {
      let payload = {
        email: email.trim().toLowerCase(),
        password,
        account_type: accountType,
        city,
        state,
        preferred_language: prefLang,
      };

      if (accountType === 'individual') {
        if (!name) throw new Error(t('auth.err_enter_name', 'Please enter your full name.'));
        payload.name = name;
        payload.extra_data = { household_size: householdSize };
      } else if (accountType === 'organization') {
        if (!orgName) throw new Error(t('auth.err_enter_org', 'Please enter your organization name.'));
        payload.name = orgName;
        payload.extra_data = {
          organization_name: orgName,
          industry,
          org_type: orgType,
          employee_count: parseInt(employeeCount) || 25,
          size_category: sizeCategory,
        };
      } else if (accountType === 'family') {
        const hName = familyName || `${name || 'Sharma'} Household`;
        payload.name = hName;
        payload.extra_data = {
          household_name: hName,
          member_count: parseInt(householdSize) || 4,
          household_type: householdType,
        };
      }

      const res = await api.register(payload);
      setSuccess(t('auth.reg_success', 'Account registered successfully in PostgreSQL! Logging you in...'));
      setTimeout(() => {
        if (accountType === 'organization') navigate('/organization');
        else if (accountType === 'family') navigate('/family');
        else navigate('/dashboard');
        window.location.reload();
      }, 700);
    } catch (err) {
      setError(err.message || t('auth.err_reg_failed', 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type) => {
    setLoading(true);
    setError(null);
    try {
      await api.demoLogin(type);
      if (type === 'organization') navigate('/organization');
      else if (type === 'family') navigate('/family');
      else navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      
      {/* Brand Header */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold mb-3 shadow-xs">
          <Leaf className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t('brand', 'EcoTrack')} • {t('subtitle', 'India Footprint & Rewards')}</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? t('auth.sign_in_title', 'Welcome to EcoTrack') : t('auth.create_acc_title', 'Join EcoTrack')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {mode === 'login'
            ? t('auth.sign_in_sub', 'Access your verified carbon dashboard, ledger & reward vouchers.')
            : t('auth.create_acc_sub', 'Track everyday emissions, verify bills, and earn Carbon Coins across India.')}
        </p>
      </div>

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg border border-slate-200/80 p-6 sm:p-8">
        
        {/* Mode Selector Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {t('auth.tab_sign_in', 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {t('auth.tab_register', 'Create Account')}
          </button>
        </div>

        {/* Account Type Selector (Individual vs Organization vs Family) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-coastal-700 uppercase tracking-wider mb-2">
            {t('auth.select_account_type', 'Select Account Type')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                accountType === 'individual'
                  ? 'border-seafoam-700 bg-seafoam-50/80 text-seafoam-900 ring-2 ring-seafoam-600/30'
                  : 'border-beach-300 bg-white text-coastal-600 hover:bg-beach-50'
              }`}
            >
              <User className={`w-5 h-5 ${accountType === 'individual' ? 'text-seafoam-700' : 'text-coastal-400'}`} />
              <span className="text-xs font-bold">{t('auth.account_individual', 'Individual')}</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountType('organization')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                accountType === 'organization'
                  ? 'border-seafoam-700 bg-seafoam-50/80 text-seafoam-900 ring-2 ring-seafoam-600/30'
                  : 'border-beach-300 bg-white text-coastal-600 hover:bg-beach-50'
              }`}
            >
              <Building2 className={`w-5 h-5 ${accountType === 'organization' ? 'text-seafoam-700' : 'text-coastal-400'}`} />
              <span className="text-xs font-bold">{t('auth.account_organization', 'Organization')}</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountType('family')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                accountType === 'family'
                  ? 'border-seafoam-700 bg-seafoam-50/80 text-seafoam-900 ring-2 ring-seafoam-600/30'
                  : 'border-beach-300 bg-white text-coastal-600 hover:bg-beach-50'
              }`}
            >
              <Home className={`w-5 h-5 ${accountType === 'family' ? 'text-seafoam-700' : 'text-coastal-400'}`} />
              <span className="text-xs font-bold">{t('auth.account_family', 'Family')}</span>
            </button>
          </div>
        </div>

        {/* Error and Success Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-2xl bg-seafoam-50 border border-seafoam-300 text-seafoam-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-seafoam-700" />
            <span>{success}</span>
          </div>
        )}

        {/* FORM: SIGN IN */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-coastal-700 mb-1">
                {t('auth.email_label', 'Email Address')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-coastal-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-coastal-700 mb-1">
                {t('auth.password_label', 'Password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-coastal-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-seafoam-700 hover:bg-seafoam-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>{t('common.loading', 'Processing...')}</span>
              ) : (
                <>
                  <span>{t('auth.btn_sign_in', 'Sign In to Dashboard')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM: REGISTRATION */
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Account Specific Fields */}
            {accountType === 'individual' && (
              <div>
                <label className="block text-xs font-bold text-coastal-700 mb-1">
                  {t('auth.full_name', 'Full Name')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-coastal-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arjun Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {accountType === 'organization' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-coastal-700 mb-1">
                    {t('auth.org_name', 'Organization / Company Name')}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-coastal-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. EcoCorp Technologies Pvt Ltd"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-coastal-700 mb-1">
                      {t('auth.industry_category', 'Industry Category')}
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600"
                    >
                      <option value="Software & IT Services">Software & IT Services</option>
                      <option value="Manufacturing & Auto">Manufacturing & Auto</option>
                      <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                      <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                      <option value="Hospitality & Food">Hospitality & Food</option>
                      <option value="CleanTech & Energy">CleanTech & Energy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-coastal-700 mb-1">
                      {t('auth.employee_count', 'Total Employees')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="w-full px-3 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600"
                    />
                  </div>
                </div>
              </>
            )}

            {accountType === 'family' && (
              <div>
                <label className="block text-xs font-bold text-coastal-700 mb-1">
                  {t('auth.family_name', 'Household / Family Name')}
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-coastal-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Family Residence"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-coastal-700 mb-1">
                {accountType === 'organization' ? t('auth.org_email', 'Official Business Email') : t('auth.email_label', 'Email Address')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-coastal-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder={accountType === 'organization' ? 'esg@company.in' : 'name@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Location (City & State) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-coastal-700 mb-1">
                  {t('auth.city_label', 'City')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coastal-700 mb-1">
                  {t('auth.state_label', 'State')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karnataka"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-coastal-700 mb-1">
                  {t('auth.password_label', 'Password')}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coastal-700 mb-1">
                  {t('auth.confirm_password', 'Confirm Password')}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-beach-50 border border-beach-300 rounded-xl text-xs font-medium text-coastal-900 focus:outline-none focus:border-seafoam-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-seafoam-700 hover:bg-seafoam-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>{t('common.loading', 'Creating Account in PostgreSQL...')}</span>
              ) : (
                <>
                  <span>{t('auth.btn_register', 'Complete Registration')}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Precautions Banner */}
        <div className="mt-6 pt-5 border-t border-beach-200 flex items-center justify-between text-[11px] text-coastal-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-seafoam-700 flex-shrink-0" />
            <span>{t('auth.sec_stored_pg', 'Securely stored in PostgreSQL with PBKDF2 salt hashing')}</span>
          </div>
          <span className="font-bold text-coastal-700">100% Secure</span>
        </div>

      </div>

      {/* 1-Click Demo Accounts for Judges / Evaluators */}
      <div className="w-full max-w-xl mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-coastal-700 uppercase tracking-wider">
            {t('auth.instant_demo_title', '1-Click Hackathon Evaluator Login')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleDemoLogin('individual')}
            className="p-3 bg-white hover:bg-seafoam-50/70 border border-beach-300 rounded-2xl text-left transition-all shadow-xs group"
          >
            <div className="text-xs font-bold text-coastal-900 group-hover:text-seafoam-800 flex items-center gap-1">
              <span>👤 Arjun (Individual)</span>
            </div>
            <div className="text-[10px] text-coastal-500 mt-0.5">14 daily activities, 175 coins</div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('organization')}
            className="p-3 bg-white hover:bg-seafoam-50/70 border border-beach-300 rounded-2xl text-left transition-all shadow-xs group"
          >
            <div className="text-xs font-bold text-coastal-900 group-hover:text-seafoam-800 flex items-center gap-1">
              <span>🏢 EcoCorp (Org)</span>
            </div>
            <div className="text-[10px] text-coastal-500 mt-0.5">85 employees, 3 branches, ESG</div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('family')}
            className="p-3 bg-white hover:bg-seafoam-50/70 border border-beach-300 rounded-2xl text-left transition-all shadow-xs group"
          >
            <div className="text-xs font-bold text-coastal-900 group-hover:text-seafoam-800 flex items-center gap-1">
              <span>🏡 Sharma (Family)</span>
            </div>
            <div className="text-[10px] text-coastal-500 mt-0.5">4 members, shared bill sync</div>
          </button>
        </div>
      </div>

    </div>
  );
}
