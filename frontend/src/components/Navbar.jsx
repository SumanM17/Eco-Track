import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Leaf, 
  PenTool, 
  LayoutDashboard, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  Trophy, 
  Globe2,
  ShieldCheck,
  Home,
  Building2,
  Coins,
  Navigation,
  Zap,
  User,
  ChevronDown,
  LogIn,
  LogOut
} from 'lucide-react';
import { api, isMockEnabled, setMockEnabled, getAuthToken } from '../api/client';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [backendOnline, setBackendOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const fetchProfile = async () => {
    try {
      const u = await api.getMe();
      setCurrentUser(u);
    } catch {
      // Default fallback individual
      setCurrentUser({
        name: "Arjun Rao",
        account_type: "individual",
        coin_balance: 175,
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const resp = await api.getHealth();
        if (mounted) setBackendOnline(resp && resp.status === 'healthy');
      } catch {
        if (mounted) setBackendOnline(false);
      }
    };

    checkHealth();
    fetchProfile();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('carbonkatha_lang', lang);
  };

  const handleSwitchDemoAccount = async (accountType) => {
    setShowAccountDropdown(false);
    try {
      const res = await api.demoLogin(accountType);
      setCurrentUser(res.user);
      if (accountType === 'family') navigate('/family');
      else if (accountType === 'organization') navigate('/organization');
      else navigate('/dashboard');
    } catch (err) {
      console.warn('Demo switch error', err);
    }
  };

  const handleLogout = () => {
    setShowAccountDropdown(false);
    api.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const navItems = [
    { to: '/log', key: 'log', icon: PenTool },
    { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { to: '/evidence', key: 'evidence', icon: ShieldCheck, badge: t('common.verified', 'Verified') },
    { to: '/family', key: 'family', icon: Home },
    { to: '/organization', key: 'organization', icon: Building2 },
    { to: '/rewards', key: 'rewards', icon: Coins, highlight: true },
    { to: '/gps', key: 'gps', icon: Navigation },
    { to: '/whatif', key: 'whatif', icon: Sliders },
    { to: '/progress', key: 'progress', icon: TrendingUp },
    { to: '/actions', key: 'actions', icon: CheckCircle2 },
    { to: '/challenges', key: 'challenges', icon: Award },
    { to: '/leaderboard', key: 'leaderboard', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                  {t('brand', 'EcoTrack')}
                </span>
                <span className="text-[10px] bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded-md tracking-wider">
                  TRACK
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                {t('subtitle', 'India Footprint & Rewards')}
              </span>
            </div>
          </NavLink>

          {/* Right Controls: Account Switcher, Coins, Language, Health */}
          <div className="flex items-center gap-2.5">
            
            {/* Live Carbon Coins Badge */}
            <NavLink
              to="/rewards"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all shadow-xs"
              title={t('rewards.balance_title', 'Your Verified Carbon Coins')}
            >
              <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{currentUser?.coin_balance ?? 175}</span>
            </NavLink>

            {/* Account Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-xs"
              >
                <span className="capitalize">{currentUser?.name || currentUser?.account_type || t('auth.account_individual', 'Individual')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {t('nav.switch_demo', 'Switch Demo Account')}
                  </div>
                  <button
                    onClick={() => handleSwitchDemoAccount('individual')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-emerald-50 flex items-center justify-between"
                  >
                    <span>👤 {t('auth.account_individual', 'Individual')} (Arjun)</span>
                    {currentUser?.account_type === 'individual' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                  <button
                    onClick={() => handleSwitchDemoAccount('family')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-emerald-50 flex items-center justify-between"
                  >
                    <span>🏡 {t('auth.account_family', 'Family')} (Sharma 4p)</span>
                    {currentUser?.account_type === 'family' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                  <button
                    onClick={() => handleSwitchDemoAccount('organization')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-emerald-50 flex items-center justify-between"
                  >
                    <span>🏢 {t('auth.account_organization', 'Organization')} (EcoCorp)</span>
                    {currentUser?.account_type === 'organization' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <NavLink
                      to="/login"
                      onClick={() => setShowAccountDropdown(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('nav.login', 'Sign In / Register')}</span>
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('nav.logout', 'Logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
              <Globe2 className="w-3.5 h-3.5 ml-1.5 mr-0.5 text-slate-600" />
              {[
                { code: 'en', label: 'EN' },
                { code: 'hi', label: 'हिं' },
                { code: 'ta', label: 'த' },
                { code: 'te', label: 'తె' },
                { code: 'kn', label: 'ಕ' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                    i18n.language === lang.code
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Health Status Pill */}
            <div 
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs"
              title={backendOnline ? t('status.connected', 'Backend Connected (PostgreSQL)') : t('status.offline', 'Offline')}
            >
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-medium">{backendOnline ? 'PostgreSQL' : 'Offline'}</span>
            </div>

          </div>
        </div>

        {/* Secondary Navigation Row: All 12 Modules Fully Translated */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 text-xs font-bold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = t(`nav.${item.key}`, item.key);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                      : item.highlight
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {item.badge && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

      </div>
    </header>
  );
}

export default Navbar;
