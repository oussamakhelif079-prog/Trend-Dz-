import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { PostCard } from './PostCard';
import { OwnerBadge } from './OwnerBadge';
import { isOwnerUser } from '../lib/ownerConfig';
import { Search, X, Users, Hash, FileText, UserPlus, Check, Flame } from 'lucide-react';
import { POPULAR_HASHTAGS } from '../data/seedData';

interface SearchViewProps {
  onSelectUser: (userId: string) => void;
  initialQuery?: string;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectUser, initialQuery = '' }) => {
  const { posts, allUsers, currentUser, followUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'users' | 'hashtags'>('all');

  // Search logic
  const trimmed = searchQuery.trim().toLowerCase();

  const matchingPosts = useMemo(() => {
    if (!trimmed) return [];
    return posts.filter((p) => {
      const inContent = p.content.toLowerCase().includes(trimmed);
      const inTags = (p.hashtags || []).some((t) => t.toLowerCase().includes(trimmed));
      const inAuthor = p.authorName.toLowerCase().includes(trimmed) || p.authorUsername.toLowerCase().includes(trimmed);
      const inWilaya = p.authorWilaya.toLowerCase().includes(trimmed);
      return inContent || inTags || inAuthor || inWilaya;
    });
  }, [posts, trimmed]);

  const matchingUsers = useMemo(() => {
    if (!trimmed) return [];
    return allUsers.filter((u) => {
      return (
        u.displayName.toLowerCase().includes(trimmed) ||
        u.username.toLowerCase().includes(trimmed) ||
        u.wilaya.toLowerCase().includes(trimmed) ||
        u.bio.toLowerCase().includes(trimmed)
      );
    });
  }, [allUsers, trimmed]);

  const matchingHashtags = useMemo(() => {
    if (!trimmed) return [];
    const allTags = new Set<string>();
    posts.forEach((p) => (p.hashtags || []).forEach((t) => allTags.add(t)));
    POPULAR_HASHTAGS.forEach((item) => allTags.add(item.tag));

    return Array.from(allTags).filter((tag) => tag.toLowerCase().includes(trimmed));
  }, [posts, trimmed]);

  const totalResults = matchingPosts.length + matchingUsers.length + matchingHashtags.length;

  return (
    <div className="pb-24 max-w-md mx-auto px-3.5 pt-2">
      {/* Search Input Bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن ميمز، صناع محتوى، ولايات، أو #هاشتاق... 🔍"
          className="w-full pl-9 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs font-['Cairo']"
        />
        <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none no-scrollbar">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'posts', label: 'المنشورات' },
          { id: 'users', label: 'الحسابات' },
          { id: 'hashtags', label: 'الهاشتاقات' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Content */}
      {trimmed ? (
        totalResults > 0 ? (
          <div className="space-y-4">
            {/* Matching Users Section */}
            {(activeFilter === 'all' || activeFilter === 'users') && matchingUsers.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2 text-xs font-bold text-slate-400">
                  الحسابات ({matchingUsers.length})
                </div>
                {matchingUsers.map((user) => {
                  const isFollowing = currentUser ? currentUser.following.includes(user.id) : false;
                  const isMe = currentUser?.id === user.id;

                  return (
                    <div
                      key={user.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl"
                    >
                      <div
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                        onClick={() => onSelectUser(user.id)}
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {user.displayName}
                            </h4>
                            {isOwnerUser(user) && <OwnerBadge size="xs" />}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            @{user.username} • {user.wilaya}
                          </p>
                        </div>
                      </div>

                      {!isMe && (
                        <button
                          onClick={() => followUser(user.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-red-600 text-white shadow-sm'
                          }`}
                        >
                          {isFollowing ? 'متابع' : 'متابعة'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Matching Hashtags Section */}
            {(activeFilter === 'all' || activeFilter === 'hashtags') && matchingHashtags.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-xs font-bold text-slate-400 mb-2">
                  الهاشتاقات ({matchingHashtags.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchingHashtags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Hash className="w-3.5 h-3.5" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Posts Section */}
            {(activeFilter === 'all' || activeFilter === 'posts') && matchingPosts.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 px-1">
                  المنشورات ({matchingPosts.length})
                </div>
                {matchingPosts.map((post) => (
                  <PostCard key={post.id} post={post} onHashtagClick={(t) => setSearchQuery(t)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty Search Results */
          <div className="my-14 text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              ما لقيناش واش راك تقلب عليه 🔍
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              جرب تكتب كلمة مفتاحية أخرى، أو ابحث باسم ولاية جزائرية.
            </p>
          </div>
        )
      ) : (
        /* Discovery suggestions when search is empty */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-2.5">
              <Flame className="w-4 h-4 text-red-600" />
              <span>اقتراحات بحث شائعة في الجزائر 🔥</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_HASHTAGS.map((h) => (
                <button
                  key={h.tag}
                  onClick={() => setSearchQuery(h.tag)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{h.icon}</span>
                  <span>{h.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
