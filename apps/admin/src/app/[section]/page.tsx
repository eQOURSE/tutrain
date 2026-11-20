import { getMockViewer, canAccess } from "@tutrain/mock-api";
import { AppShell, StateView } from "@tutrain/ui";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
const sections: Record<string, { title: string; permission: string }> = { sessions: { title: "Sessions", permission: "session:read" }, attendance: { title: "Attendance", permission: "attendance:read" } };

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!Object.hasOwn(sections, section)) notFound();
  const area = sections[section];
  const viewer = getMockViewer();
  if (!viewer) redirect("/login");
  const allowedSections = canAccess(viewer, "admin")
    ? Object.entries(sections).filter(([, value]) =>
        viewer.permissions.includes("*") || viewer.permissions.includes(value.permission)
      )
    : [];
  const authorized = allowedSections.some(([key]) => key === section);
  const navigation = [
    { href: "/", label: "Overview" },
    ...allowedSections.map(([key, value]) => ({
      href: `/${key}`,
      label: value.title,
      current: key === section,
    })),
  ];
  return <AppShell area="Staff console" title={area.title} subtitle="Operational workspace" navigation={navigation}>
    {authorized ? <StateView kind="empty" title={`No ${area.title.toLowerCase()} to show yet`} description="Updates will appear here when they are available." /> : <StateView kind="forbidden" title="Permission required" description="Your staff account does not have access to this section." action={{ href: "/", label: "Back to overview" }} />}
  </AppShell>;
}
