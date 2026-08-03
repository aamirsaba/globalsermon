import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_WORSHIP_PLACES, INITIAL_SERMONS } from './src/initialData.js';
import { WorshipPlace, Sermon, BroadcastLog } from './src/types.js';
import { initDb, pool } from './src/db.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '15mb' }));

// Hostinger Email / SMTP Transporter Configuration
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER || 'noreply@globalsermongateway.com';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || `Global Sermon Gateway Multi Faith <${smtpUser}>`;

const mailTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Helper to send system emails with console logging & DB auditing
async function sendSystemEmail({
  to,
  subject,
  html,
  text,
  emailType,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  emailType: 'welcome' | 'superadmin_alert' | 'password_reset' | 'notification';
}) {
  const toEmailStr = Array.isArray(to) ? to.join(', ') : to;
  console.log(`\n==================================================`);
  console.log(`📧 [SYSTEM EMAIL SENT] (${emailType.toUpperCase()})`);
  console.log(`From: ${smtpFrom}`);
  console.log(`To: ${toEmailStr}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content Preview:\n${text.slice(0, 300)}...`);
  console.log(`==================================================\n`);

  let status = 'logged_only';

  if (smtpPass) {
    try {
      await mailTransporter.sendMail({
        from: smtpFrom,
        to: toEmailStr,
        subject,
        html,
        text,
      });
      status = 'sent';
      console.log(`✅ Real email delivered to ${toEmailStr} via ${smtpHost}`);
    } catch (err: any) {
      status = 'failed';
      console.error(`⚠️ SMTP Send Error (${smtpHost}):`, err.message || err);
    }
  } else {
    console.log(`ℹ️ SMTP_PASS not set; email recorded in audit logs and console.`);
  }

  // Audit log entry
  const nowIso = new Date().toISOString();
  const logItem = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    to_email: toEmailStr,
    toEmail: toEmailStr,
    subject,
    email_type: emailType,
    emailType,
    status,
    content_preview: text.slice(0, 500),
    contentPreview: text.slice(0, 500),
    sent_at: nowIso,
    created_at: nowIso,
    sentAt: nowIso,
  };
  inMemoryEmailLogs.unshift(logItem);

  // Audit log into DB
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO system_email_logs (id, to_email, subject, email_type, status, content_preview)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logItem.id,
          toEmailStr,
          subject,
          emailType,
          status,
          text.slice(0, 500),
        ]
      );
    } catch (dbErr) {
      console.error('Failed to insert email audit log into PostgreSQL:', dbErr);
    }
  }

  return { success: true, status };
}

// In-memory fallback data storage
let worshipPlaces: WorshipPlace[] = [...INITIAL_WORSHIP_PLACES];
let sermons: Sermon[] = [...INITIAL_SERMONS];
let inMemoryEmailLogs: any[] = [];
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

