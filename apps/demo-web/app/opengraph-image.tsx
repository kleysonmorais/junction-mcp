import { OG_SIZE, renderOgImage } from "./og";

export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage(
    "Your health data, fluent in natural language.",
    "Open-source MCP server exposing wearable and lab data to AI agents."
  );
}
