import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Lock,
  User,
  Sun,
  Moon,
  Globe,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SdkBrandMark } from '../components/common/SdkBrandMark';
import { credentialService } from '../services/credentialService';
import { Role } from '../types';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { switchProfileByRole, loginWithEmail, availableProfiles, setCurrentProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = usernameOrEmail.trim().toLowerCase();

    if (!query) {
      toast.error(t('login.usernameOrEmail', 'Masukkan username atau alamat email'));
      return;
    }

    if (!password) {
      toast.error(t('login.passwordRequired', 'Kata sandi wajib diisi.'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Find matching profile by email, username, full_name, or role shortcut
      const matched = availableProfiles.find((p) => {
        const pEmail = p.email.toLowerCase();
        const pUsername = p.email.split('@')[0].toLowerCase();
        const pName = p.full_name.toLowerCase();
        const pRole = p.role_id.toLowerCase();

        return (
          pEmail === query ||
          pUsername === query ||
          pName.includes(query) ||
          (query === 'admin' && pRole === 'admin') ||
          (query === 'lead' && pRole === 'project_lead') ||
          (query === 'staff' && pRole === 'staff') ||
          (query === 'client' && pRole === 'client')
        );
      });

      if (matched) {
        // Validate password using credentialService
        const isPasswordValid = credentialService.verifyPassword(
          matched.id,
          matched.email,
          password
        );

        if (!isPasswordValid) {
          toast.error(
            language === 'id'
              ? 'Kata sandi salah. Silakan periksa kembali password akun Anda.'
              : 'Invalid password. Please check your credentials.'
          );
          return;
        }

        setCurrentProfile(matched);
        sessionStorage.setItem('sdk_session_authenticated', 'true');
        localStorage.setItem('sdk_active_profile_id', matched.id);
        toast.success(
          `${t('login.successMessage', 'Selamat datang')} ${matched.full_name}! (${matched.role_id})`
        );

        if (matched.role_id === 'CLIENT') {
          navigate('/cockpit');
        } else {
          navigate('/');
        }
      } else {
        // Try standard email login
        const ok = await loginWithEmail(query);
        if (ok) {
          const loggedUser = availableProfiles.find(
            (p) => p.email.toLowerCase() === query
          );
          if (loggedUser?.role_id === 'CLIENT') {
            navigate('/cockpit');
          } else {
            navigate('/');
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden transition-colors duration-500 font-sans selection:bg-[#F58320] selection:text-white ${
        isDark
          ? 'bg-[#121927] bg-[radial-gradient(ellipse_75%_65%_at_25%_25%,rgba(217,119,6,0.32)_0%,rgba(160,70,15,0.18)_28%,rgba(20,28,46,0.95)_60%,#0e1522_100%)] text-white'
          : 'bg-[#ffffff] bg-[radial-gradient(ellipse_65%_80%_at_78%_48%,rgba(254,215,170,0.65)_0%,rgba(253,230,138,0.5)_32%,rgba(254,243,199,0.3)_55%,rgba(255,255,255,0)_82%)] text-slate-900'
      }`}
    >
      {/* Background Ambient Lighting (Yellow-Amber on Dark, Glowing Warm Yellow-Peach on Light) */}
      {isDark ? (
        <div className="absolute left-[2%] top-[15%] w-[480px] h-[480px] rounded-full bg-[#f58320]/20 blur-[130px] pointer-events-none z-0" />
      ) : (
        <>
          {/* Primary Warm Golden-Yellow Glow behind & around the card */}
          <div className="absolute right-[0%] md:right-[2%] top-[6%] md:top-[10%] w-[580px] md:w-[720px] h-[580px] md:h-[720px] rounded-full bg-gradient-to-br from-[#fde68a]/80 via-[#fcd34d]/60 to-[#fb923c]/45 blur-[100px] pointer-events-none z-0" />
          {/* Secondary Soft Amber/Peach Ambient Glow drifting in the upper center */}
          <div className="absolute left-[40%] md:left-[45%] top-[2%] md:top-[8%] w-[380px] md:w-[480px] h-[380px] md:h-[480px] rounded-full bg-[#fed7aa]/60 blur-[90px] pointer-events-none z-0" />
        </>
      )}

      {/* Top Floating Utility Header: Theme & Language Switchers */}
      <header className="w-full flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6 z-20">
        {/* Mobile subtle brand title */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#F58320] flex items-center justify-center font-bold text-white text-xs shadow-md">
            SDK
          </div>
          <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Subaga Digital Kreatif
          </span>
        </div>

        <div className="hidden md:block" />

        {/* Action Controls: Language & Theme */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={t('login.langTooltip', 'Ganti Bahasa (ID / EN)')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 text-xs font-semibold backdrop-blur-md transition-all ${
              isDark
                ? 'bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 shadow-md'
                : 'bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-xs'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#F58320]" />
            <span className="tracking-wider uppercase">{language}</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={t('login.themeTooltip', language === 'id' ? 'Ganti Tema (Terang / Gelap)' : 'Toggle Theme (Light / Dark)')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full active:scale-95 text-xs font-semibold backdrop-blur-md transition-all ${
              isDark
                ? 'bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 shadow-md'
                : 'bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-xs'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">{language === 'id' ? 'Gelap' : 'Dark'}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">{language === 'id' ? 'Terang' : 'Light'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-12 lg:px-16 py-6 z-10">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-14 lg:gap-20">
          
          {/* Left Column: Brand Showcase */}
          <section className="flex flex-col items-center md:items-start text-center md:text-left flex-1 select-none">
            <div className="relative group transition-transform duration-500 hover:scale-105">
              <SdkBrandMark className="w-56 sm:w-72 md:w-80 lg:w-[380px] h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]" />
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mt-6 sm:mt-8 ${
              isDark ? 'text-white drop-shadow-md' : 'text-slate-900 drop-shadow-xs'
            }`}>
              Subaga Digital Kreatif
            </h1>
            <p className={`text-xs sm:text-sm mt-2 max-w-md font-normal leading-relaxed ${
              isDark ? 'text-white/70' : 'text-slate-600'
            }`}>
              {t(
                'login.brandTagline',
                'Platform Manajemen & Orkestrasi Proyek Digital Terpusat'
              )}
            </p>
          </section>

          {/* Right Column: Floating Login Card */}
          <section className="w-full max-w-[460px] flex-shrink-0">
            <div
              className={`rounded-[32px] p-7 sm:p-9 md:p-10 transition-all duration-300 ${
                isDark
                  ? 'bg-[#172030] text-white border border-[#26354d]/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]'
                  : 'bg-white text-slate-900 border border-[#f58320]/25 shadow-[0_25px_70px_-10px_rgba(245,131,32,0.32),0_0_60px_rgba(253,224,71,0.35)]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {t('login.welcome', 'Welcome to SDK')}
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F58320]/15 text-[#F58320] border border-[#F58320]/30 font-mono tracking-wide">
                  {language === 'id' ? 'Portal Internal SDK' : 'Enterprise Portal'}
                </span>
              </div>

              {/* Title */}
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-6 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t('login.signin', 'Sign in')}
              </h2>

              {/* Standard Credentials Form (Social logins removed completely) */}
              <form onSubmit={handleFormLogin} className="space-y-4">
                {/* Field 1: Username / Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="usernameOrEmail"
                    className={`block text-xs font-semibold ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {t(
                      'login.usernameOrEmail',
                      'Enter your username or email address'
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id="usernameOrEmail"
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder={t(
                        'login.usernameOrEmailPlaceholder',
                        'Username or email address'
                      )}
                      className={`w-full px-4 py-3 text-sm rounded-xl outline-none transition-all ${
                        isDark
                          ? 'bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:ring-2 focus:ring-[#F58320]'
                          : 'bg-white text-slate-900 placeholder:text-slate-400 border border-[#F58320]/35 hover:border-[#F58320]/60 focus:border-[#F58320] focus:ring-2 focus:ring-[#F58320]/20'
                      }`}
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className={`block text-xs font-semibold ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {t('login.password', 'Enter your Password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder', 'Password')}
                      className={`w-full px-4 py-3 text-sm rounded-xl outline-none transition-all ${
                        isDark
                          ? 'bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:ring-2 focus:ring-[#F58320]'
                          : 'bg-white text-slate-900 placeholder:text-slate-400 border border-[#F58320]/35 hover:border-[#F58320]/60 focus:border-[#F58320] focus:ring-2 focus:ring-[#F58320]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#F58320] hover:bg-[#e67512] active:bg-[#cf670e] text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('login.submitting', 'Memverifikasi...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('login.submit', 'Sign in')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className={`w-full text-center py-4 text-xs z-10 select-none ${
        isDark ? 'text-white/40' : 'text-slate-400'
      }`}>
        © {new Date().getFullYear()} Subaga Digital Kreatif. All rights reserved.
      </footer>
    </div>
  );
};
