import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..', '..');
const contractsDirectory = path.join(repositoryRoot, 'docs', 'contracts');

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function architectureModules() {
  return [...read('docs/03-ARCHITECTURE.md').matchAll(/^\| \*\*([a-z]+)\*\* \|/gmu)].map(([, module]) => module);
}

function progressPaths() {
  const progress = read('progress.md');
  const paths = [];
  for (const role of ['Kartik', 'Bhavesh']) {
    const section = progress.match(new RegExp('### ' + role + '[^\\n]*\\n[\\s\\S]*?```text\\r?\\n([\\s\\S]*?)```', 'u'));
    assert.ok(section, `${role} ownership list is missing`);
    paths.push(...section[1].split(/\r?\n/u).map((line) => line.trim()).filter(Boolean));
  }
  return paths;
}

function architectureEvents() {
  const events = [];
  for (const line of read('docs/03-ARCHITECTURE.md').split(/\r?\n/u)) {
    if (!/^\| \*\*[a-z]+\*\* \|/u.test(line)) continue;
    const cells = line.split('|').map((cell) => cell.trim());
    const module = cells[1].replaceAll('*', '');
    for (const [kind, cell] of [['emits', cells[4]], ['consumes', cells[5]]]) {
      for (const token of cell.matchAll(/`([^`]+)`/gu)) {
        const value = token[1];
        if (['—', 'almost every event', 'all', 'intercepted writes'].includes(value)) continue;
        const parts = value.split('.');
        const prefix = parts.slice(0, -1).join('.');
        for (const event of parts.at(-1).split('/')) events.push({ module, kind, shortName: `${prefix}.${event}` });
      }
    }
  }
  return events;
}

function fixtureFiles(directory = path.join(contractsDirectory, 'fixtures'), prefix = '') {
  const files = [];
  for (const name of readdirSync(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, name.name);
    if (name.isDirectory()) files.push(...fixtureFiles(path.join(directory, name.name), relative));
    else if (name.isFile() && name.name.endsWith('.json')) files.push(relative.replaceAll(path.sep, '/'));
  }
  return files;
}

function endpointPatterns() {
  return [...read('SPECS.md').matchAll(/(?:GET|POST|PATCH|DELETE|Admin:)?\s*(\/v1\/[^\s`]+)/gu)]
    .map(([, endpoint]) => endpoint.replace(/[),.;]+$/u, '').split('?')[0])
    .filter((endpoint, index, endpoints) => endpoints.indexOf(endpoint) === index);
}

function pathMatchesPattern(actualPath, pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const expression = `^${escaped.replace(/\\\{[^}]+\\\}/gu, '[^/]+')}$`;
  return new RegExp(expression, 'u').test(actualPath);
}

function assertSnakeCase(value, context) {
  assert.match(value, /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u, `${context} is not snake_case`);
}

