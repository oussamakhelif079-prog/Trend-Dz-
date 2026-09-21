import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ALGERIAN_WILAYAS } from '../data/wilayas';
import {
  Flame,
  Bot,
  Bell,
  Sun,
  Moon,
  MapPin,
  Sparkles,
  ShieldAlert,
  Database,
} from 'lucide-react';

interface HeaderProps {
  onOpenFirebaseConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFirebaseConfig }) => {
  const {
    isDarkMode,
    toggleDarkMode,
    selectedWilaya,
    setSelectedWilaya,
    openAIAssistant,
    unreadNotificationsCount,
    setIsNotificationsOpen,
    currentUser,
    openAuthModal,
  } = useAppStore();

  const [isWilayaDropdownOpen, setIsWilayaDropdownOpen] = useState(false);

  const activeWilayaObj = selectedWilaya
    ? ALGERIAN_WILAYAS.find((w) => w.number === selectedWilaya)
    : null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Dev Data Info Ribbon */}
      <div className="bg-emerald-600 dark:bg-emerald-700 text-white text-[11px] font-medium py-1 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
          <span>نسخة MVP للتطوير • بيانات تجريبية جزائرية (Dev Seed Data)</span>
        </div>
        <button
          onClick={onOpenFirebaseConfig}
          className="flex items-center gap-1 underline text-emerald-100 hover:text-white transition-colors cursor-pointer text-[10px]"
        >
          <Database className="w-3 h-3" />
          <span>إعدادات Firebase</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-red-500/20">
            <Flame className="w-5 h-5 fill-white text-white animate-bounce-short" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-['Cairo']">
                TREND <span className="text-red-600 dark:text-red-500">DZ</span>
              </h1>
              <span className="text-xs">🇩🇿</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 -mt-1 leading-none">
              الترند الجزائري
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* "اسقسي صاحبي 🤖🇩🇿" Button */}
          <button
            id="btn-ask-sahbi"
            onClick={() => openAIAssistant()}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
            title="اسقسي صاحبي - الذكاء الاصطناعي الجزائري"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">اسقسي</span>
            <span>صاحبي</span>
            <span className="text-[10px]">🤖</span>
          </button>

          {/* Wilaya Filter Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsWilayaDropdownOpen(!isWilayaDropdownOpen)}
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                selectedWilaya
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="فلترة حسب الولاية"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="max-w-[65px] truncate">
                {activeWilayaObj ? `${activeWilayaObj.number} - ${activeWilayaObj.nameAr}` : 'الولايات'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isWilayaDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-black/20"
                  onClick={() => setIsWilayaDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-1 divide-y divide-slate-100 dark:divide-slate-800">
                  <button
                    onClick={() => {
                      setSelectedWilaya(null);
                      setIsWilayaDropdownOpen(false);
                    }}
                    className={`w-full text-right px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      selectedWilaya === null
                        ? 'bg-red-500 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>كافة الولايات (58 ولاية)</span>
                    <span>🇩🇿</span>
                  </button>

                  <div className="py-1">
                    {ALGERIAN_WILAYAS.map((wilaya) => (
                      <button
                        key={wilaya.number}
                        onClick={() => {
                          setSelectedWilaya(wilaya.number);
                          setIsWilayaDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer flex items-center justify-between ${
                          selectedWilaya === wilaya.number
                            ? 'bg-red-500 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>
                          {wilaya.number}. {wilaya.nameAr}
                        </span>
                        <span className="text-[10px] opacity-70">{wilaya.nameFr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            )}
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600"></span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
