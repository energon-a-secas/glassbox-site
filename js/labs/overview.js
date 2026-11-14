// ── Lab 0: Overview ──────────────────────────────────────────
// The landing map: one title row naming the exam, then the labs by half,
// the domain-weight map and the portable bank. No hero and no stat tiles:
// the page opens on the lab cards (fleet design pass, 2026-11-14).
// Cards are plain #hash anchors: the shell's hashchange handler mounts
// the target lab, so this file needs no navigation code of its own.
//
// Every count below is derived from the data modules, never hardcoded:
// add a question or a pattern and the cards update themselves.

import { LABS } from '../state.js';
import { DOMAINS, QUESTIONS, SCENARIOS } from '../data/questions/index.js';
import { RUN_ORDER } from '../data/runs.js';
import { PROMPT_TECHNIQUES } from '../data/foundations.js';
import { SDK_LEVELS } from '../data/sdk.js';
import { MCP_FLOWS } from '../data/mcp.js';
import { CONFIG_LEVELS } from '../data/config.js';
import { PLANNING_CASES } from '../data/planning.js';
import { CW_SCENARIOS } from '../data/context.js';
import { VERB_GROUPS, DISTINCTIONS } from '../data/vocab.js';
import { PATTERNS } from '../data/patterns.js';
import { LURES, PAIRS } from '../data/traps/index.js';
import { ANTIPATTERNS } from '../data/antipatterns.js';
import { escHtml } from '../utils.js';

// Editorial card copy, keyed by lab id. Falls back to the rail hint so a
// new lab never renders an empty card.
const CARDS = {
  foundations: {
    desc: 'The layer under every other lab: what a token is, how text chunks into them, how the next one is picked, and what temperature actually changes.',
    fact: `Live demos + ${PROMPT_TECHNIQUES.length} prompt techniques`,
  },
  loop: {
    desc: 'Replay a full agent run node by node: stop_reason, tool_choice, the Task tool, subagents, and the context meter filling as it works.',
    fact: `${RUN_ORDER.length} runs to replay`,
  },
  sdk: {
    desc: 'Build the same agent level by level, from a bare stateless call to sessions and subagents. Each level names the config keys it adds and what still breaks without the next one.',
    fact: `${SDK_LEVELS.length} levels + a config bench`,
  },
  mcp: {
    desc: 'The same task twice: an improvised integration, then a defined MCP server. Watch the token cost and the error shape change.',
    fact: `${Object.keys(MCP_FLOWS).length} flows, side by side`,
  },
  config: {
    desc: 'Walk a repo from bare to fully outfitted: CLAUDE.md, rules, skills, hooks, .mcp.json, each file annotated with what it buys.',
    fact: `${CONFIG_LEVELS.length} maturity levels`,
  },
  planning: {
    desc: 'Read the signals in a task and make the call: plan first, or go straight to edits. The console decides from the same signals you were shown.',
    fact: `${PLANNING_CASES.length} cases to call`,
  },
  context: {
    desc: 'The same conversation replayed under different memory strategies: the chat on one side, the request the model actually receives on the other. Watch a window drop the order number, a digest blur $129.99, a persona drift.',
    fact: `${Object.values(CW_SCENARIOS).reduce((a, s) => a + s.strategies.length, 0)} playouts, side by side`,
  },
  patterns: {
    desc: 'The decision patterns that settle most <span data-tip="stem">stems</span>: the tell in the question, the winning option shape, the distractor shapes.',
    fact: `${PATTERNS.length} patterns`,
  },
  vocab: {
    desc: 'The exam’s verbs are signals, not synonyms: synthesize means judgment, aggregate means code, enforce means a hook. Each term with its <span data-tip="stem">stem</span>-tell, its trap, and the near-miss pairs split apart.',
    fact: `${VERB_GROUPS.reduce((a, g) => a + g.verbs.length, 0)} terms · ${DISTINCTIONS.length} pairs split`,
  },
  traps: {
    desc: 'Distractor lures with their genuine exceptions, near-miss stems with the discriminator stated, and the checks to run before answering.',
    fact: `${LURES.length} lures · ${PAIRS.length} near-misses`,
  },
  antipatterns: {
    desc: 'The failure modes the exam loves, named and flagged. Spot them in <span data-tip="stem">stems</span> and in your own configs.',
    fact: `${Object.keys(ANTIPATTERNS).length} named anti-patterns`,
  },
  drill: {
    desc: 'Sit a weighted slice of the bank in exam format, then read the reasoning for every option, right or wrong.',
    fact: `${QUESTIONS.length} questions · ${SCENARIOS.length} scenarios`,
  },
};

