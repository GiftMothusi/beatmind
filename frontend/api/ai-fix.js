const { SYSTEM_PROMPT, getClient, parseClaudeResponse, cors } = require('./_lib/anthropic');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { beat = {} } = req.body;

  const fixPrompt = `Analyse this beat and fix any musical issues to make it sound better:
${JSON.stringify(beat)}

Look for: off-beat patterns, too sparse/dense patterns, genre inconsistencies, poor groove.
Fix the issues and return the improved beat JSON with a clear explanation of what you changed.`;

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fixPrompt }],
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
