import React, { useState, useMemo } from 'react';
import { useAppStore, calculateTrendScore } from '../lib/store';
import { PostCard } from './PostCard';
import { OwnerBadge } from './OwnerBadge';
import { isOwnerUser } from '../lib/ownerConfig';
import { Flame, Hash, Users, Trophy, TrendingUp, Info, UserPlus, Check } from 'lucide-react';
import { POPULAR_HASHTAGS } from '../data/seedData';

interface TrendViewProps {
  onSelectHashtag: (tag: string) => void;
  onSelectUser: (userId: string) => void;
}

export const TrendView: React.FC<TrendViewProps> = ({ onSelectHashtag, onSelectUser }) => {
  const { posts, allUsers, currentUser, followUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'hashtags' | 'creators'>('posts');

  // Sorted trending posts based on trend score calculation
  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => calculateTrendScore(b) - calculateTrendScore(a));
  }, [posts]);

  // Aggregate hashtag occurrences and engagement from posts
  const trendingHashtags = useMemo(() => {
    const map = new Map<string, { count: number; totalScore: number }>();
    posts.forEach((p) => {
      const score = calculateTrendScore(p);
      (p.hashtags || []).forEach((tag) => {
        const current = map.get(tag) || { count: 0, totalScore: 0 };
        map.set(tag, { count: current.count + 1, totalScore: current.totalScore + score });
      });
    });

    // Add popular ones if not present
    POPULAR_HASHTAGS.forEach((item) => {
      if (!map.has(item.tag)) {
        map.set(item.tag, { count: item.postsCount, totalScore: item.postsCount * 10 });
      }
    });

    return Array.from(map.entries())
      .map(([tag, data]) => ({ tag, count: data.count, totalScore: data.totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [posts]);

  // Top trending creators ranked by followers + posts
  const trendingCreators = useMemo(() => {
    return [...allUsers].sort((a, b) => b.followersCount - a.followersCount);
  }, [allUsers]);

  return (
    <div className="pb-24 max-w-md mx-auto px-3.5 pt-2">
      {/* Header Banner */}
      <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-sm">
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 fill-white" />
          <h2 className="text-lg font-black tracking-tight font-['Cairo']">
            🔥 TREND DZ - Top Trends Today
          </h2>
        </div>
        <p className="text-xs text-red-100 font-medium mt-0.5">
          الترندات الأكثر تفاعلاً اليوم في الجزائر حسب معادلة: التفاعل = (إعجابات × 3) + (تعليقات × 4) + (مشاركات × 5) + (مشاهدات × 0.1)
        </p>

        <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-red-100">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>يتم حساب الترتيب آلياً ومباشرة من تفاعلات المستخدمين</span>
          </span>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('posts')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>المنشورات</span>
        </button>
        <button
          onClick={() => setActiveTab('hashtags')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'hashtags'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>الهاشتاقات</span>
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'creators'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>المبدعون</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {trendingPosts.map((post, index) => (
            <div key={post.id} className="relative">
              {/* Rank Badge */}
              <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>#{index + 1}</span>
                <Flame className="w-3 h-3 fill-white" />
              </div>
              <PostCard post={post} onHashtagClick={onSelectHashtag} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'hashtags' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            الهاشتاقات المتصدرة في الجزائر اليوم
          </div>
          {trendingHashtags.map((item, idx) => (
            <button
              key={item.tag}
              onClick={() => onSelectHashtag(item.tag)}
              className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-black text-slate-400 group-hover:text-red-600">
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {item.tag}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {item.count.toLocaleString()} منشور متفاعل
                  </p>
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-80" />
            </button>
          ))}
        </div>
      )}

      {activeTab === 'creators' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            أبرز صناع المحتوى في الجزائر 🇩🇿
          </div>
          {trendingCreators.map((user, idx) => {
            const isFollowing = currentUser ? currentUser.following.includes(user.id) : false;
            const isMe = currentUser?.id === user.id;

            return (
              <div
                key={user.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                <div
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  onClick={() => onSelectUser(user.id)}
                >
                  <span className="text-xs font-black text-slate-400 w-5">#{idx + 1}</span>
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.displayName}
                      </h4>
                      {isOwnerUser(user) && <OwnerBadge size="xs" />}
                      {user.isVerified && <span className="text-xs text-blue-500">✓</span>}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      @{user.username} • {user.wilaya}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {user.followersCount.toLocaleString()} متابع
                    </p>
                  </div>
                </div>

                {!isMe && (
                  <button
                    onClick={() => followUser(user.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>متابع</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
