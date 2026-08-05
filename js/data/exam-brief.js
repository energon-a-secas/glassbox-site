// ── Exam brief ───────────────────────────────────────────────
// Format, scoring, domain weights and what is explicitly out of
// scope. Pure data. No DOM. Rendered by js/labs/patterns.js.

export const EXAM_BRIEF = {
  stats: [
    { num: '720', cap: 'pass mark, on a 100-1000 scale' },
    { num: '1 / 4', cap: 'one right option, three plausible' },
    { num: '4 / 8', cap: 'scenarios drawn, at random' },
    { num: '0', cap: 'penalty for a wrong guess' },
    { num: '88', cap: 'questions worked through in the guide' },
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
    'Every stem asks for the most effective fix, not a valid one. Two or three options usually work; exactly one removes the cause.',
    'You sit 4 of the 8 scenarios, drawn at random, so you cannot skip the one you revised least.',
    'Scenario 8, Agentic AI Tools, is reported by candidates but has no content in the guide. Expect at least one stem you have not rehearsed.',
    'Single-select: one correct option out of four, no partial credit, no multi-answer questions.',
    'Domains 1, 3 and 4 carry 67% of the weight: orchestration, Claude Code configuration, and prompting.',
  ],
  outOfScope: [
    'Fine-tuning Claude or training custom models.',
    'API authentication, billing, and account management; OAuth and key rotation.',
    'Language- and framework-specific implementation beyond tool and schema configuration.',
    'Deploying or hosting MCP servers: infrastructure, networking, containers.',
    'Claude internal architecture, training process, and model weights.',
    'Constitutional AI, RLHF, and safety training methodology.',
    'Embedding model and vector database internals, though both still appear as options in stems.',
    'Computer use: browser automation and desktop interaction.',
    'Vision and image analysis.',
    'Streaming and server-sent events.',
    'Rate limits, quotas, cost arithmetic, token counting, and tokenization.',
    'Prompt caching internals, benchmark comparisons, and cloud-provider-specific configuration.',
  ],
};
