// /api/waitlist.js — Vercel Serverless Function
// Receives waitlist email → creates Person in Pipedrive

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.PIPEDRIVE_API_KEY;
  if (!apiKey) {
    console.error('PIPEDRIVE_API_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Create or find Person in Pipedrive
    const pdRes = await fetch(`https://api.pipedrive.com/v1/persons?api_token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: email.split('@')[0],
        email: [{ value: email, primary: true, label: 'work' }],
        label: 'waitlist',
        visible_to: '3',
      }),
    });

    const pdData = await pdRes.json();

    if (!pdData.success) {
      console.error('Pipedrive error:', pdData);
      // Don't expose Pipedrive errors to client — still log the signup
    }

    // Log to console for Vercel log review
    console.log(`WAITLIST SIGNUP: ${email} | Pipedrive person id: ${pdData?.data?.id || 'error'}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Waitlist handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
