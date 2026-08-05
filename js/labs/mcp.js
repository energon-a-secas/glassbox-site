// ── Lab 2: MCP ───────────────────────────────────────────────
// Same task, two ways. Improvise an integration (burns tokens on
// throwaway code) vs a defined MCP server (auto-discovered tools).

import { MCP_TASK, MCP_FLOWS, MCP_ERRORS, MCP_PRIMITIVES } from '../data/mcp.js';
import { el, escHtml, highlightCode, copyText } from '../utils.js';

const timers = {};

function total(flow) { return flow.steps.reduce((a, s) => a + s.tokens, 0); }

function playFlow(id) {
  const flow = MCP_FLOWS[id];
  const log = document.getElementById(`mcpLog-${id}`);
  const fill = document.getElementById(`mcpFill-${id}`);
  const label = document.getElementById(`mcpTok-${id}`);
  const bar = document.getElementById(`mcpBar-${id}`);
  const grand = total(flow);
  const grandMax = Math.max(total(MCP_FLOWS.adhoc), total(MCP_FLOWS.defined));
  clearInterval(timers[id]);
  log.innerHTML = '';
  let i = 0, acc = 0;
  timers[id] = setInterval(() => {
    if (i >= flow.steps.length) { clearInterval(timers[id]); return; }
    const st = flow.steps[i];
    acc += st.tokens;
    const row = el('div', `mcp-line mcp-line--${st.kind}`);
    row.innerHTML = `<span class="mcp-line__kind">${st.kind}</span><span class="mcp-line__txt">${escHtml(st.line)}</span><span class="mcp-line__tok">+${st.tokens}</span>`;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    fill.style.width = `${Math.round((acc / grand) * 100)}%`;
    label.textContent = `${acc.toLocaleString('en-US')} tokens`;
    if (bar) bar.style.width = `${Math.round((acc / grandMax) * 100)}%`;
    i++;
  }, 700);
}

function summary(flow) {
  const yn = (v) => v ? '<span class="yn yn--y">yes</span>' : '<span class="yn yn--n">no</span>';
  return `
    <dl class="mcp-summary">
      <div><dt>Turns</dt><dd>${flow.totals.turns}</dd></div>
      <div><dt data-tip="mcp">Tools auto-discovered</dt><dd>${yn(flow.totals.discovery)}</dd></div>
      <div><dt>Reusable next session</dt><dd>${yn(flow.totals.reusable)}</dd></div>
      <div><dt>Secret kept out of context</dt><dd>${yn(flow.totals.secretsSafe)}</dd></div>
    </dl>`;
}

function column(id) {
  const flow = MCP_FLOWS[id];
  const cons = flow.cons ? `<ul class="mcp-list mcp-list--con">${flow.cons.map((c) => `<li>${escHtml(c)}</li>`).join('')}</ul>` : '';
  const pros = flow.pros ? `<ul class="mcp-list mcp-list--pro">${flow.pros.map((c) => `<li>${escHtml(c)}</li>`).join('')}</ul>` : '';
  const config = flow.config ? `
    <div class="code-block code-block--sm">
      <div class="code-block__bar"><span data-tip="mcp_json">.mcp.json</span><button class="code-copy" data-copy="mcpcfg">copy</button></div>
      <pre><code>${highlightCode(flow.config, 'json')}</code></pre>
    </div>` : '';
  return `
    <div class="mcp-col mcp-col--${flow.tone}">
      <header class="mcp-col__head">
        <h3>${escHtml(flow.title)}</h3>
        <p>${escHtml(flow.subtitle)}</p>
      </header>
      ${config}
      <button class="btn btn--secondary btn--sm mcp-run" data-run="${id}">\u25b6 Run this way</button>
      <div class="mcp-meter"><div class="mcp-meter__track"><div class="mcp-meter__fill" id="mcpFill-${id}"></div></div><span id="mcpTok-${id}">0 tokens</span></div>
      <div class="mcp-log" id="mcpLog-${id}"></div>
      ${summary(flow)}
      ${cons}${pros}
    </div>`;
}

export function mountMcp(root) {
  const err = (k) => `
    <div class="err-card err-card--${k === 'good' ? 'good' : 'bad'}">
      <div class="err-card__label">${escHtml(MCP_ERRORS[k].label)}</div>
      <pre><code>${highlightCode(MCP_ERRORS[k].code, 'json')}</code></pre>
      <p class="err-card__note">${escHtml(MCP_ERRORS[k].note)}</p>
    </div>`;

  const primitives = MCP_PRIMITIVES.map((p) => `
    <div class="prim">
      <h4${p.tip ? ` data-tip="${p.tip}"` : ''}>${escHtml(p.name)}</h4>
      <p>${p.body}</p>
    </div>`).join('');

  root.innerHTML = `
    <section class="lab lab-mcp">
      <header class="lab__head">
        <div>
          <h2 class="lab__title">Improvise an integration, or wire an <span data-tip="mcp">MCP</span> server</h2>
          <p class="lab__lead">"Connecting to Jira" isn\u2019t free. Without a server, Claude writes throwaway code to guess the API and dumps raw JSON into context. With a defined server, tools are discovered once and reused forever.</p>
        </div>
      </header>

      <div class="mcp-task"><span class="mcp-task__label">Task</span> ${escHtml(MCP_TASK)}</div>

      <div class="mcp-grid">${column('adhoc')}${column('defined')}</div>

      <div class="mcp-compare">
        <div class="mcp-compare__row"><span>Improvised</span><div class="mcp-bar-track"><div class="mcp-bar mcp-bar--warn" id="mcpBar-adhoc"></div></div><span class="mcp-compare__t">${total(MCP_FLOWS.adhoc).toLocaleString('en-US')} tok</span></div>
        <div class="mcp-compare__row"><span>Defined MCP</span><div class="mcp-bar-track"><div class="mcp-bar mcp-bar--good" id="mcpBar-defined"></div></div><span class="mcp-compare__t">${total(MCP_FLOWS.defined).toLocaleString('en-US')} tok</span></div>
        <button class="btn btn--primary btn--sm" id="mcpRunBoth">\u25b6 Run both</button>
      </div>

      <div class="lab-sub">
        <h3>The error contract is what makes tools debuggable</h3>
        <p class="lab__lead">MCP marks a failed call with <span data-tip="is_error">isError</span>. What you put next to it decides whether the coordinator can recover.</p>
        <div class="err-grid">${err('bad')}${err('good')}</div>
      </div>

      <div class="lab-sub">
        <h3>An MCP server exposes three things</h3>
        <div class="prim-grid">${primitives}</div>
      </div>
    </section>`;

  root.querySelectorAll('.mcp-run').forEach((b) => b.addEventListener('click', () => playFlow(b.dataset.run)));
  root.querySelector('#mcpRunBoth').addEventListener('click', () => { playFlow('adhoc'); playFlow('defined'); });
  root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(MCP_FLOWS.defined.config, '.mcp.json copied')));
}
