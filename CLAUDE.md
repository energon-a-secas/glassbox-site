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
  history.js          Drill run log (localStorage key "glassbox-drill-history"): record/read, rolling per-domain accuracy, weakest domains, unlearned-question pool. Pure logic, no DOM
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
    exam-brief.js     EXAM_BRIEF: format, scoring, domain weights, out-of-scope list (quoted verbatim) + CONTESTED_SCOPE: where that list and the third-party banks disagree
    patterns.js       21 answer patterns + PATTERN_GROUPS (the filter rail)
    traps/            Three catalogues, one import (`traps/index.js`); split when the single file passed 500 lines
      lures.js        Distractor shapes that read senior and lose
      pairs.js        Near-miss clusters where one word in the stem picks the winner
      checks.js       The passes to run before committing to an answer
    vocab.js          Lexicon: VERB_GROUPS (term/gloss/tell/trap), QUICK_TEST, DISTINCTIONS — verbs are guide-traceable; DISTINCTIONS carries four bank-tested identifier pairs
    questions/        Question bank, one file per exam scenario
      index.js        QUESTIONS aggregate + SCENARIOS / DOMAINS / LEVELS vocabularies
      support.js  codegen.js  research.js  ci.js  conversational.js   (guide practice test)
      authored.js     Extraction + Dev Tools — exam scenarios the guide leaves unexercised
  labs/               One module per lab, each exports mount(root)
    overview.js  The landing map: hero, per-lab cards by `half`, domain-weight map. Counts are derived from data modules, never hardcoded.
    loop.js  sdk.js  mcp.js  config.js  planning.js  context.js  patterns.js  vocab.js  traps.js  antipatterns.js  drill.js
    drill-recall.js  The drill's "Since last time" card: history.js aggregates → the setup view's domain bars and its two preset buttons
