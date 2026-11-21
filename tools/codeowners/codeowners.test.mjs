import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const codeownersPath = path.join(repositoryRoot, '.github', 'CODEOWNERS');
const ownershipPath = path.join(repositoryRoot, 'docs', 'contracts', 'ownership.json');

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function ownership() {
  return JSON.parse(read('docs/contracts/ownership.json'));
}

function mappings() {
  return new Map(
    [...read('.github/CODEOWNERS').matchAll(/^# owner (\w+) = (@\S+)$/gmu)].map(([, owner, handle]) => [owner, handle]),
  );
}

function rules() {
  return read('.github/CODEOWNERS')
    .split(/\r?\n/u)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [pattern, ...owners] = line.trim().split(/\s+/u);
      return { pattern, owners };
    });
}

function runGenerator(args = []) {
  return spawnSync(process.execPath, [path.join(repositoryRoot, 'tools', 'codeowners', 'generate.mjs'), ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
}

function directoryPath(ownershipPathValue) {
  return ownershipPathValue.endsWith('/') || !path.basename(ownershipPathValue).includes('.')
    ? `${ownershipPathValue.replace(/\/$/u, '')}/`
    : ownershipPathValue;
}

function expectedPattern(ownershipPathValue) {
  return `/${directoryPath(ownershipPathValue)}`;
}

function matchingRule(target) {
  return rules()
    .filter(({ pattern }) => {
      const unanchored = pattern.slice(1);
      return unanchored.endsWith('/') ? target.startsWith(unanchored) : target === unanchored;
    })
    .at(-1);
}

test('[NFR-MNT-03] CODEOWNERS matches the generator\'s output for ownership.json', () => {
  const result = runGenerator(['--check']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test('[NFR-MNT-03] every ownership.json path, and every expanded <module> path, has a rule', () => {
  const source = ownership();
  const generatedRules = rules();
  for (const ownershipPathValue of Object.keys(source.paths)) {
    const expandedPaths = ownershipPathValue.includes('<module>')
      ? Object.keys(source.modules).map((module) => ownershipPathValue.replaceAll('<module>', module))
      : [ownershipPathValue];
    for (const expandedPath of expandedPaths) {
      assert.ok(generatedRules.some(({ pattern }) => pattern === expectedPattern(expandedPath)), expandedPath);
    }
  }
  for (const module of Object.values(source.modules)) {
    assert.ok(generatedRules.some(({ pattern }) => pattern === expectedPattern(module.contracts_path)), module.contracts_path);
  }
});

test('[NFR-MNT-03] a module path resolves to its module owner: the last rule matching apps/api/src/modules/billing/x.ts lists the kartik mapping, and packages/domain/crm/x.ts lists the bhavesh mapping plus its reviewer', () => {
  const source = ownership();
  const handleByOwner = mappings();
  const billingRule = matchingRule('apps/api/src/modules/billing/x.ts');
  const crmRule = matchingRule('packages/domain/crm/x.ts');
  const billingOwners = [source.modules.billing.owner, ...source.paths['apps/api/src/modules/<module>'].reviewers];
  const crmOwners = [source.paths['packages/domain/crm'].owner, ...source.paths['packages/domain/crm'].reviewers];
  assert.deepEqual(billingRule?.owners, [...new Set(billingOwners)].map((owner) => handleByOwner.get(owner)));
  assert.deepEqual(crmRule?.owners, [...new Set(crmOwners)].map((owner) => handleByOwner.get(owner)));
});

test('[NFR-MNT-03] the usernames from the header appear in no tracked file other than .github/CODEOWNERS', () => {
  const usernames = [...mappings().values()].map((handle) => handle.slice(1));
  const trackedFiles = execFileSync('git', ['ls-files'], { cwd: repositoryRoot, encoding: 'utf8' })
    .split(/\r?\n/u)
    .filter(Boolean)
    .filter((trackedFile) => trackedFile !== '.github/CODEOWNERS');
  for (const trackedFile of trackedFiles) {
    const contents = read(trackedFile);
    for (const username of usernames) assert.equal(contents.includes(username), false, `${username} appears in ${trackedFile}`);
  }
});
