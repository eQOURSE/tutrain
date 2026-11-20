import guardian from "../fixtures/iam/me.guardian-two-learners.json";
import learner from "../fixtures/iam/me.learner.json";
import tutor from "../fixtures/iam/me.tutor.json";
import staff from "../fixtures/iam/me.staff.json";
import catalog from "../fixtures/catalog/catalog-IN.success.json";

export type MockRole = "guardian" | "learner" | "tutor" | "operations" | "super_admin";
export type Viewer = {
  user: { id: string; role: string; email: string; phone: string };
  roles: string[];
  permissions: string[];
  learners: { id: string; name: string; grade: string; status: string }[];
};

const people: Record<Exclude<MockRole, "super_admin">, Viewer> = {
  guardian: guardian.response.body,
  learner: learner.response.body,
  tutor: tutor.response.body,
  operations: staff.response.body,
};

export function getMockViewer(): Viewer | null {
  if (process.env.NODE_ENV === "production" || process.env.TUTRAIN_MOCK_API !== "1") return null;
  const role = process.env.TUTRAIN_MOCK_ROLE as MockRole | undefined;
  if (!role) return null;
  if (role === "super_admin") return { ...people.operations, user: { ...people.operations.user, role }, roles: [role], permissions: ["*"] };
  return Object.hasOwn(people, role) ? people[role] : null;
}

export function canAccess(viewer: Viewer | null, area: "portal" | "admin"): boolean {
  if (!viewer) return false;
  return area === "portal"
    ? viewer.roles.some(role => ["guardian", "learner", "tutor"].includes(role))
    : viewer.roles.some(role => ["operations", "super_admin"].includes(role));
}

export function getMockCatalog() {
  return process.env.NODE_ENV !== "production" && process.env.TUTRAIN_MOCK_API === "1"
    ? catalog.response.body.data
    : [];
}
