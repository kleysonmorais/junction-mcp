import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "junction-mcp — health data MCP server",
  description:
    "Open-source MCP server exposing wearable and lab data from the Junction sandbox API to AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
