// ── Shell render + lab router ────────────────────────────────
import { LABS, state } from './state.js';
import { $, el } from './utils.js';

import { mountLoop } from './labs/loop.js';
import { mountSdk } from './labs/sdk.js';
import { mountMcp } from './labs/mcp.js';
import { mountConfig } from './labs/config.js';
import { mountPlanning } from './labs/planning.js';
import { mountPatterns } from './labs/patterns.js';
import { mountTraps } from './labs/traps.js';
import { mountAntipatterns } from './labs/antipatterns.js';
import { mountDrill } from './labs/drill.js';

const LAB_MOUNT = {
  loop: mountLoop,
  sdk: mountSdk,
  mcp: mountMcp,
  config: mountConfig,
  planning: mountPlanning,
  patterns: mountPatterns,
  traps: mountTraps,
  antipatterns: mountAntipatterns,
  drill: mountDrill,
};

/** Build the sticky lab tab rail once. */
export function buildRail() {
  const inner = $('labRailInner');
  if (!inner) return;
  inner.innerHTML = '';
  LABS.forEach((lab, i) => {
    const btn = el('button', 'lab-tab');
    btn.type = 'button';
    btn.dataset.lab = lab.id;
    btn.innerHTML = `<span class="lab-tab__num">${i + 1}</span><span class="lab-tab__label">${lab.label}</span>`;
    btn.title = lab.hint;
    inner.appendChild(btn);
  });
}

/** Reflect the active lab on the rail. */
export function syncRail(s) {
  document.querySelectorAll('.lab-tab').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.lab === s.activeLab);
    b.setAttribute('aria-current', b.dataset.lab === s.activeLab ? 'page' : 'false');
  });
}

/** Mount the active lab into #labMount. */
export function mountLab(s) {
  const mount = $('labMount');
  if (!mount) return;
  mount.innerHTML = '';
  document.body.dataset.lab = s.activeLab;
  document.body.dataset.capture = ''; // labs opt back in on mount (drill does)
  (LAB_MOUNT[s.activeLab] || (() => {}))(mount);
  syncRail(s);
}

export function render(s) {
  buildRail();
  mountLab(s);
}
