// ── Config Explorer data ─────────────────────────────────────
// A repo at four maturity levels. Each level = a file tree plus a
// files map { path -> { lang, code, annotation } }. The explorer
// renders the tree on the left and the selected file + annotation
// on the right.

const F = {
  readme: {
    lang: 'md',
    code: `# Orders Service

Node + Postgres API for the orders domain.
Run: npm install && npm run dev`,
    annotation: 'Claude reads the README for orientation, but a README describes the product, not <em>how you want Claude to behave</em>. Conventions still get re-derived every session.',
  },
  pkg: {
    lang: 'json',
    code: `{
  "name": "orders-service",
  "scripts": { "dev": "tsx watch src", "test": "vitest" }
}`,
    annotation: 'Signals the stack and how to run things. Useful, but silent on standards like error handling, response shapes, or test style.',
  },
  claudemd: {
    lang: 'md',
    code: `# Orders Service \u2014 Claude guide

## Stack
TypeScript, Fastify, Postgres (via Kysely), Vitest.

## Conventions
- Every endpoint returns { data, error } \u2014 never a bare value.
- Money is integer cents, never floats.
- Import standards on demand:
  @./.claude/rules/api-conventions.md
  @./.claude/rules/testing.md`,
    annotation: 'Project-level <span data-tip="claude_md">CLAUDE.md</span> is always loaded and lives in version control, so every teammate gets the same rules. <code>@./path</code> imports pull in other files (relative to this file, max depth 5) so it stays modular. Putting this in <code>~/.claude/</code> instead would strand it on one laptop.',
  },
  agentsmd: {
    lang: 'md',
    code: `# AGENTS.md

Vendor-neutral agent instructions. Mirrors CLAUDE.md so
non-Claude tools read the same conventions.

- Prefer small, reviewable diffs.
- Run \`npm test\` before proposing a commit.`,
    annotation: 'AGENTS.md is the cross-tool convention many agents read. Keep it in sync with CLAUDE.md (or have one import the other) so behavior is consistent no matter which agent opens the repo.',
  },
  rulesApi: {
    lang: 'md',
    code: `---
paths: ["src/api/**/*"]
---
For API files, use async/await with explicit error handling.
Every endpoint returns the standard { data, error } wrapper.
Validate input with zod before touching the database.`,
    annotation: 'A path-scoped rule. The YAML <code>paths:</code> frontmatter means this loads <em>only</em> when Claude edits a file under <code>src/api/</code>. Irrelevant rules stay out of context, saving tokens.',
  },
  rulesTest: {
    lang: 'md',
    code: `---
paths: ["**/*.test.ts"]
---
Use describe / it blocks.
Use data factories, not hardcoded fixtures.
Do not mock the database \u2014 use a test database.`,
    annotation: 'Glob paths apply conventions by file <em>type</em> regardless of location \u2014 ideal for tests scattered across the tree. This is why <span data-tip="rules_dir">.claude/rules/</span> beats a directory-level CLAUDE.md when files are spread out.',
  },
  skill: {
    lang: 'md',
    code: `---
context: fork
allowed-tools: ["Read", "Grep", "Glob"]
argument-hint: "Path to the module to review"
---
Review the module for the conventions in CLAUDE.md.
Report findings as { location, issue, severity, fix }.`,
    annotation: '<code>context: fork</code> runs this <code>/review</code> skill in an isolated subagent, so its verbose output never pollutes your main session. <code>allowed-tools</code> is least privilege \u2014 it literally cannot write or delete. Invoke on demand; unlike CLAUDE.md it is not always loaded.',
  },
  command: {
    lang: 'md',
    code: `Generate Vitest tests for the file passed as $ARGUMENTS.
Follow .claude/rules/testing.md. Cover the happy path
plus at least two edge cases.`,
    annotation: 'The legacy <code>.claude/commands/</code> format still works and also creates a <code>/test-gen</code> command. Current Claude Code unifies commands with skills \u2014 both produce <code>/name</code> commands.',
  },
  hook: {
    lang: 'json',
    code: `{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "command": ".claude/hooks/guard-migrations.sh" }
    ]
  }
}`,
    annotation: 'A <span data-tip="hook">hook</span> runs in code at a lifecycle point \u2014 here, vetting every Bash call before it runs. Deterministic guarantees (block a prod migration) belong in hooks, never in a prompt that the model obeys "most of the time".',
  },
  mcp: {
    lang: 'json',
    code: `{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "mcp-server-postgres"],
      "env": { "DATABASE_URL": "\${DATABASE_URL}" }
    }
  }
}`,
    annotation: '<span data-tip="mcp_json">.mcp.json</span> at the project root, in version control, gives the whole team the same MCP tools on clone. The secret stays a <code>${DATABASE_URL}</code> reference \u2014 the token itself is never committed.',
  },
};

