import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-threat-medium'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-cyan'; // key
          return `<span class="${cls}">${match}</span>`;
        }
        cls = 'text-threat-safe'; // string
      } else if (/true|false/.test(match)) {
        cls = 'text-threat-high'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-text-muted'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  let formatted: string;
  try {
    formatted = JSON.stringify(data, null, 2);
  } catch {
    formatted = String(data);
  }

  return (
    <pre
      className={cn(
        'overflow-auto rounded-card border border-border bg-void p-4 font-mono text-xs leading-relaxed',
        className
      )}
      dangerouslySetInnerHTML={{ __html: syntaxHighlight(formatted) }}
    />
  );
}
