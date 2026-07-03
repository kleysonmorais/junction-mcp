"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import Home from "@/components/Home";
import AgentChat from "@/components/AgentChat";
import ToolExplorer from "@/components/ToolExplorer";
import type { View } from "@/components/views";

export default function Page() {
  const [view, setView] = useState<View>("Home");

  return (
    <>
      <NavBar view={view} onSelect={setView} />
      <main>
        {view === "Home" && <Home onNavigate={setView} />}
        {view === "Agent Chat" && <AgentChat />}
        {view === "Tool Explorer" && <ToolExplorer />}
      </main>
    </>
  );
}
