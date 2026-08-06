// ── Config Explorer data ─────────────────────────────────────
// A repo at four maturity levels. Each level = a file tree plus a
// files map { path -> { lang, code, annotation } }. The explorer
// renders the tree on the left and the selected file + annotation
// on the right. USER_TREE is the second sidebar tree: the user scope
// (~/.claude), identical at every level because it follows the
// person, not the repo.
//
// Escaping: `annotation` and `collision.note` render RAW HTML (inline
// <code>, <em>, data-tip spans). Every other field is escaped.
// Optional per-file fields:
//   flag       anti-pattern id (data/antipatterns.js) — the lab renders
//              the Don't/Do strip from that single source.
//   collision  { with: <fileId>, note: <rawHtml> } — the "who wins"
//              strip renders only when both files exist at the current
//              level. Precedence wording matches Guide Q36 exactly
//              (see data/questions/codegen.js and data/traps.js).
// Tree nodes may carry `ic` to override the directory glyph.

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
  dirClaude: {
    lang: 'md',
    code: `# src/api — local notes

Endpoints here are versioned: /v2/ only.
Legacy /v1/ handlers are frozen — do not edit.`,
    annotation: 'A directory-level <span data-tip="claude_md">CLAUDE.md</span>: loaded when Claude works under <code>src/api/</code>, for conventions that live and die with this folder. When the matching files are <em>scattered</em> across the tree, a <span data-tip="rules_dir">.claude/rules/</span> file with <code>paths:</code> globs beats it — which is exactly the call this repo made for its tests.',
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
    collision: {
      with: 'userSkill',
      note: 'This is the copy a fresh clone gets. A personal <code>~/.claude/skills/review/SKILL.md</code> \u2014 like the one in the user-scope tree \u2014 takes precedence at the same name, silently shadowing this file for that developer and cutting them off from its updates. Nobody else is affected, and the guide recommends personal variants use a different name instead.',
    },
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

  // \u2500\u2500 user scope (~/.claude) \u2014 follows the person, not the repo \u2500\u2500
  userClaudemd: {
    lang: 'md',
    code: `# My preferences \u2014 every repo I open

- Walk me through the plan before editing.
- Commit messages: imperative mood, <= 72 chars.`,
    annotation: 'User-level <span data-tip="claude_md">CLAUDE.md</span> loads in every session of <em>every</em> repo, alongside the project file \u2014 it follows you, not the code. Personal taste belongs here; a team standard here reaches exactly one laptop. That is the drift flagged below.',
    flag: 'user-level-claude-md',
  },
  userSettings: {
    lang: 'json',
    code: `{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "command": "~/.claude/hooks/log-commands.sh" }
    ]
  }
}`,
    annotation: 'The same settings surface as the project\u2019s <code>.claude/settings.json</code> (L3), scoped to you: this hook audits every Bash call in every repo you open. Personal defaults belong here. Anything the <em>team</em> relies on ships in the project file, in version control \u2014 user-scope configs drift, with no single source of truth.',
  },
  userSkill: {
    lang: 'md',
    code: `---
context: fork
allowed-tools: ["Read", "Grep", "Glob"]
argument-hint: "Path to the module to review"
---
Review the module for the conventions in CLAUDE.md,
then flag any TODO older than one sprint \u2014 my own
pet peeve, not a team rule.`,
    annotation: 'The <em>same</em> skill name at <span data-tip="user_scope">user scope</span>. Personal skills take precedence over project skills of the same name, so on this laptop <code>/review</code> silently runs this file instead of the team\u2019s \u2014 and stops receiving the team\u2019s updates to it. That is why the guide says to name personal variants differently (<code>/my-review</code>); <code>override: true</code> is not a real frontmatter key either way.',
    collision: {
      with: 'skill',
      note: 'Both scopes define <code>skills/review/SKILL.md</code>. User scope beats project scope at the same path, so this copy silently wins on this machine \u2014 and stops tracking the team\u2019s improvements to <code>/review</code>. The guide\u2019s recommendation: give personal variants their own name, so the shadowing never happens by accident. Precedence is positional, not declared.',
    },
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
      { name: 'src', children: [{ name: 'api', children: [{ name: 'CLAUDE.md', file: 'dirClaude' }, { name: 'orders.ts' }] }] },
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
    tagline: 'On-demand workflows, deterministic guards, and shared tools \u2014 and the user scope enters the picture.',
    behavior: 'A fully outfitted repo: /review and /test-gen commands, a PreToolUse hook that can\u2019t be argued with, and MCP tools every teammate gets on clone. Custom skills exist now, so personal copies can too: the ~/.claude tree appears below.',
    userScope: true,
    tree: [
      { name: 'src', children: [{ name: 'api', children: [{ name: 'CLAUDE.md', file: 'dirClaude' }, { name: 'orders.ts' }] }] },
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

// The user scope (~/.claude). Rendered once by the lab and shown only at
// levels flagged `userScope` (L3): the same-name skill collision only
// means something once the project has custom skills to collide with.
export const USER_TREE = [
  { name: '~/.claude', ic: '🏠', children: [
    { name: 'CLAUDE.md', file: 'userClaudemd' },
    { name: 'settings.json', file: 'userSettings' },
    { name: 'skills', children: [
      { name: 'review', children: [{ name: 'SKILL.md', file: 'userSkill' }] },
    ] },
  ] },
];

export const CONFIG_FILES = F;
