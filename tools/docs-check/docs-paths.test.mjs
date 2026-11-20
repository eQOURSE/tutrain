import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..', '..');
const currentTestRelativePath = path
  .relative(repositoryRoot, fileURLToPath(import.meta.url))
  .replaceAll(path.sep, '/');

const numberedDocuments = [
  '01-CURRENT-STATE-AUDIT.md',
  '02-SRS.md',
  '03-ARCHITECTURE.md',
  '04-DATA-MODEL.md',
  '05-API-CONVENTIONS.md',
  '06-ATTENDANCE-RECORDING-PIPELINE.md',
  '07-AI-PLATFORM.md',
  '08-WEB-SEO-PERFORMANCE.md',
  '09-SECURITY-COMPLIANCE.md',
  '10-ROADMAP.md',
  '11-DEPARTMENT-WORKFLOWS.md',
];

const documentationFiles = ['AGENTS.md', 'CLAUDE.md', 'SPECS.md', 'progress.md'];

// No deliberate outside-repository Markdown links are currently approved.
const outsideRepositoryAllowlist = new Map();

function exists(relativePath) {
  return statSafe(path.join(repositoryRoot, relativePath)) !== null;
}

function statSafe(filePath) {
  try {
    return statSync(filePath);
  } catch {
    return null;
  }
}

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function markdownFilesUnderDocs() {
  const docsDirectory = path.join(repositoryRoot, 'docs');
  const directory = statSafe(docsDirectory);
  if (!directory?.isDirectory()) return [];

  return readdirSync(docsDirectory)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join('docs', name));
}

function filesCoveredByLinkCheck() {
  return [...documentationFiles, ...markdownFilesUnderDocs()];
}

