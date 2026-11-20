import "@tutrain/ui/styles.css";
import type { ReactNode } from "react";
export const metadata = { title: "TuTrain | Your learning", description: "TuTrain learner and tutor portal" };
export default function Layout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
