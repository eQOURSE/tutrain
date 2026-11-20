import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const repositoryRoot = fs.realpathSync(`${import.meta.dirname}/../..`);
const workflowsDirectory = `${repositoryRoot}/.github/workflows`;

function readWorkflow(name) {
  return fs.readFileSync(`${workflowsDirectory}/${name}`, 'utf8');
}

function assertStandardTriggers(workflow) {
  assert.match(workflow, /^on:\s*\r?\n\s+pull_request:/m);
  assert.match(workflow, /^\s+push:\s*\r?\n\s+branches:\s*\[develop, main\]/m);
}

test('[NFR-SEC-02] the secret scan runs gitleaks over the full history on every PR and on pushes to develop and main', () => {
  const workflow = readWorkflow('secret-scan.yml');
  assertStandardTriggers(workflow);
  assert.match(workflow, /secret-scan:/u);
  assert.match(workflow, /fetch-depth:\s*0/u);
  assert.match(workflow, /gitleaks"?\s+git[\s\S]*--redact[\s\S]*--ignore-gitleaks-allow/u);
  assert.doesNotMatch(workflow, /continue-on-error|--exit-code\s+0|\|\|\s*true/u);
});

test('[NFR-SEC-02] gitleaks is a pinned release checked against its SHA-256 before it runs', () => {
  const workflow = readWorkflow('secret-scan.yml');
  assert.match(workflow, /GITLEAKS_VERSION:\s*8\.30\.1/u);
  assert.match(workflow, /GITLEAKS_SHA256:\s*551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb/u);
  assert.match(workflow, /https:\/\/github\.com\/gitleaks\/gitleaks\/releases\/download\//u);
  assert.match(workflow, /sha256sum\s+--check/u);
  assert.doesNotMatch(workflow, /gitleaks\/gitleaks-action/u);
});

test('[NFR-MNT-01] the document checks run on every PR and on pushes to develop and main', () => {
  const workflow = readWorkflow('docs-check.yml');
  assertStandardTriggers(workflow);
  assert.match(workflow, /docs-check:/u);
  assert.match(workflow, /node-version:\s*22/u);
  assert.match(workflow, /npm run test:docs/u);
});

test('[NFR-SEC-02] every workflow has a read-only token and actions pinned to a full commit SHA', () => {
  const names = fs.readdirSync(workflowsDirectory).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
  assert.ok(names.length >= 2);
  for (const name of names) {
    const workflow = readWorkflow(name);
    assert.match(workflow, /^permissions:\s*\r?\n\s+contents:\s*read/m, name);
    assert.doesNotMatch(workflow, /:\s*write\b|pull_request_target/u, name);
    const usesLines = workflow.split(/\r?\n/u).filter((line) => /^\s*(?:-\s+)?uses:/u.test(line));
    assert.ok(usesLines.length > 0, name);
    for (const line of usesLines) assert.match(line, /^\s*(?:-\s+)?uses:\s+[\w.-]+\/[\w.-]+@[0-9a-f]{40}\s+#\s+v\S+\s*$/u, line);
    const checkoutUses = usesLines.filter((line) => /uses:\s+actions\/checkout@/u.test(line)).length;
    const credentialOptOuts = workflow.match(/persist-credentials:\s*false/g) ?? [];
    assert.ok(credentialOptOuts.length >= checkoutUses, `${name}: every checkout must disable persisted credentials`);
  }
});
