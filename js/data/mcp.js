// ── MCP lab data ─────────────────────────────────────────────
// Two ways to "get my Jira tickets": ask Claude to improvise vs
// wire a defined MCP server. Steps carry a token cost so the two
// flows can be metered side by side.

export const MCP_TASK = 'Pull my open Jira tickets and summarize them.';

export const MCP_FLOWS = {
  adhoc: {
    id: 'adhoc',
    title: 'Just ask Claude to connect to Jira',
    subtitle: 'No MCP server. The model has to invent an integration on the spot.',
    tone: 'warn',
    steps: [
      { kind: 'think', line: 'No jira tool exists. I\u2019ll write code to hit the REST API myself.', tokens: 400 },
      { kind: 'write', line: 'Write fetch_jira.py \u2014 guess the endpoint, auth header, and pagination.', tokens: 1300 },
      { kind: 'bash', line: 'Bash: python fetch_jira.py  (JIRA_TOKEN pasted inline \u26a0)', tokens: 300 },
      { kind: 'result', line: 'Raw JSON: 62 fields \u00d7 40 issues dumped straight into context.', tokens: 5200 },
      { kind: 'think', line: 'Re-read my own code + the blob to figure out which fields matter.', tokens: 900 },
      { kind: 'result', line: 'Summary produced \u2014 but the script is thrown away at session end.', tokens: 300 },
    ],
    totals: { turns: 6, reusable: false, discovery: false, secretsSafe: false },
    cons: [
      'Burns tokens writing, running, and re-reading throwaway code every session',
      'Guesses the API shape \u2014 breaks when Jira changes or pagination hits',
      'The token often ends up inline in code or logs',
      'Nothing is discoverable or shared; the next session starts from zero',
    ],
  },
  defined: {
    id: 'defined',
    title: 'Use a defined MCP server',
    subtitle: 'One entry in .mcp.json. Tools are discovered automatically and reused forever.',
    tone: 'good',
    config: `{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "mcp-server-jira"],
      "env": { "JIRA_TOKEN": "\${JIRA_TOKEN}" }
    }
  }
}`,
    steps: [
      { kind: 'system', line: 'Connect jira server \u2192 auto-discover tools: jira_search, jira_get_issue\u2026', tokens: 250 },
      { kind: 'call', line: 'jira_search(jql="assignee=currentUser() AND status=Open")', tokens: 200 },
      { kind: 'result', line: 'Structured result: 12 issues, only the fields the tool exposes.', tokens: 900 },
      { kind: 'result', line: 'Summary produced. Same tool works next session and for teammates.', tokens: 300 },
    ],
    totals: { turns: 4, reusable: true, discovery: true, secretsSafe: true },
    pros: [
      'Tools auto-discovered on connect \u2014 no code to write',
      'Typed inputs and trimmed outputs keep context small',
      'Secret stays in ${JIRA_TOKEN}; never enters the model context',
      'Committed to the repo, so every teammate and session reuses it',
    ],
  },
};

// The error contract that makes MCP tools debuggable.
export const MCP_ERRORS = {
  bad: {
    label: 'Generic error (anti-pattern)',
    code: `{
  "isError": true,
  "content": "Operation failed"
}`,
    note: 'The agent learns nothing. Retry? Reword? Escalate? No way to tell.',
  },
  good: {
    label: 'Structured error (do this)',
    code: `{
  "isError": true,
  "content": {
    "errorCategory": "transient",
    "isRetryable": true,
    "message": "Timeout calling the orders API.",
    "attempted_query": "order_id=12345",
    "partial_results": null
  }
}`,
    note: 'Category + retryable + attempted query lets the coordinator recover on its own.',
  },
};

// The three things an MCP server exposes.
export const MCP_PRIMITIVES = [
  { name: 'Tools', tip: 'tool_use', body: 'Functions the agent calls to <em>act</em>: CRUD, API calls, command execution.' },
  { name: 'Resources', tip: 'mcp_resource', body: 'Read-only data for <em>context</em>: schemas, catalogs, docs. A "map" that saves exploratory calls.' },
  { name: 'Prompts', tip: null, body: 'Reusable prompt templates for common tasks, shipped with the server.' },
];
