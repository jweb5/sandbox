/**
 * Claude Grammar Checker - Background Service Worker
 *
 * All Anthropic API calls are routed through an offscreen document because
 * MV3 service workers are subject to full CORS enforcement — custom headers
 * like anthropic-dangerous-direct-browser-access get stripped by the CORS
 * preflight before reaching the server. Extension pages (offscreen documents)
 * have host_permissions CORS bypass, so the headers arrive intact.
 */

const OFFSCREEN_URL = chrome.runtime.getURL('offscreen.html');

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

// ── Offscreen document management ────────────────────────────────────────────

async function ensureOffscreen() {
  try {
    const has = typeof chrome.offscreen?.hasDocument === 'function'
      ? await chrome.offscreen.hasDocument()
      : false;
    if (!has) {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: ['IFRAME_SCRIPTING'],
        justification: 'Route Anthropic API requests through an extension page context to bypass MV3 service-worker CORS restrictions.',
      });
    }
  } catch (e) {
    // Ignore "already exists" errors; log anything else
    if (!e.message?.includes('only one offscreen')) {
      console.warn('[CGC] offscreen:', e.message);
    }
  }
}

/** Send a fetch request via the offscreen document and return its response. */
async function offscreenFetch(headers, body) {
  await ensureOffscreen();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_ANTHROPIC', headers, body: JSON.stringify(body) },
      (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!resp) {
          reject(new Error('No response from offscreen document. Try reloading the extension.'));
        } else {
          resolve(resp);
        }
      },
    );
  });
}

// ── Message listeners ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_GRAMMAR') {
    chrome.storage.sync.get(['apiKey', 'model'], (settings) => {
      if (!settings.apiKey) {
        sendResponse({ success: false, error: 'API key not configured. Click the extension icon to set it up.' });
        return;
      }
      checkGrammar(message.text, sanitizeKey(settings.apiKey), settings.model || 'claude-haiku-4-5')
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true;
  }

  if (message.type === 'SET_BADGE') {
    chrome.action.setBadgeText({ text: message.text || '' });
    if (message.color) chrome.action.setBadgeBackgroundColor({ color: message.color });
    return false;
  }

  if (message.type === 'VALIDATE_KEY') {
    validateApiKey(sanitizeKey(message.apiKey))
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ── API helpers ───────────────────────────────────────────────────────────────

/** Keep only printable ASCII (0x21–0x7E). Ensures the API key is a valid HTTP header value. */
function sanitizeKey(key) {
  return String(key).replace(/[^\x21-\x7E]/g, '');
}

function makeHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

async function checkGrammar(text, apiKey, model) {
  const userPrompt = `Check this text for grammar, spelling, punctuation, style, and clarity issues:\n\n"""${text}"""`;

  const resp = await offscreenFetch(makeHeaders(apiKey), {
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  if (resp.error) throw new Error(`Network error: ${resp.error}`);

  if (!resp.ok) {
    const msg = resp.data?.error?.message || '';
    if (resp.status === 401) throw new Error(`Invalid API key.${msg ? ' ' + msg : ''}`);
    if (resp.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
    if (resp.status === 529) throw new Error('Claude API is overloaded. Please try again in a moment.');
    throw new Error(`API error ${resp.status}${msg ? ': ' + msg : ''}`);
  }

  const textBlock = resp.data?.content?.find(b => b.type === 'text');
  if (!textBlock?.text) throw new Error('Unexpected API response format.');

  let parsed;
  try {
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
  if (!apiKey) return { success: false, error: 'API key is empty.' };

  let resp;
  try {
    resp = await offscreenFetch(makeHeaders(apiKey), {
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
  } catch (err) {
    return { success: false, error: `Connection error: ${err.message}` };
  }

  if (resp.error) return { success: false, error: `Network error: ${resp.error}` };
  if (resp.ok || resp.status === 529) return { success: true };

  const apiMsg = resp.data?.error?.message || '';
  if (resp.status === 401) return { success: false, error: `Invalid API key (401)${apiMsg ? ': ' + apiMsg : ''}` };
  if (resp.status === 403) return { success: false, error: `Access denied (403)${apiMsg ? ': ' + apiMsg : ''}` };
  return { success: false, error: `API error ${resp.status}${apiMsg ? ': ' + apiMsg : ''}` };
}
