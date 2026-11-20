import { getMockViewer, canAccess } from "@tutrain/mock-api";
import { AppShell, SectionHeading, StateView } from "@tutrain/ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminHome() {
  const viewer = getMockViewer();
  if (!viewer) redirect("/login");
  if (!canAccess(viewer, "admin")) return <AppShell area="Staff console" title="Access unavailable" subtitle="This area is reserved for staff." navigation={[{ href: "/", label: "Overview", current: true }]}><StateView kind="forbidden" title="You cannot access this area" description="Use your learning portal to view your account." /></AppShell>;
  const permissions = viewer.permissions;
  const navigation = [{ href: "/", label: "Overview", current: true }, ...(permissions.includes("*") || permissions.includes("session:read") ? [{ href: "/sessions", label: "Sessions" }] : []), ...(permissions.includes("*") || permissions.includes("attendance:read") ? [{ href: "/attendance", label: "Attendance" }] : [])];
  return <AppShell area="Staff console" title="Operations overview" subtitle="Your assigned work, in one place." navigation={navigation}>
    <SectionHeading title="Available areas" detail="Areas you can open with your account" />
    <ul className="tt-list">{navigation.slice(1).map(item => <li key={item.href}><strong>{item.label}</strong><span className="tt-pill">Available</span></li>)}</ul>
  </AppShell>;
}
