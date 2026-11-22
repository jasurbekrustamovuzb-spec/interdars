/* Savol turlari bo'yicha AI so'rovi: test (mcq) / savol-javob (text) / to'g'ri-noto'g'ri (tf).
   api/generate-test.js ichida ishlatiladi (ulash — pastdagi izohda). */
const MAXT = 20;
function counts(body) {
  const c = (body && body.counts) || {};
  const n = k => Math.max(0, Math.min(MAXT, Math.floor(+c[k] || 0)));
  let r = { mcq: n('mcq'), text: n('text'), tf: n('tf') };
  if (r.mcq + r.text + r.tf === 0) r = { mcq: Math.max(1, Math.min(MAXT, +body.count || 10)), text: 0, tf: 0 };
  let over = r.mcq + r.text + r.tf - MAXT;
  for (const k of ['mcq', 'text', 'tf']) { const d = Math.min(over, r[k]); if (d > 0) { r[k] -= d; over -= d; } }
  return r;
}
function instructions(c) {
  const p = [];
  if (c.mcq) p.push(`${c.mcq} ta TEST (type:"mcq"): savol + 4 ta variant. Variantlar sodda bo'lmasin: hammasi ishonarli, bir xil uzunlik va uslubda, bir-biriga yaqin tushuncha; to'g'ri javob bitta; "yuqoridagilarning hammasi" kabi variant yo'q.`);
  if (c.text) p.push(`${c.text} ta SAVOL-JAVOB (type:"text"): variantsiz, javobi 1-4 so'zli aniq atama/son/nom. Savol "nima?", "kim?", "qachon?", "nima uchun?" shaklida; answer maydoni qisqa.`);
  if (c.tf) p.push(`${c.tf} ta TO'G'RI/NOTO'G'RI (type:"tf"): savol emas, to'liq tasdiq gap yoziladi; correct:true/false. Taxminan yarmi noto'g'ri bo'lsin — noto'g'ri tasdiq manbadagi haqiqiy faktni ishonarli tarzda o'zgartirib (son, sana, sabab, ta'rif) tuzilsin.`);
  return `Aniq shu miqdor va turlarda tuz: ${p.join(' ')} Mavzuning eng muhim joylaridan tuz. HAR TUR O'Z SHAKLIDA so'ralsin (test savoli, ochiq savol va tasdiq bir xil qolipda bo'lmasin). Bir xil faktni/javobni turli turlarda (test, savol-javob, to'g'ri/noto'g'ri) takrorlama — har savol manbaning boshqa-boshqa joyidan bo'lsin. Har savolga manbadan qisqa "evidence" qo'sh.`;
}
const SCHEMA = { type: 'object', properties: { topic: { type: 'string' }, questions: { type: 'array', items: { type: 'object', properties: {
  type: { type: 'string', enum: ['mcq', 'text', 'tf'] }, q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } },
  correctIndex: { type: 'integer' }, answer: { type: 'string' }, correct: { type: 'boolean' }, evidence: { type: 'string' } }, required: ['type', 'q'] } } }, required: ['questions'] };
const nz = s => String(s || '').toLowerCase().replace(/[’'ʻʼ`‘]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
/* Javobni tekshiradi, to'g'ri turga keltiradi, turlar orasidagi takrorni olib tashlaydi, so'ralgan sondan oshirmaydi. */
function normalize(raw, c) {
  const left = { ...c }, seenQ = new Set(), seenA = new Set(), out = [];
  for (const x of (raw && raw.questions) || []) {
    const t = x.type === 'tf' || x.type === 'text' ? x.type : 'mcq';
    const q = String(x.q || '').trim(); if (!q || !left[t] || seenQ.has(nz(q))) continue;
    let it, key;
    if (t === 'mcq') {
      const o = (x.options || []).map(s => String(s).trim()).filter(Boolean).slice(0, 4);
      if (o.length < 3 || new Set(o.map(nz)).size < o.length || !(x.correctIndex >= 0 && x.correctIndex < o.length)) continue;
      it = { type: t, q, options: o, correctIndex: x.correctIndex }; key = nz(o[x.correctIndex]);
    } else if (t === 'text') {
      const a = String(x.answer || '').trim(); if (!a || a.length > 120) continue;
      it = { type: t, q, answer: a }; key = nz(a);
    } else { if (typeof x.correct !== 'boolean') continue; it = { type: t, q, correct: x.correct }; key = null; }
    if (key && seenA.has(key)) continue;
    it.evidence = String(x.evidence || '').slice(0, 400); seenQ.add(nz(q)); if (key) seenA.add(key); left[t]--; out.push(it);
  }
  return { questions: out, short: left };
}
module.exports = { counts, instructions, SCHEMA, normalize };
/* ULASH (api/generate-test.js ichida):
   const T = require('./_question-types');
   const c = T.counts(body);                          // body — so'rov JSON'i
   prompt oxiriga:  T.instructions(c)                 // eski "N ta savol" talabi o'rniga
   Gemini sozlamasida: responseSchema: T.SCHEMA
   Javobni qaytarishdan oldin: const r = T.normalize(JSON.parse(text), c); res.json({topic, questions: r.questions, ...}) */
