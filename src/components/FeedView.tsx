import React, { useMemo, useState } from 'react';
import { useAppStore } from '../lib/store';
import { PostCard } from './PostCard';
import { PostCategory } from '../types';
import { ALGERIAN_WILAYAS } from '../data/wilayas';
import { Flame, Sparkles, Filter, PlusCircle, RefreshCw } from 'lucide-react';

interface FeedViewProps {
  onOpenCreate: () => void;
  onSelectHashtag: (tag: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onOpenCreate, onSelectHashtag }) => {
  const {
    posts,
    selectedCategory,
    setSelectedCategory,
    selectedWilaya,
    setSelectedWilaya,
  } = useAppStore();

  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories: { id: PostCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'الكل', icon: '🇩🇿' },
    { id: 'memes', label: 'ميمز', icon: '😂' },
    { id: 'video', label: 'فيديو', icon: '🎬' },
    { id: 'posts', label: 'منشورات', icon: '🗣️' },
    { id: 'audio', label: 'أصوات', icon: '🎵' },
  ];

  // Filter posts by category and wilaya
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category match
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'audio') {
          if (!post.soundTitle) return false;
        } else if (post.category !== selectedCategory) {
          return false;
        }
      }

      // Wilaya match
      if (selectedWilaya !== null && post.wilayaNumber !== selectedWilaya) {
        return false;
      }

      return true;
    });
  }, [posts, selectedCategory, selectedWilaya]);

  const activeWilayaObj = selectedWilaya
    ? ALGERIAN_WILAYAS.find((w) => w.number === selectedWilaya)
    : null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-3.5 pt-2">
      {/* Top Banner: "واش راهو داير اليوم؟ 🔥" */}
      <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 font-black text-base tracking-tight font-['Cairo']">
            <span>واش راهو داير اليوم؟</span>
            <span className="text-amber-300">🔥</span>
          </div>
          <p className="text-xs text-rose-100 font-medium mt-0.5">
            كل ما هو ترند، ميمز وبوز فالجزائر راهو هنا
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="تحديث المنشورات"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm shadow-red-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Wilaya Filter Indicator if active */}
      {activeWilayaObj && (
        <div className="mb-3 flex items-center justify-between bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-3 py-1.5 text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>
              عرض منشورات ولاية {activeWilayaObj.nameAr} ({activeWilayaObj.number})
            </span>
          </div>
          <button
            onClick={() => setSelectedWilaya(null)}
            className="text-[11px] underline font-bold cursor-pointer hover:text-red-900"
          >
            إلغاء الفلتر
          </button>
        </div>
      )}

      {/* Posts Feed or Empty State */}
      {filteredPosts.length > 0 ? (
        <div>
          {filteredPosts.slice(0, visibleCount).map((post) => (
            <PostCard key={post.id} post={post} onHashtagClick={onSelectHashtag} />
          ))}

          {/* Load More Pagination Button */}
          {visibleCount < filteredPosts.length && (
            <div className="pt-2 pb-4 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer shadow-sm"
              >
                تحميل المزيد من المنشورات 🇩🇿
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="my-12 text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-500 mx-auto flex items-center justify-center mb-3">
            <Flame className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            مازال ما كاش ترند هنا 😅
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            كون أول واحد ينشر في هذا التصنيف وخلّي الناس تشوف إبداعك!
          </p>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>انشر أول منشور 🚀</span>
          </button>
        </div>
      )}
    </div>
  );
};
