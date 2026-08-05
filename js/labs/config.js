// ── Lab 3: Config Explorer (VS Code-style) ───────────────────
// A repo at four maturity levels. Pick a level, browse the tree,
// click a file to read it with an annotation on what it changes.

import { CONFIG_LEVELS, CONFIG_FILES } from '../data/config.js';
import { el, escHtml, highlightCode } from '../utils.js';

const C = { level: 0, file: null };
const DEFAULT_FILE = { l0: 'readme', l1: 'claudemd', l2: 'rulesApi', l3: 'skill' };

function levelObj() { return CONFIG_LEVELS[C.level]; }

function treeHtml(nodes, depth) {
  return nodes.map((n) => {
    const pad = `style="padding-left:${8 + depth * 16}px"`;
    if (n.children) {
      return `<li class="tree-dir"><div class="tree-row tree-row--dir" ${pad}><span class="tree-caret">\u25be</span><span class="tree-ic">\ud83d\udcc1</span>${escHtml(n.name)}</div><ul>${treeHtml(n.children, depth + 1)}</ul></li>`;
    }
    const active = n.file === C.file ? ' is-active' : '';
    const dot = n.file ? '' : ' tree-row--plain';
    return `<li><div class="tree-row tree-file${active}${dot}" data-file="${n.file || ''}" ${pad}><span class="tree-ic">\ud83d\udcc4</span>${escHtml(n.name)}</div></li>`;
  }).join('');
}

function renderTree() {
  const lv = levelObj();
  document.getElementById('cfgTree').innerHTML = `<ul class="tree">${treeHtml(lv.tree, 0)}</ul>`;
  document.querySelectorAll('.tree-file[data-file]').forEach((r) => {
    if (r.dataset.file) r.classList.toggle('is-active', r.dataset.file === C.file);
  });
}

function renderFile() {
  const view = document.getElementById('cfgView');
  const f = C.file && CONFIG_FILES[C.file];
  if (!f) {
    view.innerHTML = `<div class="cfg-empty">Select a file to read it.</div>`;
    return;
  }
  const name = C.file;
  view.innerHTML = `
    <div class="code-block">
      <div class="code-block__bar"><span class="code-block__lang">${escHtml(f.lang)}</span></div>
      <pre><code>${highlightCode(f.code, f.lang)}</code></pre>
    </div>
    <div class="cfg-annot"><span class="cfg-annot__tag">what it changes</span><p>${f.annotation}</p></div>`;
}

function renderMeta() {
  const lv = levelObj();
  document.getElementById('cfgTagline').textContent = lv.tagline;
  document.getElementById('cfgBehavior').innerHTML = `<span class="cfg-behavior__tag">Claude\u2019s behavior</span> ${escHtml(lv.behavior)}`;
  document.querySelectorAll('.cfg-lvl').forEach((b) => b.classList.toggle('is-active', +b.dataset.i === C.level));
}

function selectLevel(i) {
  C.level = i;
  const lv = levelObj();
  // keep current file if it still exists at this level, else default
  const files = [];
  (function walk(ns) { ns.forEach((n) => n.children ? walk(n.children) : n.file && files.push(n.file)); })(lv.tree);
  if (!files.includes(C.file)) C.file = DEFAULT_FILE[lv.id] || files[0];
  renderMeta(); renderTree(); renderFile();
}

export function mountConfig(root) {
  const levelTabs = CONFIG_LEVELS.map((lv, i) => `<button class="cfg-lvl" data-i="${i}"><span class="cfg-lvl__lv">${lv.level}</span><span class="cfg-lvl__lb">${escHtml(lv.label)}</span></button>`).join('');

  root.innerHTML = `
    <section class="lab lab-config">
      <header class="lab__head">
        <div>
          <h2 class="lab__title">A repo, from bare to fully outfitted</h2>
          <p class="lab__lead">Step a project through four levels of Claude Code config. Each file you add changes what Claude knows before it types a character. Click a file to read it.</p>
        </div>
      </header>

      <div class="cfg-levels">${levelTabs}</div>
      <p class="cfg-tagline" id="cfgTagline"></p>
      <div class="cfg-behavior" id="cfgBehavior"></div>

      <div class="cfg-ide">
        <aside class="cfg-sidebar">
          <div class="cfg-sidebar__head">Explorer</div>
          <div id="cfgTree"></div>
        </aside>
        <div class="cfg-main" id="cfgView"></div>
      </div>
    </section>`;

  root.querySelector('.cfg-levels').addEventListener('click', (e) => {
    const b = e.target.closest('.cfg-lvl'); if (b) selectLevel(+b.dataset.i);
  });
  root.querySelector('#cfgTree').addEventListener('click', (e) => {
    const r = e.target.closest('.tree-file'); if (r && r.dataset.file) { C.file = r.dataset.file; renderTree(); renderFile(); }
  });

  selectLevel(C.level);
}
