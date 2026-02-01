import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

// Map known markdown files to routes
const FILE_ROUTES: Record<string, string> = {
  'chess.md': '/',
  'coaches.md': '/coaches',
  'tournaments.md': '/tournaments',
  'curriculum.md': '/curriculum',
  'training.md': '/file/training',
};

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  const navigate = useNavigate();

  // Handle link clicks - internal .md links navigate, external open in new tab
  const handleLinkClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return;

    // Check if it's an internal .md file link
    if (href.endsWith('.md') && !href.startsWith('http')) {
      e.preventDefault();
      const fileName = href.split('/').pop() || href;
      const route = FILE_ROUTES[fileName] || `/file/${fileName.replace('.md', '')}`;
      navigate(route);
    }
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style tables for mobile
          table: ({ children }) => (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1 text-left font-semibold bg-gray-50 border-b">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1 border-b">{children}</td>
          ),
          // Style links - handle internal .md links
          a: ({ href, children }) => {
            const isInternal = href?.endsWith('.md') && !href?.startsWith('http');
            return (
              <a
                href={href}
                onClick={(e) => handleLinkClick(href, e)}
                target={isInternal ? undefined : '_blank'}
                rel={isInternal ? undefined : 'noopener noreferrer'}
                className="text-blue-600 hover:underline cursor-pointer"
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
                  className="mr-2"
                />
              );
            }
            return <input type={type} />;
          },
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2 border-b pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-800 mt-3 mb-1">
              {children}
            </h3>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-600 my-2">
              {children}
            </blockquote>
          ),
          // Style lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
          ),
          // Style code
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          // Horizontal rules
          hr: () => <hr className="my-4 border-gray-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
