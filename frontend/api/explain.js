const { getClient, cors } = require('./_lib/anthropic');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { beat = {}, question = 'Why does this beat work?' } = req.body;

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system: 'You are BeatMind, a friendly music theory teacher. Explain concepts in plain English with no jargon. Be encouraging and fun. Keep answers to 3-4 sentences.',
      messages: [{
        role: 'user',
        content: `Beat context: ${JSON.stringify(beat)}\n\nQuestion: ${question}`,
      }],
    });

    return res.status(200).json({ explanation: response.content[0].text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
