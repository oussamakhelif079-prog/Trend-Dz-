import React from 'react';
import { useAppStore } from '../lib/store';
import { OwnerBadge } from './OwnerBadge';
import { isOwnerUid } from '../lib/ownerConfig';
import { X, Bell, Heart, MessageCircle, UserPlus, Check, CheckCheck } from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppStore();

  if (!isNotificationsOpen) return null;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} سا`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-600 dark:text-red-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo']">
              الإشعارات ({notifications.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-[10px] text-slate-500 hover:text-red-600 font-semibold cursor-pointer flex items-center gap-1"
              title="تحديد الكل كمقروء"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>قراءة الكل</span>
            </button>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="overflow-y-auto py-2 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-1">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-2.5 rounded-2xl flex items-start gap-2.5 transition-colors cursor-pointer ${
                  !notif.read
                    ? 'bg-red-50/70 dark:bg-red-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <img
                  src={notif.actorAvatar}
                  alt={notif.actorUsername}
                  className="w-9 h-9 rounded-full object-cover mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      @{notif.actorUsername}
                    </span>
                    {(isOwnerUid(notif.actorId) || (notif as any).actorRole === 'owner') && (
                      <OwnerBadge size="xs" />
                    )}
                    {notif.type === 'like' && (
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    )}
                    {notif.type === 'comment' && (
                      <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    {notif.type === 'follow' && (
                      <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-['Cairo'] mt-0.5">
                    {notif.text}
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    {formatTimeAgo(notif.createdAt)}
                  </span>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-red-600 mt-2 shrink-0"></span>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا توجد إشعارات جديدة حالياً ✨
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
