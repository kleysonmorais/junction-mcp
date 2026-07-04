const JSON_TOKEN_RE =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

export function JsonView({ text }: { text: string }) {
  let pretty: string;
  try {
    pretty = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return (
      <pre className="whitespace-pre-wrap wrap-break-word font-mono">
        {text}
      </pre>
    );
  }

  const parts = pretty.split(JSON_TOKEN_RE);
  return (
    <pre className="whitespace-pre-wrap wrap-break-word font-mono">
      {parts.map((part, i) => {
        let color = "inherit";
        if (/^"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:$/.test(part)) {
          color = "var(--json-key)";
        } else if (/^".*"$/.test(part)) {
          color = "var(--json-string)";
        } else if (/^(?:true|false)$/.test(part)) {
          color = "var(--json-bool)";
        } else if (/^null$/.test(part)) {
          color = "var(--json-null)";
        } else if (/^-?\d/.test(part)) {
          color = "var(--json-number)";
        } else {
          return part;
        }
        return (
          <span key={i} style={{ color }}>
            {part}
          </span>
        );
      })}
    </pre>
  );
}
