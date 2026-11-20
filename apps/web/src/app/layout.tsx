import "@tutrain/ui/styles.css";
import type { ReactNode } from "react";
export const metadata = { title: "TuTrain | Learn with clarity", description: "TuTrain learning and tutoring" };
export default function Layout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
