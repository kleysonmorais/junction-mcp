import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders agent text as GitHub-flavored markdown, themed with the
 * junction-mcp design tokens. Layout/spacing lives in the `.jmcp-md`
 * rules in globals.css; inline code and links pick up token colors here.
 */
const components: Components = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: "var(--accent-text)", textDecoration: "underline" }}
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={`${className ?? ""} font-mono`}>{children}</code>
      );
    }
    return (
      <code
        className="rounded px-1 py-0.5 font-mono text-[0.85em]"
        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      className="overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed"
      style={{
        borderColor: "var(--line)",
        background: "var(--code-bg)",
        color: "var(--code-text)",
      }}
    >
      {children}
    </pre>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="jmcp-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
