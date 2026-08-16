// ── Export the drill bank as a Proctor test ──────────────────
//
// Converts js/data/questions into proctor-drill.json at the repo root:
// the Proctor format (https://proctor.neorgon.com/llms.txt), so the whole
// bank runs anywhere Proctor runs, including embedded via
//   ?embed=1&src=https://glassbox.neorgon.com/proctor-drill.json
// (GitHub Pages serves the JSON with Access-Control-Allow-Origin: *.)
//
// Re-run after any change to the question bank:  node scripts/export-proctor.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { QUESTIONS, DOMAIN_BY_ID } from '../js/data/questions/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const questions = QUESTIONS.map((q) => {
  const letters = q.options.map((o) => o.k);
  const wrong = letters
    .filter((k) => k !== q.answer)
    .map((k) => `- **${k}**: ${q.distractors[k]}`)
    .join('\n');
  return {
    id: q.id,
    type: 'single',
    category: DOMAIN_BY_ID[q.domain].short,
    prompt: `${q.situation}\n\n**${q.ask}**`,
    options: q.options.map((o) => o.t),
    answer: letters.indexOf(q.answer),
    explanation: `${q.why}\n\nWhy not the others:\n${wrong}`,
  };
});

const test = {
  title: 'Glass Box · CCA Foundations drill bank',
  description: 'Every question from glassbox.neorgon.com, with the reasoning for all four options',
  category: 'Claude Certified Architect (Foundations)',
  questions,
};

writeFileSync(join(root, 'proctor-drill.json'), `${JSON.stringify(test, null, 2)}\n`);
console.log(`proctor-drill.json: ${questions.length} questions, ${(JSON.stringify(test).length / 1024).toFixed(0)} KB`);
