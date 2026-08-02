import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_WORSHIP_PLACES, INITIAL_SERMONS } from './src/initialData.js';
import { WorshipPlace, Sermon, BroadcastLog } from './src/types.js';
import { initDb, pool } from './src/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory data storage (pre-populated with rich multi-faith initial data)
let worshipPlaces: WorshipPlace[] = [...INITIAL_WORSHIP_PLACES];
let sermons: Sermon[] = [...INITIAL_SERMONS];
let broadcastLogs: BroadcastLog[] = [
  {
    id: 'log-101',
    sermonId: 'sermon-1',
    sermonTitle: 'خطبة الجمعة: أهمية الصبر والتوكل والتراحم في حياة المسلم',
    placeName: 'Al-Farooq Central Grand Mosque',
    timestamp: new Date().toISOString(),
    channel: 'Both',
    recipientsCount: 1420,
    languageBreakdown: {
      Urdu: 620,
      English: 450,
      Arabic: 200,
      Turkish: 150,
    },
    sampleMessages: [
      {
        recipientName: 'Muhammad Farhan',
        language: 'Urdu',
        channel: 'WhatsApp',
        previewText: '🕌 *الفرق گرینڈ مسجد - جمعہ کا خطبہ*\n*عنوان:* صابر اور توکل کی اہمیت\n*مضمون:* صبر محض خاموشی نہیں بلکہ ایمان کے ساتھ مسلسل جدوجہد ہے۔ توکل کا مطلب جائز تدبیر کے ساتھ اللہ پر کامل اعتماد ہے۔',
        status: 'Delivered',
      },
      {
        recipientName: 'Sarah Jenkins',
        language: 'English',
        channel: 'Email',
        previewText: 'Subject: Translated Friday Khutbah from Al-Farooq Mosque\n\nDear Worshipper,\nHere is today’s Friday Sermon translated into English: "The Importance of Patience and Trust in Divine Mercy".',
        status: 'Read',
      },
    ],
  },
];

// Helper to get Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
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

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET /api/places - List prayer places with optional filters
app.get('/api/places', (req, res) => {
  const { religion, city, q } = req.query;
  let result = [...worshipPlaces];

  if (religion && religion !== 'All') {
    result = result.filter(
      (p) => p.religion.toLowerCase() === (religion as string).toLowerCase()
    );
  }

  if (city) {
    result = result.filter((p) =>
      p.city.toLowerCase().includes((city as string).toLowerCase())
    );
  }

  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.preacherName.toLowerCase().includes(query) ||
        p.religion.toLowerCase().includes(query)
    );
  }

  res.json(result);
});

// POST /api/places - Create / setup a new prayer place
app.post('/api/places', (req, res) => {
  const newPlace: WorshipPlace = {
    id: `place-${Date.now()}`,
    name: req.body.name || 'New Prayer Center',
    religion: req.body.religion || 'Islam',
    venueType: req.body.venueType || 'Mosque / Masjid',
    congregationDay: req.body.congregationDay || 'Friday',
    city: req.body.city || 'Local City',
    country: req.body.country || 'Country',
    address: req.body.address || '123 Peace Way',
    imageUrl:
      req.body.imageUrl ||
      'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800',
    adminName: req.body.adminName || 'Admin User',
    preacherTitle: req.body.preacherTitle || 'Imam / Preacher',
    preacherName: req.body.preacherName || 'Lead Preacher',
    contactEmail: req.body.contactEmail || 'admin@placeofworship.org',
    contactPhone: req.body.contactPhone || '+1 555 0199',
    description: req.body.description || 'A welcoming house of worship.',
    followerCount: 1,
    languagesOffered: req.body.languagesOffered || ['English', 'Urdu', 'Arabic'],
  };

  worshipPlaces.unshift(newPlace);
  res.status(201).json(newPlace);
});

// GET /api/sermons - List sermons
app.get('/api/sermons', (req, res) => {
  const { placeId, religion, q } = req.query;
  let result = [...sermons];

  if (placeId) {
    result = result.filter((s) => s.placeId === placeId);
  }

  if (religion && religion !== 'All') {
    result = result.filter(
      (s) => s.religion.toLowerCase() === (religion as string).toLowerCase()
    );
  }

  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.placeName.toLowerCase().includes(query) ||
        s.speakerName.toLowerCase().includes(query) ||
        s.summary.toLowerCase().includes(query)
    );
  }

  res.json(result);
});

