import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { env, execPath } from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtureRoot = path.join(repositoryRoot, 'tools', 'workspace-check', 'fixtures');
const eslintBin = path.join(repositoryRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
const eslintConfig = path.join(repositoryRoot, 'eslint.config.mjs');

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function packageJson() {
  return JSON.parse(read('package.json'));
}

function lintFixture(relativePath) {
  return spawnSync(execPath, [eslintBin, '--config', eslintConfig, relativePath], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: { ...env, ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH: fixtureRoot },
  });
}

function output(result) {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function assertBoundaryFailure(relativePath) {
  const result = lintFixture(relativePath);
  assert.notEqual(result.status, 0, `${relativePath} unexpectedly passed lint:\n${output(result)}`);
  assert.match(output(result), /boundaries\/dependencies/u, `${relativePath} failed without the boundary rule`);
}

function assertBoundaryPass(relativePath) {
  const result = lintFixture(relativePath);
  assert.equal(result.status, 0, `${relativePath} unexpectedly failed lint:\n${output(result)}`);
}

test('[NFR-MNT-01] the root workspace exposes lint, typecheck, test and build scripts', () => {
  const manifest = packageJson();

  assert.equal(manifest.engines.node, '^22.12.0 || ^24.0.0 || >=26.0.0');
  assert.equal(manifest.packageManager, 'pnpm@10.34.9');
  for (const script of ['lint', 'typecheck', 'test', 'build']) assert.equal(typeof manifest.scripts[script], 'string', script);
});

test('[SPECS §1 AC1] compose.yaml pins PostgreSQL 16 by version and digest and publishes it on 127.0.0.1 only', () => {
  const manifest = packageJson();
  const compose = read('compose.yaml');

  assert.equal(manifest.scripts.dev, 'docker compose up -d --wait postgres && pnpm --filter @tutrain/api dev');
  assert.equal(manifest.scripts['db:up'], 'docker compose up -d --wait postgres');
  assert.equal(manifest.scripts['dev:api'], 'pnpm --filter @tutrain/api dev');
  assert.match(compose, /image:\s*postgres:16\.16-alpine@sha256:[0-9a-f]{64}/u);
  assert.match(compose, /127\.0\.0\.1:5432:5432/u);
  assert.doesNotMatch(compose, /(^|\n)\s*-\s*5432:5432\s*($|\n)/u);
});

test('[SPECS §1 AC5] crm importing billing internal fails', () => {
  assertBoundaryFailure('packages/domain/crm/src/import-billing-internal.ts');
});

test('[SPECS §1 AC5] a deeply nested crm import of billing internal fails', () => {
  assertBoundaryFailure('packages/domain/crm/src/deep/one/two/import-billing-internal.ts');
});

test('[NFR-MNT-03] crm importing billing services fails', () => {
  assertBoundaryFailure('packages/domain/crm/src/import-billing-services.ts');
});

test('[NFR-MNT-03] crm importing billing public passes', () => {
  assertBoundaryPass('packages/domain/crm/src/import-billing-public.ts');
});

test('[NFR-MNT-03] billing importing its own internal file passes', () => {
  assertBoundaryPass('packages/domain/billing/src/import-own-internal.ts');
});

test('[NFR-MNT-03] crm importing contracts passes', () => {
  assertBoundaryPass('packages/domain/crm/src/import-contracts.ts');
});

test('[NFR-MNT-03] crm importing ui fails', () => {
  assertBoundaryFailure('packages/domain/crm/src/import-ui.ts');
});

test('[NFR-MNT-03] an app importing a domain public file passes', () => {
  assertBoundaryPass('apps/web/src/import-domain-public.ts');
});

test('[NFR-MNT-03] an app importing its own file passes', () => {
  assertBoundaryPass('apps/web/src/import-own-file.ts');
});

test('[NFR-MNT-03] a package importing its own file passes', () => {
  assertBoundaryPass('packages/ui/src/import-own-file.ts');
});

test('[NFR-MNT-03] an app importing a domain internal file fails', () => {
  assertBoundaryFailure('apps/web/src/import-domain-internal.ts');
});

test('[NFR-MNT-03] an app importing a domain internal file through its tsconfig path alias fails', () => {
  assertBoundaryFailure('apps/web/src/import-domain-alias.ts');
});

test('[NFR-MNT-03] an app importing another app fails', () => {
  assertBoundaryFailure('apps/web/src/import-another-app.ts');
});

test('[NFR-MNT-03] an app importing ui and contracts passes', () => {
  assertBoundaryPass('apps/api/src/import-shared-packages.ts');
});

test('[NFR-MNT-01] CI has lint, typecheck, test and build jobs', () => {
  const workflow = read('.github/workflows/ci.yml');
  const manifest = packageJson();

  for (const job of ['lint', 'typecheck', 'test', 'build']) assert.match(workflow, new RegExp(`^[ ]{2}${job}:`, 'mu'), job);
  assert.doesNotMatch(workflow, /cache:\s*pnpm/u);
  assert.doesNotMatch(workflow, /corepack prepare/u);
  assert.doesNotMatch(workflow, /pnpm@\d/u);

  const jobsDocument = workflow.slice(workflow.indexOf('jobs:'));
  const jobs = [...jobsDocument.matchAll(/^[ ]{2}([a-z-]+):\r?\n([\s\S]*?)(?=^[ ]{2}[a-z-]+:|(?![\s\S]))/gmu)];
  for (const [, name, body] of jobs) {
    const enableIndex = body.indexOf('corepack enable');
    const installIndex = body.indexOf('pnpm install --frozen-lockfile');
    assert.ok(enableIndex >= 0, `${name} does not enable corepack`);
    assert.ok(installIndex > enableIndex, `${name} runs pnpm before corepack enable`);
    assert.match(body, /node-version:\s*22/u, `${name} is not on Node 22`);
    assert.equal(manifest.packageManager, 'pnpm@10.34.9');
  }

  const build = jobs.find(([, name]) => name === 'build')?.[0] ?? '';
  assert.match(build, /pnpm -r --if-present build/u);
});
