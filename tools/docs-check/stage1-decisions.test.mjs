import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
    return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function decisionSection(source, id) {
    const start = source.indexOf(`### ${id} `);
    const next = source.indexOf("\n### ", start + 1);
    return source.slice(start, next === -1 ? source.length : next);
}

function progressSection(source, id) {
    const heading = source.includes(`#### ${id} `) ? "####" : "###";
    const start = source.indexOf(`${heading} ${id} `);
    const next = source.indexOf(`\n${heading} `, start + 1);
    return source.slice(start, next === -1 ? source.length : next);
}

test("[TTV2-000] records D-001 as approved with the migration decision", () => {
    const source = read("docs/12-DECISION-LOG.md");
    const section = decisionSection(source, "D-001");
    assert.match(section, /^- Status: Approved$/mu);
    assert.match(section, /PostgreSQL 16 is the v2 system of record/u);
    assert.match(section, /migration, reconciliation and rollback checks/u);
    assert.match(section, /Bhavesh Kanoje \(Tech Lead; final Admin decision authority for this project, covering the Director \/ Super Admin sign-off/u);
    assert.match(section, /^- Effective date: 2026-11-18$/mu);
    assert.match(source, /\| D-001 \|.*\| Approved \|/u);
});

test("[TTV2-000] records D-002 as approved with changes", () => {
    const source = read("docs/12-DECISION-LOG.md");
    const section = decisionSection(source, "D-002");
    assert.match(section, /^- Status: Approved with changes$/mu);
    for (const phrase of ["Express 5", "TypeScript modular monolith", "pnpm workspaces", "Drizzle", "BullMQ/Valkey", "NestJS", "Turborepo"]) {
        assert.match(section, new RegExp(phrase.replace("/", "\\/"), "u"));
    }
    assert.match(section, /Bhavesh Kanoje \(Tech Lead\)/u);
    assert.match(section, /^- Effective date: 2026-11-18$/mu);
});

test("[TTV2-000] records D-003 as approved for the new private repository", () => {
    const source = read("docs/12-DECISION-LOG.md");
    const section = decisionSection(source, "D-003");
    assert.match(section, /^- Status: Approved$/mu);
    assert.match(section, /eQOURSE\/tutrain/u);
    assert.match(section, /current backend and frontend remain in service/u);
    assert.match(section, /Bhavesh Kanoje \(Tech Lead\)/u);
    assert.match(section, /^- Effective date: 2026-11-18$/mu);
});

test("[TTV2-000] leaves D-004 through D-025 proposed and undecided", () => {
    const source = read("docs/12-DECISION-LOG.md");
    for (let index = 4; index <= 25; index += 1) {
        const section = decisionSection(source, `D-${String(index).padStart(3, "0")}`);
        assert.match(section, /^- Status: Proposed$/mu);
        assert.match(section, /^- Decision:$/mu);
        assert.match(section, /^- Decided by:$/mu);
        assert.match(section, /^- Effective date:$/mu);
    }
});

test("[TTV2-000] aligns AGENTS with Express routes and the new repository", () => {
    const source = read("AGENTS.md");
    assert.doesNotMatch(source, /@RequirePermission/u);
    assert.match(source, /requirePermission\(/u);
    assert.match(source, /eQOURSE\/tutrain/u);
});

test("[TTV2-000] aligns the platform scaffold acceptance criteria with D-002", () => {
    const source = read("SPECS.md");
    const section = source.slice(source.indexOf("## 1. Platform scaffold"), source.indexOf("\n## 2. IAM"));
    assert.doesNotMatch(section, /Turborepo/u);
    assert.match(section, /AC1: `pnpm i && pnpm dev` starts the API against docker-compose PostgreSQL/u);
    assert.doesNotMatch(section, /Postgres \+ Valkey/u);
    assert.match(section, /AC3:[\s\S]*TTV2-A04/u);
});

test("[TTV2-000] aligns architecture tables, layout and ADR references", () => {
    const source = read("docs/03-ARCHITECTURE.md");
    assert.match(source, /\| API framework \|.*Express 5/u);
    assert.match(source, /\| Monorepo \|.*Turborepo deferred/u);
    const layout = source.slice(source.indexOf("## 5. Monorepo layout"), source.indexOf("\n## 6."));
    assert.doesNotMatch(layout, /turbo\.json/u);
    assert.match(layout, /Express 5/u);
    assert.match(layout, /worker.*added later|added later.*worker/is);
    for (const adr of ["ADR-001", "ADR-009", "ADR-010"]) {
        const line = source.split("\n").find((candidate) => candidate.includes(adr));
        assert.match(line, /D-002/u);
    }
    const adr002 = source.split("\n").find((candidate) => candidate.includes("ADR-002"));
    assert.match(adr002, /D-001/u);
});

test("[TTV2-000] keeps the D-002 API wording consistent", () => {
    const source = read("docs/03-ARCHITECTURE.md");
    assert.doesNotMatch(source, /incremental TypeScript migration/u);
    const adr001 = source.split("\n").find((candidate) => candidate.includes("ADR-001"));
    assert.match(adr001, /eQOURSE\/tutrain/u);
});

test("[TTV2-000] updates the roadmap, ownership deferrals and progress plan", () => {
    const roadmap = read("docs/10-ROADMAP.md");
    assert.match(roadmap, /Team unfamiliar with PostgreSQL and Drizzle/u);

    const ownership = read("docs/13-OWNERSHIP-AND-CONTRACTS.md");
    assert.match(ownership, /turbo\.json.*deferred by D-002/u);
    assert.match(ownership, /apps\/worker.*added later.*D-002/is);
    assert.match(ownership, /apps\/web.*added later.*D-002/is);
    assert.match(ownership, /apps\/app.*added later.*D-002/is);
    assert.match(ownership, /apps\/admin.*added later.*D-002/is);

    const ownershipJson = JSON.parse(read("docs/contracts/ownership.json"));
    for (const key of ["turbo.json", "apps/worker", "apps/web", "apps/app", "apps/admin"]) {
        assert.match(ownershipJson.paths[key].source, /D-002/u);
    }

    const progress = read("progress.md");
    const ttv2 = progressSection(progress, "TTV2-000");
    assert.match(ttv2, /Recorded 2026-11-18: D-001 Approved, D-002 Approved with changes, D-003 Approved, decided by Bhavesh Kanoje/u);
    assert.match(ttv2, /Status: DONE/u);
    assert.match(progress, /new private repository eQOURSE\/tutrain[\s\S]*keeps serving production during the migration/u);

    const a03 = progressSection(progress, "TTV2-A03");
    assert.match(a03, /eQOURSE\/tutrain/u);
    assert.match(a03, /Express 5/u);
    assert.match(a03, /PostgreSQL/u);
    assert.doesNotMatch(a03, /Configure pnpm workspaces and Turborepo\./u);
    assert.match(progressSection(progress, "TTV2-B02"), /D-002 keeps the existing frontend running/u);
    assert.match(progress, /database decision is approved \(D-001\)/u);
});

test("[TTV2-000] keeps the SRS sign-off cells empty", () => {
    const source = read("docs/02-SRS.md");
    const signOff = source.slice(source.indexOf("## 11. Sign-off"));
    assert.match(signOff, /\| Director \/ Super Admin \| \| \| \|/u);
    assert.match(signOff, /\| Tech Lead \| \| \| \|/u);
    assert.match(signOff, /\| Operations Head \| \| \| \|/u);
});
