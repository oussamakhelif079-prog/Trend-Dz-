import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Flame,
  Copy,
  Check,
  RotateCcw,
  Smile,
  Hash,
  Wand2,
  Languages,
  Video,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'sahbi';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'fallback';
}

export const AIAssistantModal: React.FC = () => {
  const { isAIAssistantOpen, closeAIAssistant, posts, showToast } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'sahbi',
      text: 'واش راك يا خويا! أنا "صاحبي 🤖🇩🇿"، رفيقك في TREND DZ.\nعطيني أي فكرة ولا صورة ولا ميم وقولي واش راك حاب: كابشن يضحك، هاشتاقات طالعة، ولا فكرة فيديو يدير البوز! واش تحب نسقسيك؟',
      timestamp: new Date().toISOString(),
      source: 'gemini',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Compile real active trends from posts for contextual grounding
  const activeTrendsSummary = React.useMemo(() => {
    const topPosts = [...posts].slice(0, 3);
    const postTitles = topPosts.map((p) => `منشور "${p.content.slice(0, 40)}..." لـ @${p.authorUsername} (${p.likesCount} لايك)`).join('، ');
    return `الترندات المتصدرة في تطبيق TREND DZ حالياً هي: ${postTitles}`;
  }, [posts]);

  useEffect(() => {
    if (isAIAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAIAssistantOpen]);

  if (!isAIAssistantOpen) return null;

  const handleSendPrompt = async (promptToSend: string, actionType?: string) => {
    if (!promptToSend.trim() && !actionType) return;

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/sahbi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          action: actionType,
          contextTrends: activeTrendsSummary,
        }),
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `msg_s_${Date.now()}`,
        sender: 'sahbi',
        text: data.reply || 'يعطيك الصحة خويا! راني هنا إذا خصك شي حاجة 🇩🇿',
        timestamp: new Date().toISOString(),
        source: data.source,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('AI assistant error:', err);
      const fallbackMsg: Message = {
        id: `msg_s_${Date.now()}`,
        sender: 'sahbi',
        text: 'صرات مشكلة صغيرة فالشبكة يا خويا، عاود سقسيني بعد شوية ونكون معاك!',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('تم نسخ كلام صاحبي! تقدر تستعمله في منشورك 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Suggestion Chips
  const quickSuggestions = [
    { label: '😂 عطيني Caption يضحك', prompt: 'خويا عطيني كابشن يضحك ومناسب لميم جزائري 😂', action: 'caption' },
    { label: '🔥 اقترح Hashtags طالعة', prompt: 'واش هي أحسن لهاشتاقات الجزائرية اللي تطلع المنشور للترند؟', action: 'hashtags' },
    { label: '📊 واش راهو الترند اليوم؟', prompt: 'واش راهو داير الترند اليوم في TREND DZ؟', action: 'trends' },
    { label: '💡 عطيني فكرة فيديو ريلز', prompt: 'عطيني فكرة فيديو جزائري قصير ريلز يدير تفاعل وبوز', action: 'video_idea' },
    { label: '✍️ حسّن المنشور', prompt: 'كيفاش نكتب منشور جذاب ويجيب لايكات بالدارجة؟', action: 'improve' },
    { label: '🇩🇿 حولها للدارجة', prompt: 'ترجملي هذه الجملة للدارجة العاصمية والوهرانية بطريقة عفوية', action: 'darija' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[750px]">
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm font-['Cairo']">
                <span>اسقسي صاحبي</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md font-sans">
                  🤖 DZ AI
                </span>
                <span>🇩🇿</span>
              </div>
              <p className="text-[10px] text-emerald-100 font-medium">
                مستشارك الجزائري الذكي للترند، الميمز وصناعة المحتوى
              </p>
            </div>
          </div>
          <button
            onClick={closeAIAssistant}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestions Carousel */}
        <div className="p-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none">
          {quickSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(item.prompt, item.action)}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Conversation Message List */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((msg) => {
            const isSahbi = msg.sender === 'sahbi';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isSahbi ? 'justify-start' : 'justify-end'}`}
              >
                {isSahbi && (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed font-['Cairo'] shadow-xs relative group ${
                    isSahbi
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tr-none'
                      : 'bg-emerald-600 text-white rounded-tl-none font-medium'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Action Copy for Sahbi messages */}
                  {isSahbi && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{msg.source === 'gemini' ? 'Gemini 3.8 Flash ⚡' : 'صاحبي DZ'}</span>
                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-bold"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                🤖
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tr-none border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>صاحبي راهو يخمم ويكتبلك بالدارجة... ⏳</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="سقسي صاحبي أي حاجة بالدارجة... 🇩🇿"
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-['Cairo']"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