function walk(value, context, visit) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${context}[${index}]`, visit));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visit(key, child, context);
    walk(child, `${context}.${key}`, visit);
  }
}

function allStrings(value) {
  const strings = [];
  walk(value, '$', (_key, child) => {
    if (typeof child === 'string') strings.push(child);
  });
  return strings;
}

const expectedGaps = [
  'packages/domain/audit',
  'apps/api/src/modules/<module>',
  'apps/worker/src/jobs/<module>',
  'packages/db/schema/<module>.ts',
  'packages/adapters/llm',
  'packages/adapters/embeddings',
  'packages/adapters/payments',
  'packages/db/migrations',
  'packages/config',
  'packages/config/tailwind',
  'packages/testing',
  'packages/contracts/events/<module>',
  'packages/api-client',
  'packages/contracts/openapi.json',
  'packages/seo',
  '.github/workflows',
  'turbo.json',
  'pnpm-workspace.yaml',
  'package.json',
  'docs/',
  'AGENTS.md',
  'CLAUDE.md',
  'SPECS.md',
  'progress.md',
];

test('[NFR-MNT-03] every architecture module appears once in ownership.json', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  const moduleNames = Object.keys(ownership.modules);
  assert.deepEqual([...moduleNames].sort(), [...new Set(moduleNames)].sort());
  assert.deepEqual(moduleNames.sort(), architectureModules().sort());
  for (const module of moduleNames) {
    assert.ok(['kartik', 'bhavesh'].includes(ownership.modules[module].owner), `${module} has no developer owner`);
    assert.equal(ownership.modules[module].contracts_path, `packages/contracts/${module}`);
    assert.equal(ownership.modules[module].public_api, `packages/domain/${module}/public.ts`);
  }
});

test('[NFR-MNT-03] progress ownership paths have one matching owner', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  const expected = progressPaths();
  assert.equal(new Set(Object.keys(ownership.paths)).size, Object.keys(ownership.paths).length, 'duplicate path entries exist');
  for (const ownershipPath of expected) {
    assert.ok(ownership.paths[ownershipPath], `missing ownership path: ${ownershipPath}`);
    assert.ok(['kartik', 'bhavesh', 'shared', 'generated', 'module'].includes(ownership.paths[ownershipPath].owner));
  }
});

test('[NFR-MNT-03] every requested ownership gap is represented', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  for (const gap of expectedGaps) assert.ok(ownership.paths[gap], `missing gap entry: ${gap}`);
  assert.ok(ownership.extra_producers?.cms, 'missing CMS extra producer');
});

test('[NFR-MNT-03] module-scoped paths use the module owner marker', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  for (const ownershipPath of [
    'apps/api/src/modules/<module>',
    'apps/worker/src/jobs/<module>',
    'packages/db/schema/<module>.ts',
    'packages/contracts/events/<module>',
  ]) {
    assert.equal(ownership.paths[ownershipPath].owner, 'module', `${ownershipPath} must resolve by module`);
  }
});

test('[NFR-MNT-03] sensitive shared paths have the required cross-owner reviewers', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  assert.deepEqual(ownership.paths['packages/domain/crm'].reviewers, ['kartik']);
  assert.deepEqual(ownership.paths['packages/domain/lms'].reviewers, ['kartik']);
  assert.deepEqual(ownership.paths['packages/domain/support'].reviewers, ['kartik']);
  assert.deepEqual(ownership.paths['packages/domain/classroom'].reviewers, ['bhavesh']);
  assert.equal(ownership.paths['packages/adapters/payments'].owner, 'kartik');
  assert.deepEqual(ownership.paths['packages/adapters/payments'].reviewers, ['bhavesh']);
});

test('[NFR-MNT-03] event names, producers, consumers and versions are valid', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  const events = readJson('docs/contracts/events.json');
  const knownProducers = new Set([...Object.keys(ownership.modules), ...Object.keys(ownership.extra_producers)]);
  const names = new Set();
  for (const event of events) {
    assert.match(event.name, /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/u);
    assert.equal(names.has(event.name), false, `duplicate event name: ${event.name}`);
    names.add(event.name);
    assert.ok(knownProducers.has(event.producer), `unknown producer: ${event.producer}`);
    for (const consumer of event.consumers) assert.ok(knownProducers.has(consumer), `unknown consumer: ${consumer}`);
    assert.equal(Number.isInteger(event.version) && event.version > 0, true);
  }
});

test('[NFR-MNT-03] architecture emits and consumes are in the event catalogue', () => {
  const events = readJson('docs/contracts/events.json');
  for (const { shortName } of architectureEvents()) {
    assert.ok(events.some((event) => event.name === shortName || event.short_name === shortName), `missing event: ${shortName}`);
  }
  for (const shortName of ['consent.withdrawn', 'order.paid', 'payment.succeeded', 'order.created', 'session.outcome_set', 'participant.joined', 'catalog.product.published', 'chat.handoff', 'cms.page.published']) {
    assert.ok(events.some((event) => event.name === shortName || event.short_name === shortName), `missing SPECS event: ${shortName}`);
  }
});

test('[NFR-MNT-03] every documented event consumer is present in the catalogue', () => {
  const events = readJson('docs/contracts/events.json');
  for (const { module, kind, shortName } of architectureEvents().filter((event) => event.kind === 'consumes')) {
    const event = events.find((candidate) => candidate.name === shortName || candidate.short_name === shortName);
    assert.ok(event, `missing event for consumer ${module}: ${shortName}`);
    assert.ok(event.consumers.includes(module), `${module} is missing as a consumer of ${shortName}`);
  }
});

test('[NFR-MNT-03] fixtures match endpoint, JSON, money, error, list and fake-identity rules', () => {
  assert.equal(existsSync(contractsDirectory), true, 'docs/contracts is missing');
  const patterns = endpointPatterns();
  const fixtures = fixtureFiles();
  assert.ok(fixtures.length > 0, 'no fixtures found');
  for (const relativePath of fixtures) {
    const fixture = readJson(path.join('docs/contracts/fixtures', relativePath));
    assert.match(fixture.request.method, /^(GET|POST|PATCH|DELETE)$/u);
    assert.ok(patterns.some((pattern) => pathMatchesPattern(fixture.request.path.split('?')[0], pattern)), `${relativePath} has an undocumented endpoint`);
    for (const body of [fixture.request.body, fixture.response.body]) {
      if (body === undefined) continue;
      walk(body, '$', (key, child, context) => {
        assertSnakeCase(key, `${relativePath} ${context}`);
        if (key === 'amount_minor') assert.equal(Number.isInteger(child), true, `${relativePath} has non-integer money`);
        if (key === 'currency') assert.match(child, /^[A-Z]{3}$/u, `${relativePath} has invalid currency`);
      });
    }
    for (const value of allStrings(fixture)) {
      if (/^[^\s@]+@[^\s@]+$/u.test(value)) assert.match(value, /@example\.test$/u, `${relativePath} contains a non-fake email`);
      if (/^\+\d{10,}$/u.test(value)) assert.match(value, /^\+9190000000/u, `${relativePath} contains a non-fake phone`);
    }
    if (fixture.response.status >= 400) {
      for (const key of ['type', 'title', 'status', 'code', 'detail', 'request_id']) assert.ok(fixture.response.body?.[key] !== undefined, `${relativePath} missing error field ${key}`);
      assert.equal(fixture.response.body.status, fixture.response.status);
    }
    for (const body of [fixture.request.body, fixture.response.body]) {
      if (body && Array.isArray(body.data)) assert.ok(Object.hasOwn(body, 'next_cursor'), `${relativePath} list has no next_cursor`);
    }
  }
  const quote = readJson('docs/contracts/fixtures/catalog/quote.success-promo-gst.json').response.body;
  const lineTotal = quote.lines.reduce((sum, line) => sum + line.line_total.amount_minor, 0);
  assert.equal(lineTotal, quote.subtotal.amount_minor);
  assert.equal(quote.subtotal.amount_minor - quote.discount.amount_minor + quote.tax.amount_minor, quote.total.amount_minor);
});

test('[NFR-MNT-03] ownership document matches JSON and lists all proposals', () => {
  const ownership = readJson('docs/contracts/ownership.json');
  const document = read('docs/13-OWNERSHIP-AND-CONTRACTS.md');
  for (const [pathName, entry] of Object.entries(ownership.paths)) {
    const escapedPath = pathName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const row = document.match(new RegExp('\\\\| `'+escapedPath+'` \\| ([a-z]+) \\| ([^|]*) \\|', 'u'));
    assert.ok(row, `ownership table missing ${pathName}`);
    assert.equal(row[1], entry.owner, `wrong owner for ${pathName}`);
    assert.equal(row[2].trim(), entry.reviewers.join(', '), `wrong reviewers for ${pathName}`);
  }
  assert.deepEqual(ownership.developers, ['kartik', 'bhavesh']);
  assert.match(document, /TTV2-A03 creates the CODEOWNERS file from ownership\.json/u);
  for (const [pathName, entry] of Object.entries(ownership.paths)) {
    if (entry.status === 'proposed') assert.match(document, new RegExp(pathName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
  for (const event of readJson('docs/contracts/events.json')) {
    if (event.status === 'proposed' || event.producer_proposed) assert.match(document, new RegExp(event.name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
});

test('[NFR-MNT-03] progress marks TTV2-002 in progress with the contract document', () => {
  const progress = read('progress.md');
  const section = progress.match(/### TTV2-002[\s\S]*?(?=\n### |\n## |$)/u);
  assert.ok(section, 'TTV2-002 section is missing');
  assert.match(section[0], /- Status: IN_PROGRESS/u);
  assert.match(section[0], /docs\/13-OWNERSHIP-AND-CONTRACTS\.md/u);
});