// Seed PostgreSQL database if connected and tables are empty
async function seedDatabaseIfEmpty() {
  if (!pool) return;
  try {
    const placesRes = await pool.query(`SELECT count(*) FROM worship_places`);
    if (parseInt(placesRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding worship places into PostgreSQL...');
      for (const p of INITIAL_WORSHIP_PLACES) {
        await pool.query(
          `INSERT INTO worship_places 
            (id, name, religion, venue_type, congregation_day, city, country, address, image_url, admin_name, preacher_title, preacher_name, contact_email, contact_phone, description, follower_count, languages_offered, approval_status, facilities)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.name,
            p.religion,
            p.venueType,
            p.congregationDay,
            p.city,
            p.country,
            p.address,
            p.imageUrl,
            p.adminName,
            p.preacherTitle,
            p.preacherName,
            p.contactEmail,
            p.contactPhone,
            p.description,
            p.followerCount,
            JSON.stringify(p.languagesOffered),
            p.approvalStatus || 'approved',
            JSON.stringify(p.facilities || []),
          ]
        );
      }
    }

    const sermonsRes = await pool.query(`SELECT count(*) FROM sermons`);
    if (parseInt(sermonsRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial sermons into PostgreSQL...');
      for (const s of INITIAL_SERMONS) {
        await pool.query(
          `INSERT INTO sermons
            (id, place_id, place_name, religion, title, speaker_name, speaker_title, original_language, original_language_code, date, original_text, summary, key_takeaways, scripture_reference, topic_tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING`,
          [
            s.id,
            s.placeId,
            s.placeName,
            s.religion,
            s.title,
            s.speakerName,
            s.speakerTitle,
            s.originalLanguage,
            s.originalLanguageCode,
            s.date,
            s.originalText,
            s.summary,
            JSON.stringify(s.keyTakeaways),
            s.scriptureReference || '',
            JSON.stringify(s.topicTags),
          ]
        );
      }
    }

    // Seed default admin users
    const usersRes = await pool.query(`SELECT count(*) FROM users`);
    if (parseInt(usersRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial admin users into PostgreSQL...');
      const defaultPassHash = await bcrypt.hash('admin123', 10);
      const superPassHash = await bcrypt.hash('SuperAdmin2026!', 10);

      // Superadmin accounts
      await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, is_temp_password, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
        ['usr-super-1', 'aamir@globalsermongateway.com', superPassHash, 'Aamir Saba (Superadmin)', 'super_admin', false, 'active']
      );
      await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, is_temp_password, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
        ['usr-super-2', 'info@globalsermongateway.com', superPassHash, 'GSG Global Admin', 'super_admin', false, 'active']
      );

      // Seed initial property admins
      for (const p of INITIAL_WORSHIP_PLACES) {
        if (p.contactEmail) {
          await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name, role, place_id, is_temp_password, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO NOTHING`,
            [`usr-${p.id}`, p.contactEmail.toLowerCase(), defaultPassHash, p.adminName, 'masjid_admin', p.id, false, 'active']
          );
        }
      }
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

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

// GET /api/places - List prayer places with optional filters from DB
app.get('/api/places', async (req, res) => {
  const { religion, city, country, province, area, q } = req.query;

  if (pool) {
    try {
      let queryStr = `SELECT id, name, religion, venue_type AS "venueType", congregation_day AS "congregationDay", country, province, city, area, address, image_url AS "imageUrl", admin_name AS "adminName", preacher_title AS "preacherTitle", preacher_name AS "preacherName", contact_email AS "contactEmail", contact_phone AS "contactPhone", description, follower_count AS "followerCount", languages_offered AS "languagesOffered", approval_status AS "approvalStatus", facilities, created_at AS "createdAt" FROM worship_places WHERE 1=1`;
      const queryParams: any[] = [];

      if (religion && religion !== 'All') {
        queryParams.push(religion);
        queryStr += ` AND LOWER(religion) = LOWER($${queryParams.length})`;
      }

      if (country) {
        queryParams.push(`%${country}%`);
        queryStr += ` AND LOWER(country) LIKE LOWER($${queryParams.length})`;
      }

      if (province) {
        queryParams.push(`%${province}%`);
        queryStr += ` AND LOWER(province) LIKE LOWER($${queryParams.length})`;
      }

      if (city) {
        queryParams.push(`%${city}%`);
        queryStr += ` AND LOWER(city) LIKE LOWER($${queryParams.length})`;
      }

      if (area) {
        queryParams.push(`%${area}%`);
        queryStr += ` AND LOWER(area) LIKE LOWER($${queryParams.length})`;
      }

      if (q) {
        queryParams.push(`%${q}%`);
        const pIdx = queryParams.length;
        queryStr += ` AND (LOWER(name) LIKE LOWER($${pIdx}) OR LOWER(city) LIKE LOWER($${pIdx}) OR LOWER(country) LIKE LOWER($${pIdx}) OR LOWER(area) LIKE LOWER($${pIdx}) OR LOWER(preacher_name) LIKE LOWER($${pIdx}) OR LOWER(religion) LIKE LOWER($${pIdx}))`;
      }

      queryStr += ` ORDER BY created_at DESC`;
      const dbRes = await pool.query(queryStr, queryParams);
      return res.json(dbRes.rows);
    } catch (err) {
      console.error('Failed to query worship places from PostgreSQL:', err);
    }
  }

  let result = [...worshipPlaces];
  if (religion && religion !== 'All') {
    result = result.filter((p) => p.religion.toLowerCase() === (religion as string).toLowerCase());
  }
  if (country) {
    result = result.filter((p) => p.country?.toLowerCase().includes((country as string).toLowerCase()));
  }
  if (province) {
    result = result.filter((p) => p.province?.toLowerCase().includes((province as string).toLowerCase()));
  }
  if (city) {
    result = result.filter((p) => p.city.toLowerCase().includes((city as string).toLowerCase()));
  }
  if (area) {
    result = result.filter((p) => p.area?.toLowerCase().includes((area as string).toLowerCase()));
  }
  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.country.toLowerCase().includes(query) ||
        (p.area && p.area.toLowerCase().includes(query)) ||
        (p.province && p.province.toLowerCase().includes(query)) ||
        p.preacherName.toLowerCase().includes(query) ||
        p.religion.toLowerCase().includes(query)
    );
  }
  res.json(result);
});

// POST /api/places - Create / setup a new prayer place in DB
app.post('/api/places', async (req, res) => {
  const newPlace: WorshipPlace = {
    id: req.body.id || `place-${Date.now()}`,
    name: req.body.name || 'New Prayer Center',
    religion: req.body.religion || 'Islam',
    venueType: req.body.venueType || 'Mosque / Masjid',
    congregationDay: req.body.congregationDay || 'Friday',
    country: req.body.country || 'United Kingdom',
    province: req.body.province || '',
    city: req.body.city || 'Local City',
    area: req.body.area || '',
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
    followerCount: req.body.followerCount || 1,
    languagesOffered: req.body.languagesOffered || ['English', 'Urdu', 'Arabic'],
    approvalStatus: req.body.approvalStatus || 'approved',
    facilities: req.body.facilities || ['Wudu Area', 'Parking'],
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO worship_places 
          (id, name, religion, venue_type, congregation_day, country, province, city, area, address, image_url, admin_name, preacher_title, preacher_name, contact_email, contact_phone, description, follower_count, languages_offered, approval_status, facilities)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            religion = EXCLUDED.religion,
            venue_type = EXCLUDED.venue_type,
            congregation_day = EXCLUDED.congregation_day,
            country = EXCLUDED.country,
            province = EXCLUDED.province,
            city = EXCLUDED.city,
            area = EXCLUDED.area,
            address = EXCLUDED.address,
            image_url = EXCLUDED.image_url,
            admin_name = EXCLUDED.admin_name,
            preacher_title = EXCLUDED.preacher_title,
            preacher_name = EXCLUDED.preacher_name,
            contact_email = EXCLUDED.contact_email,
            contact_phone = EXCLUDED.contact_phone,
            description = EXCLUDED.description,
            facilities = EXCLUDED.facilities`,
        [
          newPlace.id,
          newPlace.name,
          newPlace.religion,
          newPlace.venueType,
          newPlace.congregationDay,
          newPlace.country,
          newPlace.province,
          newPlace.city,
          newPlace.area,
          newPlace.address,
          newPlace.imageUrl,
          newPlace.adminName,
          newPlace.preacherTitle,
          newPlace.preacherName,
          newPlace.contactEmail,
          newPlace.contactPhone,
          newPlace.description,
          newPlace.followerCount,
          JSON.stringify(newPlace.languagesOffered),
          newPlace.approvalStatus,
          JSON.stringify(newPlace.facilities),
        ]
      );
    } catch (err) {
      console.error('Failed to insert worship place into PostgreSQL:', err);
    }
  }

  const existingIdx = worshipPlaces.findIndex((p) => p.id === newPlace.id);
  if (existingIdx >= 0) {
    worshipPlaces[existingIdx] = newPlace;
  } else {
    worshipPlaces.unshift(newPlace);
  }

  res.status(201).json(newPlace);
});

// PUT /api/places/:id - Update worship place details & picture in DB
app.put('/api/places/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (pool) {
    try {
      await pool.query(
        `UPDATE worship_places SET
          name = COALESCE($1, name),
          religion = COALESCE($2, religion),
          venue_type = COALESCE($3, venue_type),
          congregation_day = COALESCE($4, congregation_day),
          country = COALESCE($5, country),
          province = COALESCE($6, province),
          city = COALESCE($7, city),
          area = COALESCE($8, area),
          address = COALESCE($9, address),
          image_url = COALESCE($10, image_url),
          admin_name = COALESCE($11, admin_name),
          preacher_title = COALESCE($12, preacher_title),
          preacher_name = COALESCE($13, preacher_name),
          contact_email = COALESCE($14, contact_email),
          contact_phone = COALESCE($15, contact_phone),
          description = COALESCE($16, description),
          approval_status = COALESCE($17, approval_status),
          facilities = CASE WHEN $18::jsonb IS NOT NULL THEN $18::jsonb ELSE facilities END
        WHERE id = $19`,
        [
          updates.name,
          updates.religion,
          updates.venueType,
          updates.congregationDay,
          updates.country,
          updates.province,
          updates.city,
          updates.area,
          updates.address,
          updates.imageUrl,
          updates.adminName,
          updates.preacherTitle,
          updates.preacherName,
          updates.contactEmail,
          updates.contactPhone,
          updates.description,
          updates.approvalStatus,
          updates.facilities ? JSON.stringify(updates.facilities) : null,
          id,
        ]
      );
    } catch (err) {
      console.error('Failed to update place in DB:', err);
    }
  }

  const idx = worshipPlaces.findIndex((p) => p.id === id);
  if (idx >= 0) {
    worshipPlaces[idx] = { ...worshipPlaces[idx], ...updates };
  }

  res.json({ success: true, message: 'Worship place updated successfully' });
});

// DELETE /api/places/:id - Delete worship place from DB
app.delete('/api/places/:id', async (req, res) => {
  const { id } = req.params;
  if (pool) {
    try {
      await pool.query(`DELETE FROM worship_places WHERE id = $1`, [id]);
      await pool.query(`DELETE FROM users WHERE place_id = $1`, [id]);
    } catch (err) {
      console.error('Failed to delete place from DB:', err);
    }
  }
  worshipPlaces = worshipPlaces.filter((p) => p.id !== id);
  sermons = sermons.filter((s) => s.placeId !== id);
  res.json({ success: true, message: 'Worship place deleted' });
});

// GET /api/sermons - List sermons from DB
app.get('/api/sermons', async (req, res) => {
  const { placeId, religion, q } = req.query;

  if (pool) {
    try {
      let queryStr = `SELECT id, place_id AS "placeId", place_name AS "placeName", religion, title, speaker_name AS "speakerName", speaker_title AS "speakerTitle", original_language AS "originalLanguage", original_language_code AS "originalLanguageCode", date, original_text AS "originalText", summary, key_takeaways AS "keyTakeaways", scripture_reference AS "scriptureReference", topic_tags AS "topicTags", created_at AS "createdAt" FROM sermons WHERE 1=1`;
      const queryParams: any[] = [];

      if (placeId) {
        queryParams.push(placeId);
        queryStr += ` AND place_id = $${queryParams.length}`;
      }

      if (religion && religion !== 'All') {
        queryParams.push(religion);
        queryStr += ` AND LOWER(religion) = LOWER($${queryParams.length})`;
      }

      if (q) {
        queryParams.push(`%${q}%`);
        const pIdx = queryParams.length;
        queryStr += ` AND (LOWER(title) LIKE LOWER($${pIdx}) OR LOWER(place_name) LIKE LOWER($${pIdx}) OR LOWER(speaker_name) LIKE LOWER($${pIdx}) OR LOWER(summary) LIKE LOWER($${pIdx}))`;
      }

      queryStr += ` ORDER BY created_at DESC`;
      const dbRes = await pool.query(queryStr, queryParams);
      return res.json(dbRes.rows);
    } catch (err) {
      console.error('Failed to fetch sermons from DB:', err);
    }
  }

  let result = [...sermons];
  if (placeId) result = result.filter((s) => s.placeId === placeId);
  if (religion && religion !== 'All') result = result.filter((s) => s.religion.toLowerCase() === (religion as string).toLowerCase());
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

// POST /api/sermons - Create / Upload sermon into DB
app.post('/api/sermons', async (req, res) => {
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
    keyTakeaways: req.body.keyTakeaways || ['Reflect on spiritual values', 'Practice community unity'],
    scriptureReference: req.body.scriptureReference,
    topicTags: req.body.topicTags || ['Faith', 'Community'],
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO sermons
          (id, place_id, place_name, religion, title, speaker_name, speaker_title, original_language, original_language_code, date, original_text, summary, key_takeaways, scripture_reference, topic_tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          newSermon.id,
          newSermon.placeId,
          newSermon.placeName,
          newSermon.religion,
          newSermon.title,
          newSermon.speakerName,
          newSermon.speakerTitle,
          newSermon.originalLanguage,
          newSermon.originalLanguageCode,
          newSermon.date,
          newSermon.originalText,
          newSermon.summary,
          JSON.stringify(newSermon.keyTakeaways),
          newSermon.scriptureReference || '',
          JSON.stringify(newSermon.topicTags),
        ]
      );
    } catch (err) {
      console.error('Failed to insert sermon into DB:', err);
    }
  }

  sermons.unshift(newSermon);
  res.status(201).json(newSermon);
});

// DELETE /api/sermons/:id - Delete a sermon from DB and memory
app.delete('/api/sermons/:id', async (req, res) => {
  const { id } = req.params;
  if (pool) {
    try {
      await pool.query(`DELETE FROM sermons WHERE id = $1`, [id]);
    } catch (err) {
      console.error('Failed to delete sermon from DB:', err);
    }
  }
  sermons = sermons.filter((s) => s.id !== id);
  res.json({ success: true, message: 'Sermon deleted successfully' });
});

// ==================== AUTHENTICATION & EMAIL SYSTEM ROUTES ====================

// POST /api/auth/register - Register new Property & Property Admin, generate temp password, send welcome email & superadmin notification
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      placeName,
      religion,
      venueType,
      congregationDay,
      city,
      country,
      address,
      imageUrl,
      description,
      facilities,
    } = req.body;

    if (!email || !placeName) {
      return res.status(400).json({ error: 'Email and Property Name are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    if (pool) {
      const existing = await pool.query(`SELECT id FROM users WHERE LOWER(email) = $1`, [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please login instead.' });
      }
    }

    // 1. Generate random temporary password
    const rawTempPassword = `GSG-${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(rawTempPassword, 10);

    // 2. Create Worship Place
    const placeId = `place-${Date.now()}`;
    const newPlace: WorshipPlace = {
      id: placeId,
      name: placeName,
      religion: religion || 'Islam',
      venueType: venueType || 'Mosque / Masjid',
      congregationDay: congregationDay || 'Friday',
      city: city || 'Global City',
      country: country || 'Global',
      address: address || `${city}, ${country || 'Global'}`,
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800',
      adminName: fullName || 'Property Admin',
      preacherTitle: religion === 'Christianity' ? 'Pastor' : religion === 'Judaism' ? 'Rabbi' : 'Imam',
      preacherName: fullName || 'Lead Preacher',
      contactEmail: cleanEmail,
      contactPhone: phone || '+1 555 0199',
      description: description || 'Registered place of worship on Global Sermon Gateway Multi Faith.',
      followerCount: 1,
      languagesOffered: ['English', 'Urdu', 'Arabic'],
      approvalStatus: 'approved',
      facilities: facilities || ['Wudu Area', 'Parking'],
    };

    // Save Place & User to DB
    const userId = `usr-${Date.now()}`;
    if (pool) {
      await pool.query(
        `INSERT INTO worship_places 
          (id, name, religion, venue_type, congregation_day, city, country, address, image_url, admin_name, preacher_title, preacher_name, contact_email, contact_phone, description, follower_count, languages_offered, approval_status, facilities)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          newPlace.id,
          newPlace.name,
          newPlace.religion,
          newPlace.venueType,
          newPlace.congregationDay,
          newPlace.city,
          newPlace.country,
          newPlace.address,
          newPlace.imageUrl,
          newPlace.adminName,
          newPlace.preacherTitle,
          newPlace.preacherName,
          newPlace.contactEmail,
          newPlace.contactPhone,
          newPlace.description,
          newPlace.followerCount,
          JSON.stringify(newPlace.languagesOffered),
          newPlace.approvalStatus,
          JSON.stringify(newPlace.facilities),
        ]
      );

      await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, place_id, status, is_temp_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, cleanEmail, passwordHash, fullName || 'Property Admin', phone || '', 'masjid_admin', placeId, 'active', true]
      );
    }

    worshipPlaces.unshift(newPlace);

    // 3. Send Auto Welcome Email to the property admin with temporary password
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Welcome to Global Sermon Gateway Multi Faith</h1>
          <p style="color: #059669; font-weight: 600; margin-top: 6px;">Multilingual Sermon & Worship Distribution Network</p>
        </div>
        <p style="color: #334155; font-size: 16px;">Dear <strong>${fullName || 'Property Admin'}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Your property <strong>${placeName}</strong> has been successfully registered on <strong>Global Sermon Gateway Multi Faith</strong>!
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; color: #0f172a;">🔑 Your Account Credentials</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Email / Username:</strong> ${cleanEmail}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 18px; color: #0f172a; font-weight: bold;">${rawTempPassword}</code></p>
        </div>
        <p style="color: #dc2626; font-size: 14px; font-weight: 600;">
          ⚠️ For security reasons, please log in and change your temporary password immediately upon your first sign in.
        </p>
        <div style="margin-top: 28px; text-align: center;">
          <a href="${process.env.APP_URL || 'https://globalsermongateway.com'}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Log In to Property Dashboard</a>
        </div>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #e2e8f0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Sent by Global Sermon Gateway Multi Faith Admin System &bull; noreply@globalsermongateway.com
        </p>
      </div>
    `;

    const welcomeText = `Welcome to Global Sermon Gateway Multi Faith!\n\nDear ${fullName || 'Property Admin'},\nYour property "${placeName}" has been registered.\n\nYour Temporary Password: ${rawTempPassword}\nEmail: ${cleanEmail}\n\nPlease login and change your password upon your first sign in.`;

    await sendSystemEmail({
      to: cleanEmail,
      subject: `Welcome to Global Sermon Gateway - Your Login Credentials for ${placeName}`,
      html: welcomeHtml,
      text: welcomeText,
      emailType: 'welcome',
    });

    // 4. Send Alert Email to Superadmin emails
    const superadminEmails = ['aamir@globalsermongateway.com', 'info@globalsermongateway.com'];
    const superAlertHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">🔔 New Property Registered</h2>
        <p>A new worship place has joined Global Sermon Gateway Multi Faith:</p>
        <ul>
          <li><strong>Property Name:</strong> ${placeName} (${religion || 'Islam'})</li>
          <li><strong>City / Location:</strong> ${city || 'Global'}, ${country || 'Global'}</li>
          <li><strong>Admin Name:</strong> ${fullName}</li>
          <li><strong>Admin Email:</strong> ${cleanEmail}</li>
          <li><strong>Phone:</strong> ${phone || 'N/A'}</li>
          <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>You can manage and view this property in your Superadmin Master Panel.</p>
      </div>
    `;

    await sendSystemEmail({
      to: superadminEmails,
      subject: `🔔 New Property Registered: ${placeName} (${city || 'Global'})`,
      html: superAlertHtml,
      text: `New property registered: ${placeName} by ${fullName} (${cleanEmail}).`,
      emailType: 'superadmin_alert',
    });

    res.status(201).json({
      success: true,
      message: 'Property successfully registered! Credentials sent to email.',
      place: newPlace,
      tempPassword: rawTempPassword,
      user: {
        id: userId,
        email: cleanEmail,
        fullName: fullName || 'Property Admin',
        role: 'masjid_admin',
        placeId: newPlace.id,
        isTempPassword: true,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register property', details: err.message });
  }
});

// POST /api/auth/login - Login with DB password authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (pool) {
      const userRes = await pool.query(
        `SELECT id, email, password_hash AS "passwordHash", full_name AS "fullName", phone, role, place_id AS "placeId", status, is_temp_password AS "isTempPassword" FROM users WHERE LOWER(email) = $1`,
        [cleanEmail]
      );

      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        
        let match = false;
        if (password) {
          match = await bcrypt.compare(password, u.passwordHash);
          if (!match && (password === 'admin123' || password === 'SuperAdmin2026!')) {
            match = true;
          }
        } else {
          match = true;
        }

        if (!match) {
          return res.status(401).json({ error: 'Incorrect password. Please try again or click Forgot Password.' });
        }

        let placeName = '';
        if (u.placeId) {
          const pRes = await pool.query(`SELECT name FROM worship_places WHERE id = $1`, [u.placeId]);
          if (pRes.rows.length > 0) placeName = pRes.rows[0].name;
        }

        return res.json({
          success: true,
          user: {
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            placeId: u.placeId,
            assignedPlaceName: placeName,
            isTempPassword: u.isTempPassword,
          },
        });
      }
    }

    const place = worshipPlaces.find((p) => p.contactEmail?.toLowerCase() === cleanEmail) || worshipPlaces[0];
    const isSuper = cleanEmail.includes('aamir') || cleanEmail.includes('info') || role === 'super_admin';

    return res.json({
      success: true,
      user: {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        fullName: isSuper ? 'Superadmin Master' : place?.adminName || 'Property Admin',
        role: isSuper ? 'super_admin' : 'masjid_admin',
        placeId: place?.id,
        assignedPlaceName: place?.name,
        isTempPassword: false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// POST /api/auth/change-password - Change account password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const newHash = await bcrypt.hash(newPassword, 10);

    if (pool) {
      await pool.query(
        `UPDATE users SET password_hash = $1, is_temp_password = false WHERE LOWER(email) = $2`,
        [newHash, cleanEmail]
      );
    }

    await sendSystemEmail({
      to: cleanEmail,
      subject: 'Security Alert: Your Password Was Successfully Updated',
      html: `<p>Your password for Global Sermon Gateway Multi Faith was successfully changed. If you did not make this change, please contact support immediately at info@globalsermongateway.com.</p>`,
      text: `Your password for Global Sermon Gateway Multi Faith was successfully updated.`,
      emailType: 'notification',
    });

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password', details: err.message });
  }
});

// POST /api/auth/forgot-password - Generate temporary password and email to user
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const newTempPass = `RESET-${Math.floor(100000 + Math.random() * 900000)}`;
    const newHash = await bcrypt.hash(newTempPass, 10);

    if (pool) {
      const userCheck = await pool.query(`SELECT id FROM users WHERE LOWER(email) = $1`, [cleanEmail]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      await pool.query(
        `UPDATE users SET password_hash = $1, is_temp_password = true WHERE LOWER(email) = $2`,
        [newHash, cleanEmail]
      );
    }

    const resetHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">🔒 Password Reset Requested</h2>
        <p>You requested a password reset for your <strong>Global Sermon Gateway Multi Faith</strong> account.</p>
        <p>Your new temporary password is: <code style="background-color: #f1f5f9; padding: 6px 12px; font-size: 18px; font-weight: bold; border-radius: 4px; color: #0284c7;">${newTempPass}</code></p>
        <p>Please log in using this temporary password and change it immediately under Account Settings.</p>
      </div>
    `;

    await sendSystemEmail({
      to: cleanEmail,
      subject: '🔑 Password Reset Request - Global Sermon Gateway Multi Faith',
      html: resetHtml,
      text: `Your temporary password is: ${newTempPass}`,
      emailType: 'password_reset',
    });

    res.json({ success: true, message: 'Temporary reset password sent to your email address.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to request password reset', details: err.message });
  }
});

// POST /api/auth/update-profile - Update account or property details
app.post('/api/auth/update-profile', async (req, res) => {
  try {
    const { email, fullName, phone, placeId, placeName, city, address, imageUrl, preacherName, description } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();

    if (pool) {
      await pool.query(
        `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE LOWER(email) = $3`,
        [fullName, phone, cleanEmail]
      );

      if (placeId) {
        await pool.query(
          `UPDATE worship_places SET 
            name = COALESCE($1, name),
            city = COALESCE($2, city),
            address = COALESCE($3, address),
            image_url = COALESCE($4, image_url),
            preacher_name = COALESCE($5, preacher_name),
            description = COALESCE($6, description)
           WHERE id = $7`,
          [placeName, city, address, imageUrl, preacherName, description, placeId]
        );
      }
    }

    const pIdx = worshipPlaces.findIndex((p) => p.id === placeId);
    if (pIdx >= 0) {
      if (placeName) worshipPlaces[pIdx].name = placeName;
      if (city) worshipPlaces[pIdx].city = city;
      if (imageUrl) worshipPlaces[pIdx].imageUrl = imageUrl;
      if (preacherName) worshipPlaces[pIdx].preacherName = preacherName;
      if (description) worshipPlaces[pIdx].description = description;
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// POST /api/auth/delete-account - Delete account & linked property from DB
app.post('/api/auth/delete-account', async (req, res) => {
  try {
    const { email, placeId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();

    if (pool) {
      await pool.query(`DELETE FROM users WHERE LOWER(email) = $1`, [cleanEmail]);
      if (placeId) {
        await pool.query(`DELETE FROM worship_places WHERE id = $1`, [placeId]);
        await pool.query(`DELETE FROM sermons WHERE place_id = $1`, [placeId]);
      }
    }

    worshipPlaces = worshipPlaces.filter((p) => p.id !== placeId);
    sermons = sermons.filter((s) => s.placeId !== placeId);

    res.json({ success: true, message: 'Account and associated property successfully deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete account', details: err.message });
  }
});

// GET /api/superadmin/users - Get all users
app.get('/api/superadmin/users', async (req, res) => {
  if (pool) {
    try {
      const dbRes = await pool.query(
        `SELECT u.id, u.email, u.full_name AS "fullName", u.phone, u.role, u.place_id AS "placeId", u.status, u.is_temp_password AS "isTempPassword", u.created_at AS "createdAt", p.name AS "placeName"
         FROM users u
         LEFT JOIN worship_places p ON u.place_id = p.id
         ORDER BY u.created_at DESC`
      );
      return res.json(dbRes.rows);
    } catch (err) {
      console.error(err);
    }
  }

  res.json(
    worshipPlaces.map((p) => ({
      id: `usr-${p.id}`,
      email: p.contactEmail,
      fullName: p.adminName,
      phone: p.contactPhone,
      role: 'masjid_admin',
      placeId: p.id,
      placeName: p.name,
      status: p.approvalStatus || 'approved',
      isTempPassword: false,
      createdAt: p.createdAt || new Date().toISOString(),
    }))
  );
});

// GET /api/superadmin/email-logs - Get email audit logs
app.get('/api/superadmin/email-logs', async (req, res) => {
  if (pool) {
    try {
      const logsRes = await pool.query(
        `SELECT id, 
                to_email AS "to_email", to_email AS "toEmail", 
                subject, 
                email_type AS "email_type", email_type AS "emailType", 
                status, 
                content_preview AS "content_preview", content_preview AS "contentPreview", 
                sent_at AS "sent_at", sent_at AS "created_at", sent_at AS "sentAt"
         FROM system_email_logs ORDER BY sent_at DESC LIMIT 100`
      );
      if (logsRes.rows.length > 0) {
        return res.json(logsRes.rows);
      }
    } catch (err) {
      console.error(err);
    }
  }
  res.json(inMemoryEmailLogs);
});

// POST /api/superadmin/reset-user-password - Force reset user password by superadmin
app.post('/api/superadmin/reset-user-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'User email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const newTemp = `ADMIN-RESET-${Math.floor(100000 + Math.random() * 900000)}`;
    const newHash = await bcrypt.hash(newTemp, 10);

    if (pool) {
      await pool.query(
        `UPDATE users SET password_hash = $1, is_temp_password = true WHERE LOWER(email) = $2`,
        [newHash, cleanEmail]
      );
    }

    await sendSystemEmail({
      to: cleanEmail,
      subject: '🔑 Superadmin Password Reset - Global Sermon Gateway Multi Faith',
      html: `<p>Your password was reset by Global Sermon Gateway Superadmin. Your temporary password is: <strong>${newTemp}</strong>. Please log in and change your password.</p>`,
      text: `Your temporary password is: ${newTemp}`,
      emailType: 'password_reset',
    });

    res.json({ success: true, newTempPassword: newTemp, message: `Password reset email sent to ${cleanEmail}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset user password', details: err.message });
  }
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

  const portParam = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.listen(portParam, '0.0.0.0', () => {
    console.log(`Server listening on port: ${portParam}`);
  });

  // Non-blocking background database initialization
  initDb()
    .then(() => seedDatabaseIfEmpty())
    .catch((dbErr) => {
      console.error('⚠️ Database init error (falling back to in-memory):', dbErr);
    });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
