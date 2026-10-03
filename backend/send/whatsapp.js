// WhatsApp Business API (Meta Cloud API). Free-form text is allowed inside the 24-hour window after the person
// last wrote to the number; outside it only an approved template may be sent. The job tries text first and falls
// back to the template `incentive_update` with one body parameter (the headline) when Meta refuses (error 131047).
const TOKEN = process.env.WHATSAPP_TOKEN, PHONE_ID = process.env.WHATSAPP_PHONE_ID, VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';
const TEMPLATE = process.env.WHATSAPP_TEMPLATE || 'incentive_update', LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

function configured() { return !!(TOKEN && PHONE_ID); }
async function post(payload) {
  const r = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error && j.error.message || ('HTTP ' + r.status)); e.code = j.error && j.error.code; throw e; }
  return j.messages && j.messages[0] && j.messages[0].id;
}
async function send(to, text, headline) {
  if (!configured()) throw new Error('WhatsApp not configured (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID)');
  const num = String(to).replace(/[^\d]/g, '');
  try { return { id: await post({ messaging_product: 'whatsapp', to: num, type: 'text', text: { body: text.slice(0, 4096), preview_url: false } }), mode: 'text' }; }
  catch (e) {
    if (e.code !== 131047 && e.code !== 131026) throw e;
    const id = await post({ messaging_product: 'whatsapp', to: num, type: 'template', template: { name: TEMPLATE, language: { code: LANG }, components: [{ type: 'body', parameters: [{ type: 'text', text: (headline || 'Your incentive update is ready').slice(0, 1000).replace(/\s+/g, ' ') }] }] } });
    return { id, mode: 'template' };
  }
}
module.exports = { send, configured };
