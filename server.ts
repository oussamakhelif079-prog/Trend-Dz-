import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'TREND DZ',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Algerian Assistant ("اسقسي صاحبي 🤖🇩🇿")
app.post('/api/ai/sahbi', async (req: Request, res: Response) => {
  try {
    const { prompt, action, contextTrends } = req.body;

    if (!prompt && !action) {
      return res.status(400).json({ error: 'يرجى تقديم سؤال أو طلب لصاحبي' });
    }

    const ai = getGeminiClient();

    // If Gemini key is configured, call gemini-3.8-flash
    if (ai) {
      const systemInstruction = `أنت "صاحبي 🤖🇩🇿" المساعد الذكي الجزائري لتطبيق شبكة التواصل TREND DZ.
تتحدث بالدارجة الجزائرية الأصيلة والمحبوبة مع لمسات خفيفة من الفرنسية العفوية كما يتحدث الشباب الجزائري تماماً (Dz slang & Darija).
مهمتك مساعدة صناع المحتوى ورواد التطبيق:
1. إعطاء Captions مضحكة ومبتكرة للميمز والمنشورات.
2. اقتراح Hashtags جزائرية قوية ومناسبة.
3. تحسين المنشورات وإعطائها نكهة دزيرية جذابة.
4. تحويل النصوص العربية أو الفرنسية إلى الدارجة.
5. اقتراح أفكار لفيديوهات قصيرة ريلز وتيك توك ستايل جزائري.
6. إذا سألك المستخدم "واش راهو الترند اليوم؟" أو عن الترندات الحالية، أجب بناءً فقط على بيانات التطبيق التالية:
${contextTrends || 'حالياً الترندات الأكثر تفاعلاً تدور حول ميمز الباك والجامعة، غروب الشمس في سانتا كروز بوهران، وجسور قسنطينة التاريخية، وميمز الحفاف الجزائري.'}
ولا تخترع ترندات غير متوفرة!
كن مرحاً ومفيداً، واستخدم تعابير دزيرية مثل: خويا، ختي، فور بزاف، هبال، هادي واعرة، والله غير صح، ما شاء الله، صحيت.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt || action,
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });

      const reply = response.text || 'يعطيك الصحة خويا! عاود سولني راني هنا معاك 🇩🇿';
      return res.json({ reply, source: 'gemini' });
    }

    // Smart Fallback when GEMINI_API_KEY is not configured yet
    const query = (prompt || action || '').toLowerCase();
    let fallbackReply = '';

    if (query.includes('caption') || query.includes('كابشن') || action === 'caption') {
      const captions = [
        'كي تقول غير 5 دقايق ونوض نخدم... وبعد تلقى روحك 3 ساعات وانت فالتيليفون وداير فيها ريلز 😂💀',
        'العقلية دزيرية: كلش ساهل حتى نهار الامتحان ههههههه 🇩🇿⚡',
        'كي تسقسي يماك وين راهي حاجتي وتقولك "لوكان نوض ونلقاها واش نديرلك؟" هادي رعب الطفولة 😂🏃‍♂️',
        'نهار الجمعة بعد الكسكسي: سبات شتوي إجباري لجميع أفراد العائلة 😴🍲',
        'مادامك راك تقرا في الكابشن دير أبوني وكومنت، متخليهاش في قلبك يا خويا الباهي ❤️🇩🇿',
      ];
      fallbackReply = captions[Math.floor(Math.random() * captions.length)];
    } else if (query.includes('ترند') || query.includes('trend') || action === 'trends') {
      fallbackReply =
        'واش راهو داير اليوم في TREND DZ؟ 🔥🇩🇿\n- الترند #1: ميمز الحفاف الجزائري و"نقصلي غير شوية" ✂️😂\n- الترند #2: فيديو الغروب الخيالي من سانتا كروز وهران 🌅\n- الترند #3: هاشتاق #ضحك_جزائري و #سياحة_جزائرية محتلين الصدارة!';
    } else if (query.includes('هاشتاق') || query.includes('hashtag') || action === 'hashtags') {
      fallbackReply =
        'هاك خويا الهاشتاقات الأكثر طلوعاً وتفاعلاً اليوم في دزاير:\n#trend_dz #الجزائر #ضحك_جزائري #algerie #dzpower #ميمز_dz #وهران_الباهية 🇩🇿🚀';
    } else if (query.includes('فكرة') || query.includes('video') || action === 'video_idea') {
      fallbackReply =
        '💡 فكرة فيديو قنبلة دير بيها البوز:\nصور فيديو عفوي على "أنواع الناس في العراس الجزائرية" أو "كي يروح التيليفون يشرجى بـ 1%" مع تمثيل الدارجة تاعنا، هادو يطيرو ديما فالتفاعل! 🎬🔥';
    } else {
      fallbackReply =
        'مرحبا بيك يا خويا! راني هنا "صاحبي 🤖🇩🇿" نعاونك في كلش: كابشنات تضحك، أفكار منشورات، لهاشتاقات وترندات الـ DZ. واش راك محتاج اليوم؟';
    }

    return res.json({
      reply: fallbackReply,
      source: 'fallback',
      notice: 'ملاحظة: يمكنك تفعيل الذكاء الكامل عبر وضع مفتاح GEMINI_API_KEY في ملف الإعدادات.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/sahbi:', error);
    res.status(500).json({
      error: 'صرات مشكلة صغيرة، عاود جرب بعد شوية.',
      developerMessage: error?.message,
    });
  }
});

// Setup Vite or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TREND DZ] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