// POST /api/sermons - Create / Upload a sermon
app.post('/api/sermons', (req, res) => {
  const place = worshipPlaces.find((p) => p.id === req.body.placeId);
  const newSermon: Sermon = {
    id: `sermon-${Date.now()}`,
    placeId: req.body.placeId || (worshipPlaces[0]?.id ?? 'place-1'),
    placeName: place ? place.name : req.body.placeName || 'Local Worship Center',
    religion: place ? place.religion : req.body.religion || 'Islam',
    title: req.body.title || 'Untitled Sermon',
    speakerName: req.body.speakerName || place?.preacherName || 'Spiritual Leader',
    speakerTitle: req.body.speakerTitle || place?.preacherTitle || 'Preacher',
    originalLanguage: req.body.originalLanguage || 'Arabic',
    originalLanguageCode: req.body.originalLanguageCode || 'ar',
    date: new Date().toISOString().split('T')[0],
    originalText: req.body.originalText || '',
    summary: req.body.summary || 'Summary of the spiritual discourse.',
    keyTakeaways: req.body.keyTakeaways || [
      'Reflect on spiritual values',
      'Practice community unity',
    ],
    scriptureReference: req.body.scriptureReference,
    topicTags: req.body.topicTags || ['Faith', 'Community'],
  };

  sermons.unshift(newSermon);
  res.status(201).json(newSermon);
});

