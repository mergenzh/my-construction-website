const { formidable } = require('formidable');
const fs = require('fs');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = 'hello@kzfoundations.com';
const FROM_EMAIL = 'K&Z Foundations Website <estimates@kzfoundations.com>';
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

// Tell Vercel NOT to pre-parse the request body — formidable needs the raw stream
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const form = formidable({
    multiples: true,
    maxTotalFileSize: MAX_TOTAL_BYTES,
  });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    console.error('Form parse error:', err);
    // formidable error code 1009 = maxTotalFileSize exceeded
    const isSizeError = err.code === 1009 || (err.message || '').toLowerCase().includes('maxTotalFileSize');
    return res.status(413).json({
      error: isSizeError
        ? 'Your attachments are too large. Please keep total uploads under 4MB, or email photos directly to hello@kzfoundations.com.'
        : 'We couldn\'t read your submission. Please try again or call us at (412) 608-9544.',
    });
  }

  const get = (val) => (Array.isArray(val) ? val[0] : val) || '';

  const name        = get(fields.name);
  const type        = get(fields.type);
  const phone       = get(fields.phone);
  const email       = get(fields.email);
  const description = get(fields.description);

  if (!name || !phone || !email || !description) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  // Collect uploaded files — filter out empty entries browsers send for unselected inputs
  const rawFiles = files.attachments
    ? Array.isArray(files.attachments) ? files.attachments : [files.attachments]
    : [];

  const attachments = [];
  for (const file of rawFiles) {
    if (!file || !file.filepath || file.size === 0) continue;
    const content = fs.readFileSync(file.filepath);
    attachments.push({
      filename: file.originalFilename || 'attachment',
      content: content.toString('base64'),
    });
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
    <p><strong>Category:</strong> ${escapeHtml(type)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Project Description:</strong><br>${escapeHtml(description).replace(/\n/g, '<br>')}</p>
    <p style="color:#888;font-size:0.85rem;">${attachments.length} file(s) attached</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      reply_to: email,
      subject: `New Estimate Request — ${name}`,
      html,
      attachments: attachments.length ? attachments : undefined,
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

// Must come AFTER module.exports is assigned — otherwise the handler assignment overwrites it
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
