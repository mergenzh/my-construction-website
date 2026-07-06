const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL   = 'hello@kzfoundations.com';
const FROM_EMAIL = 'K&Z Foundations Website <estimates@kzfoundations.com>';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Vercel plain Node.js functions don't auto-parse req.body — read the stream manually
  let body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Could not parse request. Please try again.' });
  }

  const { name, type, phone, email, description, attachments = [] } = body;

  if (!name || !phone || !email || !description) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const html = `
    <h2>New Estimate Request — K&amp;Z Foundations Website</h2>
    <p><strong>Name / Organization:</strong> ${escapeHtml(name)}</p>
    <p><strong>Category:</strong> ${escapeHtml(type || '—')}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Project Description:</strong><br>${escapeHtml(description).replace(/\n/g, '<br>')}</p>
    <p style="color:#888;font-size:0.85rem;">${attachments.length} file(s) attached</p>
  `;

  // Convert base64 attachments sent from the client back to Buffers
  const resendAttachments = attachments
    .filter(a => a && a.filename && a.content)
    .map(a => ({
      filename: a.filename,
      content:  Buffer.from(a.content, 'base64'),
    }));

  try {
    const { error } = await resend.emails.send({
      from:        FROM_EMAIL,
      to:          [TO_EMAIL],
      reply_to:    email,
      subject:     `New Estimate Request — ${name}`,
      html,
      attachments: resendAttachments.length ? resendAttachments : undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'The email service rejected the message. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'Something went wrong sending your request. Please try again or call us.' });
  }
};
