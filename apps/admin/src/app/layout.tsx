import "@tutrain/ui/styles.css";
import type { ReactNode } from "react";
export const metadata = { title: "TuTrain | Operations", description: "TuTrain staff console" };
export default function Layout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
