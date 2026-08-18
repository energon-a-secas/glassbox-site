# CLAUDE.md — Glass Box

Interactive study labs for the **Claude Certified Architect — Foundations** exam. Every run is a hand-authored simulation (no live API, no keys); the point is to make Claude's hidden inner workings clickable, then make the candidate build and answer against it.

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
  rail.js             The lab rail's two views: every lab, or one lab's sections (scanned from data-section) with scroll tracking + jump
  ui.js               openInspector/closeInspector drawer + glossary tooltip engine
  tips.js             TIPS glossary (data-tip="key" anywhere → hover card); exam-accurate wording
  utils.js            $, el, escHtml, highlightCode, copyText, showToast
  history.js          Drill run log (localStorage key "glassbox-drill-history"): record/read, rolling per-domain accuracy, weakest domains, unlearned-question pool. Pure logic, no DOM
  data/               Hand-authored content (pure data, no DOM)
    foundations.js    Tokenizer samples (pre-cut, with the recount rules), next-token distributions re-weighted by temperature, PROMPT_TECHNIQUES
    runs.js           Agent-loop scenarios: nodes + per-step scene deltas, token counts, flags
    loop-contrast.js  Steer-vs-enforce comparison (prompt asks / code enforces) for the Loop lab
    loop-theory.js    LEDGER: one row per concept in the exchange — meaning (glossary key), consequence, optional exam note
    loop-orchestration.js  Hub-and-spoke map + coordinator duties + isolated-context rules + Task prompt pair + the built-in toolset walk
    mcp.js            Improvised-integration vs defined-MCP flows, MCP_CONFIG showcase, isError contract, primitives
    mcp-authoring.js  What MCP is (4 parts, N×M), stdio/Streamable-HTTP transport cards + caveats, server code in two languages, tool-call anatomy
    mcp-stdio.js      STDIO: what the local transport *is* — the three POSIX streams with the spec's MUST/MAY obligations per descriptor, the newline-delimited framing rule, one tools/list answer written three ways (correct / stray print() / pretty-printed, the last two fatal for different reasons), process ownership incl. the close-stdin→SIGTERM→SIGKILL shutdown, and buys/costs
    mcp-lifecycle.js  MCP_LIFE: the four steps from .mcp.json to a callable tool (spawn → JSON-RPC handshake → tools/list → injection), worked on crystaldba/postgres-mcp, each step carrying its wire messages, its failure mode, and the one state row it changes
    config.js         Repo maturity L0→L3 trees + user-scope (~/.claude) tree + annotated file contents + read-order metadata (per-file `load`, per-level `startOrder`)
    planning.js       Plan-vs-direct signals, preset cases, verdict notes
    context.js        Conversation-memory playouts (scenarios × strategies: chat turns + per-step request stacks) + CW_MATRIX technique table + CW_ISSUES symptom/cause/fix gallery
    context-stores.js STORE_TIERS: the 8 places a fact can live between two requests (medium → what it survives → what it costs) + WINDOW_HYGIENE + STORE_RULE
    antipatterns.js   Anti-pattern gallery + inline-flag lookup (shared with other labs)
    sdk.js            SDK_LEVELS: L0→L5 build-up, each with code, keys, caveats; a level may carry `demo: 'id'` to render an interactive example under its sample
    sdk-config.js     Config bench: CFG_FIELDS (knobs, each naming the `level` that introduced it), CFG_GOALS (requirements), CFG_NOTES
    sdk-tools.js      Defining a custom tool: the decorator taught as a decorator (plain fn → wrapped → what the SDK derives), the schema it generates, the naming rules
    sdk-ts.js         The TypeScript variants of the levels where the API actually differs (L0, L1, L2, L4) + the tool() helper; L3 hooks stay Python, L5 stays shell
    sdk-sessions.js   L5 demo data: one investigation transcript (SESS_TRUNK) and two continuations, each with a clean reply and a tainted one
    exam-brief.js     EXAM_BRIEF: format, scoring, domain weights, out-of-scope list (quoted verbatim, never annotated)
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
    foundations.js  loop.js  sdk.js  mcp.js  config.js  planning.js  context.js  patterns.js  vocab.js  traps.js  antipatterns.js  drill.js
    drill-recall.js  The drill's "Since last time" card: history.js aggregates → the setup view's domain bars and its two preset buttons
    loop-theory.js  context-stores.js  sdk-tools.js  sdk-bench.js  sdk-sessions.js  mcp-stdio.js  mcp-lifecycle.js
                    Partials, not labs — HTML builders (+ an optional binder, or a `*Click(e)` that returns whether it consumed the event) imported by loop.js / context.js / sdk.js / mcp.js so those stay under the 500-line cap