function visibleMarkdownLines(text) {
  const visibleLines = [];
  let insideFence = false;

  for (const [index, originalLine] of text.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    const trimmed = originalLine.trimStart();
    if (/^(?:```|~~~)/.test(trimmed)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) continue;

    // Inline-code spans are documentation examples, not Markdown links to resolve.
    const line = originalLine.replace(/`[^`]*`/g, '');
    visibleLines.push({ line, lineNumber });
  }

  return visibleLines;
}

function resolveMarkdownTarget(sourceFile, rawTarget) {
  const target = rawTarget.trim().replace(/^<|>$/g, '');
  if (!target || target.startsWith('#')) return null;
  if (/^(?:https?:|mailto:)/i.test(target)) return null;

  const withoutAnchor = target.split('#', 1)[0];
  const sourceDirectory = path.dirname(path.join(repositoryRoot, sourceFile));
  const resolved = path.resolve(sourceDirectory, withoutAnchor);
  const relativeResolved = path.relative(repositoryRoot, resolved);

  if (relativeResolved.startsWith('..') || path.isAbsolute(relativeResolved)) {
    return { outside: true, target };
  }

  return { outside: false, resolved, target };
}

function trackedTextFiles() {
  const extensions = new Set([
    '.cjs',
    '.css',
    '.html',
    '.js',
    '.json',
    '.mjs',
    '.md',
    '.sh',
    '.sql',
    '.ts',
    '.tsx',
    '.txt',
    '.xml',
    '.yaml',
    '.yml',
  ]);
  const trackedPaths = execFileSync('git', ['ls-files', '-z'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).split('\0').filter(Boolean);

  return trackedPaths
    .filter((relativeFile) => relativeFile !== currentTestRelativePath)
    .filter((relativeFile) => extensions.has(path.extname(relativeFile).toLowerCase()))
    .map((relativeFile) => path.join(repositoryRoot, relativeFile))
    .filter((absoluteFile) => statSafe(absoluteFile)?.isFile());
}

test('[TTV2-001] the 11 numbered documents live in docs/ and none remain at the root', () => {
  for (const file of numberedDocuments) {
    assert.equal(exists(path.join('docs', file)), true, `missing docs/${file}`);
    assert.equal(exists(file), false, `root copy still exists: ${file}`);
  }
});

test('[TTV2-001] AGENTS.md points at the SRS, architecture, data-model and API-conventions docs under docs/', () => {
  const agents = read('AGENTS.md');
  const expectedReferences = [
    'docs/02-SRS.md',
    'docs/03-ARCHITECTURE.md',
    'docs/04-DATA-MODEL.md',
    'docs/05-API-CONVENTIONS.md',
  ];

  for (const reference of expectedReferences) {
    assert.match(agents, new RegExp(reference.replaceAll('.', '\\.'), 'u'));
    assert.equal(exists(reference), true, `missing referenced file: ${reference}`);
  }
});

test('[TTV2-001] every relative Markdown link resolves', () => {
  const brokenLinks = [];
  const outsideLinks = [];

  for (const sourceFile of filesCoveredByLinkCheck()) {
    for (const { line, lineNumber } of visibleMarkdownLines(read(sourceFile))) {
      for (const match of line.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const resolvedTarget = resolveMarkdownTarget(sourceFile, match[1]);
        if (!resolvedTarget) continue;
        if (resolvedTarget.outside) {
          outsideLinks.push(`${sourceFile}:${lineNumber} -> ${resolvedTarget.target}`);
          continue;
        }
        if (!exists(path.relative(repositoryRoot, resolvedTarget.resolved))) {
          brokenLinks.push(`${sourceFile}:${lineNumber} -> ${resolvedTarget.target}`);
        }
      }
    }
  }

  for (const outsideLink of outsideLinks) {
    const target = outsideLink.split(' -> ', 2)[1];
    assert.equal(outsideRepositoryAllowlist.has(target), true, `unallowlisted outside link: ${outsideLink}`);
  }
  assert.deepEqual(brokenLinks, [], `broken Markdown links:\n${brokenLinks.join('\n')}`);
});

test('[TTV2-001] every backticked documentation path exists', () => {
  const missingPaths = [];
  for (const sourceFile of documentationFiles) {
    for (const [index, line] of read(sourceFile).split(/\r?\n/).entries()) {
      for (const match of line.matchAll(/`([^`\r\n]+)`/g)) {
        const value = match[1];
        const isDocsPath = value.startsWith('docs/');
        const isNumberedDocument = /^\d{2}-.+\.md$/u.test(value);
        if (!isDocsPath && !isNumberedDocument) continue;

        if (!exists(value)) missingPaths.push(`${sourceFile}:${index + 1} -> ${value}`);
      }
    }
  }
  assert.deepEqual(missingPaths, [], `missing documentation paths:\n${missingPaths.join('\n')}`);
});

test('[TTV2-001] no file references the old docs/ paths', () => {
  const oldPaths = [
    'docs/SRS.md',
    'docs/ARCHITECTURE.md',
    'docs/DATA-MODEL.md',
    'docs/API-CONVENTIONS.md',
  ];
  const matches = [];

  for (const absoluteFile of trackedTextFiles()) {
    const relativeFile = path.relative(repositoryRoot, absoluteFile);
    for (const [index, line] of readFileSync(absoluteFile, 'utf8').split(/\r?\n/).entries()) {
      if (oldPaths.some((oldPath) => line.includes(oldPath))) {
        matches.push(`${relativeFile}:${index + 1}`);
      }
    }
  }

  assert.deepEqual(matches, [], `old documentation paths remain:\n${matches.join('\n')}`);
});

test('[TTV2-001] progress.md records the decision', () => {
  const progress = read('progress.md');
  const sectionMatch = progress.match(/### TTV2-001[\s\S]*?(?=\n### |\n## |$)/u);
  assert.ok(sectionMatch, 'TTV2-001 section is missing');
  assert.match(sectionMatch[0], /- Status: DONE/u);
  assert.match(sectionMatch[0], /- Decision:.*docs\//u);
});