// Tree node: { name, file? } — `file` keys into F. No `file` = directory.
export const CONFIG_LEVELS = [
  {
    id: 'l0', level: 'L0', label: 'Bare repo',
    tagline: 'Claude works, but re-derives your conventions every single session.',
    behavior: 'No standing instructions. You repeat "return { data, error }" and "cents not floats" by hand, every time, and hope it sticks.',
    tree: [
      { name: 'src', children: [{ name: 'api', children: [{ name: 'orders.ts' }] }] },
      { name: 'README.md', file: 'readme' },
      { name: 'package.json', file: 'pkg' },
    ],
  },
  {
    id: 'l1', level: 'L1', label: '+ CLAUDE.md + AGENTS.md',
    tagline: 'Standing conventions, loaded every session, shared with the whole team.',
    behavior: 'Now Claude knows your wrapper shape and money rule up front. AGENTS.md keeps other agents aligned. This is the single highest-leverage file to add.',
    tree: [
      { name: 'src', children: [{ name: 'api', children: [{ name: 'orders.ts' }] }] },
      { name: 'CLAUDE.md', file: 'claudemd' },
      { name: 'AGENTS.md', file: 'agentsmd' },
      { name: 'README.md', file: 'readme' },
      { name: 'package.json', file: 'pkg' },
    ],
  },
  {
    id: 'l2', level: 'L2', label: '+ .claude/rules/',
    tagline: 'Path-scoped rules that load only when relevant, so context stays lean.',
    behavior: 'API rules load only when editing src/api; test rules load only in *.test.ts. The context window carries just the rules that matter for the file at hand.',
    tree: [
      { name: 'src', children: [{ name: 'api', children: [{ name: 'orders.ts' }] }] },
      { name: '.claude', children: [
        { name: 'rules', children: [
          { name: 'api-conventions.md', file: 'rulesApi' },
          { name: 'testing.md', file: 'rulesTest' },
        ] },
      ] },
      { name: 'CLAUDE.md', file: 'claudemd' },
      { name: 'AGENTS.md', file: 'agentsmd' },
      { name: 'README.md', file: 'readme' },
      { name: 'package.json', file: 'pkg' },
    ],
  },
  {
    id: 'l3', level: 'L3', label: '+ skills, hooks & .mcp.json',
    tagline: 'On-demand workflows, deterministic guards, and shared tools.',
    behavior: 'A fully outfitted repo: /review and /test-gen commands, a PreToolUse hook that can\u2019t be argued with, and MCP tools every teammate gets on clone.',
    tree: [
      { name: 'src', children: [{ name: 'api', children: [{ name: 'orders.ts' }] }] },
      { name: '.claude', children: [
        { name: 'skills', children: [{ name: 'review', children: [{ name: 'SKILL.md', file: 'skill' }] }] },
        { name: 'commands', children: [{ name: 'test-gen.md', file: 'command' }] },
        { name: 'rules', children: [
          { name: 'api-conventions.md', file: 'rulesApi' },
          { name: 'testing.md', file: 'rulesTest' },
        ] },
        { name: 'settings.json', file: 'hook' },
      ] },
      { name: '.mcp.json', file: 'mcp' },
      { name: 'CLAUDE.md', file: 'claudemd' },
      { name: 'AGENTS.md', file: 'agentsmd' },
      { name: 'README.md', file: 'readme' },
      { name: 'package.json', file: 'pkg' },
    ],
  },
];

export const CONFIG_FILES = F;
