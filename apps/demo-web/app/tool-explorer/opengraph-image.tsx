import { OG_SIZE, renderOgImage } from "../og";

export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage(
    "Tool Explorer",
    "Call junction-mcp's eight tools directly and inspect raw MCP results."
  );
}
