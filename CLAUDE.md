# CLAUDE.md — Glass Box

Interactive study labs for the **Claude Certified Architect — Foundations** exam. Every run is a hand-authored simulation (no live API, no keys); the point is to make Claude's hidden machinery clickable, then make the candidate build and answer against it.

## Run

```bash
make serve   # http://localhost:8856  (ES modules need HTTP, not file://)
```

`make kill` stops the server. Port is canonical in `scripts/repo-tools.sh` `get_port()`.

## Architecture (Modular tier)

```
index.html            App shell: header, lab rail, mount point, inspector drawer, footer
css/style.css         Design tokens (warm charcoal #151210, clay accent #cc785c, ember header skin) + all lab styles
js/
  app.js              Entry point (<50 lines): loadSaved → render → bindEvents
  state.js            LABS list (id/key/half) + { activeLab, examMode }, persisted to localStorage key "glassbox-state"
  render.js           Shell render, lab rail, LAB_MOUNT router → mounts one lab into #labMount
  events.js           Rail clicks, exam toggle, inspector close, keyboard (0–9, Esc), hashchange
  ui.js               openInspector/closeInspector drawer + glossary tooltip engine
  tips.js             TIPS glossary (data-tip="key" anywhere → hover card); exam-accurate wording
  utils.js            $, el, escHtml, highlightCode, copyText, showToast
  data/               Hand-authored content (pure data, no DOM)
    runs.js           Agent-loop scenarios: nodes + per-step scene deltas, token counts, flags
    loop-contrast.js  Steer-vs-enforce comparison (prompt asks / code enforces) for the Loop lab
    mcp.js            Improvised-integration vs defined-MCP flows, MCP_CONFIG showcase, isError contract, primitives
    config.js         Repo maturity L0→L3 trees + user-scope (~/.claude) tree + annotated file contents + read-order metadata (per-file `load`, per-level `startOrder`)
    planning.js       Plan-vs-direct signals, preset cases, verdict notes
    context.js        Conversation-memory playouts (scenarios × strategies: chat turns + per-step request stacks) + CW_MATRIX technique table + CW_ISSUES symptom/cause/fix gallery
    antipatterns.js   Anti-pattern gallery + inline-flag lookup (shared with other labs)
    sdk.js            SDK_LEVELS: L0→L5 build-up, each with code, keys, caveats
    sdk-config.js     Config bench: CFG_FIELDS (knobs), CFG_GOALS (requirements), CFG_NOTES
    exam-brief.js     EXAM_BRIEF: format, scoring, domain weights, out-of-scope list
    patterns.js       21 answer patterns + PATTERN_GROUPS (the filter rail)
    traps.js          LURES (distractor shapes), PAIRS (near-miss discriminators), CHECKS
    vocab.js          Lexicon: VERB_GROUPS (term/gloss/tell/trap), QUICK_TEST, DISTINCTIONS — guide-traceable only; third-party-bank claims excluded
    questions/        Question bank, one file per exam scenario
      index.js        QUESTIONS aggregate + SCENARIOS / DOMAINS / LEVELS vocabularies
      support.js  codegen.js  research.js  ci.js  conversational.js   (guide practice test)
      authored.js     Extraction + Dev Tools — exam scenarios the guide leaves unexercised
  labs/               One module per lab, each exports mount(root)
    overview.js  The landing map: hero, per-lab cards by `half`, domain-weight map. Counts are derived from data modules, never hardcoded.
    loop.js  sdk.js  mcp.js  config.js  planning.js  context.js  patterns.js  vocab.js  traps.js  antipatterns.js  drill.js
docs/architecture.mmd + .svg   Diagram source + render
```

## Conventions

