/**
 * Claude Grammar Checker — Popup Script
 * Manages extension settings and API key configuration.
 */

const apiKeyInput = document.getElementById('api-key');
const modelSelect = document.getElementById('model-select');
const toggleEnabled = document.getElementById('toggle-enabled');
const btnSave = document.getElementById('btn-save');
const statusBanner = document.getElementById('status-banner');
const toggleVisibility = document.getElementById('toggle-visibility');

const EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

const EYE_CLOSED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
  <line x1="1" y1="1" x2="23" y2="23"/>
</svg>`;

// Load saved settings on open
chrome.storage.sync.get(['apiKey', 'model', 'enabled'], (settings) => {
  if (settings.apiKey) apiKeyInput.value = settings.apiKey;
  if (settings.model) modelSelect.value = settings.model;
  toggleEnabled.checked = settings.enabled !== false;
});

// Toggle show/hide API key
toggleVisibility.addEventListener('click', () => {
  const isHidden = apiKeyInput.type === 'password';
  apiKeyInput.type = isHidden ? 'text' : 'password';
  toggleVisibility.innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
});

// Enable/disable toggle — save immediately
toggleEnabled.addEventListener('change', () => {
  const enabled = toggleEnabled.checked;
  chrome.storage.sync.set({ enabled }, () => {
    // Notify content scripts on active tabs
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled }).catch(() => {});
      });
    });
    showBanner(enabled ? '✓ Extension enabled' : 'Extension disabled', 'info', 1500);
  });
});

/** Keep only printable ASCII (0x21–0x7E) — same as background.js. */
function sanitizeKey(raw) {
  return String(raw).replace(/[^\x21-\x7E]/g, '');
}

// Save all settings
btnSave.addEventListener('click', async () => {
  const apiKey = sanitizeKey(apiKeyInput.value);
  const model = modelSelect.value;

  if (!apiKey) {
    showBanner('⚠ Please enter your API key', 'error');
    apiKeyInput.focus();
    return;
  }

  // Soft format hint only — don't block if format looks unusual
  if (apiKey.length < 20) {
    showBanner('⚠ API key looks too short — please double-check it', 'error');
    return;
  }

  btnSave.disabled = true;
  btnSave.textContent = 'Validating key…';
  showBanner('⟳ Checking API key…', 'info');

  try {
    const result = await chrome.runtime.sendMessage({ type: 'VALIDATE_KEY', apiKey });

    if (!result.success) {
      showBanner(`✗ ${result.error || 'Invalid API key'}`, 'error');
      btnSave.disabled = false;
      btnSave.textContent = 'Save Settings';
      return;
    }

    // Key is valid — save everything
    const enabled = toggleEnabled.checked;
    await chrome.storage.sync.set({ apiKey, model, enabled });

    showBanner('✓ Settings saved!', 'success', 2000);
    btnSave.textContent = '✓ Saved';
    setTimeout(() => {
      btnSave.textContent = 'Save Settings';
      btnSave.disabled = false;
    }, 2000);
  } catch (err) {
    showBanner('✗ Error saving settings', 'error');
    btnSave.disabled = false;
    btnSave.textContent = 'Save Settings';
  }
});

function showBanner(message, type = 'info', autoDismissMs = 0) {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${type}`;
  statusBanner.classList.remove('hidden');
  if (autoDismissMs > 0) {
    setTimeout(() => statusBanner.classList.add('hidden'), autoDismissMs);
  }
}