docs/architecture.mmd + .svg   Diagram source + render
```

## Conventions

- **No single JS file over 500 lines; `app.js` under 50.** Split by concern, not by size after the fact. This binds every module with logic. A pure-data catalogue splits on a real domain boundary or not at all: `data/questions/` splits by exam scenario, `data/exam-brief.js` is separate from `data/patterns.js` because the brief is not a pattern — but the 21 patterns stay in one file at ~700 lines rather than being chopped into five group-sized fragments to satisfy a number.
- **Data vs view:** everything in `js/data/` is pure data. Labs in `js/labs/` render it. Never inline scenario copy into a lab module.
- **Each lab exports `mount(root)`** and is registered in `LAB_MOUNT` (render.js) + `LABS` (state.js). `mount` may return a teardown function; `render.js` calls it before the next mount (lab switch or exam-mode re-render) — return one whenever the lab starts timers or observers (loop and mcp do). Adding a lab = new data file + new lab module + those two registrations; the rail tab is generated from the `LABS` entry, which needs a unique `key` (a single keypress — digits 0–9 were exhausted at ten labs, so Context uses `c`, Lexicon `v`, Foundations `f`) and a `half` (`machinery` / `questions`) so the overview map lists it. **`machinery` is an internal id only** — the overview renders that half as "See how it works", because the word itself was reported as a mouthful; don't put "machinery" back into reader-facing copy.
- **Sections are opt-in, and scanned once per mount.** A lab marks a block `data-section="Short label"`; `rail.js` scans `#labMount` in DOM order *after* mount, mints an id where the block has none, and builds the rail's drill-down (fewer than two sections = no drill-down). Two consequences worth knowing before adding one: a block that exists only at one step of a stepper must **not** carry `data-section`, or the rail advertises a section the reader cannot reach; and a section that rebuilds itself must declare a **stable id** in its own markup (`#mcpLife`, `#mcpBuild`), because the rail resolves sections with `getElementById` at jump time rather than holding the node.
- **The scroll offset has exactly one owner: `html { scroll-padding-top }`.** `rail.js` reads it back (`topOffset()`), which is what keeps the jump landing and the "you are reading this" highlight the same number at every breakpoint — a second hardcoded offset anywhere makes the previous tab stay lit after every jump. Centring the active tab inside the rail strip is `keepInScroller` (utils.js), never `scrollIntoView`: the latter scrolls the *page* when the strip is out of sight.
- **Glossary:** add a term to `TIPS` in `tips.js`, then reference it anywhere with `data-tip="key"`. Don't hand-write tooltip markup. `TIPS` is keyed lookup only (`ui.js` does `TIPS[key]`) and is never iterated into a browsable list, so **a key nothing references is invisible** — wire every new term into a raw field in the same pass, or it is dead weight.
- **Anti-patterns are single-sourced** in `data/antipatterns.js`. Inline flags in other labs reference an anti-pattern `id`; don't duplicate the copy.
- **Exam accuracy first.** Use the certification's exact terms (`stop_reason`, `tool_choice`, `allowed_tools`, coordinator/subagent, MCP tools/resources/prompts). When the guide names a thing, name it the same way.
- **Every claim traces to a named source, and the source is visible.** Nothing in `data/patterns.js`, `data/traps/` or `data/questions/` may assert behaviour no source states. Two tiers, and the difference is rendered, not just recorded:
  - **The guide.** The default. Questions carry a `source` field (`Guide Qn` for the practice test, `Authored · Ch.x` for ones written here, and the chapter must actually support the answer); lures and pairs carry W/Q refs in `seen[]` and `sides[].ref`.
  - **Beyond the guide.** A claim that only third-party question banks test gets `beyond: true`, which renders a "Beyond the guide" badge. Those entries have an empty `seen[]` and `ref: null` — both are conditional in the renderer, so never fabricate a W/Q ref to fill the slot. Verify such a claim against official docs before adding it, and prefer asserting *behaviour* over a signature you could not confirm (`canUseTool` is written that way deliberately).
  - `VERB_GROUPS` in `vocab.js` stays guide-only — the point of that catalogue is the exam's own wording. Bank material goes to `data/traps/`, which renders the badge. **`EXAM_BRIEF.outOfScope` is a verbatim quote and gets no companion panel**: a "contested scope" list arguing with it shipped once and was removed — the guide's own scope statement is not a thing to rebut on the page that teaches the guide.
