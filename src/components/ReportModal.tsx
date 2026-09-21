import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ShieldAlert, X, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { reportTarget, closeReportModal, submitReport } = useAppStore();
  const [reason, setReason] = useState<string>('محتوى مسيء أو غير لائق');
  const [details, setDetails] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!reportTarget) return null;

  const reasons = [
    'محتوى مسيء أو غير لائق 🚫',
    'سب وشتم أو تنمر إلكتروني 🗣️',
    'أخبار كاذبة أو تضليل إعلامي 📰',
    'رسائل مزعجة أو سبام (Spam) 🤖',
    'انتهاك حقوق الملكية الفكرية ⚖️',
    'سبب آخر 📝',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport({
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      reason: 'inappropriate',
      details: `${reason}${details ? ' - ' + details : ''}`,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      closeReportModal();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              بارك الله فيك يا خويا! 🇩🇿
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              وصلنا التبليغ تاعك وفريق TREND DZ غادي يراجعه فالحين للحفاظ على أمان مجتمعنا الجزائري.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo']">
                    تبليغ عن محتوى (Report 🚨)
                  </h3>
                  <p className="text-[10px] text-slate-400">ساعدنا على حماية مجتمع TREND DZ</p>
                </div>
              </div>
              <button
                onClick={closeReportModal}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ما هو سبب التبليغ؟
                </label>
                <div className="space-y-1.5">
                  {reasons.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        reason === r
                          ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضيح إضافي (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="إذا عندك أي تفاصيل أخرى حاب تضيفها..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReportModal}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  إرسال التبليغ 🚨
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
