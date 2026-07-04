export const VIEWS = ["Home", "Agent Chat", "Tool Explorer"] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_PATHS: Record<View, string> = {
  Home: "/",
  "Agent Chat": "/agent-chat",
  "Tool Explorer": "/tool-explorer",
};

export const GITHUB_URL = "https://github.com/kleysonmorais/junction-mcp";
