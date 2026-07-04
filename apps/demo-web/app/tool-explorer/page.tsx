import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import ToolExplorer from "@/components/ToolExplorer";

const TITLE = "Tool Explorer";
const DESCRIPTION =
  "Call junction-mcp's eight tools directly — users, wearable summaries, timeseries, and lab orders — and inspect raw MCP results.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tool-explorer" },
  openGraph: {
    url: "/tool-explorer",
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
      <main>
        <ToolExplorer />
      </main>
    </>
  );
}
