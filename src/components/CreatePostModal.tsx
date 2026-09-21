import React, { useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { ALGERIAN_WILAYAS } from '../data/wilayas';
import { PostCategory } from '../types';
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  MapPin,
  Sparkles,
  Hash,
  AlertCircle,
  Upload,
  Check,
  Music,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, createPost, openAuthModal, openAIAssistant } = useAppStore();

  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('memes');
  const [wilayaNumber, setWilayaNumber] = useState<number>(currentUser?.wilayaNumber || 16);
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [soundTitle, setSoundTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            تسجيل الدخول مطلوب 🇩🇿
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 leading-relaxed">
            لا يمكنك نشر محتوى في TREND DZ قبل تسجيل الدخول أو إنشاء حساب جديد.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
            >
              تسجيل الدخول الآن 🚀
            </button>
            <button
              onClick={onClose}
              className="w-full text-xs text-slate-500 py-2 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Client-side image compression using Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG at 82% quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate supported format
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setErrorMessage('صيغة الملف غير مدعومة! يرجى رفع صورة (JPG, PNG, WebP) أو فيديو (MP4, WebM).');
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      setErrorMessage('حجم الفيديو كبير جداً (الأقصى 50 ميغابايت للـ MVP).');
      return;
    }

    try {
      if (isImage) {
        const compressed = await compressImage(file);
        setMediaUrl(compressed);
        setMediaType('image');
      } else if (isVideo) {
        // Create local object URL for preview
        const videoUrl = URL.createObjectURL(file);
        setMediaUrl(videoUrl);
        setMediaType('video');
        setSelectedCategory('video');
      }
    } catch (err) {
      console.error('File compression error:', err);
      setErrorMessage('تعذر قراءة الملف، حاول مجدداً.');
    }
  };

  const handleAddSampleImage = (type: 'meme' | 'algeria') => {
    if (type === 'meme') {
      setMediaUrl('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80');
      setMediaType('image');
      setSelectedCategory('memes');
    } else {
      setMediaUrl('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80');
      setMediaType('image');
      setSelectedCategory('posts');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!content.trim() && !mediaUrl) {
      setErrorMessage('يرجى كتابة نص أو رفع صورة/فيديو للمنشور.');
      return;
    }

    const selectedWilayaObj = ALGERIAN_WILAYAS.find((w) => w.number === wilayaNumber);
    if (!selectedWilayaObj) {
      setErrorMessage('يرجى اختيار الولاية.');
      return;
    }

    setIsSubmitting(true);

    // Format hashtags array
    const manualTags = hashtagsInput
      .split(/[\s,]+/)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .filter((t) => t.length > 1);

    const res = createPost({
      content: content.trim(),
      mediaUrl,
      mediaType,
      category: selectedCategory,
      wilaya: selectedWilayaObj.nameAr,
      wilayaNumber: selectedWilayaObj.number,
      soundTitle: soundTitle.trim() || undefined,
      hashtags: manualTags,
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
      // Reset form
      setContent('');
      setMediaUrl(undefined);
      setMediaType('none');
      setHashtagsInput('');
      setSoundTitle('');
    } else {
      setErrorMessage(res.error || 'صرات مشكلة أثناء النشر.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">
              ➕
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
                إنشاء منشور جديد في TREND DZ
              </h3>
              <p className="text-[11px] text-slate-400">
                شارك الترند، الضحك، والمحتوى الجزائري مع خاوتك 🇩🇿
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Author Badge */}
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {currentUser.displayName}
              </h4>
              <p className="text-[11px] text-slate-400">
                @{currentUser.username} • ولاية {currentUser.wilaya}
              </p>
            </div>

            {/* AI Assistant helper trigger */}
            <button
              type="button"
              onClick={() => openAIAssistant('عطيني فكرة كابشن يضحك لمنشور')}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>استعن بـ "صاحبي 🤖"</span>
            </button>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              واش راك حاب تقول؟ (الكابشن) ✍️
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب بالدارجة، ميمز، فكرة، أو وصف للمنشور تاعك... هدرتنا شابة ونفهموها قاع 😂🇩🇿"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-['Cairo']"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              تصنيف المنشور 🏷️
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'memes', label: 'ميمز 😂' },
                { id: 'video', label: 'فيديو 🎬' },
                { id: 'posts', label: 'منشورات 🗣️' },
                { id: 'audio', label: 'أصوات 🎵' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as PostCategory)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wilaya Selector (58 Wilayas) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>الولاية الجزائرية 🇩🇿</span>
            </label>
            <select
              value={wilayaNumber}
              onChange={(e) => setWilayaNumber(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {ALGERIAN_WILAYAS.map((w) => (
                <option key={w.number} value={w.number}>
                  {w.number} - {w.nameAr} ({w.nameFr})
                </option>
              ))}
            </select>
          </div>

          {/* Media Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>الصورة أو الفيديو 📸🎬</span>
              <span className="text-[10px] text-slate-400">يدعم ضغط الصور تلقائياً</span>
            </label>

            {mediaUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 max-h-56 flex items-center justify-center">
                {mediaType === 'image' ? (
                  <img src={mediaUrl} alt="معاينة" className="max-h-56 w-full object-cover" />
                ) : (
                  <video src={mediaUrl} controls className="max-h-56 w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(undefined);
                    setMediaType('none');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black/90 cursor-pointer"
                  title="إزالة الوسائط"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    اضغط لرفع صورة أو فيديو من جهازك
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    يدعم JPG, PNG, WebP وفيديوهات MP4
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Quick Samples for Fast Testing in MVP */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <span>أو اختر صورة جاهزة للتجربة:</span>
                  <button
                    type="button"
                    onClick={() => handleAddSampleImage('meme')}
                    className="text-red-600 dark:text-red-400 underline font-semibold cursor-pointer"
                  >
                    صورة ميمز 😂
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleAddSampleImage('algeria')}
                    className="text-red-600 dark:text-red-400 underline font-semibold cursor-pointer"
                  >
                    صورة دزاير 🇩🇿
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hashtags Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-red-500" />
              <span>الهاشتاقات (Hashtags)</span>
            </label>
            <input
              type="text"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              placeholder="مثال: #ترند_الجزائر #ضحك_dz #ميمز"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['#ترند_الجزائر', '#ضحك_جزائري', '#ميمز_dz', '#dzpower'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setHashtagsInput((prev) => (prev ? `${prev} ${tag}` : tag))
                  }
                  className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Sound / Music title (optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-red-500" />
              <span>اسم الصوت أو الأغنية (اختياري)</span>
            </label>
            <input
              type="text"
              value={soundTitle}
              onChange={(e) => setSoundTitle(e.target.value)}
              placeholder="مثال: صوت ميمز دزاير الأصلي 🎵"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </form>

        {/* Footer with Submit Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>نشر 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
