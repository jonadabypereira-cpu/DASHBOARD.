const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpeGGUO2701MlqE0qS1fcOybctPkeF2rIPRPWq7-ltaxWvKO3DfELNvzC4BMGGWqk/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        redirect: 'follow'
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (erro) {
    return res.status(500).json({ success: false, error: erro.message });
  }
}