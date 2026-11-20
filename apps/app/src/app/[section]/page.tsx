import { getMockViewer, canAccess } from "@tutrain/mock-api";
import { AppShell, StateView } from "@tutrain/ui";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
const titles: Record<string, string> = { schedule: "Schedule", learning: "Learning", sessions: "Sessions", learners: "Learners" };

export default async function PortalSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!Object.hasOwn(titles, section)) notFound();
  const viewer = getMockViewer();
  if (!viewer) redirect("/login");
  if (!canAccess(viewer, "portal")) return <AppShell area="Learning portal" title="Access unavailable" subtitle="This area is for learners, guardians and tutors." navigation={[{ href: "/", label: "Overview" }]}><StateView kind="forbidden" title="You cannot access this area" description="Your role does not include this portal." /></AppShell>;
  const allowed = viewer.user.role === "tutor" ? ["sessions", "learners"] : ["schedule", "learning"];
  if (!allowed.includes(section)) return <AppShell area="Learning portal" title={titles[section]} subtitle="This area is outside your role." navigation={[{ href: "/", label: "Overview" }]}><StateView kind="forbidden" title="This page is not in your role" description="Choose a section from your workspace navigation." action={{ href: "/", label: "Back to overview" }} /></AppShell>;
  const navigation = [{ href: "/", label: "Overview" }, ...allowed.map(key => ({ href: `/${key}`, label: titles[key], current: key === section }))];
  return <AppShell area="Learning portal" title={titles[section]} subtitle="Your learning information in one place." navigation={navigation}><StateView kind="empty" title={`No ${titles[section].toLowerCase()} to show yet`} description="Updates will appear here when they are available." /></AppShell>;
}