- **No single JS file over 500 lines; `app.js` under 50.** Split by concern, not by size after the fact. This binds every module with logic. A pure-data catalogue splits on a real domain boundary or not at all: `data/questions/` splits by exam scenario, `data/exam-brief.js` is separate from `data/patterns.js` because the brief is not a pattern — but the 21 patterns stay in one file at ~700 lines rather than being chopped into five group-sized fragments to satisfy a number.
- **Data vs view:** everything in `js/data/` is pure data. Labs in `js/labs/` render it. Never inline scenario copy into a lab module.
- **Each lab exports `mount(root)`** and is registered in `LAB_MOUNT` (render.js) + `LABS` (state.js). `mount` may return a teardown function; `render.js` calls it before the next mount (lab switch or exam-mode re-render) — return one whenever the lab starts timers or observers (loop and mcp do). Adding a lab = new data file + new lab module + those two registrations; the rail tab is generated from the `LABS` entry, which needs a unique `key` (a single keypress — digits 0–9 were exhausted at ten labs, so Context uses `c`) and a `half` (`machinery` / `questions`) so the overview map lists it.
- **Glossary:** add a term to `TIPS` in `tips.js`, then reference it anywhere with `data-tip="key"`. Don't hand-write tooltip markup.
- **Anti-patterns are single-sourced** in `data/antipatterns.js`. Inline flags in other labs reference an anti-pattern `id`; don't duplicate the copy.
- **Exam accuracy first.** Use the certification's exact terms (`stop_reason`, `tool_choice`, `allowed_tools`, coordinator/subagent, MCP tools/resources/prompts). When the guide names a thing, name it the same way.
- **Every claim traces to the guide.** Nothing in `data/patterns.js`, `data/traps.js` or `data/questions/` may assert behaviour the official study guide does not state. Questions carry a `source` field: `Guide Qn` for the practice test, `Authored — Ch.x` for ones written here, and the chapter must actually support the answer.
- **Escaping is per-field, and the data files document it.** In `patterns.js` only `oneline`/`tells`/`pick`/`reject` carry inline `<code>`; in `traps.js` only `bait`/`kill`/`unless`/`sides[].answer`/`rule`/`body`. Those render raw; every other field goes through `escHtml`. Adding markup to a plain field will show up as literal text.
- **Question options are never shuffled.** `distractors` is keyed by letter and the explanations say "Why C". Only question order is randomised.
- **No inline `onclick`.** Wire listeners in `events.js` (or the lab's own mount) and expose to `window.*` only if unavoidable.
- **Numbers:** format token counts with `toLocaleString('en-US')` so grouping is stable across locales.
- **Header/footer** are the vendored Neorgon kits — never edit `css/neorgon-*.css` or `js/neorgon-*.js` here; edit `packages/neorgon-ui/` and re-run the sync script.

## Gotchas

- **Agent Loop and Agent SDK are deliberately different labs.** Loop shows the agentic loop as a *concept* — the thing Claude Code already runs for you. SDK shows what you *write*: `AgentDefinition`, hooks, `Task`, sessions. Keep the split; collapsing them back together is what made the SDK material invisible in the first place.
- The SDK config bench evaluates declaratively: `CFG_GOALS[].need` maps a field to a required value (or an array of acceptable values), and the lab reports any requirement the current knobs do not *guarantee*. Adding a knob means adding it to `CFG_FIELDS` — `need` and `when` keys are validated against those ids.

- The header **Exam mode** toggle flips `state.examMode`; labs read it to surface exam-only annotations. Re-render on toggle. In the Playbook it expands every pattern card.
- The inspector drawer is global (owned by `ui.js`); labs call `openInspector(title, bodyHtml)` rather than building their own panels.
- Hash nav (`#loop`, `#mcp`, …) maps to labs via `events.js` hashchange; keep hashes in sync with `LABS[].id`.
- **Digit keys come from `LABS[].key`, not rail position.** `events.js` resolves a digit with `LABS.find(l => l.key === e.key)` ('0' is Overview), so rail order and key mapping can change independently. A running drill needs 1–4 to answer: it sets `document.body.dataset.capture = 'keys'` while in its run view and `render.js` clears it on every mount; `events.js` bails when it is set. Any future lab wanting the digits must use the same flag.
- The drill's scaled score is a **domain-weighted estimate** on the published 100–1000 scale, renormalised over the domains the chosen set actually covers. It is not an official conversion and the result screen says so — keep that disclaimer.
- A question's `pattern` is a deliberately **specific** label ("Required fields push the model to fabricate"), finer-grained than the Playbook's 21 general cards. `drill.js` resolves it to a card by exact title match, then by `PATTERN_ALIASES` in `data/questions/index.js`, and deep-links via `sessionStorage['glassbox-open-pattern']`. 51 of 63 labels resolve; the rest have no card and render unlinked, which is correct — do not invent a loose match to raise the number. When you add a question, add an alias only if a real card covers it.
