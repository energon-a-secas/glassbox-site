// ── Exam brief ───────────────────────────────────────────────
// Format, scoring, domain weights and what is explicitly out of
// scope. Pure data. No DOM. Rendered by js/labs/patterns.js.
//
// EXAM_BRIEF.outOfScope quotes the official guide verbatim - do not
// soften it. Where third-party question banks contradict that list,
// the disagreement is recorded in CONTESTED_SCOPE below rather than
// edited into the quote.

export const EXAM_BRIEF = {
  stats: [
    { num: '720', cap: 'pass mark, on a 100-1000 scale' },
    { num: '1 / 4', cap: 'one right option, three plausible' },
    { num: '4', cap: 'scenarios sat per exam, drawn at random' },
    { num: '0', cap: 'penalty for a wrong guess' },
    { num: '88', cap: 'questions in the guide: 12 worked + 76 practice' },
    { num: '27%', cap: 'agent architecture, the biggest domain' },
  ],
  weights: [
    { id: 'd1', label: 'Agent architecture & orchestration', pct: 27 },
    { id: 'd2', label: 'Tool design & MCP integration', pct: 18 },
    { id: 'd3', label: 'Claude Code config & workflows', pct: 20 },
    { id: 'd4', label: 'Prompt engineering & structured output', pct: 20 },
    { id: 'd5', label: 'Context management & reliability', pct: 15 },
  ],
  notes: [
    'No guessing penalty. A blank and a wrong answer score the same, so never leave one empty.',
    'Most stems ask for the most effective fix, not merely a valid one. Two or three options usually work; exactly one removes the cause.',
    'You sit 4 scenarios drawn at random — the study guide lists 8 candidates, the exam-guide PDF names 6 — so you cannot skip the one you revised least.',
    'Scenario 8, Agentic AI Tools, is listed in the study guide with no content ("help us fill it in"). Expect at least one stem you have not rehearsed.',
    'Single-select: one correct option out of four, no multi-answer questions.',
    'Domains 1, 3 and 4 carry 67% of the scored content: orchestration, Claude Code configuration, and prompting.',
  ],
  outOfScope: [
    'Fine-tuning Claude or training custom models.',
    'API authentication, billing, and account management; OAuth and key rotation.',
    'Language- and framework-specific implementation beyond tool and schema configuration.',
    'Deploying or hosting MCP servers: infrastructure, networking, containers.',
    'Claude internal architecture, training process, and model weights.',
    'Constitutional AI, RLHF, and safety training methodology.',
    'Embedding model and vector database internals — though the practice test still uses them as distractor options.',
    'Computer use: browser automation and desktop interaction.',
    'Vision and image analysis.',
    'Streaming and server-sent events.',
    'Rate limits, quotas, and API pricing calculations — but batch-vs-sync SLA reasoning (the 24-hour window arithmetic) is very much in scope.',
    'Token-counting algorithms and tokenization internals; context-window budgeting itself is tested.',
    'Prompt caching internals (knowing it exists is enough), benchmark comparisons, and cloud-provider-specific configuration.',
  ],
};

// Topics the guide puts out of scope (or never mentions) that third-party
// question banks test anyway. `n` is the number of appearances measured
// across 718 bank questions - it is the reason to spend time here, or not.
//
// Escaping: `settle` renders RAW (it carries <code>). `topic`, `guideSays`
// and `banksTest` are escaped - keep them free of markup.
export const CONTESTED_SCOPE = [
  {
    topic: 'Prompt caching mechanics',
    guideSays: 'Internals are out of scope - "knowing it exists is enough".',
    banksTest: 'Exact minimum cacheable lengths, the breakpoint ceiling, and write/read multipliers.',
    n: 31,
    settle: 'Learn the five numbers and stop: 1,024-token minimum on Sonnet and Opus, <em>2,048</em> on Haiku, at most four <code>cache_control</code> breakpoints, a write at 1.25× base input (2× for the one-hour TTL), a read at 0.1×. Cheap to memorise, and the banks ask for them directly.',
  },
  {
    topic: 'Sampling parameters',
    guideSays: 'Never discussed as an architectural lever.',
    banksTest: 'temperature, top_p and top_k as options on consistency and reliability stems.',
    n: 64,
    settle: 'Know what they do so you can eliminate them - they are credited <em>zero</em> times out of 64 appearances. This is a recognition task, not a study topic.',
  },
  {
    topic: 'Model tiers and naming',
    guideSays: 'Model selection is not a listed objective, and no version numbers appear.',
    banksTest: 'Which tier for which workload, and whether a given model name is real.',
    n: 25,
    settle: 'The decision rule is short (Haiku for high-volume narrow work, Sonnet as the default, Opus for expensive hard reasoning) and the elimination rule is shorter: a fabricated name is never the answer. Do not memorise a version roster - none of the 718 questions turns on a 4.x model.',
  },
  {
    topic: 'Streaming and server-sent events',
    guideSays: 'Explicitly out of scope.',
    banksTest: 'Mostly as a distractor - and separately, HTTP+SSE as an MCP transport.',
    n: 18,
    settle: 'Skip streaming mechanics. Do learn the one transport fact it collides with: remote MCP is <em>Streamable HTTP</em>, and HTTP+SSE was deprecated in the 2025-03-26 spec revision.',
  },
  {
    topic: 'Structured Outputs and JSON Schema',
    guideSays: 'Structured output is a whole domain, but the guide predates the GA surface.',
    banksTest: 'The actual request field, and schema dialect trivia.',
    n: 22,
    settle: 'Worth real time - it is 20% of the exam by weight. Know <code>output_config.format</code> for a constrained response, a tool\'s <code>input_schema</code> for a constrained call, and that <code>nullable: true</code> is OpenAPI 3.0, not JSON Schema.',
  },
  {
    topic: 'Claude Code permissions',
    guideSays: 'Covers CLAUDE.md, rules, skills and hooks; says nothing about a deny list.',
    banksTest: 'How to stop Claude reading a path - with .claudeignore offered as the answer.',
    n: 14,
    settle: 'Learn the two real surfaces, because the invented one is everywhere: <code>permissions.deny</code> / <code>permissions.allow</code> in <code>.claude/settings.json</code>, and a <code>PreToolUse</code> hook exiting <code>2</code> to block a call. There is no <code>.claudeignore</code>.',
  },
];
