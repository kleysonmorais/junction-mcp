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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "junction-mcp";
const SITE_DESCRIPTION =
  "Open-source MCP server exposing wearable and lab data from the Junction sandbox API to AI agents.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — health data MCP server`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "MCP",
    "Model Context Protocol",
    "wearables",
    "lab results",
    "health data",
    "AI agents",
    "Junction API",
  ],
  authors: [{ name: "Kleyson Morais", url: "https://www.linkedin.com/in/kleysonmorais" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — health data MCP server`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — health data MCP server`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
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
