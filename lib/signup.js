// Signup for the holding page. The list lives in Cloudflare D1 (binding DB).
// Mail goes out through Resend from hello@neinainoi.com (secret RESEND_API_KEY).
// Nothing here is visible to a visitor except neinainoi.com and hello@neinainoi.com.

const INSTAGRAM = 'https://www.instagram.com/nei.nai.noi/';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const site = (env) => env.SITE_URL || 'https://neinainoi.com';
const now = () => new Date().toISOString();
const token = () => [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');

function wantsJson(request) {
  return (request.headers.get('accept') || '').includes('application/json');
}

function reply(request, env, ok, page) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 400, headers: { 'content-type': 'application/json' } });
  }
  return Response.redirect(`${site(env)}/${page}`, 303);
}

// Mail clients restyle email for dark mode, so we set no colours and no background.
// Text and links take the reader's own colours. Lines are joined with <br>, never <p>,
// so no client adds its own paragraph spacing.
function layout(blocks) {
  const body = blocks.map((lines) => lines.join('<br>')).join('<br><br>');
  return `<!doctype html><html><head><meta name="color-scheme" content="light dark"></head><body style="margin:0;padding:24px;font:16px/1.5 Helvetica,Arial,sans-serif">${body}</body></html>`;
}
const link = (href, text) => `<a href="${href}">${text}</a>`;

export function confirmationMail(env, t) {
  const url = `${site(env)}/api/confirm?t=${t}`;
  return {
    subject: 'confirm',
    text: `one click to confirm.\n${url}\n\nthen we will write once, when the shop opens.\nuntil then: instagram @nei.nai.noi\n${INSTAGRAM}\n\nneinainoi`,
    html: layout([
      ['one click to confirm.', link(url, 'confirm')],
      ['then we will write once, when the shop opens.', `until then: ${link(INSTAGRAM, 'instagram @nei.nai.noi')}`],
      ['neinainoi'],
    ]),
  };
}

export function welcomeMail(env, t) {
  const out = `${site(env)}/api/unsubscribe?t=${t}`;
  return {
    subject: 'you are on the list',
    text: `thank you.\nwe will write once, when the shop opens. nothing before that.\n\nuntil then, follow us on instagram @nei.nai.noi\n${INSTAGRAM}\n\nneinainoi\n\nunsubscribe: ${out}`,
    html: layout([
      ['thank you.', 'we will write once, when the shop opens. nothing before that.'],
      [`until then, follow us on ${link(INSTAGRAM, 'instagram @nei.nai.noi')}`],
      ['neinainoi'],
      [`<small>${link(out, 'unsubscribe')}</small>`],
    ]),
    unsubscribe: out,
  };
}

async function send(env, to, mail) {
  const headers = mail.unsubscribe ? { 'List-Unsubscribe': `<${mail.unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'neinainoi <hello@neinainoi.com>', to: [to], subject: mail.subject, text: mail.text, html: mail.html, headers }),
  });
  if (!res.ok) throw new Error(`mail ${res.status}`);
}

export async function subscribe(request, env) {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (form.get('website')) return reply(request, env, true, 'thanks.html'); // filled only by bots
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(request, env, false, 'invalid.html');

  const row = await env.DB.prepare('SELECT token, status FROM subscribers WHERE email = ?').bind(email).first();
  if (row?.status === 'confirmed') return reply(request, env, true, 'thanks.html');

  const t = row?.token || token();
  if (!row) {
    await env.DB.prepare('INSERT INTO subscribers (email, token, status, created_at) VALUES (?, ?, ?, ?)').bind(email, t, 'pending', now()).run();
  }
  await send(env, email, confirmationMail(env, t));
  return reply(request, env, true, 'thanks.html');
}

export async function confirm(request, env) {
  const t = new URL(request.url).searchParams.get('t') || '';
  const row = await env.DB.prepare('SELECT email, status FROM subscribers WHERE token = ?').bind(t).first();
  if (!row) return Response.redirect(`${site(env)}/`, 303);
  if (row.status !== 'confirmed') {
    await env.DB.prepare('UPDATE subscribers SET status = ?, confirmed_at = ? WHERE token = ?').bind('confirmed', now(), t).run();
    await send(env, row.email, welcomeMail(env, t));
  }
  return Response.redirect(`${site(env)}/confirmed.html`, 303);
}

export async function unsubscribe(request, env) {
  const t = new URL(request.url).searchParams.get('t') || '';
  await env.DB.prepare('DELETE FROM subscribers WHERE token = ?').bind(t).run();
  return Response.redirect(`${site(env)}/unsubscribed.html`, 303);
}
