import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

interface ItemInfo {
  id: string;
  name: string;
}

interface MarkdownViewerProps {
  content: string;
  className?: string;
  files?: ItemInfo[];
  folders?: ItemInfo[];
}

export function MarkdownViewer({ content, className = '', files = [], folders = [] }: MarkdownViewerProps) {
  // Helper to resolve relative .md links to file IDs or folder IDs
  const resolveLink = (href: string | undefined): { type: 'internal' | 'external'; to: string } | null => {
    if (!href) return null;

    // External links (http, https, mailto, etc.)
    if (href.match(/^(https?:|mailto:|tel:)/i)) {
      return { type: 'external', to: href };
    }

    // Clean the href: remove leading ./ and trailing /
    const cleanHref = href.replace(/^\.\//, '').replace(/\/$/, '');

    // For paths like "01_projects/run_nyc_marathon", extract the last segment
    const lastSegment = cleanHref.includes('/')
      ? cleanHref.split('/').pop() || cleanHref
      : cleanHref;

    // First check for matching folder (try full path, then last segment)
    const matchingFolder = folders.find(f =>
      f.name.toLowerCase() === cleanHref.toLowerCase() ||
      f.name.toLowerCase() === lastSegment.toLowerCase()
    );

    if (matchingFolder) {
      return { type: 'internal', to: `/folder/${matchingFolder.id}` };
    }

    // Then check for matching file (try full path, then last segment)
    const matchingFile = files.find(f =>
      f.name.toLowerCase() === cleanHref.toLowerCase() ||
      f.name.toLowerCase() === cleanHref.toLowerCase() + '.md' ||
      f.name.toLowerCase() === lastSegment.toLowerCase() ||
      f.name.toLowerCase() === lastSegment.toLowerCase() + '.md'
    );

    if (matchingFile) {
      return { type: 'internal', to: `/file/${matchingFile.id}` };
    }

    // Unknown link type - treat as external
    return { type: 'external', to: href };
  };
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style tables for mobile
          table: ({ children }) => (
            <div className="overflow-x-auto -mx-4 px-4 mb-4">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)] text-[var(--color-text)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
              {children}
            </td>
          ),
          // Style links - internal .md files navigate within app, external open in new tab
          a: ({ href, children }) => {
            const resolved = resolveLink(href);
            if (!resolved) {
              return <span className="text-[var(--color-accent)]">{children}</span>;
            }
            if (resolved.type === 'internal') {
              return (
                <Link
                  to={resolved.to}
                  className="text-[var(--color-accent)] hover:underline cursor-pointer"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={resolved.to}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline cursor-pointer"
              >
                {children}
              </a>
            );
          },
          // Style checkboxes
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 accent-[var(--color-accent)]"
                />
              );
            }
            return <input type={type} />;
          },
          // Style headings
          h1: ({ children }) => (
            <h1
              className="text-2xl font-semibold text-[var(--color-text)] mt-6 mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-xl font-semibold text-[var(--color-text)] mt-6 mb-2 pb-2 border-b border-[var(--color-border-subtle)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-lg font-semibold text-[var(--color-text)] mt-5 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-[var(--color-text-secondary)] my-3 leading-relaxed">
              {children}
            </p>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[var(--color-accent)] pl-4 italic text-[var(--color-text-secondary)] my-4 bg-[var(--color-bg-subtle)] py-2 pr-4 rounded-r-lg">
              {children}
            </blockquote>
          ),
          // Style lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1.5 my-3 text-[var(--color-text-secondary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1.5 my-3 text-[var(--color-text-secondary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Style code
          code: ({ children }) => (
            <code className="bg-[var(--color-bg-subtle)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--color-text)]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-[var(--color-bg-subtle)] p-4 rounded-lg overflow-x-auto my-4 text-sm">
              {children}
            </pre>
          ),
          // Horizontal rules
          hr: () => <hr className="my-6 border-[var(--color-border-subtle)]" />,
          // Strong/bold
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--color-text)]">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