- **Escaping is per-field, and the data files document it.** In `patterns.js` only `oneline`/`tells`/`pick`/`reject` carry inline `<code>`; in `data/traps/` only `bait`/`kill`/`unless`/`sides[].answer`/`rule`/`body`; in `vocab.js` only `tell`/`trap`; `exam-brief.js` has no raw field at all. Those render raw; every other field goes through `escHtml`. Adding markup to a plain field will show up as literal text — `sides[].when` is the one that catches people, since its neighbours are raw.
- **Question options are never shuffled.** `distractors` is keyed by letter and the explanations say "Why C". Only question order is randomised.
- **`proctor-drill.json` is generated, and committed.** It is the bank exported to Proctor's format (`make proctor` → `scripts/export-proctor.mjs`); the overview lab embeds it via proctor.neorgon.com. Any edit under `js/data/questions/` must re-run the export or the embedded copy silently drifts from the drill.
- **No inline `onclick`.** Wire listeners in `events.js` (or the lab's own mount) and expose to `window.*` only if unavoidable.
- **Numbers:** format token counts with `toLocaleString('en-US')` so grouping is stable across locales.
- **Header/footer** are the vendored Neorgon kits — never edit `css/neorgon-*.css` or `js/neorgon-*.js` here; edit `packages/neorgon-ui/` and re-run the sync script.

## Gotchas

- **Agent Loop and Agent SDK are deliberately different labs.** Loop shows the agentic loop as a *concept* — the thing Claude Code already runs for you. SDK shows what you *write*: `AgentDefinition`, hooks, `Task`, sessions. Keep the split; collapsing them back together is what made the SDK material invisible in the first place.
- **The config bench is three numbered steps, and that ordering is the feature.** State the case (a `<select>` adds a requirement; each lands as a row carrying its own verdict and the setting it rides on) → tune the settings (each knob badges the requirements riding on it, red until its value can guarantee them) → read the config. It shipped once as a chip row above a 300px knob column, where picking the case and tuning the knobs read as one bank of controls and a reported gap could not be traced back to the requirement that raised it. Keep the chain *requirement → knob → line of config* visible. The case dropdown is also the one control on that lab reporting through `change` rather than `click`, so `sdk.js` delegates both (`benchClick` + `benchChange`).
- The SDK config bench evaluates declaratively: `CFG_GOALS[].need` maps a field to a required value (or an array of acceptable values), and the lab reports any requirement the current knobs do not *guarantee*. Adding a knob means adding it to `CFG_FIELDS` — `need` and `when` keys are validated against those ids. **Every field also names the `level` that introduced it**, rendered as an `L2` badge that jumps back to that level — a bench setting with no level is a setting the reader never met, so fill it in rather than leaving it out. The bench also renders the actual config object it is evaluating, live from the knobs; it shipped once as a hand-written static block that ignored them, so if the code sample and the toggles ever disagree again, the sample has been re-hardcoded.

- The header **Exam mode** toggle flips `state.examMode`; labs read it to surface exam-only annotations. Re-render on toggle. In the Playbook it expands every pattern card.
- The inspector drawer is global (owned by `ui.js`); labs call `openInspector(title, bodyHtml)` rather than building their own panels.
- Hash nav (`#loop`, `#mcp`, …) maps to labs via `events.js` hashchange; keep hashes in sync with `LABS[].id`.
- **Digit keys come from `LABS[].key`, not rail position.** `events.js` resolves a digit with `LABS.find(l => l.key === e.key)` ('0' is Overview), so rail order and key mapping can change independently. A running drill needs 1–4 to answer: it sets `document.body.dataset.capture = 'keys'` while in its run view and `render.js` clears it on every mount; `events.js` bails when it is set. Any future lab wanting the digits must use the same flag.
- The drill's scaled score is a **domain-weighted estimate** on the published 100–1000 scale, renormalised over the domains the chosen set actually covers. It is not an official conversion and the result screen says so — keep that disclaimer.
- **The drill has four views (`setup` / `run` / `result` / `review`) and its `D` state outlives the DOM.** The lab remounts on every tab switch, so `mountDrill` restores `D.view` instead of resetting to setup — leaving mid-run (including through the drill's own Pattern deep link) used to destroy the run. Each view rebuilds itself from `D` on entry and `show()` blanks the ones it hides, which is what keeps ids unique across views; don't cache DOM references across a `show()`.
- **Only a run played to the end is logged**, once, guarded by `D.logged` — quitting early would score every unanswered question as missed and poison the rolling accuracy. `weakest()` deliberately does **not** apply a sample-size floor: the setup card shows every domain bar, so a floor made the button name a domain visibly stronger than the ones on screen.
- **This repo used to carry a `.claudeignore`, and it never did anything.** It was replaced by `permissions.deny` in `.claude/settings.json`, which is the real surface. Worth knowing twice over: it is also one of the best lures in the whole exam — the name pattern-matches `.gitignore`/`.dockerignore` so perfectly that third-party study material teaches it as real, and this repo shipped one for months. If you find yourself reaching for a config file by analogy, that is the moment to check it exists.
- **A lab too big for 500 lines splits into a partial, not a second lab.** Six of them now (`loop-theory`, `context-stores`, `sdk-tools`, `sdk-bench`, `sdk-sessions`, `mcp-lifecycle`), each exporting HTML builders plus — where the markup is interactive — either a binder or a `*Click(e)` that returns whether it consumed the event. They are *not* in `LAB_MOUNT` or `LABS`: the Loop lab is one tab with two labelled halves and a jump nav, not two rail entries. The jump nav uses buttons and `scrollIntoView`, deliberately not anchors, so `#loop` survives in the address bar.
- **A partial that rebuilds itself needs the parent's listener to be delegated on the lab root.** `mcp.js` swaps `#mcpLife` / `#mcpBuild` by `outerHTML` on every step or language change, which destroys every node inside — including the jump buttons. One `root.addEventListener('click', …)` handles jumps, then `lifecycleClick`, then the language tabs, and each branch returns; a `root.querySelector('[data-jump]').addEventListener(...)` both dies on the first rebuild and only ever wires the *first* such button. Same reason the step index lives at module scope in the partial rather than in the DOM: it has to survive both the rebuild and a lab remount.
- **Verifying an edit in the browser needs a fresh origin, for CSS as much as for modules.** A reload keeps both the ES module graph and the cached stylesheet: a no-store `fetch` will show the new file while `import()` still returns the old one, and a CSS fix reads as "did nothing" while the computed value stays stale. Serve on an unused port (`python3 -m http.server 89xx`) and `curl | grep` the file first. Don't trust a `document.styleSheets` probe to decide it: the CORS-blocked `cdn.neorgon.org/season.css` throws when you walk `cssRules`, and a callback that returns a string on error reads as a truthy "found it".
- **`min-width: 0` on any grid/flex item that holds a code block.** The default `min-width: auto` grows the item to its widest line, so the `overflow-x: auto` on the `<pre>` never gets to scroll and the whole page overflows sideways instead — it cost ~70px at 390px on `.pair__side`. The two-column code layouts (`.pair__cols`, `.store-grid`, `.prim-grid`) all depend on this. Column budgets, measured: ~46–48 characters for a half-width sample, ~54–58 for the MCP build column.
- **The repo lives in an iCloud-synced folder (`~/Documents`).** Concurrent writes get forked into silent `name 2.ext` copies — one appeared during the Tier 1 work (`js/data/patterns 2.js`, the pre-edit copy of a file edited moments earlier). It had no importers so nothing broke, but a fork of a file that *is* imported would be worse than a syntax error. Prefer sequential writes over parallel batches, and check with `find . -name "* [0-9].*"` before finishing.
- A question's `pattern` is a deliberately **specific** label ("Required fields push the model to fabricate"), finer-grained than the Playbook's 21 general cards. `drill.js` resolves it to a card by exact title match, then by `PATTERN_ALIASES` in `data/questions/index.js`, and deep-links via `sessionStorage['glassbox-open-pattern']`. 51 of 63 labels resolve; the rest have no card and render unlinked, which is correct — do not invent a loose match to raise the number. When you add a question, add an alias only if a real card covers it.
