import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { OwnerBadge } from './OwnerBadge';
import { isOwnerUid } from '../lib/ownerConfig';
import { X, Heart, Send, MessageCircle, AlertCircle } from 'lucide-react';

export const CommentsBottomSheet: React.FC = () => {
  const {
    activeCommentsPostId,
    closeComments,
    comments,
    addComment,
    likeComment,
    posts,
    currentUser,
    openAuthModal,
  } = useAppStore();

  const [newCommentText, setNewCommentText] = useState('');

  const targetPost = useMemo(() => {
    if (!activeCommentsPostId) return null;
    return posts.find((p) => p.id === activeCommentsPostId) || null;
  }, [activeCommentsPostId, posts]);

  const postComments = useMemo(() => {
    if (!activeCommentsPostId) return [];
    return comments.filter((c) => c.postId === activeCommentsPostId);
  }, [activeCommentsPostId, comments]);

  if (!activeCommentsPostId) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!newCommentText.trim()) return;

    const ok = addComment(activeCommentsPostId, newCommentText);
    if (ok) {
      setNewCommentText('');
    }
  };

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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={closeComments}
        aria-label="إغلاق التعليقات"
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full mx-auto flex flex-col max-h-[82vh] z-10 animate-slide-up">
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 mb-1"></div>

        {/* Sheet Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-red-600 dark:text-red-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              التعليقات ({postComments.length})
            </h3>
            {targetPost && (
              <span className="text-xs text-slate-400 truncate max-w-[150px]">
                على منشور @{targetPost.authorUsername}
              </span>
            )}
          </div>
          <button
            onClick={closeComments}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[160px]">
          {postComments.length > 0 ? (
            postComments.map((comment) => {
              const isLiked = currentUser ? comment.likedBy.includes(currentUser.id) : false;
              const isCommentOwner = isOwnerUid(comment.authorId) || comment.authorRole === 'owner';
              return (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="w-8 h-8 rounded-full object-cover mt-0.5"
                  />
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-2xl">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {comment.authorName}
                        </h4>
                        {isCommentOwner && <OwnerBadge size="xs" />}
                        <span className="text-[10px] text-slate-400">
                          {comment.authorWilaya}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-['Cairo']">
                      {comment.content}
                    </p>
                  </div>

                  {/* Comment Like Button */}
                  <button
                    onClick={() => likeComment(comment.id)}
                    className={`p-1 text-center transition-transform active:scale-125 cursor-pointer ${
                      isLiked ? 'text-red-600' : 'text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                    <span className="text-[10px] font-bold block mt-0.5">
                      {comment.likesCount > 0 ? comment.likesCount : ''}
                    </span>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-medium">ما كاش حتى تعليق هنا لحد الآن!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                كن أول من يعلق وشاركنا رأيك بالدارجة 🇩🇿
              </p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          {currentUser ? (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="اكتب تعليقك هنا بالدارجة... 🇩🇿"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-['Cairo']"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4 rtl:-scale-x-100" />
              </button>
            </form>
          ) : (
            <div className="text-center py-1">
              <button
                onClick={openAuthModal}
                className="text-xs font-bold text-red-600 dark:text-red-400 underline cursor-pointer"
              >
                سجّل الدخول لتتمكن من كتابة تعليق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
