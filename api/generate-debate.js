/* InterDars — Munozara mavzulari uchun AI tavsiyalari.
   POST /api/generate-debate  { count?: number, exclude?: string[] }
   Header: Authorization: Bearer <Supabase access token>
   Javob: { topics: [{ t: "mavzu", h: ["maslahat", ...] }] }
   Kerakli muhit o'zgaruvchilari: SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY
   Ixtiyoriy: GEMINI_MODEL (standart: gemini-2.5-flash) */

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const COOLDOWN_MS = 8000;      // bir foydalanuvchi uchun so'rovlar orasidagi pauza
const lastCall = new Map();    // userId -> vaqt (har bir server nusxasi uchun)

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}

async function userFromToken(token) {
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  const r = await fetch(base + '/auth/v1/user', {
    headers: { apikey: key, Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

function clean(s, n) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed' }); }

  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return send(res, 401, { error: 'Hisobingizga qayta kiring.' });
  if (!process.env.GEMINI_API_KEY) return send(res, 503, { error: 'AI hozircha sozlanmagan.' });

  let user;
  try { user = await userFromToken(token); } catch (e) { user = null; }
  if (!user) return send(res, 401, { error: 'Hisobingizga qayta kiring.' });

  const now = Date.now();
  const prev = lastCall.get(user.id) || 0;
  if (now - prev < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - prev)) / 1000);
    return send(res, 429, { error: 'Biroz kuting va qayta urinib ko’ring.', retryAfter: wait });
  }
  lastCall.set(user.id, now);
  if (lastCall.size > 2000) { for (const [k, v] of lastCall) if (now - v > 60000) lastCall.delete(k); }

  const body = await readBody(req);
  const count = Math.max(3, Math.min(10, parseInt(body.count, 10) || 6));
  const exclude = (Array.isArray(body.exclude) ? body.exclude : []).map(x => clean(x, 200)).filter(Boolean).slice(0, 30);

  const prompt =
    'Sen maktab o‘quvchilari va o‘qituvchilari uchun munozara (debat) mavzularini tuzadigan yordamchisan.\n' +
    'O‘zbek tilida (lotin yozuvi) roppa-rosa ' + count + ' ta munozara mavzusi yoz.\n' +
    'Qoidalar:\n' +
    '- Har bir mavzu bitta to‘liq tasdiq gap bo‘lsin, jamoalar uni qo‘llab ham, inkor qilib ham bahslasha olsin.\n' +
    '- Mavzu qisqa (12 so‘zgacha), aniq va o‘quvchilarga tushunarli bo‘lsin.\n' +
    '- Mavzular xilma-xil bo‘lsin: ta’lim, texnologiya, jamiyat, sog‘lom turmush, ekologiya, kelajak kasblari.\n' +
    '- Siyosiy, diniy va haqoratli mavzular bo‘lmasin.\n' +
    '- Har mavzuga 2 ta juda qisqa maslahat (h) qo‘sh: bahsni boshlash uchun bitta savol yoki fikr.\n' +
    (exclude.length ? '- Mana bu mavzularni takrorlama: ' + exclude.join(' | ') + '\n' : '');

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          topics: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                t: { type: 'STRING' },
                h: { type: 'ARRAY', items: { type: 'STRING' } }
              },
              required: ['t']
            }
          }
        },
        required: ['topics']
      }
    }
  };
  // 2.5 modellarda "thinking" javobni sekinlashtiradi — mavzu yozish uchun kerak emas
  if (/2\.5-flash/.test(MODEL)) payload.generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const t0 = Date.now();
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 25000);
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(MODEL) + ':generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify(payload),
        signal: ctl.signal
      }
    );
    clearTimeout(to);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.log('generate-debate: gemini', r.status, (j && j.error && j.error.status) || '', Date.now() - t0, 'ms');
      if (r.status === 429) return send(res, 429, { error: 'AI hozir band. Birozdan keyin urinib ko’ring.', retryAfter: 30 });
      return send(res, 502, { error: 'AI javob bermadi. Birozdan keyin qayta urinib ko’ring.' });
    }

    const txt = (((j.candidates || [])[0] || {}).content || {}).parts;
    const raw = Array.isArray(txt) ? txt.map(p => p.text || '').join('') : '';
    let data = {};
    try { data = JSON.parse(raw.replace(/^```json|```$/g, '').trim()); } catch (e) { data = {}; }

    const seen = new Set(exclude.map(x => x.toLowerCase()));
    const topics = [];
    (Array.isArray(data.topics) ? data.topics : []).forEach(x => {
      const t = clean(x && x.t, 300);
      if (!t || seen.has(t.toLowerCase())) return;
      seen.add(t.toLowerCase());
      topics.push({ t, h: (Array.isArray(x.h) ? x.h : []).map(h => clean(h, 160)).filter(Boolean).slice(0, 3) });
    });

    console.log('generate-debate: ok', topics.length, 'topics', Date.now() - t0, 'ms');
    if (!topics.length) return send(res, 502, { error: 'AI mavzu topa olmadi. Qayta urinib ko’ring.' });
    return send(res, 200, { topics: topics.slice(0, count) });
  } catch (e) {
    console.log('generate-debate: error', e && e.name, Date.now() - t0, 'ms');
    return send(res, 502, { error: 'AI javob bermadi. Birozdan keyin qayta urinib ko’ring.' });
  }
};
