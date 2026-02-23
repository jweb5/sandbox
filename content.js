/**
 * Claude Grammar Checker - Content Script
 * Detects editable elements, sends text for analysis, and renders suggestions.
 */
(function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────
  const DEBOUNCE_MS = 1800;      // Wait after last keystroke before checking
  const MIN_CHARS = 10;          // Minimum characters before triggering a check
  const PANEL_ID = 'cgc-panel';
  const BTN_ID = 'cgc-fab';

  const TYPE_META = {
    spelling:    { label: 'Spelling',    color: '#ef4444', emoji: '🔴' },
    grammar:     { label: 'Grammar',     color: '#f97316', emoji: '🟠' },
    punctuation: { label: 'Punctuation', color: '#eab308', emoji: '🟡' },
    style:       { label: 'Style',       color: '#3b82f6', emoji: '🔵' },
    clarity:     { label: 'Clarity',     color: '#8b5cf6', emoji: '🟣' },
  };

  // ── State ────────────────────────────────────────────────────────────────
  let enabled = true;
  let debounceTimer = null;
  let currentEl = null;
  let lastCheckedText = '';
  let isChecking = false;
  let panel = null;
  let fab = null;
  const mirrors = new WeakMap(); // textarea/input el → mirror overlay div

  // ── Initialization ───────────────────────────────────────────────────────
  async function init() {
    const settings = await storageGet(['enabled']);
    enabled = settings.enabled !== false;
    if (enabled) attach();
  }

  chrome.storage.onChanged.addListener((changes) => {
    if ('enabled' in changes) {
      enabled = changes.enabled.newValue;
      enabled ? attach() : detach();
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TOGGLE') {
      enabled = msg.enabled;
      enabled ? attach() : detach();
    }
  });

  // ── Event wiring ─────────────────────────────────────────────────────────
  function attach() {
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('scroll', onScrollEl, true);
    window.addEventListener('resize', onWindowResize);
  }

  function detach() {
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('input', onInput, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('scroll', onScrollEl, true);
    window.removeEventListener('resize', onWindowResize);
    if (currentEl) clearHighlights(currentEl);
    hidePanel();
    hideFab();
    currentEl = null;
  }

  function onFocusIn(e) {
    const el = e.target;
    if (!isEditable(el)) return;
    currentEl = el;
    scheduleFabUpdate();
    // Trigger a check on focus if the field already has enough text
    if (enabled && getText(el).trim().length >= MIN_CHARS) {
      scheduleCheck(el);
    }
  }

  function onFocusOut(e) {
    // Delay so clicks on panel/fab don't prematurely hide them
    setTimeout(() => {
      const active = document.activeElement;
      const panelEl = document.getElementById(PANEL_ID);
      const fabEl = document.getElementById(BTN_ID);
      if (!panelEl?.contains(active) && !fabEl?.contains(active) && active !== currentEl) {
        hidePanel();
        hideFab();
        if (currentEl) clearHighlights(currentEl);
        currentEl = null;
      }
    }, 150);
  }

  function onInput(e) {
    if (!enabled) return;
    const el = e.target;
    if (!isEditable(el)) return;
    currentEl = el;
    clearHighlights(el); // Clear stale highlights while typing
    scheduleCheck(el);
    scheduleFabUpdate();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      hidePanel();
    }
  }

  function onScrollEl(e) {
    // Sync on any scroll — page scroll changes viewport coords for position:fixed mirror
    if (!currentEl) return;
    const mirror = mirrors.get(currentEl);
    if (mirror && mirror.style.display !== 'none') syncMirrorPosition(currentEl, mirror);
  }

  function onWindowResize() {
    if (!currentEl) return;
    const mirror = mirrors.get(currentEl);
    if (mirror && mirror.style.display !== 'none') {
      syncMirrorStyles(currentEl, mirror);
      syncMirrorPosition(currentEl, mirror);
    }
  }

  // ── Grammar check flow ───────────────────────────────────────────────────
  function scheduleCheck(el) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runCheck(el), DEBOUNCE_MS);
  }

  async function runCheck(el) {
    if (!enabled || isChecking) return;
    const text = getText(el);
    if (text.trim().length < MIN_CHARS) return;
    if (text === lastCheckedText) return;

    isChecking = true;
    lastCheckedText = text;
    showPanelLoading(el);
    chrome.runtime.sendMessage({ type: 'SET_BADGE', text: '…', color: '#7c3aed' }).catch(() => {});

    let response;
    try {
      response = await chrome.runtime.sendMessage({ type: 'CHECK_GRAMMAR', text });
    } catch (err) {
      isChecking = false;
      chrome.runtime.sendMessage({ type: 'SET_BADGE', text: '!', color: '#f97316' }).catch(() => {});
      showPanelError('Could not reach extension background. Try reloading the page.');
      return;
    }

    isChecking = false;

    if (!enabled || currentEl !== el) {
      chrome.runtime.sendMessage({ type: 'SET_BADGE', text: '', color: '' }).catch(() => {});
      return;
    }

    if (response?.success) {
      const count = response.issues?.length ?? 0;
      chrome.runtime.sendMessage({
        type: 'SET_BADGE',
        text: count > 0 ? String(count) : '✓',
        color: count > 0 ? '#ef4444' : '#22c55e',
      }).catch(() => {});
      renderPanel(el, response.issues, response.score, response.summary);
    } else {
      chrome.runtime.sendMessage({ type: 'SET_BADGE', text: '!', color: '#f97316' }).catch(() => {});
      showPanelError(response?.error || 'Unknown error');
    }
  }

  // ── Editable element helpers ─────────────────────────────────────────────
  function isEditable(el) {
    if (!el || el.tagName === 'SELECT') return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      const t = (el.type || 'text').toLowerCase();
      return ['text', 'search', 'email', 'url', 'tel', ''].includes(t);
    }
    return el.isContentEditable === true || el.getAttribute('contenteditable') === 'true';
  }

  function getText(el) {
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      return el.innerText || '';
    }
    return el.value || '';
  }

  function applyFix(el, original, suggestion) {
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      applyFixContentEditable(el, original, suggestion);
    } else {
      const val = el.value;
      const idx = val.indexOf(original);
      if (idx === -1) return;
      el.value = val.slice(0, idx) + suggestion + val.slice(idx + original.length);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    lastCheckedText = '';
    // Schedule a re-check after applying the fix
    scheduleCheck(el);
  }

  function applyFixContentEditable(el, original, suggestion) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.textContent.indexOf(original);
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + original.length);
        range.deleteContents();
        range.insertNode(document.createTextNode(suggestion));
        // Collapse cursor to end of inserted text
        const sel = window.getSelection();
        if (sel) {
          const newRange = document.createRange();
          newRange.setStartAfter(node.nextSibling || node);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
  }

  // ── Inline Highlights ─────────────────────────────────────────────────────

  function highlightIssues(el, issues) {
    if (!issues || issues.length === 0) {
      clearHighlights(el);
      return;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      applyContentEditableHighlights(el, issues);
    } else {
      applyMirrorHighlights(el, issues);
    }
  }

  function clearHighlights(el) {
    if (!el) return;
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      removeContentEditableHighlights(el);
    } else {
      const mirror = mirrors.get(el);
      if (mirror) mirror.style.display = 'none';
    }
  }

  // ── Mirror overlay (textarea / input) ──────────────────────────────────

  const MIRROR_COPY_STYLES = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
    'lineHeight', 'textTransform', 'paddingTop', 'paddingRight',
    'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth',
    'borderBottomWidth', 'borderLeftWidth', 'boxSizing', 'tabSize',
  ];

  function syncMirrorStyles(el, mirror) {
    const cs = window.getComputedStyle(el);
    for (const prop of MIRROR_COPY_STYLES) {
      mirror.style[prop] = cs[prop];
    }
    if (el.tagName.toLowerCase() === 'textarea') {
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordBreak = 'break-word';
      mirror.style.overflowWrap = 'break-word';
    } else {
      mirror.style.whiteSpace = 'pre';
      mirror.style.overflow = 'hidden';
    }
  }

  function syncMirrorPosition(el, mirror) {
    const rect = el.getBoundingClientRect();
    // Use viewport coords — mirror is position:fixed
    mirror.style.top = `${rect.top}px`;
    mirror.style.left = `${rect.left}px`;
    mirror.style.width = `${rect.width}px`;
    mirror.style.height = `${rect.height}px`;
    mirror.scrollTop = el.scrollTop;
    mirror.scrollLeft = el.scrollLeft;
  }

  function buildMirrorHtml(text, issues) {
    // Find non-overlapping issue ranges (first occurrence of each)
    const markers = [];
    for (const issue of issues) {
      if (!issue.original) continue;
      const idx = text.indexOf(issue.original);
      if (idx === -1) continue;
      markers.push({ start: idx, end: idx + issue.original.length, type: issue.type });
    }
    markers.sort((a, b) => a.start - b.start);
    // Remove overlaps
    const deduped = [];
    for (const m of markers) {
      if (deduped.length && m.start < deduped[deduped.length - 1].end) continue;
      deduped.push(m);
    }
    // Build HTML
    let html = '';
    let pos = 0;
    for (const m of deduped) {
      html += escapeHtml(text.slice(pos, m.start));
      html += `<mark class="cgc-hl cgc-hl-${m.type}">${escapeHtml(text.slice(m.start, m.end))}</mark>`;
      pos = m.end;
    }
    html += escapeHtml(text.slice(pos));
    return html;
  }

  function applyMirrorHighlights(el, issues) {
    let mirror = mirrors.get(el);
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.className = 'cgc-mirror';
      mirror.setAttribute('aria-hidden', 'true');
      document.body.appendChild(mirror);
      mirrors.set(el, mirror);
    }
    syncMirrorStyles(el, mirror);
    syncMirrorPosition(el, mirror);
    mirror.innerHTML = buildMirrorHtml(getText(el), issues);
    mirror.style.display = 'block';
  }

  // ── contenteditable highlights ──────────────────────────────────────────

  function removeContentEditableHighlights(el) {
    const marks = el.querySelectorAll('mark[data-cgchl]');
    for (const mark of marks) {
      const parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    }
    try { el.normalize(); } catch (e) { /* ignore */ }
  }

  function wrapFirstOccurrence(root, original, type) {
    // Snapshot text nodes first to avoid TreeWalker invalidation on mutation
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.parentElement?.hasAttribute('data-cgchl')) nodes.push(n);
    }
    for (const node of nodes) {
      const idx = node.textContent.indexOf(original);
      if (idx === -1) continue;
      const parent = node.parentNode;
      if (!parent) continue;
      const before = node.textContent.slice(0, idx);
      const after = node.textContent.slice(idx + original.length);
      const mark = document.createElement('mark');
      mark.setAttribute('data-cgchl', '');
      mark.className = `cgc-hl cgc-hl-${type}`;
      mark.textContent = original;
      if (before) parent.insertBefore(document.createTextNode(before), node);
      parent.insertBefore(mark, node);
      if (after) parent.insertBefore(document.createTextNode(after), node);
      parent.removeChild(node);
      return; // Only wrap first occurrence
    }
  }

  function applyContentEditableHighlights(el, issues) {
    // Save cursor
    const sel = window.getSelection();
    let savedRange = null;
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      try { savedRange = sel.getRangeAt(0).cloneRange(); } catch (e) { /* ignore */ }
    }

    removeContentEditableHighlights(el);

    for (const issue of issues) {
      if (issue.original) wrapFirstOccurrence(el, issue.original, issue.type);
    }

    // Restore cursor
    if (savedRange && sel) {
      try { sel.removeAllRanges(); sel.addRange(savedRange); } catch (e) { /* ignore */ }
    }
  }

  // ── Floating Action Button (FAB) ──────────────────────────────────────────
  function scheduleFabUpdate() {
    requestAnimationFrame(() => {
      if (currentEl && isEditable(currentEl)) updateFab(currentEl);
      else hideFab();
    });
  }

  function updateFab(el) {
    if (!fab) fab = createFab();
    const rect = el.getBoundingClientRect();
    // Viewport coords — FAB is position:fixed
    fab.style.top = `${rect.bottom - 28}px`;
    fab.style.left = `${rect.right - 28}px`;
    fab.style.display = 'flex';
  }

  function hideFab() {
    if (fab) fab.style.display = 'none';
  }

  function createFab() {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.className = 'cgc-fab';
    btn.title = 'Check grammar with Claude';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentEl) {
        lastCheckedText = ''; // Force re-check
        runCheck(currentEl);
      }
    });
    document.body.appendChild(btn);
    return btn;
  }

  // ── Panel ────────────────────────────────────────────────────────────────
  function getOrCreatePanel() {
    let p = document.getElementById(PANEL_ID);
    if (!p) {
      p = document.createElement('div');
      p.id = PANEL_ID;
      p.className = 'cgc-panel';
      document.body.appendChild(p);
      panel = p;
    }
    return p;
  }

  function showPanelLoading(el) {
    const p = getOrCreatePanel();
    p.innerHTML = `
      <div class="cgc-panel-header">
        <div class="cgc-panel-title">
          <span class="cgc-logo">✦</span> Claude Grammar
        </div>
        <button class="cgc-close-btn" title="Close">✕</button>
      </div>
      <div class="cgc-loading">
        <div class="cgc-spinner"></div>
        <span>Analyzing your writing…</span>
      </div>`;
    p.querySelector('.cgc-close-btn').addEventListener('click', hidePanel);
    p.classList.add('cgc-visible');
  }

  function showPanelError(msg) {
    const p = getOrCreatePanel();
    p.innerHTML = `
      <div class="cgc-panel-header">
        <div class="cgc-panel-title">
          <span class="cgc-logo">✦</span> Claude Grammar
        </div>
        <button class="cgc-close-btn" title="Close">✕</button>
      </div>
      <div class="cgc-error">
        <span class="cgc-error-icon">⚠️</span>
        <p>${escapeHtml(msg)}</p>
        ${msg.includes('API key') ? '<a class="cgc-settings-link" href="#" id="cgc-open-settings">Open Settings</a>' : ''}
      </div>`;
    p.querySelector('.cgc-close-btn').addEventListener('click', hidePanel);
    const settingsLink = p.querySelector('#cgc-open-settings');
    if (settingsLink) {
      settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      });
    }
    p.classList.add('cgc-visible');
  }

  function renderPanel(el, issues, score, summary) {
    // Apply inline highlights first
    highlightIssues(el, issues);

    const p = getOrCreatePanel();

    const scoreColor = score >= 90 ? '#22c55e' : score >= 70 ? '#f97316' : '#ef4444';
    const scoreLabel = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs work';
    const circumference = 2 * Math.PI * 18;
    const dashOffset = circumference * (1 - score / 100);

    const issueCount = issues.length;
    const issueWord = issueCount === 1 ? 'issue' : 'issues';

    let issuesHtml = '';
    if (issueCount === 0) {
      issuesHtml = `<div class="cgc-no-issues">
        <span class="cgc-check">✓</span>
        <p>No issues found! Your writing looks great.</p>
      </div>`;
    } else {
      issuesHtml = issues.map((issue, idx) => {
        const meta = TYPE_META[issue.type] || { label: issue.type, color: '#6b7280', emoji: '⚪' };
        return `
          <div class="cgc-issue-card" data-idx="${idx}">
            <div class="cgc-issue-type" style="color:${meta.color}; border-color:${meta.color}20; background:${meta.color}12">
              ${meta.emoji} ${meta.label}
            </div>
            <div class="cgc-issue-text">
              <span class="cgc-original">"${escapeHtml(issue.original)}"</span>
              <span class="cgc-arrow">→</span>
              <span class="cgc-suggestion">"${escapeHtml(issue.suggestion)}"</span>
            </div>
            <p class="cgc-explanation">${escapeHtml(issue.explanation)}</p>
            <button class="cgc-fix-btn" data-idx="${idx}">Apply Fix</button>
          </div>`;
      }).join('');
    }

    p.innerHTML = `
      <div class="cgc-panel-header">
        <div class="cgc-panel-title">
          <span class="cgc-logo">✦</span> Claude Grammar
        </div>
        <button class="cgc-close-btn" title="Close">✕</button>
      </div>
      <div class="cgc-score-section">
        <div class="cgc-score-ring">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="18" fill="none" stroke="#e5e7eb" stroke-width="4"/>
            <circle cx="24" cy="24" r="18" fill="none" stroke="${scoreColor}" stroke-width="4"
              stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
              stroke-linecap="round" transform="rotate(-90 24 24)"/>
          </svg>
          <span class="cgc-score-num" style="color:${scoreColor}">${score}</span>
        </div>
        <div class="cgc-score-info">
          <div class="cgc-score-label" style="color:${scoreColor}">${scoreLabel}</div>
          <div class="cgc-score-summary">${escapeHtml(summary)}</div>
          ${issueCount > 0 ? `<div class="cgc-issue-count">${issueCount} ${issueWord} found</div>` : ''}
        </div>
      </div>
      <div class="cgc-issues-list">${issuesHtml}</div>`;

    // Wire up close and fix buttons
    p.querySelector('.cgc-close-btn').addEventListener('click', hidePanel);
    p.querySelectorAll('.cgc-fix-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const issue = issues[idx];
        if (issue && currentEl) {
          applyFix(currentEl, issue.original, issue.suggestion);
          // Remove the fixed issue card
          btn.closest('.cgc-issue-card').classList.add('cgc-issue-fixed');
          btn.textContent = '✓ Fixed';
          btn.disabled = true;
        }
      });
    });

    p.classList.add('cgc-visible');
  }

  function hidePanel() {
    const p = document.getElementById(PANEL_ID);
    if (p) p.classList.remove('cgc-visible');
  }

  // ── Utilities ────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────
  init();
})();
