import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const repositoryRoot = fs.realpathSync(`${import.meta.dirname}/../..`);

function read(relativePath) {
  return fs.readFileSync(`${repositoryRoot}/${relativePath}`, 'utf8');
}

function sectionOf(document, heading) {
  const lines = document.split(/\r?\n/u);
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start < 0) return '';
  const headingLevel = heading.match(/^#+/u)?.[0].length ?? 0;
  const end = lines.findIndex((line, index) => index > start && (line.match(/^(#+)\s/u)?.[1].length ?? Infinity) <= headingLevel);
  return lines.slice(start, end < 0 ? lines.length : end).join('\n');
}

function assertHasPhrases(document, phrases) {
  for (const phrase of phrases) assert.match(document, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'i'), phrase);
}

test('[TTV2-A03] README names eQOURSE/tutrain as the source of truth for the v2 documents', () => {
  const readme = read('README.md');
  assertHasPhrases(readme, [
    'eQOURSE/tutrain',
    'source of truth',
    'tutrain-backend',
    'migration history',
    'team agreement',
    'AGENTS.md',
    'SPECS.md',
    'progress.md',
    'docs/',
    'docs/contracts/'
  ]);
  assert.match(readme, /\b[0-9a-f]{40}\b/i);
});

test('[TTV2-A03] AGENTS.md opens as this repository\'s rules file', () => {
  const agents = read('AGENTS.md');
  const firstBlockquote = agents.split(/\r?\n/u).find((line) => line.startsWith('>')) ?? '';
  assert.doesNotMatch(agents, /Copy this file/i);
  assert.match(firstBlockquote, /eQOURSE\/tutrain/i);
  assert.equal(read('CLAUDE.md').trim(), '@AGENTS.md');
});

test('[TTV2-A03] progress.md records this repository and where A01 and A02 are tracked', () => {
  const progress = read('progress.md');
  const current = sectionOf(progress, '## Current repository condition');
  assertHasPhrases(current, ['eQOURSE/tutrain', 'source of truth', 'tutrain-backend']);
  assert.match(current, /\b[0-9a-f]{40}\b/i);
  for (const task of ['TTV2-A01', 'TTV2-A02']) {
    const section = sectionOf(progress, `#### ${task} `);
    assert.match(section, /^- Tracking:.*tutrain-backend/im);
  }
  const a03 = sectionOf(progress, '#### TTV2-A03 ');
  assert.match(a03, /- Status: IN_PROGRESS/u);
  assert.match(a03, /not enforced/i);
});

test('[TTV2-A03] the import is complete and the legacy-only documents stay behind', () => {
  for (const relativePath of ['AGENTS.md', 'CLAUDE.md', 'SPECS.md', 'progress.md', 'docs/contracts/ownership.json', 'docs/contracts/events.json']) {
    assert.equal(fs.existsSync(`${repositoryRoot}/${relativePath}`), true, relativePath);
  }
  for (const module of ['iam', 'catalog', 'shared']) {
    assert.equal(fs.statSync(`${repositoryRoot}/packages/contracts/${module}/fixtures`).isDirectory(), true, `${module} fixtures are missing`);
  }
  for (let number = 1; number <= 13; number += 1) {
    const prefix = String(number).padStart(2, '0');
    assert.ok(fs.readdirSync(`${repositoryRoot}/docs`).some((name) => name.startsWith(`${prefix}-`)), `docs/${prefix} document is missing`);
  }
  const legacyArchitecture = ['docs', 'ARCHITECTURE.md'].join('/');
  assert.equal(fs.existsSync(`${repositoryRoot}/${legacyArchitecture}`), false);
  assert.equal(fs.existsSync(`${repositoryRoot}/docs/LEGACY-SECRET-INVENTORY.md`), false);
  const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: repositoryRoot, encoding: 'utf8' }).split('\0').filter(Boolean);
  assert.equal(trackedFiles.some((file) => file.split('/').at(-1).startsWith('.env')), false);
});
