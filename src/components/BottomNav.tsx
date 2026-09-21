import React from 'react';
import { useAppStore } from '../lib/store';
import { NavigationTab } from '../types';
import { isOwnerUser } from '../lib/ownerConfig';
import { Home, Flame, PlusCircle, Search, User } from 'lucide-react';

interface BottomNavProps {
  onOpenCreate: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenCreate }) => {
  const { currentTab, setCurrentTab, currentUser, openAuthModal } = useAppStore();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; isAction?: boolean }[] = [
    { id: 'feed', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'trend', label: 'الترند', icon: <Flame className="w-5 h-5" /> },
    {
      id: 'create',
      label: 'نشر',
      icon: <PlusCircle className="w-6 h-6 text-red-600 dark:text-red-500 fill-red-50 dark:fill-red-950" />,
      isAction: true,
    },
    { id: 'search', label: 'البحث', icon: <Search className="w-5 h-5" /> },
    { id: 'profile', label: 'حسابي', icon: <User className="w-5 h-5" /> },
  ];

  const handleTabClick = (item: (typeof navItems)[0]) => {
    if (item.isAction) {
      if (!currentUser) {
        openAuthModal();
      } else {
        onOpenCreate();
      }
      return;
    }
    setCurrentTab(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id && !item.isAction;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => handleTabClick(item)}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all cursor-pointer ${
                item.isAction
                  ? 'transform active:scale-90 hover:opacity-90'
                  : isActive
                  ? 'text-red-600 dark:text-red-500 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.id === 'profile' && isOwnerUser(currentUser) && (
                  <span className="absolute -top-1.5 -right-2 text-[11px] select-none" title="Owner">👑</span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-600 dark:bg-red-500"></span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
