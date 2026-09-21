import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { PostCard } from './PostCard';
import { ALGERIAN_WILAYAS } from '../data/wilayas';
import { UserProfile } from '../types';
import { OwnerBadge } from './OwnerBadge';
import { isOwnerUser } from '../lib/ownerConfig';
import {
  Settings,
  Edit3,
  MapPin,
  Calendar,
  Grid,
  Video,
  Heart,
  LogOut,
  UserCheck,
  Check,
  X,
  Database,
  Flame,
  User,
} from 'lucide-react';

interface ProfileViewProps {
  viewingUserId?: string | null;
  onOpenFirebaseConfig?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  viewingUserId,
  onOpenFirebaseConfig,
}) => {
  const {
    currentUser,
    allUsers,
    posts,
    updateProfile,
    logout,
    loginAsDemoUser,
    openAuthModal,
    followUser,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'likes'>('posts');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Determine profile to display: either viewing another user or current user
  const profileUser: UserProfile | null = useMemo(() => {
    if (viewingUserId) {
      return allUsers.find((u) => u.id === viewingUserId) || null;
    }
    return currentUser;
  }, [viewingUserId, allUsers, currentUser]);

  // Edit form state
  const [editName, setEditName] = useState(profileUser?.displayName || '');
  const [editBio, setEditBio] = useState(profileUser?.bio || '');
  const [editWilayaNumber, setEditWilayaNumber] = useState<number>(profileUser?.wilayaNumber || 16);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profileUser?.avatarUrl || '');

  if (!currentUser && !viewingUserId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          أهلاً بك في TREND DZ 🇩🇿
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          سجل الدخول لعرض صفحتك الشخصية، إدارة منشوراتك، والتفاعل مع الترندات الجزائرية!
        </p>
        <button
          onClick={openAuthModal}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          تسجيل الدخول / إنشاء حساب 🚀
        </button>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-slate-500">
        لم يتم العثور على هذا الحساب 🔍
      </div>
    );
  }

  const isMe = currentUser?.id === profileUser.id;
  const isFollowing = currentUser ? currentUser.following.includes(profileUser.id) : false;

  // Filter user posts, videos, and likes
  const userPosts = posts.filter((p) => p.authorId === profileUser.id);
  const userVideos = userPosts.filter((p) => p.mediaType === 'video');
  const userLikedPosts = posts.filter((p) => p.likedBy.includes(profileUser.id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const wilayaObj = ALGERIAN_WILAYAS.find((w) => w.number === editWilayaNumber);
    updateProfile({
      displayName: editName.trim() || profileUser.displayName,
      bio: editBio.trim(),
      wilaya: wilayaObj ? wilayaObj.nameAr : profileUser.wilaya,
      wilayaNumber: wilayaObj ? wilayaObj.number : profileUser.wilayaNumber,
      avatarUrl: editAvatarUrl || profileUser.avatarUrl,
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-3.5 pt-2">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4">
        {/* Top Cover Banner */}
        <div className="h-20 -mx-4 -mt-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-t-3xl relative">
          {isMe && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <button
                onClick={logout}
                className="p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Header */}
        <div className="relative flex items-end justify-between -mt-10 mb-3 px-1">
          <div className="relative">
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.displayName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-md bg-white"
            />
            {profileUser.isVerified && (
              <span className="absolute bottom-1 left-1 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                ✓
              </span>
            )}
          </div>

          <div>
            {isMe ? (
              <button
                onClick={() => {
                  setEditName(profileUser.displayName);
                  setEditBio(profileUser.bio);
                  setEditWilayaNumber(profileUser.wilayaNumber);
                  setEditAvatarUrl(profileUser.avatarUrl);
                  setIsEditingProfile(true);
                }}
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل البروفايل</span>
              </button>
            ) : (
              <button
                onClick={() => followUser(profileUser.id)}
                className={`flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>متابع</span>
                  </>
                ) : (
                  <span>متابعة 🇩🇿</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Bio Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-['Cairo']">
              {profileUser.displayName}
            </h2>
            {isOwnerUser(profileUser) && <OwnerBadge size="sm" showLabel />}
            <span className="text-xs text-slate-400">@{profileUser.username}</span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-['Cairo']">
            {profileUser.bio || 'لا توجد سيرة ذاتية بعد.'}
          </p>

          <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-red-500" />
              <span>
                ولاية {profileUser.wilaya} ({profileUser.wilayaNumber})
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>انضم في 2024</span>
            </span>
          </div>
        </div>

        {/* Numeric Counters: Followers, Following, Posts */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {userPosts.length}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">المنشورات</div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {profileUser.followersCount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">المتابعون</div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {profileUser.followingCount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">يتابع</div>
          </div>
        </div>
      </div>

      {/* Quick Algerian Demo Account Switcher (For MVP testing) */}
      {isMe && (
        <div className="mb-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>التبديل السريع بين حسابات التجربة الجزائريين (Dev Accounts):</span>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
              MVP Demo
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => loginAsDemoUser(u.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer border ${
                  currentUser?.id === u.id
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <img src={u.avatarUrl} alt={u.displayName} className="w-4 h-4 rounded-full object-cover" />
                <span>{u.displayName.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Tabs: Posts / Videos / Likes */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('posts')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>منشوراتي ({userPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'videos'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>فيديو ({userVideos.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'likes'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>الإعجابات ({userLikedPosts.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              لا توجد منشورات بعد لهذا الحساب.
            </div>
          )
        )}

        {activeTab === 'videos' && (
          userVideos.length > 0 ? (
            userVideos.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              لم ينشر هذا الحساب أي فيديو بعد 🎬
            </div>
          )
        )}

        {activeTab === 'likes' && (
          userLikedPosts.length > 0 ? (
            userLikedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              لا توجد منشورات معجب بها بعد ❤️
            </div>
          )
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                تعديل الحساب الشخصي ✏️
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل (Display Name)
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  السيرة الذاتية (Bio)
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الولاية الجزائرية
                </label>
                <select
                  value={editWilayaNumber}
                  onChange={(e) => setEditWilayaNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w.number} value={w.number}>
                      {w.number} - {w.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رابط صورة البروفايل (Avatar URL)
                </label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-left font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  حفظ التعديلات ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
