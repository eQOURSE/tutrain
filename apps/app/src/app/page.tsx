import { getMockViewer, canAccess } from "@tutrain/mock-api";
import { AppShell, SectionHeading, StateView } from "@tutrain/ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  const viewer = getMockViewer();
  if (!viewer) redirect("/login");
  if (!canAccess(viewer, "portal")) return <AppShell area="Learning portal" title="Access unavailable" subtitle="Your account cannot open this workspace." navigation={[{ href: "/", label: "Home", current: true }]}><StateView kind="forbidden" title="This workspace is not in your role" description="Use the staff console for your assigned work." /></AppShell>;
  const role = viewer.user.role;
  const navigation = role === "tutor"
    ? [{ href: "/", label: "Overview", current: true }, { href: "/sessions", label: "Sessions" }, { href: "/learners", label: "Learners" }]
    : [{ href: "/", label: "Overview", current: true }, { href: "/schedule", label: "Schedule" }, { href: "/learning", label: "Learning" }];
  return <AppShell area="Learning portal" title={role === "guardian" ? "Your learners" : "Your learning workspace"} subtitle="A clear view of the people and work connected to your account." navigation={navigation}>
    <SectionHeading title={role === "guardian" ? "Learner profiles" : "Coming up"} detail="People and activity connected to your account" />
    {viewer.learners.length ? <ul className="tt-list">{viewer.learners.map(person => <li key={person.id}><div><strong>{person.name}</strong><br /><span>Grade {person.grade}</span></div><span className="tt-pill">{person.status}</span></li>)}</ul> : <StateView kind="empty" title="Nothing scheduled yet" description="Sessions and learning updates will appear after the scheduling API is connected." />}
  </AppShell>;
}
