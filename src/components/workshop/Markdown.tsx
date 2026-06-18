"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Render markdown text con soporte de GitHub Flavored Markdown
 * (tablas, listas, bold, código inline, etc).
 *
 * Estilos inline alineados al design system de SDIH (navy + cyan).
 * Sin dependencia de @tailwindcss/typography para mantener control fino
 * sobre cada elemento y consistencia con el resto del portal.
 */
export function Markdown({ children, className = "" }: MarkdownProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-text-secondary last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-text-secondary">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 marker:text-cyan-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 marker:text-cyan-400 marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-text-secondary">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-cyan-400 bg-white/5 py-2 pl-4 italic text-text-secondary">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={`${className} block`}>{children}</code>
              );
            }
            return (
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-300">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-navy-900 p-4 font-mono text-sm text-cyan-200">
              {children}
            </pre>
          ),
          h1: ({ children }) => (
            <h1 className="mb-3 mt-4 text-2xl font-bold text-text-primary">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-xl font-bold text-text-primary">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-lg font-semibold text-text-primary">{children}</h3>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
            >
              {children}
            </a>
          ),
          // Tablas (GitHub Flavored Markdown)
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/20 bg-white/5">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/10">{children}</tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-text-secondary">{children}</td>
          ),
          hr: () => <hr className="my-4 border-white/10" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
