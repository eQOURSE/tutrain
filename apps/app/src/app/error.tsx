"use client";
import { StateView } from "@tutrain/ui";
export default function ErrorPage() { return <main className="tt-centered"><StateView kind="error" title="We could not load your workspace" description="Please try again. Your account and learning data are safe." action={{ href: "/", label: "Try again" }} /></main>; }
