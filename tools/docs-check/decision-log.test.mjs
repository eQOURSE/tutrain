import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..', '..');
const decisionLogPath = path.join(repositoryRoot, 'docs', '12-DECISION-LOG.md');

const expectedDecisions = [
  ['D-001', 'PostgreSQL'],
  ['D-002', 'monorepo'],
  ['D-003', 'repo'],
  ['D-004', 'domestic'],
  ['D-005', 'international'],
  ['D-006', 'GST'],
  ['D-007', 'WhatsApp'],
  ['D-008', 'LLM'],
  ['D-009', 'refund'],
  ['D-010', 'reschedule'],
  ['D-011', 'no-show'],
  ['D-012', 'threshold'],
  ['D-013', 'penalt'],
  ['D-014', 'payout'],
  ['D-015', 'rate'],
  ['D-016', 'TDS'],
  ['D-017', 'recording'],
  ['D-018', 'transcript'],
  ['D-019', 'Workspace'],
  ['D-020', 'Meet'],
  ['D-021', 'auth'],
  ['D-022', 'Payload'],
  ['D-023', 'S3'],
  ['D-024', 'CRM'],
  ['D-025', 'ADR-008'],
];

const requiredItems = [
  'Question',
  'Options',
  'Recommended default',
  'Today',
  'Owner',
  'Needed by',
  'Status',
  'Decision',
  'Decided by',
  'Effective date',
  'System impact',
];

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function decisionLog() {
  assert.equal(existsSync(decisionLogPath), true, 'docs/12-DECISION-LOG.md is missing');
  return read('docs/12-DECISION-LOG.md');
}

function sections(log) {
  const headings = [...log.matchAll(/^### (D-\d{3}) (.+)\r?$/gmu)];
  return headings.map((heading, index) => {
    const bodyStart = heading.index + heading[0].length;
    const bodyEnd = headings[index + 1]?.index ?? log.length;
    return {
      id: heading[1],
      title: heading[2],
      body: log.slice(bodyStart, bodyEnd).replace(/^\r?\n/u, ''),
    };
  });
}

function field(section, label) {
  const match = section.body.match(new RegExp(`^- ${label}:[ \\t]*(.*)$`, 'mu'));
  assert.ok(match, `${section.id} is missing ${label}`);
  return match[1].trim();
}

test('[TTV2-000] the decision log has the 25 decisions in order', () => {
  const actual = sections(decisionLog());
  assert.deepEqual(
    actual.map(({ id }) => id),
    expectedDecisions.map(([id]) => id),
  );

  for (const [{ id, title }, [, keyword]] of actual.map((section, index) => [section, expectedDecisions[index]])) {
    assert.match(title, new RegExp(keyword, 'iu'), `${id} heading must contain ${keyword}`);
  }
});

test('[TTV2-000] every decision section has the required list items in order', () => {
  const actual = sections(decisionLog());
  assert.equal(actual.length, expectedDecisions.length);
  for (const section of actual) {
    const labels = section.body
      .split(/\r?\n/u)
      .map((line) => line.match(/^- ([A-Za-z ]+):/u)?.[1])
      .filter(Boolean);
    assert.deepEqual(labels, requiredItems, `${section.id} list-item order differs`);
  }
});

test('[TTV2-000] every owner is a role from the SRS sign-off table', () => {
  const roles = read('docs/02-SRS.md')
    .split(/\r?\n/u)
    .map((line) => line.trim().split('|').map((cell) => cell.trim()))
    .filter((cells) => cells.length === 6 && cells[1] && cells.slice(2, -1).every((cell) => cell === ''))
    .map((cells) => cells[1]);
  assert.deepEqual(roles, [
    'Director / Super Admin',
    'Tech Lead',
    'Operations Head',
    'Finance Head',
    'Marketing Head',
  ]);

  for (const section of sections(decisionLog())) {
    for (const owner of field(section, 'Owner').split(';').map((value) => value.trim())) {
      assert.ok(roles.includes(owner), `${section.id} has an unknown owner: ${owner}`);
    }
  }
});

test('[TTV2-000] every Needed by entry is a registered task ID', () => {
  const taskIds = new Set(
    [...read('SPECS.md').matchAll(/^\| `?(TTV2-[A-Z0-9-]+)`? \|/gmu)].map(([, taskId]) => taskId),
  );
  for (const section of sections(decisionLog())) {
    for (const taskId of field(section, 'Needed by').matchAll(/TTV2-[A-Z0-9-]+/gu)) {
      assert.ok(taskIds.has(taskId[0]), `${section.id} references an unknown task: ${taskId[0]}`);
    }
  }
});

test('[TTV2-000] every recommended default links to a source document', () => {
  for (const section of sections(decisionLog())) {
    assert.match(field(section, 'Recommended default'), /\[[^\]]+\]\([^)]+\)/u, `${section.id} has no source link`);
  }
});

test('[TTV2-000] decision status fields follow the proposed or decided shape', () => {
  const allowedStatuses = new Set(['Proposed', 'Approved', 'Approved with changes', 'Deferred', 'Rejected']);
  for (const section of sections(decisionLog())) {
    const status = field(section, 'Status');
    assert.ok(allowedStatuses.has(status), `${section.id} has invalid status ${status}`);
    const decision = field(section, 'Decision');
    const decidedBy = field(section, 'Decided by');
    const effectiveDate = field(section, 'Effective date');
    if (status === 'Proposed') {
      assert.equal(decision, '', `${section.id} Proposed decision is not empty`);
      assert.equal(decidedBy, '', `${section.id} Proposed decided-by is not empty`);
      assert.equal(effectiveDate, '', `${section.id} Proposed effective date is not empty`);
    } else {
      assert.notEqual(decision, '', `${section.id} decided status has no decision`);
      assert.notEqual(decidedBy, '', `${section.id} decided status has no decider`);
      assert.match(effectiveDate, /^\d{4}-\d{2}-\d{2}$/u, `${section.id} has an invalid effective date`);
    }
  }
});

test('[TTV2-000] the summary table matches section IDs and statuses', () => {
  const log = decisionLog();
  const summaryRows = [...log.matchAll(/^\| (D-\d{3}) \| ([^\n]+?) \| ([^\n]+?) \| ([^\n]+?) \| ([^\n]+?) \|$/gmu)].map(
    ([, id, , , , status]) => ({ id, status: status.trim() }),
  );
  const expected = sections(log).map((section) => ({ id: section.id, status: field(section, 'Status') }));
  assert.deepEqual(summaryRows, expected);
});

test('[TTV2-000] progress marks the decision log in progress', () => {
  const progress = read('progress.md');
  const section = progress.match(/### TTV2-000[\s\S]*?(?=\n### |\n## |$)/u);
  assert.ok(section, 'TTV2-000 section is missing');
  assert.match(section[0], /- Status: IN_PROGRESS/u);
  assert.match(section[0], /docs\/12-DECISION-LOG\.md/u);
});
