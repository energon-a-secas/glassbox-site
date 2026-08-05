// ── Shared utilities ─────────────────────────────────────────

export function $(id) { return document.getElementById(id); }

/** Escape HTML special characters. */
export function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escape, then promote `backticked` spans to <code>. The question bank writes
 * identifiers in markdown style because the stems read as prose; escaping runs
 * first, so the markup can only ever be the <code> tags added here.
 */
export function codeify(str) {
  return escHtml(str).replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Create an element with class + innerHTML in one call. */
export function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/** Show a temporary toast. */
let _toastTimer = null;
export function showToast(msg) {
  let node = document.getElementById('app-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'app-toast';
    node.className = 'toast';
    document.body.appendChild(node);
  }
  node.textContent = msg;
  node.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => node.classList.remove('visible'), 1800);
}

/**
 * Very light code "highlighter": wraps strings, comments, keywords,
 * and punctuation in spans. Good enough for short config snippets,
 * intentionally not a real parser.
 */
export function highlightCode(code, lang) {
  let out = escHtml(code);
  // Strings (double-quoted) and template-ish ${...}
  out = out.replace(/(&quot;[^&]*?&quot;)/g, '<span class="tok-str">$1</span>');
  // Line comments (# for md/yaml/py/bash, // for others)
  if (lang === 'md' || lang === 'yaml' || lang === 'py' || lang === 'bash') {
    out = out.replace(/(^|\n)(#[^\n]*)/g, '$1<span class="tok-com">$2</span>');
  } else {
    out = out.replace(/(\/\/[^\n]*)/g, '<span class="tok-com">$1</span>');
  }
  // JSON keys already covered by string rule; highlight booleans/null/numbers
  out = out.replace(/\b(true|false|null)\b/g, '<span class="tok-kw">$1</span>');
  return out;
}

/** Copy text to clipboard, with a toast. */
export function copyText(text, label) {
  navigator.clipboard?.writeText(text).then(
    () => showToast(label || 'Copied'),
    () => showToast('Copy failed'),
  );
}
