import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import AgentChat from "@/components/AgentChat";

const TITLE = "Agent Chat";
const DESCRIPTION =
  "Watch a real agent loop call junction-mcp tools live over wearable and lab data from the Junction sandbox.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/agent-chat" },
  openGraph: {
    url: "/agent-chat",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Page() {
  return (
    <>
      <NavBar />
      <main className="flex min-h-0 flex-1 flex-col">
        <AgentChat />
      </main>
    </>
  );
}
