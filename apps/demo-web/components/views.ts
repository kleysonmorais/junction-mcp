export const VIEWS = ["Home", "Agent Chat", "Tool Explorer"] as const;
export type View = (typeof VIEWS)[number];

export const GITHUB_URL = "https://github.com/kleysonmorais/junction-mcp";