// Which labs train each weighted domain. Orientation metadata: DOMAINS
// holds the official weights, this is the site map on top.
const DOMAIN_LABS = {
  d1: ['loop', 'sdk'],
  d2: ['mcp', 'sdk'],
  d3: ['config', 'planning'],
  d4: ['foundations', 'patterns', 'vocab', 'traps'],
  d5: ['context', 'loop', 'antipatterns'],
};

const HALVES = [
  { id: 'machinery', title: 'See how it works' },
  { id: 'questions', title: 'Answer the questions' },
];

const labById = Object.fromEntries(LABS.map((l) => [l.id, l]));

function cardHtml(id) {
  const lab = labById[id];
  const card = CARDS[id];
  if (!lab || !card) return '';
  return `
    <a class="ov-card" href="#${lab.id}">
      <div class="ov-card__top">
        <span class="ov-card__key" title="Press ${lab.key}">${lab.key}</span>
        <h4>${escHtml(lab.label)}</h4>
      </div>
      <p>${card.desc}</p>
      <span class="ov-card__fact">${card.fact}</span>
    </a>`;
}

function halfHtml(half) {
  const ids = LABS.filter((l) => l.half === half.id).map((l) => l.id);
  return `
    <section class="ov-sec">
      <header class="ov-sec__head">
        <h3>${half.title}</h3>
      </header>
      <div class="ov-cards">${ids.map(cardHtml).join('')}</div>
    </section>`;
}

function domainHtml(d) {
  const maxPct = Math.max(...DOMAINS.map((x) => x.pct));
  const chips = (DOMAIN_LABS[d.id] || []).map((id) => {
    const lab = labById[id];
    return lab ? `<a class="ov-chip" href="#${lab.id}"><b>${lab.key}</b>${escHtml(lab.label)}</a>` : '';
  }).join('');
  return `
    <div class="ov-domain">
      <div class="ov-domain__meta">
        <span class="ov-domain__label">${escHtml(d.label)}</span>
        <span class="ov-domain__pct">${d.pct}%</span>
      </div>
      <div class="ov-domain__bar"><i style="width:${Math.round((d.pct / maxPct) * 100)}%"></i></div>
      <div class="ov-domain__labs">${chips}</div>
    </div>`;
}

export function mountOverview(root) {
  root.innerHTML = `
    <section class="lab lab-overview">
      <header class="lab__head">
        <h2 class="lab__title">Study labs for the Claude Certified Architect (Foundations) exam</h2>
      </header>

      ${HALVES.map(halfHtml).join('')}

      <section class="ov-sec">
        <header class="ov-sec__head">
          <h3>Where the points are</h3>
          <p>Bars are the official weights relative to the biggest; chips are the labs that train each one.</p>
        </header>
        <div class="ov-map">
          ${DOMAINS.map(domainHtml).join('')}
          <p class="ov-map__note">The <a href="#drill">Drill</a> samples every domain and estimates a scaled score on the 100-1000 scale from these weights.</p>
        </div>
      </section>

      <section class="ov-sec">
        <header class="ov-sec__head">
          <h3>Take the bank with you</h3>
          <p>Get the bank as a <a href="proctor-drill.json">Proctor test file</a> (${QUESTIONS.length} questions, every option reasoned), or open it in <a href="https://proctor.neorgon.com/" target="_blank" rel="noopener noreferrer">Proctor</a> for the timed simulator, PDF export and notes.</p>
        </header>
        <iframe class="ov-proctor" loading="lazy"
          src="https://proctor.neorgon.com/?embed=1&mode=study&src=${encodeURIComponent('https://glassbox.neorgon.com/proctor-drill.json')}"
          title="Glass Box drill bank in Proctor, study mode"></iframe>
      </section>
    </section>`;
}