docs/architecture.mmd + .svg   Diagram source + render
```

## Conventions

- **No single JS file over 500 lines; `app.js` under 50.** Split by concern, not by size after the fact. This binds every module with logic. A pure-data catalogue splits on a real domain boundary or not at all: `data/questions/` splits by exam scenario, `data/exam-brief.js` is separate from `data/patterns.js` because the brief is not a pattern — but the 21 patterns stay in one file at ~700 lines rather than being chopped into five group-sized fragments to satisfy a number.
- **Data vs view:** everything in `js/data/` is pure data. Labs in `js/labs/` render it. Never inline scenario copy into a lab module.
- **Each lab exports `mount(root)`** and is registered in `LAB_MOUNT` (render.js) + `LABS` (state.js). `mount` may return a teardown function; `render.js` calls it before the next mount (lab switch or exam-mode re-render) — return one whenever the lab starts timers or observers (loop and mcp do). Adding a lab = new data file + new lab module + those two registrations; the rail tab is generated from the `LABS` entry, which needs a unique `key` (a single keypress — digits 0–9 were exhausted at ten labs, so Context uses `c`) and a `half` (`machinery` / `questions`) so the overview map lists it.
- **Glossary:** add a term to `TIPS` in `tips.js`, then reference it anywhere with `data-tip="key"`. Don't hand-write tooltip markup. `TIPS` is keyed lookup only (`ui.js` does `TIPS[key]`) and is never iterated into a browsable list, so **a key nothing references is invisible** — wire every new term into a raw field in the same pass, or it is dead weight.
- **Anti-patterns are single-sourced** in `data/antipatterns.js`. Inline flags in other labs reference an anti-pattern `id`; don't duplicate the copy.
- **Exam accuracy first.** Use the certification's exact terms (`stop_reason`, `tool_choice`, `allowed_tools`, coordinator/subagent, MCP tools/resources/prompts). When the guide names a thing, name it the same way.
- **Every claim traces to a named source, and the source is visible.** Nothing in `data/patterns.js`, `data/traps/` or `data/questions/` may assert behaviour no source states. Two tiers, and the difference is rendered, not just recorded:
  - **The guide.** The default. Questions carry a `source` field (`Guide Qn` for the practice test, `Authored — Ch.x` for ones written here, and the chapter must actually support the answer); lures and pairs carry W/Q refs in `seen[]` and `sides[].ref`.
  - **Beyond the guide.** A claim that only third-party question banks test gets `beyond: true`, which renders a "Beyond the guide" badge. Those entries have an empty `seen[]` and `ref: null` — both are conditional in the renderer, so never fabricate a W/Q ref to fill the slot. Verify such a claim against official docs before adding it, and prefer asserting *behaviour* over a signature you could not confirm (`canUseTool` is written that way deliberately).
  - `VERB_GROUPS` in `vocab.js` stays guide-only — the point of that catalogue is the exam's own wording. Bank material goes to `data/traps/` or `CONTESTED_SCOPE`.
- **Escaping is per-field, and the data files document it.** In `patterns.js` only `oneline`/`tells`/`pick`/`reject` carry inline `<code>`; in `data/traps/` only `bait`/`kill`/`unless`/`sides[].answer`/`rule`/`body`; in `exam-brief.js` only `CONTESTED_SCOPE[].settle`. Those render raw; every other field goes through `escHtml`. Adding markup to a plain field will show up as literal text — `sides[].when` is the one that catches people, since its neighbours are raw.
- **Question options are never shuffled.** `distractors` is keyed by letter and the explanations say "Why C". Only question order is randomised.
- **`proctor-drill.json` is generated, and committed.** It is the bank exported to Proctor's format (`make proctor` → `scripts/export-proctor.mjs`); the overview lab embeds it via proctor.neorgon.com. Any edit under `js/data/questions/` must re-run the export or the embedded copy silently drifts from the drill.
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
- **The drill has four views (`setup` / `run` / `result` / `review`) and its `D` state outlives the DOM.** The lab remounts on every tab switch, so `mountDrill` restores `D.view` instead of resetting to setup — leaving mid-run (including through the drill's own Pattern deep link) used to destroy the run. Each view rebuilds itself from `D` on entry and `show()` blanks the ones it hides, which is what keeps ids unique across views; don't cache DOM references across a `show()`.
- **Only a run played to the end is logged**, once, guarded by `D.logged` — quitting early would score every unanswered question as missed and poison the rolling accuracy. `weakest()` deliberately does **not** apply a sample-size floor: the setup card shows every domain bar, so a floor made the button name a domain visibly stronger than the ones on screen.
- **This repo used to carry a `.claudeignore`, and it never did anything.** It was replaced by `permissions.deny` in `.claude/settings.json`, which is the real surface. Worth knowing twice over: it is also one of the best lures in the whole exam — the name pattern-matches `.gitignore`/`.dockerignore` so perfectly that third-party study material teaches it as real, and this repo shipped one for months. If you find yourself reaching for a config file by analogy, that is the moment to check it exists.
- **The repo lives in an iCloud-synced folder (`~/Documents`).** Concurrent writes get forked into silent `name 2.ext` copies — one appeared during the Tier 1 work (`js/data/patterns 2.js`, the pre-edit copy of a file edited moments earlier). It had no importers so nothing broke, but a fork of a file that *is* imported would be worse than a syntax error. Prefer sequential writes over parallel batches, and check with `find . -name "* [0-9].*"` before finishing.
- A question's `pattern` is a deliberately **specific** label ("Required fields push the model to fabricate"), finer-grained than the Playbook's 21 general cards. `drill.js` resolves it to a card by exact title match, then by `PATTERN_ALIASES` in `data/questions/index.js`, and deep-links via `sessionStorage['glassbox-open-pattern']`. 51 of 63 labels resolve; the rest have no card and render unlinked, which is correct — do not invent a loose match to raise the number. When you add a question, add an alias only if a real card covers it.
