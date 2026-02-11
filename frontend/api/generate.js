const { SYSTEM_PROMPT, getClient, parseClaudeResponse, cors } = require('./_lib/anthropic');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt = '', history = [] } = req.body;
  const messages = [...history, { role: 'user', content: `Generate a beat: ${prompt}` }];

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const result = parseClaudeResponse(response.content[0].text);
    return res.status(200).json(result);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return res.status(500).json({ error: `JSON parse error: ${e.message}` });
    }
    return res.status(500).json({ error: e.message });
  }
};
