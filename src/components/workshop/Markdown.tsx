"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./CopyButton";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * InlineMarkdown — renderiza markdown INLINE (negrita, cursiva, código, links)
 * sin envolver en párrafo ni agregar bloques. Para títulos y textos cortos que
 * traen *cursiva* o **negrita** en el contenido y no deben mostrar los asteriscos.
 */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <>{children}</>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-cyan/10 px-1 py-0.5 font-mono text-[0.9em] text-cyan">
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-cyan/40 underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/** Aplana nodos de React a texto plano (para copiar bloques de código). */
function nodeToText(node: React.ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (React.isValidElement(node)) {
    return nodeToText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

/**
 * Render markdown con GitHub Flavored Markdown (tablas, listas, código, etc).
 *
 * Estilos alineados al design system SDIH (navy + cyan). Prioriza legibilidad:
 * line-height amplio, ritmo vertical consistente y bloques (tablas, código,
 * citas) con contenedores claros para que el texto largo no se sienta pesado.
 * Sin @tailwindcss/typography — control fino por elemento.
 */
export function Markdown({ children, className = "" }: MarkdownProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-4 leading-[1.75] text-text-secondary last:mb-0">
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
            <ul className="mb-4 ml-1 list-none space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-2 marker:font-semibold marker:text-cyan">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative pl-5 leading-[1.7] text-text-secondary before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-cyan/70 [ol_&]:pl-1 [ol_&]:before:hidden">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 rounded-r-lg border-l-4 border-cyan bg-cyan/5 py-3 pl-5 pr-4 text-text-primary [&_p]:mb-0 [&_p]:italic [&_p]:text-text-primary/90">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return <code className={`${className} block`}>{children}</code>;
            }
            return (
              <code className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan">
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            const raw = nodeToText(children).replace(/\n$/, "");
            return (
              <div className="group relative mb-4">
                <pre className="overflow-x-auto rounded-xl border border-navy-600 bg-navy-900/80 p-4 pt-10 font-mono text-sm leading-relaxed text-cyan-200 shadow-inner">
                  {children}
                </pre>
                {/* Botón copiar — para pegar el prompt/código tal cual */}
                <div className="absolute right-1.5 top-1.5">
                  <CopyButton text={raw} label="Copiar" />
                </div>
              </div>
            );
          },
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 text-2xl font-bold text-text-primary first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 flex items-center gap-2 text-xl font-bold text-text-primary first:mt-0 before:h-5 before:w-1 before:rounded-full before:bg-cyan">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-lg font-semibold text-cyan first:mt-0">
              {children}
            </h3>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cyan underline decoration-cyan/40 underline-offset-2 transition-colors hover:decoration-cyan"
            >
              {children}
            </a>
          ),
          // Tablas (GitHub Flavored Markdown)
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-xl border border-navy-600">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-cyan/10 text-left">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-navy-600">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-white/[0.03]">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-cyan">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 align-top leading-relaxed text-text-secondary">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-navy-600" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
