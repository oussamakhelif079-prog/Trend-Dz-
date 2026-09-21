/**
 * 👑 TREND DZ - إعدادات حساب المالك (Owner Configuration)
 * =========================================================
 * 
 * 📌 ضع هنا الـ Firebase Auth UID الخاص بحسابك:
 * يمكنك الحصول على الـ UID مباشرة من:
 * Firebase Console -> Authentication -> Users -> انسخ User UID الخاص بك
 * 
 * 🔒 الأمان:
 * - أي حساب مسجل جديد يأخذ تلقائياً role = "user".
 * - لن يحصل أي حساب على رتبة "owner" والشارة 👑 إلا إذا تطابق الـ UID الخاص به تماماً مع OWNER_UID.
 * - قواعد الأمان في Firestore Security Rules تمنع منعاً باتاً أي مستخدم من تعديل حقل role في حسابه.
 */
export const OWNER_UID = "ضع_هنا_UID_حسابي";

export type UserRole = 'user' | 'owner';

/**
 * التحقق الأمني الموثوق مما إذا كان المعرف يطابق حساب المالك الفعلي (Owner)
 */
export function isOwnerUid(uidOrId?: string | null): boolean {
  if (!uidOrId) return false;
  // إذا لم يتم استبدال القيمة الافتراضية، لا نعتبر أي حساب Owner حمايةً للأمان
  if (!OWNER_UID || OWNER_UID === "ضع_هنا_UID_حسابي") {
    return false;
  }
  return uidOrId === OWNER_UID;
}

/**
 * التحقق مما إذا كان المستخدم يملك رتبة Owner
 * يتحقق من الـ UID ومطابقته لـ OWNER_UID أو تطابق حقل role مع التحقق من الهوية
 */
export function isOwnerUser(user?: {
  id?: string;
  uid?: string;
  role?: string;
} | null): boolean {
  if (!user) return false;
  if (isOwnerUid(user.uid) || isOwnerUid(user.id)) {
    return true;
  }
  // إذا تم تحديد role = 'owner' مسبقاً، نتحقق أن المعرف يطابق OWNER_UID لمنع تزييف الدور عبر DevTools أو localStorage
  if (user.role === 'owner') {
    return isOwnerUid(user.uid || user.id);
  }
  return false;
}