// POST /api/translate - High-accuracy AI Sermon Translation using Gemini
app.post('/api/translate', async (req, res) => {
  try {
    const { title, originalText, summary, keyTakeaways, religion, targetLanguage } = req.body;

    if (!originalText || !targetLanguage) {
      return res.status(400).json({ error: 'Missing originalText or targetLanguage' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback response if API key is pending configuration
      return res.json({
        translatedTitle: `[${targetLanguage}] ${title || 'Sermon'}`,
        translatedText: `[Translation Preview in ${targetLanguage}]\n\n${originalText}`,
        translatedSummary: `[${targetLanguage} Summary] ${summary || ''}`,
        translatedTakeaways: (keyTakeaways || []).map((k: string) => `• [${targetLanguage}] ${k}`),
        sacredTerminologyNotes: `Preserved sacred terminology for ${religion || 'Faith'} tradition.`,
      });
    }

    const prompt = `You are an expert multilingual religious scholar and translator specializing in sacred texts, sermons, khutbahs, homilies, and spiritual discourses.
Translate the following sermon into ${targetLanguage}.

Religion / Faith Context: ${religion || 'Universal Faith'}
Original Title: ${title || 'Sermon'}
Original Text: ${originalText}
Original Summary: ${summary || ''}
Key Takeaways: ${JSON.stringify(keyTakeaways || [])}

IMPORTANT TRANSLATION RULES:
1. Maintain maximum reverence, eloquence, and respect suitable for a holy sermon or Khutbah.
2. Accurately translate sacred concepts while retaining proper honorifics or recognized religious terms where appropriate (e.g. for Urdu/Arabic/Hindi/Spanish/etc., use traditional spiritual vocabulary).
3. Produce clear, natural, and moving prose.
4. Return JSON only with the following structure:
{
  "translatedTitle": "string",
  "translatedText": "string",
  "translatedSummary": "string",
  "translatedTakeaways": ["string array"],
  "sacredTerminologyNotes": "brief note on how key sacred terms were localized respectfully"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        translatedTitle: `[${targetLanguage}] ${title}`,
        translatedText: responseText,
        translatedSummary: `[${targetLanguage}] ${summary}`,
        translatedTakeaways: keyTakeaways,
        sacredTerminologyNotes: 'Translated using Gemini AI.',
      };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      details: error.message || String(error),
    });
  }
});

// POST /api/broadcast - Simulate broadcasting translated sermon via WhatsApp & Email
app.post('/api/broadcast', async (req, res) => {
  const { sermonId, deliveryChannels, customNote } = req.body;
  const sermon = sermons.find((s) => s.id === sermonId);

  if (!sermon) {
    return res.status(404).json({ error: 'Sermon not found' });
  }

  const place = worshipPlaces.find((p) => p.id === sermon.placeId);
  const totalFollowers = place ? place.followerCount : 100;

  // Build realistic simulated distribution
  const log: BroadcastLog = {
    id: `log-${Date.now()}`,
    sermonId: sermon.id,
    sermonTitle: sermon.title,
    placeName: sermon.placeName,
    timestamp: new Date().toISOString(),
    channel: deliveryChannels || 'Both',
    recipientsCount: totalFollowers,
    languageBreakdown: {
      Urdu: Math.round(totalFollowers * 0.45),
      English: Math.round(totalFollowers * 0.35),
      Arabic: Math.round(totalFollowers * 0.12),
      Spanish: Math.round(totalFollowers * 0.08),
    },
    sampleMessages: [
      {
        recipientName: 'Tariq Hussain',
        language: 'Urdu',
        channel: 'WhatsApp',
        previewText: `🕌 *${sermon.placeName} - آن لائن خطبہ / بیان*\n\n*عنوان:* ${sermon.title}\n\n*اہم معلومات:* ${sermon.summary}\n\n${customNote ? `_انتظامیہ پیغام:_ ${customNote}\n\n` : ''}مکمل ترجمہ اور آڈیو سننے کیلئے لنک پر کلک کریں: ${process.env.APP_URL || 'https://sermon-gateway.app'}/sermons/${sermon.id}?lang=ur`,
        status: 'Delivered',
      },
      {
        recipientName: 'Maria Rodriguez',
        language: 'Spanish',
        channel: 'Email',
        previewText: `Asunto: Sermon Traducido de ${sermon.placeName}\n\nEstimado/a Hermano/a,\n\nLe enviamos el sermón reciente: "${sermon.title}".\n\nResumen: ${sermon.summary}\n\nBendiciones.`,
        status: 'Sent',
      },
      {
        recipientName: 'John Davis',
        language: 'English',
        channel: 'WhatsApp',
        previewText: `✨ *${sermon.placeName} Sermon Alert*\n\nTitle: ${sermon.title}\n\nSummary: ${sermon.summary}\n\nRead full message in your language here.`,
        status: 'Read',
      },
    ],
  };

  broadcastLogs.unshift(log);
  res.status(201).json(log);
});

// GET /api/broadcast-logs
app.get('/api/broadcast-logs', (req, res) => {
  res.json(broadcastLogs);
});

// POST /api/generate-sermon-draft - AI assistant for preachers to draft/refine sermon
app.post('/api/generate-sermon-draft', async (req, res) => {
  try {
    const { religion, topic, scriptureRef, targetLanguage, length } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        title: `Discourse on ${topic || 'Faith & Moral Life'}`,
        text: `Here is a structured sermon outline on ${topic}.\n\n1. Opening Praise & Gratitude\n2. Reflection on ${scriptureRef || 'Sacred Scripture'}\n3. Practical applications in daily community life.\n4. Closing Prayer and Blessings.`,
        summary: `A sermon on ${topic} emphasizing spiritual growth and community compassion.`,
        keyTakeaways: [
          'Cultivate daily gratitude',
          'Practice kindness towards neighbors',
          'Hold firm in faith during difficulties',
        ],
      });
    }

    const prompt = `You are a deeply respected preacher and theological assistant for the ${religion || 'Islamic'} tradition.
Write a moving, spiritually uplifting sermon/khutbah draft on the topic: "${topic || 'Patience, Gratitude and Community Unity'}".
Scripture / Text Reference: ${scriptureRef || 'Appropriate verse or teaching'}
Language: Write the full text in ${targetLanguage || 'English'}.
Length: ${length || 'Medium (about 300 words)'}.

Formatting Guidelines:
- Include an inspiring, relevant title.
- Provide full sermon text with traditional opening greetings and closing prayer/blessings appropriate for ${religion}.
- Include a 2-sentence summary.
- Include 3 concise key takeaways.

Return JSON format:
{
  "title": "string",
  "text": "string",
  "summary": "string",
  "keyTakeaways": ["string", "string", "string"],
  "scriptureRef": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const resultText = response.text || '';
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      parsed = {
        title: `Discourse on ${topic}`,
        text: resultText,
        summary: `Sermon on ${topic}`,
        keyTakeaways: ['Live with integrity', 'Seek wisdom', 'Build unity'],
      };
    }

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate sermon draft', details: err.message });
  }
});

// POST /api/live-translate-chunk - Phase 2 Live audio/transcript translation chunk simulator
app.post('/api/live-translate-chunk', async (req, res) => {
  try {
    const { originalChunkText, religion, targetLanguage } = req.body;
    if (!originalChunkText) {
      return res.status(400).json({ error: 'Missing originalChunkText' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        translatedChunk: `[Live ${targetLanguage}] ${originalChunkText}`,
      });
    }

    const prompt = `You are a real-time interpreter for live religious sermons (${religion || 'General'}).
Translate this spoken sentence into ${targetLanguage} instantly, preserving natural live subtitle flow and sacred reverence:
"${originalChunkText}"

Return JSON: { "translatedChunk": "string" }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    let parsed = { translatedChunk: originalChunkText };
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {}

    res.json(parsed);
  } catch (err: any) {
    res.json({ translatedChunk: req.body.originalChunkText });
  }
});

// ==================== VITE & STATIC SETUP ====================

async function startServer() {
  try {
    await initDb();
  } catch (dbErr) {
    console.error('⚠️ Database init error (falling back to in-memory):', dbErr);
  }

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

  const portParam = process.env.PORT || 3000;

  if (process.env.PORT) {
    app.listen(portParam, () => {
      console.log(`Server running on hostinger/production port: ${portParam}`);
    });
  } else {
    app.listen(3000, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:3000`);
    });
  }
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});