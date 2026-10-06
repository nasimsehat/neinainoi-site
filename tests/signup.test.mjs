import assert from 'node:assert/strict';
import { subscribe, confirm, unsubscribe } from '../lib/signup.js';
// tiny in-memory stand-in for D1 that understands the five statements used
const rows = new Map();
const DB = { prepare(sql) { return { bind(...a) { return {
  async first() { if (sql.includes('WHERE email')) return rows.get(a[0]) ?? null;
    for (const [email, r] of rows) if (r.token === a[0]) return { email, ...r }; return null; },
  async run() {
    if (sql.startsWith('INSERT')) rows.set(a[0], { token: a[1], status: a[2], created_at: a[3] });
    else if (sql.startsWith('UPDATE')) { for (const r of rows.values()) if (r.token === a[2]) { r.status = a[0]; r.confirmed_at = a[1]; } }
    else if (sql.startsWith('DELETE')) { for (const [e, r] of rows) if (r.token === a[0]) rows.delete(e); }
  } }; } }; } };
const sent = [];
globalThis.fetch = async (url, init) => { sent.push({ url, ...JSON.parse(init.body), auth: init.headers.authorization }); return new Response('{}', { status: 200 }); };
const env = { DB, RESEND_API_KEY: 'k' };
const post = (email, extra = {}, json = true) => { const fd = new FormData(); fd.set('email', email); for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  return new Request('https://neinainoi.com/api/subscribe', { method: 'POST', body: fd, headers: json ? { accept: 'application/json' } : {} }); };

let r = await subscribe(post(' Ana@Example.com '), env);
assert.equal(r.status, 200); assert.equal(rows.get('ana@example.com').status, 'pending');
assert.equal(sent.length, 1); assert.equal(sent[0].subject, 'confirm'); assert.equal(sent[0].from, 'neinainoi <hello@neinainoi.com>');
assert.match(sent[0].text, /instagram @neinainoi/); assert.match(sent[0].html, /instagram\.com\/neinainoi/);
const t = rows.get('ana@example.com').token; assert.ok(sent[0].text.includes(`/api/confirm?t=${t}`));

r = await subscribe(post('ana@example.com'), env);                 // repeat before confirming: same token, mail resent
assert.equal(sent.length, 2); assert.equal(rows.size, 1); assert.equal(rows.get('ana@example.com').token, t);

r = await confirm(new Request(`https://neinainoi.com/api/confirm?t=${t}`), env);
assert.equal(r.status, 303); assert.equal(r.headers.get('location'), 'https://neinainoi.com/confirmed.html');
assert.equal(rows.get('ana@example.com').status, 'confirmed');
assert.equal(sent[2].subject, 'you are on the list'); assert.match(sent[2].text, /instagram @neinainoi/);
assert.equal(sent[2].headers['List-Unsubscribe'], `<https://neinainoi.com/api/unsubscribe?t=${t}>`);

await confirm(new Request(`https://neinainoi.com/api/confirm?t=${t}`), env);   // clicking twice sends no second welcome
assert.equal(sent.length, 3);
await subscribe(post('ana@example.com'), env);                     // already confirmed: no mail
assert.equal(sent.length, 3);

r = await subscribe(post('not an email'), env); assert.equal(r.status, 400);
r = await subscribe(post('bot@spam.com', { website: 'x' }), env); assert.equal(r.status, 200); assert.ok(!rows.has('bot@spam.com'));
r = await subscribe(post('nojs@example.com', {}, false), env);
assert.equal(r.status, 303); assert.equal(r.headers.get('location'), 'https://neinainoi.com/thanks.html');
r = await confirm(new Request('https://neinainoi.com/api/confirm?t=bogus'), env); assert.equal(r.headers.get('location'), 'https://neinainoi.com/');

r = await unsubscribe(new Request(`https://neinainoi.com/api/unsubscribe?t=${t}`), env);
assert.ok(!rows.has('ana@example.com')); assert.equal(r.headers.get('location'), 'https://neinainoi.com/unsubscribed.html');
for (const m of sent) assert.ok(!/[–—]/.test(m.text + m.html) && !/buttondown/i.test(m.html));
console.log('all signup checks passed,', sent.length, 'mails captured');
