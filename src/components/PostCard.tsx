import React, { useState, useRef } from 'react';
import { Post } from '../types';
import { useAppStore } from '../lib/store';
import { OwnerBadge } from './OwnerBadge';
import { isOwnerUid } from '../lib/ownerConfig';
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MoreVertical,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  Clock,
  ShieldAlert,
  Trash2,
  Flame,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onHashtagClick?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onHashtagClick }) => {
  const {
    currentUser,
    isOwner,
    likePost,
    sharePost,
    incrementViews,
    openComments,
    deletePost,
    openReportModal,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;
  const isAuthor = currentUser?.id === post.authorId;
  const isAuthorOwner = isOwnerUid(post.authorId) || post.authorRole === 'owner';
  const canDelete = isAuthor || isOwner;

  // Format date in Arabic relative time
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} سا`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      incrementViews(post.id);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleLike = () => {
    likePost(post.id);
    incrementViews(post.id);
  };

  const handleOpenComments = () => {
    openComments(post.id);
    incrementViews(post.id);
  };

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden mb-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
    >
      {/* Post Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              loading="lazy"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
            />
            {post.isDevSeed && (
              <span
                className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-full border border-white dark:border-slate-900"
                title="حساب تجريبي (Seed)"
              >
                DEV
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {post.authorName}
              </h3>
              {isAuthorOwner && <OwnerBadge size="xs" />}
              <span className="text-xs text-slate-400 font-normal">@{post.authorUsername}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
                <MapPin className="w-3 h-3 text-red-500" />
                {post.wilayaNumber} - {post.authorWilaya}
              </span>
              <span className="flex items-center gap-0.5 text-slate-400">
                <Clock className="w-2.5 h-2.5" />
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* 3-dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="خيارات المنشور"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 divide-y divide-slate-100 dark:divide-slate-700">
                {canDelete ? (
                  <button
                    onClick={() => {
                      deletePost(post.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-right px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAuthor ? 'حذف المنشور' : 'حذف المنشور (إشراف المالك 👑)'}</span>
                  </button>
                ) : null}

                <button
                  onClick={() => {
                    openReportModal({ type: 'post', id: post.id });
                    setShowMenu(false);
                  }}
                  className="w-full text-right px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>تبليغ عن المنشور (Report 🚨)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Text & Hashtags */}
      <div className="px-3.5 pb-2.5">
        <p className="text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-line font-['Cairo']">
          {post.content}
        </p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onHashtagClick && onHashtagClick(tag)}
                className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Sound Pill */}
        {post.soundTitle && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full">
            <Volume2 className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="truncate max-w-[220px]">{post.soundTitle}</span>
          </div>
        )}
      </div>

      {/* Media Content */}
      {post.mediaUrl && (
        <div className="relative w-full bg-black/5 dark:bg-black/30 overflow-hidden">
          {post.mediaType === 'image' ? (
            <div className="relative w-full max-h-[480px] flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800 animate-pulse min-h-[260px]">
                  <Flame className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <img
                src={post.mediaUrl}
                alt="محتوى المنشور"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-auto max-h-[480px] object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          ) : post.mediaType === 'video' ? (
            <div
              className="relative w-full bg-black flex items-center justify-center aspect-[4/5] max-h-[500px] cursor-pointer"
              onClick={toggleVideoPlay}
            >
              <video
                ref={videoRef}
                src={post.mediaUrl}
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Play / Pause Overlay Icon */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-14 h-14 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                    <Play className="w-7 h-7 fill-slate-900 ml-1" />
                  </div>
                </div>
              )}

              {/* Mute / Unmute Button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-3 left-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors z-10 cursor-pointer"
                aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Video Badge */}
              <span className="absolute top-3 right-3 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                فيديو DZ 🎬
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Engagement Actions Bar */}
      <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            id={`btn-like-${post.id}`}
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-125 cursor-pointer ${
              isLiked ? 'text-red-600 dark:text-red-500' : 'text-slate-600 dark:text-slate-400 hover:text-red-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600 dark:fill-red-500 text-red-600 dark:text-red-500' : ''}`} />
            <span>{post.likesCount.toLocaleString()}</span>
          </button>

          {/* Comment Button */}
          <button
            id={`btn-comment-${post.id}`}
            onClick={handleOpenComments}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount.toLocaleString()}</span>
          </button>

          {/* Share Button */}
          <button
            id={`btn-share-${post.id}`}
            onClick={() => sharePost(post.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span>{post.sharesCount.toLocaleString()}</span>
          </button>
        </div>

        {/* Views Count */}
        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <Eye className="w-4 h-4" />
          <span>{post.viewsCount.toLocaleString()} مشاهدة</span>
        </div>
      </div>
    </article>
  );
};
