// api/send-audit.js
const RESEND_API_KEY = process.env.RESEND_API_KEY; // ilalagay natin sa Vercel env vars

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse JSON body
  const { name, email, store_url, platform, challenges } = req.body;

  // Basic validation
  if (!name || !email || !store_url) {
    return res.status(400).json({ error: 'Missing required fields: name, email, store_url' });
  }

  // Honeypot check (optional, pero pwede na rin)
  if (req.body.website_url) {
    // Bot detected, silently succeed
    return res.status(200).json({ success: true, message: 'ok' });
  }

  // Build email HTML
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>body{font-family:sans-serif;background:#0A0C10;color:#EDF2F7;} .container{max-width:600px;margin:auto;background:#0F1217;border:1px solid #1E252D;border-radius:16px;overflow:hidden;} .header{background:linear-gradient(135deg,#0F1217,#1a1f2b);padding:28px 32px;border-bottom:2px solid #2BD67B;text-align:center;} .header h2{color:#2BD67B;font-family:monospace;margin:0;} .body{padding:32px;} .field{margin-bottom:20px;padding:16px 20px;background:rgba(43,214,123,0.03);border-left:3px solid #2BD67B;border-radius:8px;} .field-label{font-family:monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:#5F6C84;margin-bottom:4px;} .field-value{font-size:0.95rem;color:#EDF2F7;} .footer{padding:20px 32px;background:rgba(10,12,16,0.8);border-top:1px solid #1E252D;text-align:center;font-family:monospace;font-size:0.6rem;color:#5F6C84;}</style></head>
    <body>
      <div class="container">
        <div class="header"><h2>🔍 NEW STORE AUDIT REQUEST</h2></div>
        <div class="body">
          <div class="field"><div class="field-label">Full Name</div><div class="field-value">${name}</div></div>
          <div class="field"><div class="field-label">Email Address</div><div class="field-value">${email}</div></div>
          <div class="field"><div class="field-label">Store URL</div><div class="field-value">${store_url}</div></div>
          <div class="field"><div class="field-label">Platform</div><div class="field-value">${platform}</div></div>
          <div class="field"><div class="field-label">Challenges Facing</div><div class="field-value">${challenges || 'Not provided'}</div></div>
        </div>
        <div class="footer"><p>Sent via Notz.Dev Automated Form System</p></div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Notz.Dev Store Audit <onboarding@resend.dev>',
        to: ['ajhay.dev@gmail.com'],
        reply_to: email,
        subject: `🔍 New Store Audit Request from ${name}`,
        html: emailHtml,
        text: `New Store Audit Request\n\nName: ${name}\nEmail: ${email}\nStore URL: ${store_url}\nPlatform: ${platform}\nChallenges: ${challenges || 'Not provided'}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Resend API error');
    }

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
}