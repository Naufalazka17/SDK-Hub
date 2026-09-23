import React, { useState, useEffect } from 'react';
import { 
  Download, Smartphone, Laptop, Apple, Globe, 
  CheckCircle2, ArrowRight, Share, PlusSquare, Monitor, 
  Sparkles, Bell, Zap, WifiOff, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export const InstallTutorialPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isId = language === 'id';
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'desktop' | 'android' | 'ios'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed / running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Auto-detect user platform to select default tab
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActiveTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        toast.success(isId ? 'Aplikasi SDK Hub berhasil dipasang!' : 'SDK Hub app installed successfully!');
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        isId
          ? 'Browser Anda belum memicu prompt otomatis. Silakan ikuti langkah-langkah pada panduan di bawah.'
          : 'Automatic install prompt is not available in this browser. Please follow the steps below.'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top Banner Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 sm:p-10 shadow-sm">
        {/* Background Ambient Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#F58320]/15 text-[#F58320] border border-[#F58320]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isId ? 'Progressive Web App (PWA) SDK' : 'Progressive Web App (PWA) SDK'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Panduan Unduh & Pasang Aplikasi SDK Hub' : 'SDK Hub App Download & Installation Guide'}
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {isId
                ? 'Pasang aplikasi Subaga Digital Kreatif langsung dari browser Anda ke layar utama HP Android, iOS iPhone/iPad, maupun komputer desktop. Nikmati performa instan tanpa perlu unduh file APK atau App Store.'
                : 'Install Subaga Digital Kreatif directly from your browser to your Android, iOS iPhone/iPad, or desktop home screen. Experience native performance without manual app store downloads.'}
            </p>

            {isStandalone && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isId ? 'Aplikasi telah terpasang di perangkat Anda (Mode Standalone)' : 'App is already installed on your device (Standalone Mode)'}</span>
              </div>
            )}
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            {deferredPrompt && !isStandalone && (
              <button
                type="button"
                onClick={handleTriggerInstall}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#F58320] hover:bg-[#e67512] active:scale-95 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isId ? 'Pasang Sekarang' : 'Install Now'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all cursor-pointer"
            >
              <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-2xl max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('desktop')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'desktop'
              ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-default)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Desktop (PC/Mac)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('android')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'android'
              ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-default)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Android (Chrome)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ios')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ios'
              ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-default)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>iOS (iPhone/iPad)</span>
        </button>
      </div>

      {/* Tutorial Content Area */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-9 shadow-sm space-y-8">
        {/* DESKTOP INSTRUCTIONS */}
        {activeTab === 'desktop' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-default)]">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isId ? 'Cara Pasang di Laptop / Komputer (Chrome & Edge)' : 'How to Install on Desktop (Chrome & Edge)'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isId
                    ? 'Dapat dijalankan seperti aplikasi desktop native di Windows, MacOS, atau Linux.'
                    : 'Runs just like a native desktop app on Windows, macOS, or Linux.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Buka di Browser' : 'Open in Browser'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Buka platform SDK Hub melalui browser Google Chrome, Microsoft Edge, atau Brave di komputer Anda.'
                    : 'Open the SDK Hub platform using Google Chrome, Microsoft Edge, or Brave on your computer.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Temukan Ikon Install' : 'Find the Install Icon'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Perhatikan kolom alamat URL (Omnibox) di kanan atas. Klik ikon komputer dengan tanda panah ke bawah (Install SDK Hub), atau buka Menu Titik Tiga (⋮).'
                    : 'Look at the top-right of your address bar (omnibox). Click the computer install icon or open the three-dots menu (⋮).'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Klik "Install"' : 'Click "Install"'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Pilih "Install" pada jendela dialog. Ikon SDK Hub akan otomatis disematkan ke Desktop dan Taskbar Anda!'
                    : 'Click "Install" in the prompt dialog. The SDK Hub icon will be pinned to your Desktop and Taskbar!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ANDROID INSTRUCTIONS */}
        {activeTab === 'android' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-default)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isId ? 'Cara Pasang di HP Android (Google Chrome)' : 'How to Install on Android (Google Chrome)'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isId
                    ? 'Aplikasi akan otomatis muncul di laci aplikasi seperti aplikasi Play Store reguler.'
                    : 'The app will appear in your app drawer just like a standard Play Store app.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Buka Google Chrome' : 'Open Google Chrome'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Buka alamat website SDK Hub di Google Chrome pada smartphone Android Anda.'
                    : 'Open the SDK Hub web address in Google Chrome on your Android smartphone.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Buka Menu Titik Tiga (⋮)' : 'Open Three-Dots Menu (⋮)'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Ketuk menu titik tiga (⋮) di pojok kanan atas browser, lalu pilih "Tambahkan ke Layar Utama" atau "Instal Aplikasi".'
                    : 'Tap the three-dots menu (⋮) in the top-right corner, then select "Add to Home screen" or "Install App".'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Ketuk "Instal"' : 'Tap "Install"'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Konfirmasi dengan mengetuk "Instal". Ikon aplikasi SDK Hub akan langsung muncul di home screen smartphone Anda!'
                    : 'Confirm by tapping "Install". The SDK Hub app icon will immediately appear on your smartphone home screen!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* IOS INSTRUCTIONS */}
        {activeTab === 'ios' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-default)]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-500">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isId ? 'Cara Pasang di iPhone & iPad (Safari)' : 'How to Install on iPhone & iPad (Safari)'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isId
                    ? 'iOS mewajibkan penggunaan browser Safari untuk menambahkan Progressive Web App ke Home Screen.'
                    : 'iOS requires Apple Safari browser to add Progressive Web Apps to your Home Screen.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {isId ? 'Buka di Safari' : 'Open in Safari'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Pastikan Anda membuka SDK Hub melalui browser bawaan Apple Safari (bukan in-app browser dari chat).'
                    : 'Make sure you open SDK Hub in the native Apple Safari browser (not inside in-app chat webviews).'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5 text-[#F58320]" />
                  <span>{isId ? 'Ketuk Ikon Bagikan (Share)' : 'Tap Share Icon'}</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Ketuk ikon Bagikan (kotak dengan panah ke atas) di bilah bawah layar iPhone atau bilah atas iPad.'
                    : 'Tap the Share icon (square with an arrow pointing upward) on the bottom bar on iPhone or top bar on iPad.'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-extrabold flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <PlusSquare className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isId ? 'Tambah ke Layar Utama' : 'Add to Home Screen'}</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isId
                    ? 'Gulir ke bawah pada menu opsi, pilih "Tambah ke Layar Utama" (Add to Home Screen), lalu ketuk "Tambah" di pojok kanan atas.'
                    : 'Scroll down the share sheet, select "Add to Home Screen", then tap "Add" at the top-right corner.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PWA Key Features / Value Propositions */}
        <div className="pt-6 border-t border-[var(--border-default)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            {isId ? 'Keunggulan Aplikasi PWA SDK Hub' : 'SDK Hub PWA Advantages'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)]/60 border border-[var(--border-default)] flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  {isId ? 'Ringan & Instan' : 'Lightweight & Fast'}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Ukuran aplikasi di bawah 5MB dengan loading instan berkat caching cerdas.' : 'Under 5MB app footprint with instant launch via smart caching.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)]/60 border border-[var(--border-default)] flex items-start gap-3">
              <Bell className="w-5 h-5 text-[#F58320] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  {isId ? 'Push Notification' : 'Push Notifications'}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Dapatkan update tugas & pesan chat realtime langsung di lockscreen.' : 'Receive realtime task & chat message updates on your lockscreen.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)]/60 border border-[var(--border-default)] flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  {isId ? 'Dukungan Offline' : 'Offline Ready'}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Akses data proyek yang telah tersimpan meski jaringan internet terputus.' : 'Access cached project data even when your network drops.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)]/60 border border-[var(--border-default)] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  {isId ? 'Selalu Terupdate' : 'Always Up-to-Date'}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Pembaruan fitur terbaru berjalan otomatis tanpa repot update manual.' : 'Feature updates apply automatically without manual store downloads.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
