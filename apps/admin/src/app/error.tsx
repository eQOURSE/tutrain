"use client";
import { StateView } from "@tutrain/ui";
export default function ErrorPage() { return <main className="tt-centered"><StateView kind="error" title="We could not load the console" description="Please try again or contact your system administrator." action={{ href: "/", label: "Try again" }} /></main>; }
