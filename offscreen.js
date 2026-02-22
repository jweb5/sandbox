/**
 * Claude Grammar Checker — Offscreen Document
 *
 * This page exists solely to make fetch requests to the Anthropic API.
 * Extension pages (unlike MV3 service workers) have full host_permissions
 * CORS bypass, so the anthropic-dangerous-direct-browser-access header
 * actually reaches the server instead of being stripped by a CORS preflight.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'FETCH_ANTHROPIC') return false;

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: message.headers,
    body: message.body, // already JSON-stringified by background.js
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      sendResponse({ ok: response.ok, status: response.status, data });
    })
    .catch((err) => {
      sendResponse({ ok: false, status: 0, error: err.message });
    });

  return true; // keep the message channel open for the async response
});
