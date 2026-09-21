import React, { useState } from 'react';
import { isFirebaseConfigured, firebaseStatus } from '../lib/firebase';
import { OWNER_UID, isOwnerUid, isOwnerUser } from '../lib/ownerConfig';
import { OwnerBadge } from './OwnerBadge';
import { Database, CheckCircle2, AlertCircle, Copy, Check, X, Server, ShieldCheck, Key, Crown } from 'lucide-react';
import { useAppStore } from '../lib/store';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { showToast, currentUser } = useAppStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const envVars = [
    { key: 'VITE_FIREBASE_API_KEY', desc: 'مفتاح API الخاص بمشروع Firebase' },
    { key: 'VITE_FIREBASE_AUTH_DOMAIN', desc: 'نطاق المصادقة (Auth Domain)' },
    { key: 'VITE_FIREBASE_PROJECT_ID', desc: 'معرّف المشروع (Project ID)' },
    { key: 'VITE_FIREBASE_STORAGE_BUCKET', desc: 'سطل التخزين للصور والفيديوهات' },
    { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', desc: 'معرّف مرسل الرسائل' },
    { key: 'VITE_FIREBASE_APP_ID', desc: 'معرّف تطبيق الويب (App ID)' },
    { key: 'VITE_FIREBASE_MEASUREMENT_ID', desc: 'معرّف التحليلات (اختياري)' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast(`تم نسخ ${id} إلى الحافظة!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo']">
                حالة الاتصال بـ Firebase Backend 🇩🇿
              </h3>
              <p className="text-[10px] text-slate-400">إدارة قاعدة البيانات، المصادقة، والتخزين</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto py-3 space-y-3.5 flex-1">
          {/* Status Alert */}
          <div
            className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
              isFirebaseConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}
          >
            {isFirebaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-bold">
                {isFirebaseConfigured
                  ? 'تم تفعيل الاتصال المباشر بـ Firebase! ✅'
                  : 'Firebase غير متصل حالياً (يعمل وضع التخزين المحلي المحمي - Dev Mode) ⚡'}
              </div>
              <p className="text-[11px] mt-1 opacity-90 leading-relaxed font-['Cairo']">
                {isFirebaseConfigured
                  ? `التطبيق متصل بـ Firestore Authentication وقاعدة البيانات السحابية الحقيقية (المشروع: ${firebaseStatus.projectId || 'qualified-orbit-nf38q'}).`
                  : 'التطبيق يعمل بنجاح تام عبر طبقة بيانات محلية جزائرية كاملة (Seed & Local Persistence)، ويمكنك ربطه بـ Firebase في أي وقت بإضافة المفاتيح في ملف .env.'}
              </p>
              {isFirebaseConfigured && firebaseStatus.databaseId && (
                <div className="mt-1.5 pt-1.5 border-t border-emerald-200 dark:border-emerald-800/60 font-mono text-[10px] text-emerald-800 dark:text-emerald-300 truncate">
                  Database ID: {firebaseStatus.databaseId}
                </div>
              )}
            </div>
          </div>

          {/* Owner Role & UID Management Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>نظام حساب المالك (Owner 👑)</span>
              </div>
              {currentUser && isOwnerUser(currentUser) ? (
                <OwnerBadge size="sm" showLabel />
              ) : (
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  دورك الحالي: مستخدم عادي
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-['Cairo']">
              شارة 👑 مخصصة لحساب المالك الوحيد فقط. يتم التحقق منها عبر <strong>Firebase UID</strong> الحقيقي من جهة الخادم وقواعد Firestore.
            </p>

            {currentUser && (
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>الـ UID الخاص بحسابك الحالي:</span>
                  <button
                    onClick={() => handleCopy(currentUser.uid || currentUser.id, 'User UID')}
                    className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'User UID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>نسخ الـ UID</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all truncate bg-slate-50 dark:bg-slate-900/80 px-2 py-1 rounded">
                  {currentUser.uid || currentUser.id}
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
              <div>
                <strong>أين تضع الـ UID الخاص بك؟</strong>
              </div>
              <p className="text-[10.5px]">
                افتح الملف <code className="text-amber-600 dark:text-amber-400 font-mono">src/lib/ownerConfig.ts</code> وضع الـ UID في:
              </p>
              <pre className="bg-slate-900 text-amber-300 p-2 rounded-lg text-[10px] font-mono overflow-x-auto text-left" dir="ltr">
{`export const OWNER_UID = "${OWNER_UID || 'ضع_هنا_UID_حسابي'}";`}
              </pre>
              <p className="text-[10.5px]">
                أو أضفه في ملف <code>.env</code> كـ <code>VITE_FIREBASE_OWNER_UID</code>.
              </p>
            </div>
          </div>

          {/* Setup Guide */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-red-500" />
              <span>أين وكيف تضع مفاتيح Firebase؟</span>
            </h4>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 leading-relaxed font-['Cairo']">
              <p>
                1. افتح لوحة تحكم <strong>Firebase Console</strong> وأنشئ مشروعاً جديداً.
              </p>
              <p>
                2. فعّل <strong>Firestore Database</strong> و <strong>Authentication</strong> (Email/Password & Google).
              </p>
              <p>
                3. ضع المتغيرات التالية داخل ملف <code>.env</code> في جذر المشروع:
              </p>
            </div>
          </div>

          {/* Environment Variables Table */}
          <div className="space-y-1.5">
            {envVars.map((item) => (
              <div
                key={item.key}
                className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {item.key}
                  </span>
                  <span className="text-[9.5px] text-slate-400">{item.desc}</span>
                </div>
                <button
                  onClick={() => handleCopy(item.key, item.key)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  title="نسخ اسم المتغير"
                >
                  {copiedKey === item.key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Security Rules & Collections Notice */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>جاهزية القواعد والمخطط (Schema & Rules):</span>
            </div>
            <p>
              تم إعداد وتجهيز ملفات <code>firebase-blueprint.json</code> و <code>firestore.rules</code> لحماية بيانات المستخدمين بحيث لا يمكن لأي مستخدم تعديل أو حذف إلا منشوراته الخاصة.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            فهمت، استمرار في الاستخدام 🇩🇿
          </button>
        </div>
      </div>
    </div>
  );
};
