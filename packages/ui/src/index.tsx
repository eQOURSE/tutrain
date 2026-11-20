import type { ReactNode } from "react";

export type NavigationItem = { href: string; label: string; current?: boolean };

export function AppShell({ area, title, subtitle, navigation, children }: {
  area: string;
  title: string;
  subtitle: string;
  navigation: NavigationItem[];
  children: ReactNode;
}) {
  return <div className="tt-shell">
    <a className="tt-skip-link" href="#main-content">Skip to main content</a>
    <aside className="tt-sidebar" aria-label={`${area} navigation`}>
      <a className="tt-brand" href="/" aria-label="TuTrain home"><span className="tt-brand-mark">T</span><span>TuTrain</span></a>
      <div className="tt-area">{area}</div>
      <nav aria-label="Primary"><ul className="tt-nav">{navigation.map(item => <li key={item.href}>
        <a href={item.href} aria-current={item.current ? "page" : undefined}>{item.label}</a>
      </li>)}</ul></nav>
      <p className="tt-sidebar-note">A clearer day of learning.</p>
    </aside>
    <main className="tt-main" id="main-content" tabIndex={-1}><header className="tt-page-head"><div><p className="tt-eyebrow">{area}</p><h1>{title}</h1><p className="tt-subtitle">{subtitle}</p></div></header>{children}</main>
  </div>;
}

export function StateView({ kind, title, description, action }: {
  kind: "loading" | "empty" | "error" | "forbidden";
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return <section className={`tt-state tt-state--${kind}`} role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined}>
    <span className="tt-state-symbol" aria-hidden="true">{kind === "loading" ? "◌" : kind === "empty" ? "○" : kind === "forbidden" ? "⊘" : "!"}</span>
    <h2>{title}</h2><p>{description}</p>
    {action && <a className="tt-button" href={action.href}>{action.label}</a>}
  </section>;
}

export function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return <div className="tt-section-head"><h2>{title}</h2>{detail && <p>{detail}</p>}</div>;
}
