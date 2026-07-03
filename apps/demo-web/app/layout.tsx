import type { Metadata } from "next";
import { Onest, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "junction-mcp — health data MCP server",
  description:
    "Open-source MCP server exposing wearable and lab data from the Junction sandbox API to AI agents.",
};

// Set the theme before first paint to avoid a flash. Defaults to light.
const themeScript = `(function(){try{var t=localStorage.getItem("jmcp-theme");if(t!=="dark"&&t!=="light"){t="light";}document.documentElement.setAttribute("data-jmcp-theme",t);}catch(e){document.documentElement.setAttribute("data-jmcp-theme","light");}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-jmcp-theme="light"
      className={`${onest.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
