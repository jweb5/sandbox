/**
 * Claude Grammar Checker - Background Service Worker
 * Handles all Claude API communication from a privileged context.
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert grammar and writing assistant. Analyze text for issues and respond with ONLY valid JSON — no markdown, no explanation, no other text.

Respond in this exact JSON format:
{
  "issues": [
    {
      "original": "exact problematic phrase copied from the input",
      "suggestion": "corrected replacement",
      "type": "spelling|grammar|punctuation|style|clarity",
      "explanation": "brief explanation under 15 words"
    }
  ],
  "score": <integer 0-100>,
  "summary": "one sentence writing quality assessment"
}

Issue type definitions:
- spelling: misspelled or non-existent words
- grammar: grammatical errors (subject-verb agreement, tense, articles, etc.)
- punctuation: missing, extra, or wrong punctuation
- style: wordiness, redundancy, informal language, passive voice
- clarity: ambiguous, unclear, or convoluted phrasing

Rules:
- Only report genuine issues. Do not fabricate problems.
- The "original" field must be an exact substring of the input text.
- If no issues exist, return { "issues": [], "score": 100, "summary": "Your writing is excellent!" }
- Score reflects overall quality: 90-100 excellent, 70-89 good, 50-69 fair, below 50 needs work.`;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_GRAMMAR') {
    // Read API key and model from storage (never expose key to content script)
    chrome.storage.sync.get(['apiKey', 'model'], (settings) => {
      if (!settings.apiKey) {
        sendResponse({ success: false, error: 'API key not configured. Click the extension icon to set it up.' });
        return;
      }
      checkGrammar(message.text, settings.apiKey, settings.model || 'claude-haiku-4-5')
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'VALIDATE_KEY') {
    validateApiKey(message.apiKey)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function checkGrammar(text, apiKey, model) {
  const userPrompt = `Check this text for grammar, spelling, punctuation, style, and clarity issues:\n\n"""${text}"""`;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `HTTP ${response.status}`;
    if (response.status === 401) throw new Error('Invalid API key. Please check your key in the extension settings.');
    if (response.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
    if (response.status === 529) throw new Error('Claude API is overloaded. Please try again in a moment.');
    throw new Error(`API error: ${msg}`);
  }

  const data = await response.json();

  // Extract text block (skip any non-text blocks)
  const textBlock = data.content?.find(b => b.type === 'text');
  if (!textBlock?.text) throw new Error('Unexpected API response format.');

  let parsed;
  try {
    // Strip any accidental markdown code fences
    const cleaned = textBlock.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse Claude response. Please try again.');
  }

  if (!Array.isArray(parsed.issues)) throw new Error('Invalid response structure from Claude.');

  return {
    success: true,
    issues: parsed.issues,
    score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 100,
    summary: parsed.summary || '',
  };
}

async function validateApiKey(apiKey) {
  // Send a minimal request to verify the key works
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });

  if (response.status === 401) return { success: false, error: 'Invalid API key.' };
  if (response.ok || response.status === 529) return { success: true };
  const data = await response.json().catch(() => ({}));
  return { success: false, error: data.error?.message || `HTTP ${response.status}` };
}
